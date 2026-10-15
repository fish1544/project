import { logger } from '@lark-apaas/client-toolkit/logger';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import type {
  FeedbackSubmitRequest,
  FeedbackSubmitResponse,
} from '@shared/api.interface';

export async function submitFeedback(
  data: FeedbackSubmitRequest,
): Promise<FeedbackSubmitResponse> {
  try {
    const response = await axiosForBackend({
      url: '/api/feedback',
      method: 'POST',
      data,
    });
    return response.data;
  } catch (error) {
    logger.error('提交反馈失败', error);
    throw error;
  }
}
