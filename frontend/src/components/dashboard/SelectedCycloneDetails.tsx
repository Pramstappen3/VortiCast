import React from 'react';
import { Cyclone } from '../../types/cyclone';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  Wind, 
  Compass, 
  Gauge, 
  MapPin, 
  Clock, 
  ShieldAlert, 
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { 
  formatCoordinates, 
  formatWindSpeed, 
  formatPressure, 
  formatIsoDate, 
  getCategoryBadgeStyle 
} from '../../utils/formatters';

interface SelectedCycloneDetailsProps {
  cyclone: Cyclone | null;
  windUnit?: 'kt' | 'kmh' | 'mph';
}

export const SelectedCycloneDetails: React.FC<SelectedCycloneDetailsProps> = ({
  cyclone,
  windUnit = 'kt',
}) => {
  if (!cyclone) {
    return (
      <Card className="h-full flex items-center justify-center p-8 text-center text-slate-500">
        <div>
          <AlertCircle className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm">Select a cyclone from the list or map to inspect parameters.</p>
        </div>
      </Card>
    );
  }

  const badgeStyle = getCategoryBadgeStyle(cyclone.current.category);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader
        title={cyclone.name}
        subtitle={`${cyclone.code} • ${cyclone.basin}`}
        icon={<ShieldAlert className="h-5 w-5 text-cyan-400" />}
        action={
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
            {cyclone.current.category}
          </span>
        }
      />

      <CardContent className="space-y-4 flex-1">
        {/* Core telemetry grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Coordinates */}
          <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <MapPin className="h-3.5 w-3.5 text-cyan-400" />
              <span>Center Fix</span>
            </div>
            <div className="text-sm font-mono font-semibold text-slate-100">
              {formatCoordinates(cyclone.current.lat, cyclone.current.lon)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Satellite / Radar fix</div>
          </div>

          {/* Maximum Sustained Wind */}
          <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Wind className="h-3.5 w-3.5 text-rose-400" />
              <span>Max Sustained Wind</span>
            </div>
            <div className="text-sm font-mono font-bold text-rose-300">
              {formatWindSpeed(cyclone.current.windSpeedKnots, windUnit)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Gusts up to {Math.round(cyclone.current.windSpeedKnots * 1.25)} kt
            </div>
          </div>

          {/* Central Pressure */}
          <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Gauge className="h-3.5 w-3.5 text-amber-400" />
              <span>Minimum Pressure</span>
            </div>
            <div className="text-sm font-mono font-semibold text-amber-300">
              {formatPressure(cyclone.current.centralPressureHpa)}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Barometric center</div>
          </div>

          {/* Movement Vector */}
          <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Compass className="h-3.5 w-3.5 text-indigo-400" />
              <span>Movement Vector</span>
            </div>
            <div className="text-sm font-mono font-semibold text-slate-100">
              {cyclone.current.movementDirection} @ {cyclone.current.movementSpeedKmh} km/h
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Forward translation</div>
          </div>
        </div>

        {/* Observation time */}
        <div className="flex items-center justify-between text-xs bg-navy-950/40 px-3 py-2 rounded-lg border border-slate-800/60 text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span>Observation Epoch:</span>
          </div>
          <span className="font-mono text-slate-200">
            {formatIsoDate(cyclone.current.timestamp)}
          </span>
        </div>

        {/* Landfall threat indicator & Regions */}
        <div className="bg-navy-950/70 p-3 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-300">Landfall Assessment</span>
            {cyclone.landfallThreat ? (
              <Badge variant="rose" size="sm" dot>Threat Imminent</Badge>
            ) : (
              <Badge variant="emerald" size="sm">Open Ocean Drift</Badge>
            )}
          </div>
          <div className="text-xs text-slate-400">
            <span className="text-slate-500">Monitored Sectors: </span>
            {cyclone.affectedRegions.length > 0
              ? cyclone.affectedRegions.join(', ')
              : 'No coastal sectors under watch'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
