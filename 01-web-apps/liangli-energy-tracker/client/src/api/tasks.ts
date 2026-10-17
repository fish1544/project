import apiClient from './client';
import type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskListResponse,
  EnergyLoadResponse,
} from '@shared/api.interface';

export async function getTasks(params?: {
  status?: 'pending' | 'completed';
  date?: string;
}): Promise<TaskListResponse> {
  const res = await apiClient.get('/api/tasks', { params });
  return res.data;
}

export async function getEnergyLoad(): Promise<EnergyLoadResponse> {
  const res = await apiClient.get('/api/tasks/energy-load');
  return res.data;
}

export async function createTask(data: CreateTaskRequest): Promise<Task> {
  const res = await apiClient.post('/api/tasks', data);
  return res.data;
}

export async function updateTask(
  id: string,
  data: UpdateTaskRequest,
): Promise<Task> {
  const res = await apiClient.patch(`/api/tasks/${id}`, data);
  return res.data;
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  const res = await apiClient.delete(`/api/tasks/${id}`);
  return res.data;
}

export function getEnergyLevelLabel(level: number): string {
  const labels: Record<number, string> = {
    1: '很轻松',
    2: '小费劲',
    3: '中等',
    4: '很费劲',
    5: '大工程',
  };
  return labels[level] || `等级${level}`;
}

export function getEnergyLevelValue(level: number): number {
  const values: Record<number, number> = {
    1: 5,
    2: 10,
    3: 20,
    4: 35,
    5: 50,
  };
  return values[level] || 5;
}

export function getLoadStatusLabel(
  status: 'light' | 'comfortable' | 'tight' | 'overload',
): string {
  const labels: Record<string, string> = {
    light: '轻负荷',
    comfortable: '舒适区',
    tight: '紧绷区',
    overload: '超载',
  };
  return labels[status] || status;
}

export function getLoadStatusColor(
  status: 'light' | 'comfortable' | 'tight' | 'overload',
): string {
  const colors: Record<string, string> = {
    light: '#95D5B2',
    comfortable: '#52B788',
    tight: '#F4A261',
    overload: '#E76F51',
  };
  return colors[status] || '#95D5B2';
}
