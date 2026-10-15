import apiClient from './client';
import type {
  CommunityPost,
  CommunityListResponse,
  CreateCommunityPostRequest,
} from '@shared/api.interface';

export async function getCommunityPosts(params: {
  page: number;
  pageSize: number;
  category?: string;
}): Promise<CommunityListResponse> {
  const res = await apiClient.get('/api/community/posts', { params });
  return res.data;
}

export async function createPost(
  data: CreateCommunityPostRequest,
): Promise<CommunityPost> {
  const res = await apiClient.post('/api/community/posts', data);
  return res.data;
}

export async function likePost(
  id: string,
): Promise<{ likesCount: number }> {
  const res = await apiClient.post(`/api/community/posts/${id}/like`, {});
  return res.data;
}

export async function deletePost(id: string): Promise<void> {
  await apiClient.delete(`/api/community/posts/${id}`);
}
