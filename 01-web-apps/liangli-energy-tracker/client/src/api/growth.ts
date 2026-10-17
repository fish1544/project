import apiClient from './client';
import type {
  GrowthItem,
  CreateGrowthItemRequest,
  GrowthListResponse,
} from '@shared/api.interface';

export async function getGrowthList(params?: {
  category?: string;
  isConverted?: boolean;
}): Promise<GrowthListResponse> {
  const res = await apiClient.get('/api/growth', { params });
  return res.data;
}

export async function createGrowthItem(
  data: CreateGrowthItemRequest,
): Promise<GrowthItem> {
  const res = await apiClient.post('/api/growth', data);
  return res.data;
}

export async function updateGrowthItem(
  id: string,
  data: Partial<CreateGrowthItemRequest>,
): Promise<GrowthItem> {
  const res = await apiClient.patch(`/api/growth/${id}`, data);
  return res.data;
}

export async function deleteGrowthItem(id: string): Promise<void> {
  await apiClient.delete(`/api/growth/${id}`);
}

export async function convertToTask(id: string): Promise<{
  taskId: string;
  growthItem: GrowthItem;
}> {
  const res = await apiClient.post(`/api/growth/${id}/convert`, {});
  return res.data;
}
