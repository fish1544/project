import { IsInt, IsString, Min, IsOptional, IsArray } from 'class-validator';
import type { VoiceRecordCreateRequest } from '@shared/api.interface';

export class CreateVoiceRecordDto implements VoiceRecordCreateRequest {
  @IsInt()
  @Min(0)
  durationSeconds!: number;

  @IsString()
  recordDate!: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

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
}
