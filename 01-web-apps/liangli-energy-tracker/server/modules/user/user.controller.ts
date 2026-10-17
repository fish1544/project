import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UserService } from './user.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { User } from '@shared/api.interface';

@Controller('api/user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  async getProfile(@Req() req: Request): Promise<User> {
    const userId = req['userId'] as string;
    return this.userService.getProfile(userId);
  }

  @Patch('profile')
  async updateProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<User> {
    const userId = req['userId'] as string;
    return this.userService.updateProfile(userId, dto);
  }

  @Post('change-password')
  async changePassword(
    @Req() req: Request,
    @Body() dto: ChangePasswordDto,
  ): Promise<{ success: true }> {
    const userId = req['userId'] as string;
    return this.userService.changePassword(
      userId,
      dto.oldPassword,
      dto.newPassword,
    );
  }
}
