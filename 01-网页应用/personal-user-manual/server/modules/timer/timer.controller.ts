import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TimerService } from './timer.service';
import { CreateTimerRecordDto } from './dto/create-timer-record.dto';
import { UpdateTimerRecordDto } from './dto/update-timer-record.dto';
import { NeedAppLogin } from '@server/common/decorators/need-app-login.decorator';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';

@NeedAppLogin()
@UseGuards(AppAuthGuard)
@Controller('api/timer')
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Get()
  list(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
  ) {
    const userId = req.appUserId!;
    return this.timerService.list(
      userId,
      page ? parseInt(page, 10) : undefined,
      pageSize ? parseInt(pageSize, 10) : undefined,
      category || undefined,
    );
  }

  @Post()
  create(@Req() req: Request, @Body() dto: CreateTimerRecordDto) {
    const userId = req.appUserId!;
    return this.timerService.create(userId, dto);
  }

  @Get('stats')
  stats(@Req() req: Request, @Query('days') days?: string) {
    const userId = req.appUserId!;
    return this.timerService.getStats(userId, days ? parseInt(days, 10) : undefined);
  }

  @Get(':id')
  getById(@Req() req: Request, @Param('id') id: string) {
    const userId = req.appUserId!;
    return this.timerService.getById(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTimerRecordDto,
  ) {
    const userId = req.appUserId!;
    return this.timerService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const userId = req.appUserId!;
    return this.timerService.remove(userId, id);
  }
}
