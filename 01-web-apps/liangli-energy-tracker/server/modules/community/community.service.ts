import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq, and, desc, count } from 'drizzle-orm';

import { communityPost, appUser } from '@server/database/schema';
import type { CreatePostDto } from './dto/create-post.dto';
import type {
  CommunityPost,
  CommunityListResponse,
} from '@shared/api.interface';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getPosts(
    page = 1,
    pageSize = 20,
    category?: string,
  ): Promise<CommunityListResponse> {
    const offset = (page - 1) * pageSize;

    const whereConditions = [eq(communityPost.isPublic, true)];
    if (category) {
      whereConditions.push(eq(communityPost.goalCategory, category));
    }

    const rows = await this.db
      .select({
        id: communityPost.id,
        content: communityPost.content,
        goalCategory: communityPost.goalCategory,
        likesCount: communityPost.likesCount,
        createdAt: communityPost.createdAt,
        authorNickname: appUser.nickname,
        authorAvatarUrl: appUser.avatarUrl,
      })
      .from(communityPost)
      .innerJoin(appUser, eq(communityPost.userId, appUser.id))
      .where(and(...whereConditions))
      .orderBy(desc(communityPost.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(communityPost)
      .where(and(...whereConditions));

    const items: CommunityPost[] = rows.map((row) => ({
      id: row.id,
      content: row.content,
      goalCategory: row.goalCategory,
      likesCount: row.likesCount,
      authorNickname: row.authorNickname ?? '匿名用户',
      authorAvatarUrl: row.authorAvatarUrl,
      createdAt: row.createdAt.toISOString(),
    }));

    return {
      items,
      total: Number(total),
    };
  }

  async createPost(
    userId: string,
    dto: CreatePostDto,
  ): Promise<CommunityPost> {
    const inserted = await this.db
      .insert(communityPost)
      .values({
        userId,
        content: dto.content,
        goalCategory: dto.goalCategory ?? null,
        isPublic: dto.isPublic ?? true,
      })
      .returning();

    const userRows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    this.logger.log(`社区帖子创建成功: ${inserted[0].id}`);

    return {
      id: inserted[0].id,
      content: inserted[0].content,
      goalCategory: inserted[0].goalCategory,
      likesCount: inserted[0].likesCount,
      authorNickname: userRows[0]?.nickname ?? '匿名用户',
      authorAvatarUrl: userRows[0]?.avatarUrl ?? null,
      createdAt: inserted[0].createdAt.toISOString(),
    };
  }

  async likePost(id: string): Promise<{ likesCount: number }> {
    const existing = await this.db
      .select()
      .from(communityPost)
      .where(eq(communityPost.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    const updated = await this.db
      .update(communityPost)
      .set({ likesCount: existing[0].likesCount + 1 })
      .where(eq(communityPost.id, id))
      .returning({ likesCount: communityPost.likesCount });

    this.logger.log(`帖子点赞: ${id}`);
    return { likesCount: updated[0].likesCount };
  }

  async deletePost(userId: string, id: string): Promise<{ success: true }> {
    const existing = await this.db
      .select()
      .from(communityPost)
      .where(eq(communityPost.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('帖子不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权删除此帖子');
    }

    await this.db.delete(communityPost).where(eq(communityPost.id, id));
    this.logger.log(`帖子删除成功: ${id}`);
    return { success: true };
  }
}
