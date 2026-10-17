import apiClient from './client';
import type { ReviewData } from '@shared/api.interface';

export async function getReviewData(
  period: 'week' | 'month' | 'all',
): Promise<ReviewData> {
  const res = await apiClient.get('/api/review', { params: { period } });
  return res.data;
}
