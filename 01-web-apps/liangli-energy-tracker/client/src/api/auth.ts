import apiClient from './client';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UsernameCheckResponse,
  User,
  PasswordChangeRequest,
} from '@shared/api.interface';

const TOKEN_KEY = 'liangli_token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/register', data);
  return res.data;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const res = await apiClient.post('/api/auth/login', data);
  return res.data;
}

export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
  const res = await apiClient.get('/api/auth/check-username', {
    params: { username },
  });
  return res.data;
}

export async function getMe(): Promise<User> {
  const res = await apiClient.get('/api/auth/me', {
    headers: authHeaders(),
  });
  return res.data;
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const body: PasswordChangeRequest = { oldPassword, newPassword };
  await apiClient.post('/api/auth/change-password', body, {
    headers: authHeaders(),
  });
}
