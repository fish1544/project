import {
  Injectable,
  Inject,
  Logger,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq, and, gte, count } from 'drizzle-orm';

import { task, focusRecord, appUser } from '@server/database/schema';
import type { ReviewData } from '@shared/api.interface';

type TaskRow = typeof task.$inferSelect;
type FocusRow = typeof focusRecord.$inferSelect;

const ENERGY_MAP: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
  4: 35,
  5: 50,
};

const ENERGY_CATEGORIES = [
  { level: 1, label: '很轻松(5)' },
  { level: 2, label: '小费劲(10)' },
  { level: 3, label: '中等(20)' },
  { level: 4, label: '较吃力(35)' },
  { level: 5, label: '很费力(50)' },
];

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
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getReviewData(
    userId: string,
    period: 'week' | 'month' | 'all' = 'week',
  ): Promise<ReviewData> {
    const days = period === 'week' ? 7 : 30;
    const startDate = getDateDaysAgo(days - 1);

    // Get user's daily energy limit
    const userRows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));
    const dailyEnergyLimit = userRows[0]?.dailyEnergyLimit ?? 100;

    // Tasks filtered by period (week/month) or all
    const allTaskRows: TaskRow[] = period === 'all'
      ? await this.db.select().from(task).where(eq(task.userId, userId))
      : await this.db
          .select()
          .from(task)
          .where(
            and(
              eq(task.userId, userId),
              gte(task.createdAt, new Date(startDate)),
            ),
          );

    const totalTasks = allTaskRows.length;
    const completedTasks = allTaskRows.filter(
      (t: TaskRow) => t.status === 'completed',
    ).length;
    const taskCompletionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    // Energy used: completed tasks total energy
    const energyUsed = allTaskRows
      .filter((t: TaskRow) => t.status === 'completed')
      .reduce((sum: number, t: TaskRow) => sum + (ENERGY_MAP[t.energyLevel] ?? 0), 0);

    // Category breakdown by energy level (all tasks)
    const categoryBreakdown = ENERGY_CATEGORIES.map((cat) => ({
      category: cat.label,
      count: allTaskRows.filter((t: TaskRow) => t.energyLevel === cat.level).length,
    }));

    // Focus stats
    const focusRows: FocusRow[] = await this.db
      .select()
      .from(focusRecord)
      .where(
        and(
          eq(focusRecord.userId, userId),
          gte(focusRecord.focusDate, startDate),
        ),
      );

    const totalFocusSeconds = focusRows.reduce(
      (sum: number, r: FocusRow) => sum + r.durationSeconds,
      0,
    );
    const totalFocusMinutes = Math.floor(totalFocusSeconds / 60);
    const averageDailyFocusMinutes = days > 0 ? Math.floor(totalFocusMinutes / days) : 0;

    // Energy trend - daily energy used from completed tasks
    const completedTaskRows: TaskRow[] = await this.db
      .select()
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          eq(task.status, 'completed'),
        ),
      );

    const dayMap = new Map<string, number>();
    for (let i = days - 1; i >= 0; i -= 1) {
      dayMap.set(getDateDaysAgo(i), 0);
    }

    for (const t of completedTaskRows) {
      if (t.completedAt && t.dueDate) {
        const dateStr = t.dueDate;
        if (dayMap.has(dateStr)) {
          const current = dayMap.get(dateStr) ?? 0;
          dayMap.set(dateStr, current + (ENERGY_MAP[t.energyLevel] ?? 0));
        }
      }
    }

    const energyTrend: { date: string; used: number; limit: number }[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      const dateStr = getDateDaysAgo(i);
      energyTrend.push({
        date: dateStr,
        used: dayMap.get(dateStr) ?? 0,
        limit: dailyEnergyLimit,
      });
    }

    return {
      period,
      taskCompletionRate,
      totalTasks,
      completedTasks,
      totalFocusMinutes,
      averageDailyFocusMinutes,
      energyUsed,
      energyTrend,
      categoryBreakdown,
    };
  }
}
