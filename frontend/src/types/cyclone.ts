export type CycloneBasin = 
  | 'North Indian Ocean (NIO)'
  | 'Western North Pacific (WPAC)'
  | 'North Atlantic (NATL)'
  | 'Eastern North Pacific (EPAC)'
  | 'South Pacific (SPAC)'
  | 'South Indian Ocean (SIO)';

export type CycloneCategory = 
  | 'Tropical Depression'
  | 'Tropical Storm'
  | 'Severe Cyclonic Storm'
  | 'Very Severe Cyclonic Storm'
  | 'Extremely Severe Cyclonic Storm'
  | 'Super Cyclonic Storm'
  | 'Category 1'
  | 'Category 2'
  | 'Category 3'
  | 'Category 4'
  | 'Category 5';

export type CycloneStatus = 'ACTIVE' | 'DISSIPATING' | 'LANDFALL' | 'EXTRATROPICAL';

export interface CycloneObservation {
  timestamp: string;
  lat: number;
  lon: number;
  windSpeedKnots: number;
  windSpeedKmh: number;
  centralPressureHpa: number;
  movementDirection: string; // e.g. 'NNW'
  movementSpeedKmh: number;
  status: CycloneStatus;
  category: CycloneCategory;
}

export interface TrackPoint {
  id: string;
  lat: number;
  lon: number;
  timestamp: string;
  windSpeedKnots: number;
  centralPressureHpa?: number;
  category: CycloneCategory;
  type: 'OBSERVED' | 'PREDICTED';
  leadTimeHours?: number;
  uncertaintyRadiusKm?: number;
}

export interface Cyclone {
  id: string;
  name: string;
  code: string; // e.g. '02B' or 'AL092026'
  basin: CycloneBasin;
  status: CycloneStatus;
  current: CycloneObservation;
  history: TrackPoint[];
  forecastConfidenceScore?: number; // 0 - 100%
  satelliteImageUrl?: string;
  alertLevel: 'ADVISORY' | 'WATCH' | 'WARNING' | 'EMERGENCY';
  landfallThreat: boolean;
  affectedRegions: string[];
}

export interface CycloneSummaryStats {
  activeCount: number;
  strongestWindKnots: number;
  strongestStormName: string;
  averageConfidencePct: number | null;
  lastUpdatedTimestamp: string;
}
