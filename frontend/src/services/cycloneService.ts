import { Cyclone, CycloneSummaryStats } from '../types/cyclone';
import { apiGet } from './api';
import { 
  MOCK_CYCLONES, 
  MOCK_SUMMARY_STATS, 
  MOCK_HISTORICAL_ARCHIVE, 
  HistoricalCycloneArchiveRecord 
} from '../mocks/mockData';

export const cycloneService = {
  /**
   * Fetch current global summary statistics
   */
  async getSummaryStats(): Promise<CycloneSummaryStats> {
    return apiGet<CycloneSummaryStats>('/cyclones/summary', MOCK_SUMMARY_STATS);
  },

  /**
   * Fetch list of all active cyclones
   */
  async getActiveCyclones(): Promise<Cyclone[]> {
    return apiGet<Cyclone[]>('/cyclones/active', MOCK_CYCLONES);
  },

  /**
   * Fetch a single cyclone by ID
   */
  async getCycloneById(id: string): Promise<Cyclone | null> {
    const defaultItem = MOCK_CYCLONES.find((c) => c.id === id) || null;
    return apiGet<Cyclone | null>(`/cyclones/${id}`, defaultItem);
  },

  /**
   * Fetch historical cyclone database records
   */
  async getHistoricalArchive(year?: number, basin?: string): Promise<HistoricalCycloneArchiveRecord[]> {
    let results = MOCK_HISTORICAL_ARCHIVE;
    if (year) {
      results = results.filter((r) => r.year === year);
    }
    if (basin && basin !== 'ALL') {
      results = results.filter((r) => r.basin.includes(basin));
    }
    return apiGet<HistoricalCycloneArchiveRecord[]>('/cyclones/historical', results);
  },
};
