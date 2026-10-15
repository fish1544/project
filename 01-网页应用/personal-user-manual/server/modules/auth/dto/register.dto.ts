import { IsString, Length, IsOptional, MaxLength } from 'class-validator';
import type { RegisterRequest } from '@shared/api.interface';

export class RegisterDto implements RegisterRequest {
  @IsString()
  @Length(3, 50)
  username!: string;

  @IsString()
  @Length(6, 100)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}
