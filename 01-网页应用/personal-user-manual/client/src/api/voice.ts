import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  VoiceRecord,
  VoiceRecordCreateRequest,
  VoiceRecordUpdateRequest,
  VoiceRecordListResponse,
} from '@shared/api.interface';

export async function getVoiceRecords(
  page = 1,
  pageSize = 20,
): Promise<VoiceRecordListResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/voice',
      method: 'GET',
      params: { page, pageSize },
    });
    return response.data;
  } catch (error) {
    logger.error('获取语音记录列表失败', error);
    throw error;
  }
}

export async function createVoiceRecord(
  data: VoiceRecordCreateRequest,
): Promise<VoiceRecord> {
  try {
    const response = await axiosForBackend({
      url: '/api/voice',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('创建语音记录失败', error);
    throw error;
  }
}

export async function getVoiceRecord(id: string): Promise<VoiceRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/voice/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取语音记录详情失败', error);
    throw error;
  }
}

export async function updateVoiceRecord(
  id: string,
  data: VoiceRecordUpdateRequest,
): Promise<VoiceRecord> {
  try {
    const response = await axiosForBackend({
      url: `/api/voice/${id}`,
      method: 'PATCH',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('更新语音记录失败', error);
    throw error;
  }
}

export async function deleteVoiceRecord(id: string): Promise<{ success: boolean }> {
  try {
    const response = await axiosForBackend({
      url: `/api/voice/${id}`,
      method: 'DELETE',
    });
    return response.data;
  } catch (error) {
    logger.error('删除语音记录失败', error);
    throw error;
  }
}
