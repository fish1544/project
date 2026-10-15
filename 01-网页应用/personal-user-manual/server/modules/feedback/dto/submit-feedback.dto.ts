import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { FeedbackSubmitRequest } from '@shared/api.interface';

export class SubmitFeedbackDto implements FeedbackSubmitRequest {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  voiceRecognitionRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  aiReviewAccuracyRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  timerUsabilityRating?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  overallRating?: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  suggestions?: string;
}
