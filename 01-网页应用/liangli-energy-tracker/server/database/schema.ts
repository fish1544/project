/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, foreignKey, index, integer, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

export const customTimestamptz = customType<{
  data: Date;
  driverData: string;
  config: { precision?: number };
}>({
  dataType(config) {
    const precision = typeof config?.precision !== 'undefined'
      ? ` (${config.precision})`
      : '';
    return `timestamptz${precision}`;
  },
  toDriver(value: Date | string | number) {
    if (value == null) return value as any;
    if (typeof value === 'number') return new Date(value).toISOString();
    if (typeof value === 'string') return value;
    if (value instanceof Date) return value.toISOString();
    throw new Error('Invalid timestamp value');
  },
  fromDriver(value: string | Date): Date {
    if (value instanceof Date) return value;
    return new Date(value);
  },
});

export const userProfile = customType<{
  data: string;
  driverData: string;
}>({
  dataType() {
    return 'user_profile';
  },
  toDriver(value: string) {
    return sql`ROW(${value})::user_profile`;
  },
  fromDriver(value: string) {
    const [userId] = value.slice(1, -1).split(',');
    return userId.trim();
  },
});

export type FileAttachment = {
  bucket_id: string;
  file_path: string;
};

export const fileAttachment = customType<{
  data: FileAttachment;
  driverData: string;
}>({
  dataType() {
    return 'file_attachment';
  },
  toDriver(value: FileAttachment) {
    return sql`ROW(${value.bucket_id},${value.file_path})::file_attachment`;
  },
  fromDriver(value: string): FileAttachment {
    const [bucketId, filePath] = value.slice(1, -1).split(',');
    return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
  },
});

export function escapeLiteral(str: string): string {
  return "'" + str.replace(/'/g, "''") + "'";
}

export const userProfileArray = customType<{
  data: string[];
  driverData: string;
}>({
  dataType() {
    return 'user_profile[]';
  },
  toDriver(value: string[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::user_profile[]`;
    }
    const elements = value.map(id => `ROW(${escapeLiteral(id)})::user_profile`).join(',');
    return sql.raw(`ARRAY[${elements}]::user_profile[]`);
  },
  fromDriver(value: string): string[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => m.slice(1, -1).split(',')[0].trim());
  },
});

export const fileAttachmentArray = customType<{
  data: FileAttachment[];
  driverData: string;
}>({
  dataType() {
    return 'file_attachment[]';
  },
  toDriver(value: FileAttachment[]) {
    if (!value || value.length === 0) {
      return sql`'{}'::file_attachment[]`;
    }
    const elements = value.map(f =>
      `ROW(${escapeLiteral(f.bucket_id)},${escapeLiteral(f.file_path)})::file_attachment`
    ).join(',');
    return sql.raw(`ARRAY[${elements}]::file_attachment[]`);
  },
  fromDriver(value: string): FileAttachment[] {
    if (!value || value === '{}') return [];
    const inner = value.slice(1, -1);
    const matches = inner.match(/\([^)]*\)/g) || [];
    return matches.map(m => {
      const [bucketId, filePath] = m.slice(1, -1).split(',');
      return { bucket_id: bucketId.trim(), file_path: filePath.trim() };
    });
  },
});

export const communityPost = pgTable("community_post", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  content: text("content").notNull(),
  goalCategory: varchar("goal_category", { length: 50 }),
  likesCount: integer("likes_count").notNull().default(0),
  isPublic: boolean("is_public").notNull().default(true),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_community_post_is_public").on(table.isPublic),
  index("idx_community_post_created_at").on(table.createdAt),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "community_post_user_id_fkey",
  }).onDelete("cascade"),
]);

export const focusRecord = pgTable("focus_record", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  taskId: uuid("task_id"),
  mode: varchar("mode", { length: 20 }).notNull().default('pomodoro'),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  focusDate: date("focus_date").notNull(),
  startedAt: customTimestamptz("started_at", { precision: 3 }).notNull(),
  endedAt: customTimestamptz("ended_at", { precision: 3 }),
  isCompleted: boolean("is_completed").notNull().default(false),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_focus_record_user_id").on(table.userId),
  index("idx_focus_record_focus_date").on(table.focusDate),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "focus_record_user_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.taskId],
    foreignColumns: [task.id],
    name: "focus_record_task_id_fkey",
  }).onDelete("set null"),
]);

export const growthPool = pgTable("growth_pool", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 50 }),
  energyLevel: integer("energy_level").notNull().default(1),
  isConverted: boolean("is_converted").notNull().default(false),
  convertedTaskId: uuid("converted_task_id"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_growth_pool_user_id").on(table.userId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "growth_pool_user_id_fkey",
  }).onDelete("cascade"),
  foreignKey({
    columns: [table.convertedTaskId],
    foreignColumns: [task.id],
    name: "growth_pool_converted_task_id_fkey",
  }).onDelete("set null"),
]);

export const task = pgTable("task", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  energyLevel: integer("energy_level").notNull().default(1),
  status: varchar("status", { length: 20 }).notNull().default('pending'),
  dueDate: date("due_date"),
  completedAt: customTimestamptz("completed_at", { precision: 3 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_task_user_id").on(table.userId),
  index("idx_task_status").on(table.status),
  index("idx_task_due_date").on(table.dueDate),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUser.id],
    name: "task_user_id_fkey",
  }).onDelete("cascade"),
]);

export const appUser = pgTable("app_user", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  nickname: varchar("nickname", { length: 100 }),
  avatarUrl: text("avatar_url"),
  bio: varchar("bio", { length: 500 }),
  dailyEnergyLimit: integer("daily_energy_limit").notNull().default(100),
  growthDirections: varchar("growth_directions", { length: 255 }).array().default(sql`{}'::character varying(255)[]`),
  isPublic: boolean("is_public").notNull().default(false),
  role: varchar("role", { length: 20 }).notNull().default('user'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("app_user_username_key").on(table.username),
]);

// table aliases
export const appUserTable = appUser;
export const communityPostTable = communityPost;
export const focusRecordTable = focusRecord;
export const growthPoolTable = growthPool;
export const taskTable = task;
