import { IsOptional, IsArray, IsString, IsInt, Min } from 'class-validator';
import type { VoiceRecordUpdateRequest } from '@shared/api.interface';

export class UpdateVoiceRecordDto implements VoiceRecordUpdateRequest {
  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emotionTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  eventTags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  timeMentions?: string[];

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSeconds?: number;

  @IsOptional()
  @IsString()
  recordDate?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;
}
