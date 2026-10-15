import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DRIZZLE_DATABASE, type PostgresJsDatabase } from '../../database/database.module';
import { eq } from 'drizzle-orm';
import * as bcrypt from 'bcryptjs';

import { appUser } from '@server/database/schema';
import type { UpdateProfileDto } from './dto/update-profile.dto';
import type { User } from '@shared/api.interface';

type AppUserRow = typeof appUser.$inferSelect;

const SALT_ROUNDS = 10;

function toUserResponse(row: AppUserRow): User {
  return {
    id: row.id,
    username: row.username,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl,
    bio: row.bio,
    role: (row.role as 'admin' | 'user') ?? 'user',
    dailyEnergyLimit: row.dailyEnergyLimit,
    growthDirections: row.growthDirections ?? [],
    isPublic: row.isPublic,
  };
}

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    return toUserResponse(rows[0]);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<User> {
    const patch: Partial<typeof appUser.$inferInsert> = {};
    if (dto.nickname !== undefined) patch.nickname = dto.nickname;
    if (dto.avatarUrl !== undefined) patch.avatarUrl = dto.avatarUrl;
    if (dto.bio !== undefined) patch.bio = dto.bio;
    if (dto.dailyEnergyLimit !== undefined) patch.dailyEnergyLimit = dto.dailyEnergyLimit;
    if (dto.growthDirections !== undefined) patch.growthDirections = dto.growthDirections;
    if (dto.isPublic !== undefined) patch.isPublic = dto.isPublic;

    const updated = await this.db
      .update(appUser)
      .set(patch)
      .where(eq(appUser.id, userId))
      .returning();

    if (updated.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    this.logger.log(`用户资料更新成功: ${userId}`);
    return toUserResponse(updated[0]);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ success: true }> {
    const rows = await this.db
      .select()
      .from(appUser)
      .where(eq(appUser.id, userId));

    if (rows.length === 0) {
      throw new NotFoundException('用户不存在');
    }

    const passwordValid = bcrypt.compareSync(oldPassword, rows[0].passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('原密码错误');
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);

    await this.db
      .update(appUser)
      .set({ passwordHash: newPasswordHash })
      .where(eq(appUser.id, userId));

    this.logger.log(`用户密码修改成功: ${userId}`);
    return { success: true };
  }
}
