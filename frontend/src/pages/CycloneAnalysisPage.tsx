import React from 'react';
import { Cyclone } from '../types/cyclone';
import { PredictionRun } from '../types/prediction';
import { CycloneAnalysisCharts } from '../components/charts/CycloneAnalysisCharts';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LineChart, Wind, Gauge, Compass, BarChart2, ShieldAlert } from 'lucide-react';
import { formatCoordinates, formatWindSpeed, formatPressure } from '../utils/formatters';

interface CycloneAnalysisPageProps {
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone: (c: Cyclone) => void;
  prediction: PredictionRun | null;
  windUnit: 'kt' | 'kmh' | 'mph';
}

export const CycloneAnalysisPage: React.FC<CycloneAnalysisPageProps> = ({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  prediction,
  windUnit,
}) => {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <LineChart className="h-5 w-5 text-cyan-400" />
            <span>Cyclone Meteorological Dynamics & Analysis</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kinematic and thermodynamic structure evolution curves, deepening gradients, and intensity forecasts.
          </p>
        </div>

        {/* Cyclone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Analysis Target:</span>
          <select
            value={selectedCyclone?.id || ''}
            onChange={(e) => {
              const target = cyclones.find((c) => c.id === e.target.value);
              if (target) onSelectCyclone(target);
            }}
            className="bg-navy-900 border border-slate-700 text-cyan-300 font-semibold rounded-lg px-3 py-1.5 text-xs outline-none"
          >
            {cyclones.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Storm Telemetry Summary Banner */}
      {selectedCyclone && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-3 bg-navy-900/90 border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Peak Sustained Core</span>
            <div className="text-lg font-mono font-bold text-rose-400">{formatWindSpeed(selectedCyclone.current.windSpeedKnots, windUnit)}</div>
            <span className="text-[11px] text-slate-500">{selectedCyclone.current.category}</span>
          </Card>
          <Card className="p-3 bg-navy-900/90 border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Central Minimum Pressure</span>
            <div className="text-lg font-mono font-bold text-amber-400">{formatPressure(selectedCyclone.current.centralPressureHpa)}</div>
            <span className="text-[11px] text-slate-500">Sub-surface Barometry</span>
          </Card>
          <Card className="p-3 bg-navy-900/90 border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Translation Velocity</span>
            <div className="text-lg font-mono font-bold text-indigo-300">{selectedCyclone.current.movementSpeedKmh} km/h</div>
            <span className="text-[11px] text-slate-500">Vector Heading: {selectedCyclone.current.movementDirection}</span>
          </Card>
          <Card className="p-3 bg-navy-900/90 border-slate-800">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">Observational Epochs</span>
            <div className="text-lg font-mono font-bold text-cyan-400">{(selectedCyclone.history || []).length + 1} Fixes</div>
            <span className="text-[11px] text-slate-500">Recorded Best-Track cycle</span>
          </Card>
        </div>
      )}

      {/* Recharts Trajectories */}
      <CycloneAnalysisCharts
        cyclone={selectedCyclone}
        prediction={prediction}
      />
    </div>
  );
};
