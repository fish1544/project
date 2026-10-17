import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FocusService } from './focus.service';
import { StartFocusDto } from './dto/start-focus.dto';
import { EndFocusDto } from './dto/end-focus.dto';
import type {
  FocusRecord,
  FocusStatsResponse,
} from '@shared/api.interface';

@Controller('api/focus')
@UseGuards(JwtAuthGuard)
export class FocusController {
  constructor(private readonly focusService: FocusService) {}

  @Post('start')
  async startFocus(
    @Req() req: Request,
    @Body() dto: StartFocusDto,
  ): Promise<FocusRecord> {
    const userId = req['userId'] as string;
    return this.focusService.startFocus(userId, dto);
  }

  @Post('end')
  async endFocus(
    @Req() req: Request,
    @Body() dto: EndFocusDto,
  ): Promise<FocusRecord> {
    const userId = req['userId'] as string;
    return this.focusService.endFocus(userId, dto);
  }

  @Get('records')
  async getRecords(
    @Req() req: Request,
    @Query('date') date?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<{ items: FocusRecord[]; total: number }> {
    const userId = req['userId'] as string;
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.focusService.getRecords(userId, date, pageNum, pageSizeNum);
  }

  @Get('stats')
  async getStats(@Req() req: Request): Promise<FocusStatsResponse> {
    const userId = req['userId'] as string;
    return this.focusService.getStats(userId);
  }
}
