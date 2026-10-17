import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq, and, asc, desc, count, isNull } from 'drizzle-orm';

import { task, appUser } from '@server/database/schema';
import type { CreateTaskDto } from './dto/create-task.dto';
import type { UpdateTaskDto } from './dto/update-task.dto';
import type {
  Task,
  TaskListResponse,
  EnergyLoadResponse,
} from '@shared/api.interface';

type TaskRow = typeof task.$inferSelect;

const ENERGY_MAP: Record<number, number> = {
  1: 5,
  2: 10,
  3: 20,
  4: 35,
  5: 50,
};

function toTaskResponse(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    energyLevel: row.energyLevel,
    status: row.status as Task['status'],
    dueDate: row.dueDate,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getTasks(
    userId: string,
    status?: string,
    date?: string,
  ): Promise<TaskListResponse> {
    const conditions = [eq(task.userId, userId)];
    if (status) {
      conditions.push(eq(task.status, status));
    }
    if (date) {
      conditions.push(eq(task.dueDate, date));
    }

    const rows: TaskRow[] = await this.db
      .select()
      .from(task)
      .where(and(...conditions))
      .orderBy(asc(task.dueDate), desc(task.createdAt));

    const [{ total }] = await this.db
      .select({ total: count() })
      .from(task)
      .where(and(...conditions));

    return {
      items: rows.map((row: TaskRow) => toTaskResponse(row)),
      total: Number(total),
    };
  }

  async getEnergyLoad(userId: string): Promise<EnergyLoadResponse> {
    const userRows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (userRows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const totalEnergy = userRows[0].dailyEnergyLimit;

    const pendingRows: TaskRow[] = await this.db
      .select()
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          eq(task.status, 'pending'),
        ),
      );

    const completedRows: TaskRow[] = await this.db
      .select()
      .from(task)
      .where(
        and(
          eq(task.userId, userId),
          eq(task.status, 'completed'),
        ),
      );

    const usedEnergy = pendingRows.reduce(
      (sum: number, row: TaskRow) => sum + (ENERGY_MAP[row.energyLevel] ?? 0),
      0,
    );

    const remainingEnergy = totalEnergy - usedEnergy;
    const ratio = totalEnergy > 0 ? usedEnergy / totalEnergy : 0;

    let loadStatus: EnergyLoadResponse['loadStatus'];
    if (ratio < 0.3) {
      loadStatus = 'light';
    } else if (ratio < 0.6) {
      loadStatus = 'comfortable';
    } else if (ratio < 0.9) {
      loadStatus = 'tight';
    } else {
      loadStatus = 'overload';
    }

    return {
      totalEnergy,
      usedEnergy,
      remainingEnergy,
      loadStatus,
      pendingTasks: pendingRows.map((row: TaskRow) => toTaskResponse(row)),
      completedTasks: completedRows.map((row: TaskRow) => toTaskResponse(row)),
    };
  }

  async createTask(userId: string, dto: CreateTaskDto): Promise<Task> {
    const inserted = await this.db
      .insert(task)
      .values({
        userId,
        title: dto.title,
        description: dto.description ?? null,
        energyLevel: dto.energyLevel,
        dueDate: dto.dueDate ?? null,
      })
      .returning();

    this.logger.log(`任务创建成功: ${inserted[0].id}`);
    return toTaskResponse(inserted[0]);
  }

  async updateTask(
    userId: string,
    id: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const existing = await this.db
      .select()
      .from(task)
      .where(eq(task.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('任务不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此任务');
    }

    const patch: Partial<typeof task.$inferInsert> = {};
    if (dto.title !== undefined) patch.title = dto.title;
    if (dto.description !== undefined) patch.description = dto.description;
    if (dto.energyLevel !== undefined) patch.energyLevel = dto.energyLevel;
    if (dto.dueDate !== undefined) patch.dueDate = dto.dueDate;

    if (dto.status !== undefined) {
      patch.status = dto.status;
      if (dto.status === 'completed') {
        patch.completedAt = new Date();
      } else if (existing[0].status === 'completed') {
        patch.completedAt = null;
      }
    }

    const updated = await this.db
      .update(task)
      .set(patch)
      .where(eq(task.id, id))
      .returning();

    this.logger.log(`任务更新成功: ${id}`);
    return toTaskResponse(updated[0]);
  }

  async deleteTask(userId: string, id: string): Promise<{ success: true }> {
    const existing = await this.db
      .select()
      .from(task)
      .where(eq(task.id, id));

    if (existing.length === 0) {
      throw new NotFoundException('任务不存在');
    }

    if (existing[0].userId !== userId) {
      throw new ForbiddenException('无权操作此任务');
    }

    await this.db.delete(task).where(eq(task.id, id));
    this.logger.log(`任务删除成功: ${id}`);
    return { success: true };
  }
}
