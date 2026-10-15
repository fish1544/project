import { IsString, IsBoolean } from 'class-validator';
import type { EndFocusRequest } from '@shared/api.interface';

export class EndFocusDto implements EndFocusRequest {
  @IsString()
  recordId!: string;

  @IsBoolean()
  isCompleted!: boolean;
}
