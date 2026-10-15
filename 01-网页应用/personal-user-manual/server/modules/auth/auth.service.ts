import {
  Injectable,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq } from 'drizzle-orm';
import * as crypto from 'node:crypto';
import { appUsers, userSessions } from '@server/database/schema';
import type { AppUser } from '@shared/api.interface';

const SESSION_DAYS = 30;

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function toAppUser(row: {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: Date;
}): AppUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async register(
    username: string,
    password: string,
    displayName?: string,
  ): Promise<AppUser> {
    if (!username || username.trim().length === 0) {
      throw new BadRequestException('用户名不能为空');
    }
    if (!password || password.length === 0) {
      throw new BadRequestException('密码不能为空');
    }

    const trimmedUsername = username.trim();

    // 检查用户名是否已存在
    const existing = await this.db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.username, trimmedUsername))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const inserted = await this.db
      .insert(appUsers)
      .values({
        username: trimmedUsername,
        passwordHash,
        passwordSalt: salt,
        displayName: displayName?.trim() || null,
      })
       .returning({
         id: appUsers.id,
         username: appUsers.username,
         displayName: appUsers.displayName,
         role: appUsers.role,
         createdAt: appUsers.createdAt,
       });

    return toAppUser(inserted[0]);
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ user: AppUser; sessionToken: string }> {
    const users = await this.db
      .select()
      .from(appUsers)
      .where(eq(appUsers.username, username.trim()))
      .limit(1);

    if (users.length === 0) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const user = users[0];
    const computedHash = hashPassword(password, user.passwordSalt);

    if (computedHash !== user.passwordHash) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 生成 session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    await this.db.insert(userSessions).values({
      userId: user.id,
      sessionToken,
      expiresAt,
    });

    // 更新 lastLoginAt
    await this.db
      .update(appUsers)
      .set({ lastLoginAt: new Date() })
      .where(eq(appUsers.id, user.id));

    return {
      user: toAppUser(user),
      sessionToken,
    };
  }

  async logout(sessionToken: string): Promise<void> {
    if (!sessionToken) {
      return;
    }
    await this.db
      .delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async getCurrentUser(userId: string): Promise<AppUser | null> {
    if (!userId) {
      return null;
    }
    const users = await this.db
       .select({
         id: appUsers.id,
         username: appUsers.username,
         displayName: appUsers.displayName,
         role: appUsers.role,
         createdAt: appUsers.createdAt,
       })
       .from(appUsers)
       .where(eq(appUsers.id, userId))
      .limit(1);

    if (users.length === 0) {
      return null;
    }
    return toAppUser(users[0]);
  }

  async checkUsernameAvailable(username: string): Promise<{ available: boolean }> {
    if (!username || username.trim().length === 0) {
      return { available: false };
    }
    const users = await this.db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.username, username.trim()))
      .limit(1);

    return { available: users.length === 0 };
  }

  async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<{ sessionToken: string; expiresAt: Date }> {
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);

    await this.db.insert(userSessions).values({
      userId,
      sessionToken,
      expiresAt,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
    });

    return { sessionToken, expiresAt };
  }

  async findUserByUsername(username: string): Promise<{ id: string } | null> {
    const rows = await this.db
      .select({ id: appUsers.id })
      .from(appUsers)
      .where(eq(appUsers.username, username.trim()))
      .limit(1);
    return rows[0] ?? null;
  }
}
