import {
  IsString,
  IsInt,
  IsIn,
  IsOptional,
  Min,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { TimerRecordUpdateRequest } from '@shared/api.interface';

const CATEGORIES = [
  'work',
  'study',
  'creative',
  'rest',
  'exercise',
  'social',
  'outdoor',
  'other',
] as const;

export class UpdateTimerRecordDto implements TimerRecordUpdateRequest {
  @IsOptional()
  @IsString()
  @Length(1, 255)
  taskName?: string;

  @IsOptional()
  @IsString()
  @IsIn(CATEGORIES)
  category?: 'work' | 'study' | 'creative' | 'rest' | 'exercise' | 'social' | 'outdoor' | 'other';

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @Type(() => Date)
  startedAt?: string;

  @IsOptional()
  @Type(() => Date)
  endedAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
