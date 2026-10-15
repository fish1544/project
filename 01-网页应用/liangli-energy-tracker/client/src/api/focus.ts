import apiClient from './client';
import type {
  FocusRecord,
  StartFocusRequest,
  EndFocusRequest,
  FocusStatsResponse,
} from '@shared/api.interface';

export async function startFocus(
  data: StartFocusRequest,
): Promise<FocusRecord> {
  const res = await apiClient.post('/api/focus/start', data);
  return res.data;
}

export async function endFocus(
  data: EndFocusRequest,
): Promise<FocusRecord> {
  const res = await apiClient.post('/api/focus/end', data);
  return res.data;
}

export async function getFocusRecords(params?: {
  date?: string;
}): Promise<{ items: FocusRecord[]; total: number }> {
  const res = await apiClient.get('/api/focus/records', { params });
  return res.data;
}

export async function getFocusStats(): Promise<FocusStatsResponse> {
  const res = await apiClient.get('/api/focus/stats');
  return res.data;
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
