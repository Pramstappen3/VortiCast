import React from 'react';
import { PredictionUpdateDelta } from '../../types/prediction';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Activity, 
  ArrowRight, 
  Clock, 
  Wind, 
  Gauge, 
  AlertCircle,
  HelpCircle,
  Sparkles,
  Layers
} from 'lucide-react';
import { formatCoordinates, formatWindSpeed, formatIsoDate } from '../../utils/formatters';

interface RecentPredictionUpdatesProps {
  updates: PredictionUpdateDelta[];
  loading?: boolean;
}

export const RecentPredictionUpdates: React.FC<RecentPredictionUpdatesProps> = ({
  updates,
  loading = false,
}) => {
  return (
    <Card className="flex flex-col">
      <CardHeader
        title="Recent Prediction Updates & Delta Analysis"
        subtitle="Tracking trajectory divergence and meteorological explanations"
        icon={<Activity className="h-5 w-5 text-cyan-400" />}
        action={
          <Badge variant="cyan" size="sm">
            {updates.length} Advisory Cycles
          </Badge>
        }
      />

      <CardContent className="space-y-4">
        {updates.length === 0 ? (
          <div className="p-6 text-center text-slate-500 text-sm">
            No prediction updates or track shift deltas recorded for the current forecast period.
          </div>
        ) : (
          <div className="space-y-4">
            {updates.map((update) => {
              const isIntensityUp = update.intensityShiftKnots > 0;
              const hasExplanation = update.explanation !== null && update.explanation.trim() !== '';

              return (
                <div
                  key={update.id}
                  className="p-4 rounded-xl bg-navy-950/70 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {/* Header of update item */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-cyan-300">{update.cycloneName}</span>
                      <span className="text-xs text-slate-400">• {update.leadTimeTarget}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs font-mono text-slate-400">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>{formatIsoDate(update.timestamp)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delta comparison: Previous vs Updated */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                    {/* Previous forecast state */}
                    <div className="p-2.5 rounded-lg bg-navy-900/60 border border-slate-800/60">
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block mb-1">
                        Previous Prediction
                      </span>
                      <div className="text-xs space-y-1 font-mono text-slate-300">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Position:</span>
                          <span>{formatCoordinates(update.previousPrediction.lat, update.previousPrediction.lon)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Max Wind:</span>
                          <span>{formatWindSpeed(update.previousPrediction.windSpeedKnots)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Pressure:</span>
                          <span>{update.previousPrediction.centralPressureHpa} hPa</span>
                        </div>
                      </div>
                    </div>

                    {/* Updated forecast state */}
                    <div className="p-2.5 rounded-lg bg-navy-900/90 border border-cyan-500/30 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-semibold">
                          Updated Prediction
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-mono">
                          <span className="text-cyan-300">Δ {update.trackShiftKm.toFixed(1)} km</span>
                          <span className="text-slate-500">•</span>
                          <span className={isIntensityUp ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {isIntensityUp ? `+${update.intensityShiftKnots}` : update.intensityShiftKnots} kt
                          </span>
                        </div>
                      </div>
                      <div className="text-xs space-y-1 font-mono text-slate-200">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Position:</span>
                          <span className="text-cyan-200">{formatCoordinates(update.updatedPrediction.lat, update.updatedPrediction.lon)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Max Wind:</span>
                          <span className={isIntensityUp ? 'text-rose-300 font-bold' : 'text-emerald-300 font-bold'}>
                            {formatWindSpeed(update.updatedPrediction.windSpeedKnots)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-sans">Pressure:</span>
                          <span>{update.updatedPrediction.centralPressureHpa} hPa</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Explanation Section */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="text-xs">
                      <span className="text-slate-400 font-medium block mb-1">
                        Reason for Trajectory / Intensity Revision:
                      </span>
                      {hasExplanation ? (
                        <p className="text-slate-300 leading-relaxed bg-navy-900/40 p-2.5 rounded-lg border border-slate-800/60">
                          {update.explanation}
                        </p>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-400 italic bg-navy-900/20 p-2.5 rounded-lg border border-slate-800/40">
                          <HelpCircle className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span>Prediction change explanations are not available yet.</span>
                        </div>
                      )}
                    </div>

                    {/* Supporting atmospheric inputs if available */}
                    {update.environmentalFactors && (
                      <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {update.environmentalFactors.seaSurfaceTemp && (
                          <div className="p-2 rounded bg-navy-900/30 border border-slate-800/50 text-slate-300">
                            <span className="text-slate-400">SST Anomaly: </span>
                            {update.environmentalFactors.seaSurfaceTemp}
                          </div>
                        )}
                        {update.environmentalFactors.verticalWindShear && (
                          <div className="p-2 rounded bg-navy-900/30 border border-slate-800/50 text-slate-300">
                            <span className="text-slate-400">Wind Shear: </span>
                            {update.environmentalFactors.verticalWindShear}
                          </div>
                        )}
                        {update.environmentalFactors.steeringRidge && (
                          <div className="p-2 rounded bg-navy-900/30 border border-slate-800/50 text-slate-300">
                            <span className="text-slate-400">Steering Flow: </span>
                            {update.environmentalFactors.steeringRidge}
                          </div>
                        )}
                        {update.environmentalFactors.atmosphericMoisture && (
                          <div className="p-2 rounded bg-navy-900/30 border border-slate-800/50 text-slate-300">
                            <span className="text-slate-400">Moisture Inflow: </span>
                            {update.environmentalFactors.atmosphericMoisture}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
