import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsArray,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import type { UserProfileUpdateRequest } from '@shared/api.interface';

export class UpdateProfileDto implements UserProfileUpdateRequest {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  dailyEnergyLimit?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  growthDirections?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
