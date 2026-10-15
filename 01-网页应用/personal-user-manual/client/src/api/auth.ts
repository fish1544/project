import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  UsernameCheckResponse,
  CurrentUserResponse,
} from '@shared/api.interface';

export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/auth/register',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('注册失败', error);
    throw error;
  }
}

export async function login(data: LoginRequest): Promise<LoginResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/auth/login',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('登录失败', error);
    throw error;
  }
}

export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/auth/logout',
      method: 'POST',
    });
    return response.data;
  } catch (error) {
    logger.error('登出失败', error);
    throw error;
  }
}

export async function checkUsername(username: string): Promise<UsernameCheckResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/auth/check-username',
      method: 'GET',
      params: { username },
    });
    return response.data;
  } catch (error) {
    logger.error('检查用户名失败', error);
    throw error;
  }
}

export async function getCurrentUser(): Promise<CurrentUserResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/auth/me',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取当前用户失败', error);
    throw error;
  }
}
