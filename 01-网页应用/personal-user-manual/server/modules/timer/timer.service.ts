import { Inject, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count, gte, sql } from 'drizzle-orm';
import { timerRecords } from '@server/database/schema';
import type {
  TimerRecord,
  TimerRecordCreateRequest,
  TimerRecordUpdateRequest,
  TimerStatsResponse,
} from '@shared/api.interface';

const MAX_PAGE_SIZE = 100;

@Injectable()
export class TimerService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(
    userId: string,
    page = 1,
    pageSize = 20,
    category?: string,
  ): Promise<{ items: TimerRecord[]; total: number }> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);
    const offset = (safePage - 1) * safePageSize;

    const whereClause = category
      ? and(eq(timerRecords.userId, userId), eq(timerRecords.category, category))
      : eq(timerRecords.userId, userId);

    const [rows, totalResult] = await Promise.all([
      this.db
        .select()
        .from(timerRecords)
        .where(whereClause)
        .orderBy(desc(timerRecords.startedAt))
        .limit(safePageSize)
        .offset(offset),
      this.db.select({ count: count() }).from(timerRecords).where(whereClause),
    ]);

    const items: TimerRecord[] = rows.map((row) => ({
      id: row.id,
      taskName: row.taskName,
      category: row.category as TimerRecord['category'],
      durationSeconds: row.durationSeconds,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt.toISOString(),
      isManual: row.isManual,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    }));

    return { items, total: totalResult[0]?.count ?? 0 };
  }

  async getById(userId: string, id: string): Promise<TimerRecord> {
    const rows = await this.db
      .select()
      .from(timerRecords)
      .where(and(eq(timerRecords.userId, userId), eq(timerRecords.id, id)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('计时记录不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      taskName: row.taskName,
      category: row.category as TimerRecord['category'],
      durationSeconds: row.durationSeconds,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt.toISOString(),
      isManual: row.isManual,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async create(userId: string, data: TimerRecordCreateRequest): Promise<TimerRecord> {
    const startedAtDate = new Date(data.startedAt);
    const endedAtDate = new Date(data.endedAt);

    if (data.durationSeconds < 0) {
      throw new BadRequestException('durationSeconds 必须 >= 0');
    }
    if (endedAtDate <= startedAtDate) {
      throw new BadRequestException('endedAt 必须晚于 startedAt');
    }

    const rows = await this.db
      .insert(timerRecords)
      .values({
        userId,
        taskName: data.taskName,
        category: data.category,
        durationSeconds: data.durationSeconds,
        startedAt: startedAtDate,
        endedAt: endedAtDate,
        isManual: data.isManual ?? false,
        notes: data.notes ?? null,
      })
      .returning();

    const row = rows[0];
    return {
      id: row.id,
      taskName: row.taskName,
      category: row.category as TimerRecord['category'],
      durationSeconds: row.durationSeconds,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt.toISOString(),
      isManual: row.isManual,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async update(
    userId: string,
    id: string,
    data: TimerRecordUpdateRequest,
  ): Promise<TimerRecord> {
    const existing = await this.getById(userId, id);

    const patch: Partial<typeof timerRecords.$inferInsert> = {};
    if (data.taskName !== undefined) patch.taskName = data.taskName;
    if (data.category !== undefined) patch.category = data.category;
    if (data.durationSeconds !== undefined) {
      if (data.durationSeconds < 0) {
        throw new BadRequestException('durationSeconds 必须 >= 0');
      }
      patch.durationSeconds = data.durationSeconds;
    }
    if (data.startedAt !== undefined) patch.startedAt = new Date(data.startedAt);
    if (data.endedAt !== undefined) patch.endedAt = new Date(data.endedAt);
    if (data.notes !== undefined) patch.notes = data.notes;

    // 校验时间范围
    const effectiveStart = patch.startedAt ?? new Date(existing.startedAt);
    const effectiveEnd = patch.endedAt ?? new Date(existing.endedAt);
    if (effectiveEnd <= effectiveStart) {
      throw new BadRequestException('endedAt 必须晚于 startedAt');
    }

    if (Object.keys(patch).length === 0) {
      return existing;
    }

    const rows = await this.db
      .update(timerRecords)
      .set(patch)
      .where(and(eq(timerRecords.userId, userId), eq(timerRecords.id, id)))
      .returning();

    const row = rows[0];
    return {
      id: row.id,
      taskName: row.taskName,
      category: row.category as TimerRecord['category'],
      durationSeconds: row.durationSeconds,
      startedAt: row.startedAt.toISOString(),
      endedAt: row.endedAt.toISOString(),
      isManual: row.isManual,
      notes: row.notes,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const rows = await this.db
      .delete(timerRecords)
      .where(and(eq(timerRecords.userId, userId), eq(timerRecords.id, id)))
      .returning({ id: timerRecords.id });

    if (rows.length === 0) {
      throw new NotFoundException('计时记录不存在');
    }

    return { success: true };
  }

  async getStats(userId: string, days = 7): Promise<TimerStatsResponse> {
    const safeDays = Math.max(1, Math.min(days, 365));

    // 按 Asia/Shanghai 时区计算最近 N 天的起始日期
    const now = new Date();
    const rangeStart = new Date(now.getTime() - (safeDays - 1) * 24 * 60 * 60 * 1000);

    const rows = await this.db
      .select({
        category: timerRecords.category,
        day: sql<string>`to_char(${timerRecords.startedAt} at time zone 'Asia/Shanghai', 'YYYY-MM-DD')`,
        seconds: sql<number>`sum(${timerRecords.durationSeconds})`,
      })
      .from(timerRecords)
      .where(
        and(
          eq(timerRecords.userId, userId),
          gte(timerRecords.startedAt, rangeStart),
        ),
      )
      .groupBy(timerRecords.category, sql`to_char(${timerRecords.startedAt} at time zone 'Asia/Shanghai', 'YYYY-MM-DD')`);

    const byCategory: Record<string, number> = {};
    const byDay: Record<string, number> = {};
    let totalSeconds = 0;

    for (const row of rows) {
      const secs = Number(row.seconds);
      totalSeconds += secs;
      byCategory[row.category] = (byCategory[row.category] ?? 0) + secs;
      byDay[row.day] = (byDay[row.day] ?? 0) + secs;
    }

    return { totalSeconds, byCategory, byDay };
  }
}
