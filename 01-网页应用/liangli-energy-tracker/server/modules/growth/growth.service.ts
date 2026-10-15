import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq, and, desc, count } from 'drizzle-orm';

import { growthPool, task } from '@server/database/schema';
import type { CreateGrowthDto } from './dto/create-growth.dto';
import type {
  GrowthItem,
  GrowthListResponse,
} from '@shared/api.interface';

type GrowthRow = typeof growthPool.$inferSelect;

function toGrowthResponse(row: GrowthRow): GrowthItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    energyLevel: row.energyLevel,
    isConverted: row.isConverted,
    convertedTaskId: row.convertedTaskId,
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class GrowthService {
  private readonly logger = new Logger(GrowthService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getGrowthItems(
    userId: string,
    category?: string,
    isConverted?: string,
  ): Promise<GrowthListResponse> {
    const conditions = [eq(growthPool.userId, userId)];
    if (category) {
      conditions.push(eq(growthPool.category, category));
    }
    if (isConverted !== undefined) {
      conditions.push(eq(growthPool.isConverted, isConverted === 'true'));
    }

    const rows: GrowthRow[] = await this.db
      .select()
      .from(growthPool)
      .where(and(...conditions))
      .orderBy(desc(growthPool.createdAt));

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(growthPool)
      .where(and(...conditions));

    return {
      items: rows.map((row: GrowthRow) => toGrowthResponse(row)),
      total: Number(total),
    };
  }

  async createGrowthItem(
    userId: string,
    dto: CreateGrowthDto,
  ): Promise<GrowthItem> {
    const inserted = await this.db
      .insert(growthPool)
      .values({
        userId,
        title: dto.title,
        description: dto.description ?? null,
        category: dto.category ?? null,
        energyLevel: dto.energyLevel ?? 1,
      })
      .returning();

    this.logger.log(`成长想法创建成功: ${inserted[0].id}`);
    return toGrowthResponse(inserted[0]);
  }

  async updateGrowthItem(
    userId: string,
    id: string,
    dto: Partial<CreateGrowthDto>,
  ): Promise<GrowthItem> {
    const existing = await this.db
      .select()
      .from(growthPool)
      .where(eq(growthPool.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('成长想法不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此成长想法');
    }

    const patch: Partial<typeof growthPool.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.category !== undefined) patch.category = dto.category;
    if (dto.energyLevel !== undefined) patch.energyLevel = dto.energyLevel;

    const updated = await this.db
      .update(growthPool)
      .set(patch)
      .where(eq(growthPool.id, id))
      .returning();

    this.logger.log(`成长想法更新成功: ${id}`);
    return toGrowthResponse(updated[0]);
  }

  async deleteGrowthItem(
    userId: string,
    id: string,
  ): Promise<{ success: true }> {
    const existing = await this.db
      .select()
      .from(growthPool)
      .where(eq(growthPool.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('成长想法不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此成长想法');
    }

    await this.db.delete(growthPool).where(eq(growthPool.id, id));
    this.logger.log(`成长想法删除成功: ${id}`);
    return { success: true };
  }

  async convertToTask(
    userId: string,
    id: string,
  ): Promise<{ taskId: string; growthItem: GrowthItem }> {
    const existing = await this.db
      .select()
      .from(growthPool)
      .where(eq(growthPool.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('成长想法不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此成长想法');
    }

    if (existing[0].isConverted) {
      return {
        taskId: existing[0].convertedTaskId!,
        growthItem: toGrowthResponse(existing[0]),
      };
    }

    const result = await this.db.transaction(async (tx) => {
      const newTasks = await tx
        .insert(task)
        .values({
          userId,
          title: existing[0].title,
          description: existing[0].description,
          energyLevel: existing[0].energyLevel,
        })
        .returning();

      const newTaskId = newTasks[0].id;

      const updatedGrowth = await tx
        .update(growthPool)
        .set({
          isConverted: true,
          convertedTaskId: newTaskId,
        })
        .where(eq(growthPool.id, id))
        .returning();

      return { taskId: newTaskId, growthItem: updatedGrowth[0] };
    });

    this.logger.log(`成长想法转为任务成功: ${id} -> ${result.taskId}`);
    return {
      taskId: result.taskId,
      growthItem: toGrowthResponse(result.growthItem),
    };
  }
}
