import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  TimerRecord,
  TimerRecordCreateRequest,
  TimerRecordUpdateRequest,
  TimerRecordListResponse,
  TimerStatsResponse,
} from '@shared/api.interface';

export async function getTimerRecords(
  page = 1,
  pageSize = 20,
  category?: string,
): Promise<TimerRecordListResponse> {
  try {
    const params: Record<string, unknown> = { page, pageSize };
    if (category) params.category = category;
    const response = await axiosForBackend({
      url: '/api/timer',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取计时记录列表失败', error);
    throw error;
  }
}

export async function createTimerRecord(
  data: TimerRecordCreateRequest,
): Promise<TimerRecord> {
  try {
    const response = await axiosForBackend({
      url: '/api/timer',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建计时记录失败', error);
    throw error;
  }
}

export async function getTimerStats(days = 7): Promise<TimerStatsResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/timer/stats',
      method: 'GET',
      params: { days },
    });
    return response.data;
  } catch (error) {
    logger.error('获取计时统计失败', error);
    throw error;
  }
}

export async function getTimerRecord(id: string): Promise<TimerRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/timer/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取计时记录详情失败', error);
    throw error;
  }
}

export async function updateTimerRecord(
  id: string,
  data: TimerRecordUpdateRequest,
): Promise<TimerRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/timer/${id}`,
      method: 'PATCH',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新计时记录失败', error);
    throw error;
  }
}

export async function deleteTimerRecord(id: string): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: `/api/timer/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除计时记录失败', error);
    throw error;
  }
}
