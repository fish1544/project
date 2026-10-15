import {
  IsString,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import type { CreateCommunityPostRequest } from '@shared/api.interface';

export class CreatePostDto implements CreateCommunityPostRequest {
  @IsString()
  @MaxLength(2000)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  goalCategory?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
