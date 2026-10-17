import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  IsIn,
} from 'class-validator';
import type { StartFocusRequest } from '@shared/api.interface';

export class StartFocusDto implements StartFocusRequest {
  @IsOptional()
  @IsString()
  taskId?: string;

  @IsString()
  @IsIn(['pomodoro', 'free'])
  mode!: 'pomodoro' | 'free';

  @IsOptional()
  @IsInt()
  @Min(1)
  durationSeconds?: number;
}
