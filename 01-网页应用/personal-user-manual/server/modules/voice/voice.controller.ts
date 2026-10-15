import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { VoiceService } from './voice.service';
import { NeedAppLogin } from '@server/common/decorators/need-app-login.decorator';
import { AppAuthGuard } from '@server/common/guards/app-auth.guard';
import { CreateVoiceRecordDto } from './dto/create-voice-record.dto';
import { UpdateVoiceRecordDto } from './dto/update-voice-record.dto';
import type {
  VoiceRecord,
  VoiceRecordListResponse,
} from '@shared/api.interface';

@NeedAppLogin()
@UseGuards(AppAuthGuard)
@Controller('api/voice')
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Get()
  async list(
    @Req() req: Request,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ): Promise<VoiceRecordListResponse> {
    const userId = req.appUserId!;
    return this.voiceService.list(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Post()
  create(
    @Req() req: Request,
    @Body() dto: CreateVoiceRecordDto,
  ): Promise<VoiceRecord> {
    const userId = req.appUserId!;
    return this.voiceService.create(userId, dto);
  }

  @Get(':id')
  getById(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<VoiceRecord> {
    const userId = req.appUserId!;
    return this.voiceService.getById(userId, id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateVoiceRecordDto,
  ): Promise<VoiceRecord> {
    const userId = req.appUserId!;
    return this.voiceService.update(userId, id, dto);
  }

  @Delete(':id')
  remove(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: boolean }> {
    const userId = req.appUserId!;
    return this.voiceService.remove(userId, id);
  }
}
