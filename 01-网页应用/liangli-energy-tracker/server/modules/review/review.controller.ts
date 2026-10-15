import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ReviewService } from './review.service';
import type { ReviewData } from '@shared/api.interface';

@Controller('api/review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async getReview(
    @Req() req: Request,
    @Query('period') period?: string,
  ): Promise<ReviewData> {
    const userId = req['userId'] as string;
    const validPeriod = (period === 'week' || period === 'month' || period === 'all')
      ? period
      : 'week';
    return this.reviewService.getReviewData(userId, validPeriod);
  }
}
