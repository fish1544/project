import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { NeedAppLogin } from '@server/common/decorators/need-app-login.decorator';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
} from '@server/common/middleware/app-auth.middleware';

@Controller('api/auth')
@UseGuards(AppAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  async getMe(@Req() req: Request) {
    if (!req.appUserId) {
      return { user: null };
    }
    const user = await this.authService.getCurrentUser(req.appUserId);
    return { user };
  }

  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsernameAvailable(username || '');
  }

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(
      dto.username,
      dto.password,
      dto.displayName,
    );

    // 注册成功后自动创建 session
    const { sessionToken } = await this.authService.createSession(user.id);

    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    });

    return { success: true, user };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { user, sessionToken } = await this.authService.login(
      dto.username,
      dto.password,
    );

    res.cookie(SESSION_COOKIE_NAME, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS * 1000,
    });

    return { success: true, user };
  }

  @NeedAppLogin()
  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = req.cookies?.[SESSION_COOKIE_NAME];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  }
}
