// ========================================
// 用户与认证
// ========================================

export interface AppUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  createdAt: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  displayName?: string;
}

export interface RegisterResponse {
  success: boolean;
  user: AppUser;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: AppUser;
}

export interface LogoutResponse {
  success: boolean;
}

export interface UsernameCheckResponse {
  available: boolean;
}

export interface CurrentUserResponse {
  user: AppUser | null;
}

// ========================================
// 语音记录
// ========================================

export interface VoiceRecord {
  id: string;
  audioUrl: string | null;
  durationSeconds: number;
  transcript: string | null;
  emotionTags: string[];
  eventTags: string[];
  timeMentions: string[];
  recordDate: string;
  createdAt: string;
}

export interface VoiceRecordCreateRequest {
  audioUrl?: string;
  durationSeconds: number;
  transcript?: string;
  emotionTags?: string[];
  eventTags?: string[];
  timeMentions?: string[];
  recordDate: string;
}

export interface VoiceRecordUpdateRequest {
  transcript?: string;
  emotionTags?: string[];
  eventTags?: string[];
  timeMentions?: string[];
}

export interface VoiceRecordListResponse {
  items: VoiceRecord[];
  total: number;
}

// ========================================
// 计时记录
// ========================================

export type TimerCategory =
  | 'work'
  | 'study'
  | 'creative'
  | 'rest'
  | 'exercise'
  | 'social'
  | 'outdoor'
  | 'other';

export const TIMER_CATEGORIES: TimerCategory[] = [
  'work',
  'study',
  'creative',
  'rest',
  'exercise',
  'social',
  'outdoor',
  'other',
];

export interface TimerRecord {
  id: string;
  taskName: string;
  category: TimerCategory;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  isManual: boolean;
  notes: string | null;
  createdAt: string;
}

export interface TimerRecordCreateRequest {
  taskName: string;
  category: TimerCategory;
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  isManual?: boolean;
  notes?: string;
}

export interface TimerRecordUpdateRequest {
  taskName?: string;
  category?: TimerCategory;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  notes?: string;
}

export interface TimerRecordListResponse {
  items: TimerRecord[];
  total: number;
}

export interface TimerStatsResponse {
  totalSeconds: number;
  byCategory: Record<string, number>;
  byDay: Record<string, number>;
}

// ========================================
// 复盘报告
// ========================================

export type ReviewType = 'daily' | 'weekly' | 'monthly';

export interface ReviewReport {
  id: string;
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
  achievements: string[];
  stressSources: string[];
  triggerPoints: string[];
  behaviorPatterns: string[];
  summary: string | null;
  createdAt: string;
}

export interface ReviewGenerateRequest {
  reviewType: ReviewType;
  periodStart: string;
  periodEnd: string;
}

export interface ReviewListResponse {
  items: ReviewReport[];
  total: number;
}

// ========================================
// 个人使用说明书
// ========================================

export interface StressThreshold {
  threshold: string;
  symptom: string;
  solution: string;
}

export interface HabitSuggestion {
  category: string;
  suggestion: string;
  action: string;
}

export interface UserManual {
  id: string;
  version: number;
  energyRhythm: string[];
  stressThresholds: StressThreshold[];
  habitSuggestions: HabitSuggestion[];
  personalInsights: string | null;
  generatedAt: string;
}

export interface ManualGenerateRequest {
  force?: boolean;
}

// ========================================
// 反馈问卷
// ========================================

export interface FeedbackSubmitRequest {
  voiceRecognitionRating?: number;
  aiReviewAccuracyRating?: number;
  timerUsabilityRating?: number;
  overallRating?: number;
  suggestions?: string;
}

export interface FeedbackSubmitResponse {
  success: boolean;
  id: string;
}
