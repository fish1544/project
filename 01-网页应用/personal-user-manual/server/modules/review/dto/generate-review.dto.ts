import { IsString, IsIn } from 'class-validator';
import type { ReviewGenerateRequest } from '@shared/api.interface';

export class GenerateReviewDto implements ReviewGenerateRequest {
  @IsString()
  @IsIn(['daily', 'weekly', 'monthly'])
  reviewType!: 'daily' | 'weekly' | 'monthly';

  @IsString()
  periodStart!: string;

  @IsString()
  periodEnd!: string;
}
