import { IsString, MinLength, MaxLength } from 'class-validator';
import type { PasswordChangeRequest } from '@shared/api.interface';

export class ChangePasswordDto implements PasswordChangeRequest {
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  oldPassword!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword!: string;
}
