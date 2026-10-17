import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq, and, desc, count, gte, sql, isNotNull, isNull } from 'drizzle-orm';

import { focusRecord } from '@server/database/schema';
import type { StartFocusDto } from './dto/start-focus.dto';
import type { EndFocusDto } from './dto/end-focus.dto';
import type {
  FocusRecord as FocusRecordType,
  FocusStatsResponse,
} from '@shared/api.interface';

type FocusRow = typeof focusRecord.$inferSelect;

function toFocusResponse(row: FocusRow): FocusRecordType {
  return {
    id: row.id,
    taskId: row.taskId,
    mode: row.mode as FocusRecordType['mode'],
    durationSeconds: row.durationSeconds,
    focusDate: row.focusDate,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt ? row.endedAt.toISOString() : null,
    isCompleted: row.isCompleted,
  };
}

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Injectable()
export class FocusService {
  private readonly logger = new Logger(FocusService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async startFocus(userId: string, dto: StartFocusDto): Promise<FocusRecordType> {
    const now = new Date();
    const focusDate = getTodayString();

    const inserted = await this.db
      .insert(focusRecord)
      .values({
        userId,
        taskId: dto.taskId ?? null,
        mode: dto.mode,
        durationSeconds: dto.durationSeconds ?? 0,
        focusDate,
        startedAt: now,
      })
      .returning();

    this.logger.log(`专注开始: ${inserted[0].id}`);
    return toFocusResponse(inserted[0]);
  }

  async endFocus(userId: string, dto: EndFocusDto): Promise<FocusRecordType> {
    const existing = await this.db
      .select()
      .from(focusRecord)
      .where(eq(focusRecord.id, dto.recordId));

    if (existing.length === 0) {
      throw new NotFoundException('专注记录不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此专注记录');
    }

    const now = new Date();
    const start = existing[0].startedAt;
    const durationSeconds = Math.floor((now.getTime() - start.getTime()) / 1000);

    const updated = await this.db
      .update(focusRecord)
      .set({
        endedAt: now,
        durationSeconds,
        isCompleted: dto.isCompleted,
      })
      .where(eq(focusRecord.id, dto.recordId))
      .returning();

    this.logger.log(`专注结束: ${dto.recordId}`);
    return toFocusResponse(updated[0]);
  }

  async getRecords(
    userId: string,
    date?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: FocusRecordType[]; total: number }> {
    const conditions = [eq(focusRecord.userId, userId)];
    if (date) {
      conditions.push(eq(focusRecord.focusDate, date));
    }

    const offset = (page - 1) * pageSize;

    const rows: FocusRow[] = await this.db
      .select()
      .from(focusRecord)
      .where(and(...conditions))
      .orderBy(desc(focusRecord.startedAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(focusRecord)
      .where(and(...conditions));

    return {
      items: rows.map((row: FocusRow) => toFocusResponse(row)),
      total: Number(total),
    };
  }

  async getStats(userId: string): Promise<FocusStatsResponse> {
    const today = getTodayString();
    const sevenDaysAgo = getDateDaysAgo(6);

    // Total minutes and sessions
    const allRows: FocusRow[] = await this.db
      .select()
      .from(focusRecord)
      .where(eq(focusRecord.userId, userId));

    const totalSeconds = allRows.reduce(
      (sum: number, row: FocusRow) => sum + row.durationSeconds,
      0,
    );
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalSessions = allRows.length;

    // Today minutes
    const todayRows: FocusRow[] = await this.db
      .select()
      .from(focusRecord)
      .where(
        and(
          eq(focusRecord.userId, userId),
          eq(focusRecord.focusDate, today),
        ),
      );

    const todaySeconds = todayRows.reduce(
      (sum: number, row: FocusRow) => sum + row.durationSeconds,
      0,
    );
    const todayMinutes = Math.floor(todaySeconds / 60);

    // Weekly data - last 7 days
    const weeklyRows: FocusRow[] = await this.db
      .select()
      .from(focusRecord)
      .where(
        and(
          eq(focusRecord.userId, userId),
          gte(focusRecord.focusDate, sevenDaysAgo),
        ),
      );

    const dayMap = new Map<string, number>();
    for (let i = 6; i >= 0; i -= 1) {
      dayMap.set(getDateDaysAgo(i), 0);
    }

    for (const row of weeklyRows) {
      const dateStr = row.focusDate;
      const current = dayMap.get(dateStr) ?? 0;
      dayMap.set(dateStr, current + Math.floor(row.durationSeconds / 60));
    }

    const weeklyData: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i -= 1) {
      const dateStr = getDateDaysAgo(i);
      weeklyData.push({ date: dateStr, minutes: dayMap.get(dateStr) ?? 0 });
    }

    // Distribution: with task / without task
    const withTaskSeconds = allRows
      .filter((row: FocusRow) => row.taskId !== null)
      .reduce((sum: number, row: FocusRow) => sum + row.durationSeconds, 0);

    const withoutTaskSeconds = totalSeconds - withTaskSeconds;

    const distribution = [
      { category: '有任务', minutes: Math.floor(withTaskSeconds / 60) },
      { category: '无任务', minutes: Math.floor(withoutTaskSeconds / 60) },
    ];

    return {
      totalMinutes,
      totalSessions,
      todayMinutes,
      weeklyData,
      distribution,
    };
  }
}
