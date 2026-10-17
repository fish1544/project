import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsIn,
  MaxLength,
} from 'class-validator';
import type { UpdateTaskRequest } from '@shared/api.interface';

export class UpdateTaskDto implements UpdateTaskRequest {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  energyLevel?: number;

  @IsOptional()
  @IsString()
  @IsIn(['pending', 'in_progress', 'completed'])
  status?: 'pending' | 'in_progress' | 'completed';

  @IsOptional()
  @IsString()
  dueDate?: string;
}
