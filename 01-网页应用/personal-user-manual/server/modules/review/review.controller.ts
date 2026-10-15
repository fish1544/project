import { Controller, Get, Post, Param, UseGuards, Query, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ReviewService } from './review.service';
import { NeedAppLogin } from '@server/common/decorators/need-app-login.decorator';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';
import { GenerateReviewDto } from './dto/generate-review.dto';
import type { ReviewType } from '@shared/api.interface';

@NeedAppLogin()
@UseGuards(AppAuthGuard)
@Controller('api/review')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('type') type?: ReviewType,
  ) {
    const userId = req.appUserId!;
    const p = page ? parseInt(page, 10) : 1;
    const ps = pageSize ? parseInt(pageSize, 10) : 10;
    return this.reviewService.list(userId, p, ps, type);
  }

  @Post('generate')
  async generate(@Req() req: Request, @Body() dto: GenerateReviewDto) {
    const userId = req.appUserId!;
    return this.reviewService.generate(userId, dto.reviewType, dto.periodStart, dto.periodEnd);
  }

  @Get(':id')
  async getById(@Req() req: Request, @Param('id') id: string) {
    const userId = req.appUserId!;
    return this.reviewService.getById(userId, id);
  }
}
