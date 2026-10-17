export interface User {
  id: string;
  username: string;
  nickname: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: 'admin' | 'user';
  dailyEnergyLimit: number;
  growthDirections: string[];
  isPublic: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UsernameCheckResponse {
  available: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  energyLevel: number;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  energyLevel: number;
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  energyLevel?: number;
  status?: 'pending' | 'in_progress' | 'completed';
  dueDate?: string;
}

export interface TaskListResponse {
  items: Task[];
  total: number;
}

export interface EnergyLoadResponse {
  totalEnergy: number;
  usedEnergy: number;
  remainingEnergy: number;
  loadStatus: 'light' | 'comfortable' | 'tight' | 'overload';
  pendingTasks: Task[];
  completedTasks: Task[];
}

export interface GrowthItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  energyLevel: number;
  isConverted: boolean;
  convertedTaskId: string | null;
  createdAt: string;
}

export interface CreateGrowthItemRequest {
  title: string;
  description?: string;
  category?: string;
  energyLevel?: number;
}

export interface GrowthListResponse {
  items: GrowthItem[];
  total: number;
}

export interface FocusRecord {
  id: string;
  taskId: string | null;
  mode: 'pomodoro' | 'free';
  durationSeconds: number;
  focusDate: string;
  startedAt: string;
  endedAt: string | null;
  isCompleted: boolean;
}

export interface StartFocusRequest {
  taskId?: string;
  mode: 'pomodoro' | 'free';
  durationSeconds?: number;
}

export interface EndFocusRequest {
  recordId: string;
  isCompleted: boolean;
}

export interface FocusStatsResponse {
  totalMinutes: number;
  totalSessions: number;
  todayMinutes: number;
  weeklyData: { date: string; minutes: number }[];
  distribution: { category: string; minutes: number }[];
}

export interface CommunityPost {
  id: string;
  content: string;
  goalCategory: string | null;
  likesCount: number;
  authorNickname: string;
  authorAvatarUrl: string | null;
  createdAt: string;
}

export interface CreateCommunityPostRequest {
  content: string;
  goalCategory?: string;
  isPublic?: boolean;
}

export interface CommunityListResponse {
  items: CommunityPost[];
  total: number;
}

export interface ReviewData {
  period: 'week' | 'month' | 'all';
  taskCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  totalFocusMinutes: number;
  averageDailyFocusMinutes: number;
  energyUsed: number;
  energyTrend: { date: string; used: number; limit: number }[];
  categoryBreakdown: { category: string; count: number }[];
}

export interface UserProfileUpdateRequest {
  nickname?: string;
  avatarUrl?: string;
  bio?: string;
  dailyEnergyLimit?: number;
  growthDirections?: string[];
  isPublic?: boolean;
}

export interface PasswordChangeRequest {
  oldPassword: string;
  newPassword: string;
}
