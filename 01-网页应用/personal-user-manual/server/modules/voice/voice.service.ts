import { Injectable, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import {
  DRIZZLE_DATABASE,
  type PostgresJsDatabase,
} from '@lark-apaas/fullstack-nestjs-core';
import { eq, and, desc, count } from 'drizzle-orm';
import { voiceRecords } from '@server/database/schema';
import type { VoiceRecord, VoiceRecordCreateRequest, VoiceRecordUpdateRequest } from '@shared/api.interface';
import { extractEmotionTags, extractEventTags, extractTimeMentions } from './utils/extract-tags';

type VoiceRecordRow = typeof voiceRecords.$inferSelect;

function toVoiceRecord(row: VoiceRecordRow): VoiceRecord {
  const dateVal = row.recordDate;
  return {
    id: row.id,
    audioUrl: row.audioUrl ?? null,
    durationSeconds: row.durationSeconds ?? 0,
    transcript: row.transcript ?? null,
    emotionTags: row.emotionTags ?? [],
    eventTags: row.eventTags ?? [],
    timeMentions: row.timeMentions ?? [],
    recordDate: typeof row.recordDate === 'string'
      ? row.recordDate
      : String(row.recordDate),
    createdAt: row.createdAt.toISOString(),
  };
}

@Injectable()
export class VoiceService {
  constructor(
    @Inject(DRIZZLE_DATABASE) private readonly db: PostgresJsDatabase,
  ) {}

  async list(
    userId: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ items: VoiceRecord[]; total: number }> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.min(50, Math.max(1, pageSize));
    const offset = (safePage - 1) * safePageSize;

    const [countResult, rows] = await Promise.all([
      this.db
        .select({ count: count() })
        .from(voiceRecords)
        .where(eq(voiceRecords.userId, userId)),
      this.db
        .select()
        .from(voiceRecords)
        .where(eq(voiceRecords.userId, userId))
        .orderBy(desc(voiceRecords.recordDate), desc(voiceRecords.createdAt))
        .limit(safePageSize)
        .offset(offset),
    ]);

    const total = countResult[0]?.count ?? 0;
    const items: VoiceRecord[] = rows.map((row) => toVoiceRecord(row));

    return { items, total };
  }

  async getById(userId: string, id: string): Promise<VoiceRecord> {
    const rows = await this.db
      .select()
      .from(voiceRecords)
      .where(and(eq(voiceRecords.userId, userId), eq(voiceRecords.id, id)))
      .limit(1);

    if (rows.length === 0) {
      throw new NotFoundException('语音记录不存在');
    }

    return toVoiceRecord(rows[0]);
  }

  async create(
    userId: string,
    data: VoiceRecordCreateRequest,
  ): Promise<VoiceRecord> {
    const emotionTags =
      data.emotionTags && data.emotionTags.length > 0
        ? data.emotionTags
        : data.transcript
          ? extractEmotionTags(data.transcript)
          : [];

    const eventTags =
      data.eventTags && data.eventTags.length > 0
        ? data.eventTags
        : data.transcript
          ? extractEventTags(data.transcript)
          : [];

    const timeMentions =
      data.timeMentions && data.timeMentions.length > 0
        ? data.timeMentions
        : data.transcript
          ? extractTimeMentions(data.transcript)
          : [];

    const inserted = await this.db
      .insert(voiceRecords)
      .values({
        userId,
        audioUrl: data.audioUrl ?? null,
        durationSeconds: data.durationSeconds ?? 0,
        transcript: data.transcript ?? null,
        emotionTags,
        eventTags,
        timeMentions,
        recordDate: data.recordDate,
      })
      .returning();

    return toVoiceRecord(inserted[0]);
  }

  async update(
    userId: string,
    id: string,
    data: VoiceRecordUpdateRequest & { durationSeconds?: number; recordDate?: string; audioUrl?: string },
  ): Promise<VoiceRecord> {
    const existing = await this.db
      .select({ id: voiceRecords.id })
      .from(voiceRecords)
      .where(and(eq(voiceRecords.userId, userId), eq(voiceRecords.id, id)))
      .limit(1);

    if (existing.length === 0) {
      throw new NotFoundException('语音记录不存在');
    }

    const patch: Partial<typeof voiceRecords.$inferInsert> = {};

    if (data.transcript !== undefined) {
      patch.transcript = data.transcript;
      // 转写更新时，如果用户没显式传标签，则重新自动提取
      if (data.emotionTags === undefined) {
        patch.emotionTags = data.transcript
          ? extractEmotionTags(data.transcript)
          : [];
      }
      if (data.eventTags === undefined) {
        patch.eventTags = data.transcript
          ? extractEventTags(data.transcript)
          : [];
      }
      if (data.timeMentions === undefined) {
        patch.timeMentions = data.transcript
          ? extractTimeMentions(data.transcript)
          : [];
      }
    }

    if (data.emotionTags !== undefined) {
      patch.emotionTags = data.emotionTags;
    }
    if (data.eventTags !== undefined) {
      patch.eventTags = data.eventTags;
    }
    if (data.timeMentions !== undefined) {
      patch.timeMentions = data.timeMentions;
    }
    if (data.durationSeconds !== undefined) {
      patch.durationSeconds = data.durationSeconds;
    }
    if (data.recordDate !== undefined) {
      patch.recordDate = data.recordDate;
    }
    if (data.audioUrl !== undefined) {
      patch.audioUrl = data.audioUrl;
    }

    if (Object.keys(patch).length === 0) {
      return this.getById(userId, id);
    }

    const updated = await this.db
      .update(voiceRecords)
      .set(patch)
      .where(and(eq(voiceRecords.userId, userId), eq(voiceRecords.id, id)))
      .returning();

    return toVoiceRecord(updated[0]);
  }

  async remove(userId: string, id: string): Promise<{ success: boolean }> {
    const deleted = await this.db
      .delete(voiceRecords)
      .where(and(eq(voiceRecords.userId, userId), eq(voiceRecords.id, id)))
      .returning({ id: voiceRecords.id });

    if (deleted.length === 0) {
      throw new NotFoundException('语音记录不存在');
    }

    return { success: true };
  }
}
