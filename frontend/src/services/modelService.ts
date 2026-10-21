import { ModelPerformanceReport } from '../types/model';
import { apiGet } from './api';
import { MOCK_MODEL_PERFORMANCE } from '../mocks/mockData';

export const modelService = {
  /**
   * Fetch current model performance verification benchmarks
   */
  async getModelPerformanceReport(): Promise<ModelPerformanceReport> {
    return apiGet<ModelPerformanceReport>('/models/performance/latest', MOCK_MODEL_PERFORMANCE);
  },
};
