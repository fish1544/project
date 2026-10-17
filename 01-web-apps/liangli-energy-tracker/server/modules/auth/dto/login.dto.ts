import { IsString } from 'class-validator';
import type { LoginRequest } from '@shared/api.interface';

export class LoginDto implements LoginRequest {
  @IsString()
  username!: string;

  @IsString()
  password!: string;
}
