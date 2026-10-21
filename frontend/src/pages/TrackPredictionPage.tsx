import React, { useState } from 'react';
import { Cyclone } from '../types/cyclone';
import { PredictionRun, ForecastPoint } from '../types/prediction';
import { CycloneMap } from '../components/maps/CycloneMap';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Compass, 
  Layers, 
  Eye, 
  EyeOff, 
  Clock, 
  MapPin, 
  Wind, 
  Gauge, 
  AlertCircle 
} from 'lucide-react';
import { formatCoordinates, formatWindSpeed, formatPressure, formatIsoDate, getCategoryBadgeStyle } from '../utils/formatters';

interface TrackPredictionPageProps {
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone: (c: Cyclone) => void;
  prediction: PredictionRun | null;
  windUnit: 'kt' | 'kmh' | 'mph';
}

export const TrackPredictionPage: React.FC<TrackPredictionPageProps> = ({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  prediction,
  windUnit,
}) => {
  const [showCone, setShowCone] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [selectedLeadHour, setSelectedLeadHour] = useState<number | null>(null);

  const forecastPoints = prediction?.points || [];
  const activePoint: ForecastPoint | undefined = selectedLeadHour !== null
    ? forecastPoints.find((p) => p.leadTimeHours === selectedLeadHour)
    : forecastPoints[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Compass className="h-5 w-5 text-cyan-400" />
            <span>AI Trajectory Prediction & Forecast Cone</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multiscale Graph Neural Network (GNN) ensemble predictions integrated with numerical steering dynamics.
          </p>
        </div>

        {prediction && (
          <div className="flex items-center gap-2">
            <Badge variant="cyan" size="md">
              Model: {prediction.modelShortCode}
            </Badge>
            <Badge variant="emerald" size="md">
              Confidence: {prediction.confidenceScore}%
            </Badge>
          </div>
        )}
      </div>

      {/* Main Map with Scrubber & Overlay Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 flex flex-col space-y-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-navy-900 p-3 rounded-xl border border-slate-800">
            {/* Cyclone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Cyclone:</span>
              <select
                value={selectedCyclone?.id || ''}
                onChange={(e) => {
                  const target = cyclones.find((c) => c.id === e.target.value);
                  if (target) onSelectCyclone(target);
                }}
                className="bg-navy-950 text-cyan-300 font-semibold border border-slate-700 rounded-md px-2.5 py-1 text-xs outline-none"
              >
                {cyclones.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Layer Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCone(!showCone)}
                className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                  showCone
                    ? 'bg-cyan-950/80 border-cyan-700 text-cyan-300'
                    : 'bg-navy-950 border-slate-800 text-slate-500'
                }`}
              >
                {showCone ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Uncertainty Cone</span>
              </button>

              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`text-xs px-2.5 py-1 rounded-md border flex items-center gap-1.5 transition-colors ${
                  showHistory
                    ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                    : 'bg-navy-950 border-slate-800 text-slate-500'
                }`}
              >
                {showHistory ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                <span>Historical Fixes</span>
              </button>
            </div>
          </div>

          {/* Map canvas */}
          <div className="h-[520px] w-full">
            <CycloneMap
              cyclones={cyclones}
              selectedCyclone={selectedCyclone}
              onSelectCyclone={onSelectCyclone}
              forecastPoints={forecastPoints}
              showForecastCone={showCone}
              showHistoricalTrack={showHistory}
            />
          </div>

          {/* Forecast Horizon Scrubber */}
          <div className="bg-navy-900 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Forecast Horizon Waypoint Selector
              </span>
              <span>Click a lead time to inspect waypoint parameters</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {forecastPoints.map((pt) => {
                const isSelected = (selectedLeadHour === pt.leadTimeHours) || (selectedLeadHour === null && pt.leadTimeHours === forecastPoints[0]?.leadTimeHours);

                return (
                  <button
                    key={pt.id}
                    onClick={() => setSelectedLeadHour(pt.leadTimeHours)}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-cyan-500/15 border-cyan-400 shadow-glow-cyan text-white'
                        : 'bg-navy-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-sm text-cyan-300">+{pt.leadTimeHours}h</span>
                      <span className="text-[10px] text-slate-500">±{pt.uncertaintyRadiusKm}km</span>
                    </div>
                    <div className="text-xs font-semibold mt-1 truncate text-slate-200">
                      {formatWindSpeed(pt.windSpeedKnots, windUnit)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Selected Waypoint Telemetry Sidebar */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader
              title="Waypoint Forecast Inspection"
              subtitle={activePoint ? `+${activePoint.leadTimeHours}h Horizon (${formatIsoDate(activePoint.validTime)})` : 'Select a waypoint'}
              icon={<Compass className="h-5 w-5 text-cyan-400" />}
            />
            <CardContent className="space-y-4">
              {activePoint ? (
                <>
                  <div className="p-3 rounded-lg bg-navy-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Classification:</span>
                      <span className="font-semibold text-slate-200">{activePoint.intensityCategory}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Position Coordinates:</span>
                      <span className="font-mono text-cyan-300">{formatCoordinates(activePoint.lat, activePoint.lon)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Estimated Wind Speed:</span>
                      <span className="font-mono font-bold text-rose-300">{formatWindSpeed(activePoint.windSpeedKnots, windUnit)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Estimated Pressure:</span>
                      <span className="font-mono text-amber-300">{formatPressure(activePoint.centralPressureHpa)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Uncertainty Radius (Cone):</span>
                      <span className="font-mono text-slate-300">±{activePoint.uncertaintyRadiusKm} km</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-navy-950/60 border border-slate-800 text-xs text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-300 block">Ensemble Spread Dynamics</span>
                    <p className="leading-relaxed text-[11px]">
                      The 70% probability cone reflects trajectory divergence across 50 ensemble perturbations trained on European and American reanalysis forcing.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-500">No waypoint active.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
