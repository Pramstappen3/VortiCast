export interface ModelMetricByLeadTime {
  leadTimeHours: number;
  label: string; // '12h', '24h', '48h', '72h', '120h'
  vorticastMaeKm: number;
  ecmwfMaeKm: number;
  gfsMaeKm: number;
  intensityMaeKnots: number;
  sampleCount: number;
}

export interface ModelPerformanceReport {
  evaluatedModel: string;
  version: string;
  validationSeason: string;
  overallTrackMaeKm: number;
  overallIntensityRmseKnots: number;
  metricsByLeadTime: ModelMetricByLeadTime[];
  dataFreshness: string;
  isOfficialEvaluation: boolean;
  notes: string;
}
