import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FeedbackService } from './feedback.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';

@Controller('api/feedback')
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  @Post()
  submit(@Req() req: Request, @Body() dto: SubmitFeedbackDto) {
    const userId = req.appUserId ?? null;
    return this.feedbackService.submit(userId, dto);
  }
}
