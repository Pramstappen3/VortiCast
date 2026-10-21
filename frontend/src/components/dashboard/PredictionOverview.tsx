import React from 'react';
import { PredictionRun } from '../../types/prediction';
import { Cyclone } from '../../types/cyclone';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Compass, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Calendar
} from 'lucide-react';
import { 
  formatCoordinates, 
  formatWindSpeed, 
  formatPressure, 
  formatIsoDate,
  getCategoryBadgeStyle 
} from '../../utils/formatters';

interface PredictionOverviewProps {
  prediction: PredictionRun | null;
  cyclone: Cyclone | null;
  windUnit?: 'kt' | 'kmh' | 'mph';
}

export const PredictionOverview: React.FC<PredictionOverviewProps> = ({
  prediction,
  cyclone,
  windUnit = 'kt',
}) => {
  if (!cyclone) {
    return (
      <Card className="p-6 text-center text-slate-500">
        <p className="text-sm">Select an active cyclone to view AI trajectory forecasts.</p>
      </Card>
    );
  }

  if (!prediction || prediction.points.length === 0) {
    return (
      <Card className="p-6 text-center text-slate-400">
        <Info className="h-6 w-6 mx-auto text-cyan-400 mb-2" />
        <h4 className="text-sm font-semibold text-slate-200">No Forecast Run Available</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          AI trajectory inference has not yet generated a forecast cycle for this system or data ingestion is pending.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        title="AI Trajectory & Intensity Prediction"
        subtitle={`${prediction.modelName} (Cycle: ${formatIsoDate(prediction.issueTime)})`}
        icon={<Compass className="h-5 w-5 text-cyan-400" />}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 hidden sm:inline">Ensemble Spread:</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
              ±{prediction.ensembleSpreadKm.toFixed(1)} km
            </span>
          </div>
        }
      />

      <CardContent className="space-y-4">
        {/* Distinction Banner: Observed vs Predicted */}
        <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-navy-950/80 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Observed State (0h Initial Fix)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
              <span className="text-slate-300">Predicted AI Horizon (+12h to +120h)</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-cyan-400 font-semibold hidden md:block">
            Confidence: {prediction.confidenceScore.toFixed(1)}%
          </div>
        </div>

        {/* Forecast Points Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Lead Time</th>
                <th className="py-2.5 px-3">Valid (UTC)</th>
                <th className="py-2.5 px-3">Predicted Lat / Lon</th>
                <th className="py-2.5 px-3">Intensity Category</th>
                <th className="py-2.5 px-3">Wind Speed</th>
                <th className="py-2.5 px-3">Est. Pressure</th>
                <th className="py-2.5 px-3 text-right">Uncertainty Cone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 font-mono">
              {/* Initial 0h point from observed fix for comparison */}
              <tr className="bg-amber-950/10 text-slate-200">
                <td className="py-2.5 px-3 font-semibold text-amber-400">0h (Fix)</td>
                <td className="py-2.5 px-3 text-slate-400">{formatIsoDate(cyclone.current.timestamp)}</td>
                <td className="py-2.5 px-3 text-slate-200">{formatCoordinates(cyclone.current.lat, cyclone.current.lon)}</td>
                <td className="py-2.5 px-3">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                    {cyclone.current.category}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-bold text-amber-300">{formatWindSpeed(cyclone.current.windSpeedKnots, windUnit)}</td>
                <td className="py-2.5 px-3 text-slate-300">{formatPressure(cyclone.current.centralPressureHpa)}</td>
                <td className="py-2.5 px-3 text-right text-slate-500">±0 km</td>
              </tr>

              {/* Predicted forecast steps */}
              {prediction.points.map((pt) => {
                const badgeStyle = getCategoryBadgeStyle(pt.intensityCategory);
                const windDiff = pt.windSpeedKnots - cyclone.current.windSpeedKnots;

                return (
                  <tr key={pt.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-cyan-400">+{pt.leadTimeHours}h</td>
                    <td className="py-2.5 px-3 text-slate-400">{formatIsoDate(pt.validTime)}</td>
                    <td className="py-2.5 px-3 text-slate-200">{formatCoordinates(pt.lat, pt.lon)}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] border font-sans font-medium ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                        {pt.intensityCategory}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-100 flex items-center gap-1.5">
                      <span>{formatWindSpeed(pt.windSpeedKnots, windUnit)}</span>
                      {windDiff > 0 ? (
                        <span title={`Intensifying (+${windDiff} kt)`}>
                          <TrendingUp className="h-3 w-3 text-rose-400" />
                        </span>
                      ) : windDiff < 0 ? (
                        <span title={`Weakening (${windDiff} kt)`}>
                          <TrendingDown className="h-3 w-3 text-emerald-400" />
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">{formatPressure(pt.centralPressureHpa)}</td>
                    <td className="py-2.5 px-3 text-right text-cyan-400 font-semibold">
                      ±{pt.uncertaintyRadiusKm} km
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};
