import { CycloneCategory, TrackPoint } from './cyclone';

export interface ForecastPoint extends TrackPoint {
  leadTimeHours: number;
  validTime: string;
  uncertaintyRadiusKm: number;
  intensityCategory: CycloneCategory;
}

export interface PredictionRun {
  id: string;
  cycloneId: string;
  cycloneName: string;
  modelName: string;
  modelShortCode: string; // e.g. 'VC-NET-V2', 'IFS', 'GFS'
  issueTime: string;
  confidenceScore: number; // 0 to 100%
  points: ForecastPoint[];
  ensembleSpreadKm: number;
}

export interface PredictionUpdateDelta {
  id: string;
  cycloneId: string;
  cycloneName: string;
  timestamp: string;
  leadTimeTarget: string; // e.g. "+48h Forecast"
  previousPrediction: {
    lat: number;
    lon: number;
    windSpeedKnots: number;
    centralPressureHpa: number;
    timestamp: string;
  };
  updatedPrediction: {
    lat: number;
    lon: number;
    windSpeedKnots: number;
    centralPressureHpa: number;
    timestamp: string;
  };
  trackShiftKm: number;
  intensityShiftKnots: number;
  explanation: string | null;
  environmentalFactors?: {
    verticalWindShear?: string;
    seaSurfaceTemp?: string;
    steeringRidge?: string;
    atmosphericMoisture?: string;
  };
}
