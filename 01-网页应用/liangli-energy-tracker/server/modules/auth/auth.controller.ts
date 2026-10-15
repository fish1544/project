import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type {
  AuthResponse,
  UsernameCheckResponse,
  User,
} from '@shared/api.interface';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Get('check-username')
  async checkUsername(
    @Query('username') username: string,
  ): Promise<UsernameCheckResponse> {
    return this.authService.checkUsername(username);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getCurrentUser(@Req() req: Request): Promise<User> {
    const userId = req['userId'] as string;
    return this.authService.getUserById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() body: { oldPassword: string; newPassword: string },
  ): Promise<{ success: boolean }> {
    const userId = req['userId'] as string;
    await this.authService.changePassword(userId, body.oldPassword, body.newPassword);
    return { success: true };
  }
}
