import {
  IsString,
  IsInt,
  IsIn,
  IsOptional,
  IsBoolean,
  Min,
  Length,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import type { TimerRecordCreateRequest } from '@shared/api.interface';

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

export class CreateTimerRecordDto implements TimerRecordCreateRequest {
  @IsString()
  @Length(1, 255)
  taskName!: string;

  @IsString()
  @IsIn(CATEGORIES)
  category!: 'work' | 'study' | 'creative' | 'rest' | 'exercise' | 'social' | 'outdoor' | 'other';

  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @Type(() => Date)
  startedAt!: string;

  @Type(() => Date)
  endedAt!: string;

  @IsOptional()
  @IsBoolean()
  isManual?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
