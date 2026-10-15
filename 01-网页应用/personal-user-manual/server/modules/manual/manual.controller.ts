import { Controller, Get, Post, UseGuards, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ManualService } from './manual.service';
import { NeedAppLogin } from '@server/common/decorators/need-app-login.decorator';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';

interface GenerateManualBody {
  force?: boolean;
}

@NeedAppLogin()
@UseGuards(AppAuthGuard)
@Controller('api/manual')
export class ManualController {
  constructor(private readonly manualService: ManualService) {}

  @Get('latest')
  async latest(@Req() req: Request) {
    const userId = req.appUserId!;
    return this.manualService.getLatest(userId);
  }

  @Post('generate')
  async generate(@Req() req: Request, @Body() body: GenerateManualBody) {
    const userId = req.appUserId!;
    return this.manualService.generate(userId, body.force === true);
  }
}
