import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, gte, lt } from 'drizzle-orm';
import { userManuals, voiceRecords, timerRecords } from '@server/database/schema';
import type { UserManual, StressThreshold, HabitSuggestion } from '@shared/api.interface';
import { generateManual } from './utils/manual-generator';

@Injectable()
export class ManualService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  private rowToManual(row: typeof userManuals.$inferSelect): UserManual {
    return {
      id: row.id,
      version: row.version,
      energyRhythm: row.energyRhythm ?? [],
      stressThresholds: (row.stressThresholds as StressThreshold[]) ?? [],
      habitSuggestions: (row.habitSuggestions as HabitSuggestion[]) ?? [],
      personalInsights: row.personalInsights,
      generatedAt: row.generatedAt.toISOString(),
    };
  }

  async getLatest(userId: string): Promise<UserManual | null> {
    const rows = await this.db
      .select()
      .from(userManuals)
      .where(eq(userManuals.userId, userId))
      .orderBy(desc(userManuals.generatedAt))
      .limit(1);

    if (rows.length === 0) return null;
    return this.rowToManual(rows[0]);
  }

  async generate(userId: string, force = false): Promise<UserManual> {
    // 已有且不强制生成，直接返回最新
    const existing = await this.getLatest(userId);
    if (existing && !force) {
      return existing;
    }

    // 最近 30 天
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const startDateStr = thirtyDaysAgo.toISOString().slice(0, 10);

    // 查询语音记录（date 列用字符串比较）
    const voiceRows = await this.db
      .select()
      .from(voiceRecords)
      .where(
        and(
          eq(voiceRecords.userId, userId),
          gte(voiceRecords.recordDate, startDateStr),
        ),
      );

    // 查询计时记录（timestamptz 列用 Date 对象比较）
    const timerRows = await this.db
      .select()
      .from(timerRecords)
      .where(
        and(
          eq(timerRecords.userId, userId),
          gte(timerRecords.startedAt, thirtyDaysAgo),
          lt(timerRecords.startedAt, now),
        ),
      );

    // 生成说明书
    const generated = generateManual(voiceRows, timerRows);

    // 计算版本号
    const nextVersion = existing ? existing.version + 1 : 1;

    // 保存
    const [inserted] = await this.db
      .insert(userManuals)
      .values({
        userId,
        version: nextVersion,
        energyRhythm: generated.energyRhythm,
        stressThresholds: generated.stressThresholds as unknown,
        habitSuggestions: generated.habitSuggestions as unknown,
        personalInsights: generated.personalInsights,
        generatedAt: now,
      })
      .returning();

    return this.rowToManual(inserted);
  }
}
