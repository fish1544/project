import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import type { RegisterRequest } from '@shared/api.interface';

export class RegisterDto implements RegisterRequest {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  nickname?: string;
}
