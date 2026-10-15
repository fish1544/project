import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '@lark-apaas/fullstack-nestjs-core';
import { feedbackSurveys } from '@server/database/schema';
import type { FeedbackSubmitRequest } from '@shared/api.interface';

@Injectable()
export class FeedbackService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async submit(
    userId: string | null,
    data: FeedbackSubmitRequest,
  ): Promise<{ success: boolean; id: string }> {
    const ratingFields = [
      data.voiceRecognitionRating,
      data.aiReviewAccuracyRating,
      data.timerUsabilityRating,
      data.overallRating,
    ];

    for (const rating of ratingFields) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new BadRequestException('评分必须在 1-5 之间');
      }
    }

    const hasAnyContent =
      data.voiceRecognitionRating !== undefined ||
      data.aiReviewAccuracyRating !== undefined ||
      data.timerUsabilityRating !== undefined ||
      data.overallRating !== undefined ||
      (data.suggestions !== undefined && data.suggestions.trim().length > 0);

    if (!hasAnyContent) {
      throw new BadRequestException('请至少填写一项反馈内容');
    }

    const [record] = await this.db
      .insert(feedbackSurveys)
      .values({
        userId: userId ?? undefined,
        voiceRecognitionRating: data.voiceRecognitionRating,
        aiReviewAccuracyRating: data.aiReviewAccuracyRating,
        timerUsabilityRating: data.timerUsabilityRating,
        overallRating: data.overallRating,
        suggestions: data.suggestions,
      })
      .returning({ id: feedbackSurveys.id });

    return { success: true, id: record.id };
  }
}
