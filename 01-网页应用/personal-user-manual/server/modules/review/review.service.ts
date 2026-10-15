import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, gte, lt, count } from 'drizzle-orm';
import { reviewReports, voiceRecords, timerRecords } from '@server/database/schema';
import type { ReviewReport, ReviewType } from '@shared/api.interface';
import { generateReview } from './utils/review-generator';

@Injectable()
export class ReviewService {
  constructor(@Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase) {}

  async list(
    userId: string,
    page = 1,
    pageSize = 10,
    reviewType?: ReviewType,
  ): Promise<{ items: ReviewReport[]; total: number }> {
    const whereConditions = [eq(reviewReports.userId, userId)];
    if (reviewType) {
      whereConditions.push(eq(reviewReports.reviewType, reviewType));
    }
    const whereClause = and(...whereConditions);

    const [countResult] = await this.db
      .select({ count: count() })
      .from(reviewReports)
      .where(whereClause);

    const offset = (page - 1) * pageSize;
    const rows = await this.db
      .select()
      .from(reviewReports)
      .where(whereClause)
      .orderBy(desc(reviewReports.periodEnd))
      .limit(pageSize)
      .offset(offset);

    const items: ReviewReport[] = rows.map((row) => ({
      id: row.id,
      reviewType: row.reviewType as ReviewType,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      achievements: row.achievements ?? [],
      stressSources: row.stressSources ?? [],
      triggerPoints: row.triggerPoints ?? [],
      behaviorPatterns: row.behaviorPatterns ?? [],
      summary: row.summary,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: Number(countResult?.count ?? 0),
    };
  }

  async getById(userId: string, id: string): Promise<ReviewReport> {
    const rows = await this.db
      .select()
      .from(reviewReports)
      .where(and(eq(reviewReports.id, id), eq(reviewReports.userId, userId)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('复盘报告不存在');
    }

    const row = rows[0];
    return {
      id: row.id,
      reviewType: row.reviewType as ReviewType,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      achievements: row.achievements ?? [],
      stressSources: row.stressSources ?? [],
      triggerPoints: row.triggerPoints ?? [],
      behaviorPatterns: row.behaviorPatterns ?? [],
      summary: row.summary,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async generate(
    userId: string,
    reviewType: ReviewType,
    periodStart: string,
    periodEnd: string,
  ): Promise<ReviewReport> {
    // periodEnd 是包含的，需要 +1 天做半开区间
    const periodEndDate = new Date(periodEnd);
    periodEndDate.setDate(periodEndDate.getDate() + 1);
    const periodStartDate = new Date(periodStart);
    const periodEndExclusiveStr = periodEndDate.toISOString().slice(0, 10);

    // 查询该时间段的语音记录
    const voiceRows = await this.db
      .select()
      .from(voiceRecords)
      .where(
        and(
          eq(voiceRecords.userId, userId),
          gte(voiceRecords.recordDate, periodStart),
          lt(voiceRecords.recordDate, periodEndExclusiveStr),
        ),
      );

    // 查询该时间段的计时记录（timestamptz 列用 Date 对象）
    const timerRows = await this.db
      .select()
      .from(timerRecords)
      .where(
        and(
          eq(timerRecords.userId, userId),
          gte(timerRecords.startedAt, periodStartDate),
          lt(timerRecords.startedAt, periodEndDate),
        ),
      );

    // 调用规则引擎生成复盘
    const generated = generateReview(voiceRows, timerRows, reviewType, periodStart, periodEnd);

    // 删除同一用户同一类型同一时间段的旧报告
    const existing = await this.db
      .select({ id: reviewReports.id })
      .from(reviewReports)
      .where(
        and(
          eq(reviewReports.userId, userId),
          eq(reviewReports.reviewType, reviewType),
          eq(reviewReports.periodStart, periodStart),
          eq(reviewReports.periodEnd, periodEnd),
        ),
      );

    if (existing.length > 0) {
      await this.db.delete(reviewReports).where(
        and(
          eq(reviewReports.userId, userId),
          eq(reviewReports.reviewType, reviewType),
          eq(reviewReports.periodStart, periodStart),
          eq(reviewReports.periodEnd, periodEnd),
        ),
      );
    }

    // 保存新报告
    const [inserted] = await this.db
      .insert(reviewReports)
      .values({
        userId,
        reviewType,
        periodStart,
        periodEnd,
        achievements: generated.achievements,
        stressSources: generated.stressSources,
        triggerPoints: generated.triggerPoints,
        behaviorPatterns: generated.behaviorPatterns,
        summary: generated.summary,
      })
      .returning();

    return {
      id: inserted.id,
      reviewType: inserted.reviewType as ReviewType,
      periodStart: inserted.periodStart,
      periodEnd: inserted.periodEnd,
      achievements: inserted.achievements ?? [],
      stressSources: inserted.stressSources ?? [],
      triggerPoints: inserted.triggerPoints ?? [],
      behaviorPatterns: inserted.behaviorPatterns ?? [],
      summary: inserted.summary,
      createdAt: inserted.createdAt.toISOString(),
    };
  }
}
