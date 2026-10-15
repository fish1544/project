import {
  IsString,
  IsInt,
  Min,
  Max,
  IsOptional,
  MaxLength,
} from 'class-validator';
import type { CreateTaskRequest } from '@shared/api.interface';

export class CreateTaskDto implements CreateTaskRequest {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  @Max(5)
  energyLevel!: number;

  @IsOptional()
  @IsString()
  dueDate?: string;
}
