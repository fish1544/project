import apiClient from './client';
import type {
  User,
  UserProfileUpdateRequest,
} from '@shared/api.interface';

export async function getProfile(): Promise<User> {
  const res = await apiClient.get('/api/user/profile');
  return res.data;
}

export async function updateProfile(
  data: UserProfileUpdateRequest,
): Promise<User> {
  const res = await apiClient.patch('/api/user/profile', data);
  return res.data;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  await apiClient.post('/api/user/change-password', { oldPassword, newPassword });
}
