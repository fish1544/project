import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GrowthService } from './growth.service';
import { CreateGrowthDto } from './dto/create-growth.dto';
import type {
  GrowthItem,
  GrowthListResponse,
} from '@shared/api.interface';

@Controller('api/growth')
@UseGuards(JwtAuthGuard)
export class GrowthController {
  constructor(private readonly growthService: GrowthService) {}

  @Get()
  async getGrowthItems(
    @Req() req: Request,
    @Query('category') category?: string,
    @Query('isConverted') isConverted?: string,
  ): Promise<GrowthListResponse> {
    const userId = req['userId'] as string;
    return this.growthService.getGrowthItems(userId, category, isConverted);
  }

  @Post()
  async createGrowthItem(
    @Req() req: Request,
    @Body() dto: CreateGrowthDto,
  ): Promise<GrowthItem> {
    const userId = req['userId'] as string;
    return this.growthService.createGrowthItem(userId, dto);
  }

  @Patch(':id')
  async updateGrowthItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: CreateGrowthDto,
  ): Promise<GrowthItem> {
    const userId = req['userId'] as string;
    return this.growthService.updateGrowthItem(userId, id, dto);
  }

  @Delete(':id')
  async deleteGrowthItem(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    const userId = req['userId'] as string;
    return this.growthService.deleteGrowthItem(userId, id);
  }

  @Post(':id/convert')
  async convertToTask(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ taskId: string; growthItem: GrowthItem }> {
    const userId = req['userId'] as string;
    return this.growthService.convertToTask(userId, id);
  }
}
