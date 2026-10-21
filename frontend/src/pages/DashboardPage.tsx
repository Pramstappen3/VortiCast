import React from 'react';
import { Cyclone, CycloneSummaryStats } from '../types/cyclone';
import { PredictionRun, PredictionUpdateDelta } from '../types/prediction';
import { SummaryCards } from '../components/dashboard/SummaryCards';
import { CycloneMap } from '../components/maps/CycloneMap';
import { SelectedCycloneDetails } from '../components/dashboard/SelectedCycloneDetails';
import { PredictionOverview } from '../components/dashboard/PredictionOverview';
import { RecentPredictionUpdates } from '../components/dashboard/RecentPredictionUpdates';
import { CycloneAnalysisCharts } from '../components/charts/CycloneAnalysisCharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Map, Layers, Radio, AlertTriangle } from 'lucide-react';

interface DashboardPageProps {
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone: (c: Cyclone) => void;
  summaryStats: CycloneSummaryStats | null;
  currentPrediction: PredictionRun | null;
  predictionUpdates: PredictionUpdateDelta[];
  loading: boolean;
  windUnit: 'kt' | 'kmh' | 'mph';
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  summaryStats,
  currentPrediction,
  predictionUpdates,
  loading,
  windUnit,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Summary Cards (Section 5A) */}
      <SummaryCards stats={summaryStats} loading={loading} />

      {/* 2. Map and Cyclone Details Grid (Sections 5B & 5C) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Interactive Map: 8 Cols */}
        <div className="lg:col-span-8 flex flex-col space-y-2">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Map className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
                Geographic Cyclone Tracking & Trajectory Map
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Basemap: CartoDB Dark Matter
            </span>
          </div>

          <div className="h-[480px] w-full">
            <CycloneMap
              cyclones={cyclones}
              selectedCyclone={selectedCyclone}
              onSelectCyclone={onSelectCyclone}
              forecastPoints={currentPrediction?.points || []}
              showForecastCone={true}
              showHistoricalTrack={true}
            />
          </div>
        </div>

        {/* Selected Cyclone Details Panel: 4 Cols */}
        <div className="lg:col-span-4">
          <SelectedCycloneDetails
            cyclone={selectedCyclone}
            windUnit={windUnit}
          />
        </div>
      </div>

      {/* 3. Prediction Overview (Section 5D) */}
      <div>
        <PredictionOverview
          prediction={currentPrediction}
          cyclone={selectedCyclone}
          windUnit={windUnit}
        />
      </div>

      {/* 4. Meteorological Charts */}
      <div>
        <CycloneAnalysisCharts
          cyclone={selectedCyclone}
          prediction={currentPrediction}
        />
      </div>

      {/* 5. Recent Prediction Updates & Timeline (Section 5E) */}
      <div>
        <RecentPredictionUpdates updates={predictionUpdates} />
      </div>
    </div>
  );
};
