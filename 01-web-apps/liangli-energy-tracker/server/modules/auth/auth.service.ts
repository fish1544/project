import {
  Injectable,
  Inject,
  Logger,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

import { appUser } from '@server/database/schema';
import type { RegisterDto } from './dto/register.dto';
import type { LoginDto } from './dto/login.dto';
import type { AuthResponse, User, UsernameCheckResponse } from '@shared/api.interface';

const JWT_SECRET = process.env.JWT_SECRET || 'liangli-jwt-secret-key-2024';
const JWT_EXPIRES_IN = '7d';
const SALT_ROUNDS = 10;

type AppUserRow = typeof appUser.$inferSelect;

function toUserResponse(row: AppUserRow): User {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    role: (row.role as 'admin' | 'user') ?? 'user',
    dailyEnergyLimit: row.dailyEnergyLimit,
    growthDirections: row.growthDirections ?? [],
    isPublic: row.isPublic,
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.username, dto.username));

    if (existing.length > 0) {
      throw new ConflictException('用户名已存在');
    }

    const passwordHash = bcrypt.hashSync(dto.password, SALT_ROUNDS);

    const inserted = await this.db
      .insert(appUser)
      .values({
        username: dto.username,
        passwordHash,
        nickname: dto.nickname ?? null,
      })
      .returning();

    const user = toUserResponse(inserted[0]);
    const token = this.generateToken(inserted[0]);

    this.logger.log(`用户注册成功: ${dto.username}`);

    return { user, token };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.username, dto.username));

    if (rows.length === 0) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const userRow = rows[0];
    const passwordValid = bcrypt.compareSync(dto.password, userRow.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const user = toUserResponse(userRow);
    const token = this.generateToken(userRow);

    return { user, token };
  }

  async checkUsername(username: string): Promise<UsernameCheckResponse> {
    const rows = await this.db
      .select({ id: appUser.id })
      .from(appUser)
      .where(eq(appUser.username, username));

    return { available: rows.length === 0 };
  }

  async validateUser(userId: string): Promise<User | null> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (rows.length === 0) {
      return null;
    }

    return toUserResponse(rows[0]);
  }

  generateToken(user: AppUserRow): string {
    return jwt.sign(
      { sub: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
  }

  async getUserById(userId: string): Promise<User> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return toUserResponse(rows[0]);
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const userRow = rows[0];
    const passwordValid = bcrypt.compareSync(oldPassword, userRow.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);

    await this.db
      .update(appUser)
      .set({ passwordHash: newPasswordHash })
      .where(eq(appUser.id, userId));

    this.logger.log(`用户密码修改成功: ${userId}`);
  }
}
