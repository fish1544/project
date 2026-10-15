import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type { UserManual } from '@shared/api.interface';

export async function getLatestManual(): Promise<UserManual | null> {
  try {
    const response = await axiosForBackend({
      url: '/api/manual/latest',
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取最新说明书失败', error);
    throw error;
  }
}

export async function generateManual(force = false): Promise<UserManual> {
  try {
    const response = await axiosForBackend({
      url: '/api/manual/generate',
      method: 'POST',
      params: { force },
    });
    return response.data;
  } catch (error) {
    logger.error('生成说明书失败', error);
    throw error;
  }
}
