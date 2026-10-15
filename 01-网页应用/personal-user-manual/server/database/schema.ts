/* eslint-disable */
/** auto generated, do not edit */
import { sql } from 'drizzle-orm';
import { boolean, date, foreignKey, index, integer, jsonb, pgTable, text, uniqueIndex, uuid, varchar, customType } from "drizzle-orm/pg-core"

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

export const userSessions = pgTable("user_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  sessionToken: varchar("session_token", { length: 128 }).notNull().unique(),
  expiresAt: customTimestamptz("expires_at", { precision: 3 }).notNull(),
  userAgent: text("user_agent"),
  ipAddress: varchar("ip_address", { length: 45 }),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("user_sessions_session_token_key").on(table.sessionToken),
  index("idx_user_sessions_token").on(table.sessionToken),
  index("idx_user_sessions_expires").on(table.expiresAt),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "user_sessions_user_id_fkey",
  }).onDelete("cascade"),
]);

export const feedbackSurveys = pgTable("feedback_surveys", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id"),
  voiceRecognitionRating: integer("voice_recognition_rating"),
  aiReviewAccuracyRating: integer("ai_review_accuracy_rating"),
  timerUsabilityRating: integer("timer_usability_rating"),
  overallRating: integer("overall_rating"),
  suggestions: text("suggestions"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_feedback_surveys_user_id").on(table.userId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "feedback_surveys_user_id_fkey",
  }).onDelete("set null"),
]);

export const userManuals = pgTable("user_manuals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  version: integer("version").notNull().default(1),
  energyRhythm: text("energy_rhythm").array().default([]),
  /**
   * @type { threshold: string, symptom: string, solution: string }[]
   */
  stressThresholds: jsonb("stress_thresholds").default('[]'),
  /**
   * @type { category: string, suggestion: string, action: string }[]
   */
  habitSuggestions: jsonb("habit_suggestions").default('[]'),
  personalInsights: text("personal_insights"),
  generatedAt: customTimestamptz("generated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_user_manuals_user_id").on(table.userId),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "user_manuals_user_id_fkey",
  }).onDelete("cascade"),
]);

export const reviewReports = pgTable("review_reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  reviewType: varchar("review_type", { length: 20 }).notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  achievements: text("achievements").array().default([]),
  stressSources: text("stress_sources").array().default([]),
  triggerPoints: text("trigger_points").array().default([]),
  behaviorPatterns: text("behavior_patterns").array().default([]),
  summary: text("summary"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_review_reports_user_id").on(table.userId),
  index("idx_review_reports_type").on(table.reviewType),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "review_reports_user_id_fkey",
  }).onDelete("cascade"),
]);

export const timerRecords = pgTable("timer_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  taskName: varchar("task_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 50 }).notNull().default('work'),
  durationSeconds: integer("duration_seconds").notNull().default(0),
  startedAt: customTimestamptz("started_at", { precision: 3 }).notNull(),
  endedAt: customTimestamptz("ended_at", { precision: 3 }).notNull(),
  isManual: boolean("is_manual").notNull().default(false),
  notes: text("notes"),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_timer_records_user_id").on(table.userId),
  index("idx_timer_records_category").on(table.category),
  index("idx_timer_records_started").on(table.startedAt),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "timer_records_user_id_fkey",
  }).onDelete("cascade"),
]);

export const voiceRecords = pgTable("voice_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull(),
  audioUrl: text("audio_url"),
  durationSeconds: integer("duration_seconds").default(0),
  transcript: text("transcript"),
  emotionTags: varchar("emotion_tags", { length: 255 }).array().default([]),
  eventTags: varchar("event_tags", { length: 255 }).array().default([]),
  timeMentions: varchar("time_mentions", { length: 255 }).array().default([]),
  recordDate: date("record_date").notNull(),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  index("idx_voice_records_user_id").on(table.userId),
  index("idx_voice_records_date").on(table.recordDate),
  foreignKey({
    columns: [table.userId],
    foreignColumns: [appUsers.id],
    name: "voice_records_user_id_fkey",
  }).onDelete("cascade"),
]);

export const appUsers = pgTable("app_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  passwordSalt: varchar("password_salt", { length: 64 }).notNull(),
  displayName: varchar("display_name", { length: 100 }),
  lastLoginAt: customTimestamptz("last_login_at", { precision: 3 }),
  role: varchar("role", { length: 20 }).notNull().default('user'),
  // System field: Creation time (auto-filled, do not modify)
  createdAt: customTimestamptz("_created_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
  // System field: Update time (auto-filled, do not modify)
  updatedAt: customTimestamptz("_updated_at", { precision: 3 }).notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("app_users_username_key").on(table.username),
]);

// table aliases
export const appUsersTable = appUsers;
export const feedbackSurveysTable = feedbackSurveys;
export const reviewReportsTable = reviewReports;
export const timerRecordsTable = timerRecords;
export const userManualsTable = userManuals;
export const userSessionsTable = userSessions;
export const voiceRecordsTable = voiceRecords;
