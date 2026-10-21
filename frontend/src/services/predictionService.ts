import { PredictionRun, PredictionUpdateDelta } from '../types/prediction';
import { apiGet } from './api';
import { MOCK_PREDICTION_RUNS, MOCK_PREDICTION_UPDATES } from '../mocks/mockData';

export const predictionService = {
  /**
   * Fetch current forecast trajectory for a specific cyclone
   */
  async getPredictionForCyclone(cycloneId: string): Promise<PredictionRun | null> {
    const fallback = MOCK_PREDICTION_RUNS[cycloneId] || null;
    return apiGet<PredictionRun | null>(`/predictions/trajectories/${cycloneId}`, fallback);
  },

  /**
   * Fetch recent prediction change events / model delta updates
   */
  async getRecentPredictionUpdates(cycloneId?: string): Promise<PredictionUpdateDelta[]> {
    let fallback = MOCK_PREDICTION_UPDATES;
    if (cycloneId) {
      fallback = fallback.filter((u) => u.cycloneId === cycloneId);
    }
    return apiGet<PredictionUpdateDelta[]>('/predictions/updates', fallback);
  },
};
