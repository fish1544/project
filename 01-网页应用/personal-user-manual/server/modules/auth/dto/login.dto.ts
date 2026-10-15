import { IsString, Length } from 'class-validator';
import type { LoginRequest } from '@shared/api.interface';

export class LoginDto implements LoginRequest {
  @IsString()
  @Length(1, 50)
  username!: string;

  @IsString()
  @Length(1, 100)
  password!: string;
}
