import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  ReviewReport,
  ReviewGenerateRequest,
  ReviewListResponse,
  ReviewType,
} from '@shared/api.interface';

export async function getReviewReports(
  page = 1,
  pageSize = 20,
  type?: ReviewType,
): Promise<ReviewListResponse> {
  try {
    const params: Record<string, unknown> = { page, pageSize };
    if (type) params.type = type;
    const response = await axiosForBackend({
      url: '/api/review',
      method: 'GET',
      params,
    });
    return response.data;
  } catch (error) {
    logger.error('获取复盘报告列表失败', error);
    throw error;
  }
}

export async function generateReview(
  data: ReviewGenerateRequest,
): Promise<ReviewReport> {
  try {
    const response = await axiosForBackend({
      url: '/api/review/generate',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('生成复盘报告失败', error);
    throw error;
  }
}

export async function getReviewReport(id: string): Promise<ReviewReport> {
  try {
    const response = await axiosForBackend({
      url: `/api/review/${id}`,
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    logger.error('获取复盘报告详情失败', error);
    throw error;
  }
}
