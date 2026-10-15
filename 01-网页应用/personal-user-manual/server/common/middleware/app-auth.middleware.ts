import { Injectable, NestMiddleware } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, gt } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';
import { userSessions } from '@server/database/schema';

const SESSION_COOKIE_NAME = 'app_session';
const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

@Injectable()
export class AppAuthMiddleware implements NestMiddleware {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    const token = req.cookies?.[SESSION_COOKIE_NAME];

    if (!token || typeof token !== 'string') {
      next();
      return;
    }

    try {
      const now = new Date();
      const sessions = await this.db
        .select()
        .from(userSessions)
        .where(
          and(
            eq(userSessions.sessionToken, token),
            gt(userSessions.expiresAt, now),
          ),
        )
        .limit(1);

      if (sessions.length === 0) {
        // 无效或过期，清除 cookie
        res.clearCookie(SESSION_COOKIE_NAME, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        });
        next();
        return;
      }

      const session = sessions[0];
      req.appUserId = session.userId;

      // 刷新 cookie 过期时间（滑动过期）
      res.cookie(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        maxAge: SESSION_MAX_AGE_SECONDS * 1000,
      });

      next();
    } catch {
      // 数据库查询失败，不阻断请求，当做未登录处理
      next();
    }
  }
}

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
