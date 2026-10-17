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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type {
  Task,
  TaskListResponse,
  EnergyLoadResponse,
} from '@shared/api.interface';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getTasks(
    @Req() req: Request,
    @Query('status') status?: string,
    @Query('date') date?: string,
  ): Promise<TaskListResponse> {
    const userId = req['userId'] as string;
    return this.tasksService.getTasks(userId, status, date);
  }

  @UseGuards(JwtAuthGuard)
  @Get('energy-load')
  async getEnergyLoad(@Req() req: Request): Promise<EnergyLoadResponse> {
    const userId = req['userId'] as string;
    return this.tasksService.getEnergyLoad(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createTask(
    @Req() req: Request,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    const userId = req['userId'] as string;
    return this.tasksService.createTask(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updateTask(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ): Promise<Task> {
    const userId = req['userId'] as string;
    return this.tasksService.updateTask(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteTask(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    const userId = req['userId'] as string;
    return this.tasksService.deleteTask(userId, id);
  }
}
