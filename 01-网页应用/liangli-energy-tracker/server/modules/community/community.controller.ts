import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import type {
  CommunityPost,
  CommunityListResponse,
} from '@shared/api.interface';

@Controller('api/community/posts')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get()
  async getPosts(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('category') category?: string,
  ): Promise<CommunityListResponse> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.communityService.getPosts(pageNum, pageSizeNum, category);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createPost(
    @Req() req: Request,
    @Body() dto: CreatePostDto,
  ): Promise<CommunityPost> {
    const userId = req['userId'] as string;
    return this.communityService.createPost(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async likePost(
    @Param('id') id: string,
  ): Promise<{ likesCount: number }> {
    return this.communityService.likePost(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(
    @Req() req: Request,
    @Param('id') id: string,
  ): Promise<{ success: true }> {
    const userId = req['userId'] as string;
    return this.communityService.deletePost(userId, id);
  }
}
