import React from 'react';
import { 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { Cyclone } from '../../types/cyclone';
import { PredictionRun } from '../../types/prediction';
import { Card, CardHeader, CardContent } from '../ui/Card';
import { LineChart as ChartIcon, Wind, Gauge } from 'lucide-react';
import { formatIsoDate } from '../../utils/formatters';

interface CycloneAnalysisChartsProps {
  cyclone: Cyclone | null;
  prediction: PredictionRun | null;
}

// Custom dark theme tooltip for Recharts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-navy-900 border border-slate-700/80 p-2.5 rounded-lg shadow-xl text-xs font-mono">
        <p className="font-sans font-semibold text-slate-300 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-400 font-sans">{entry.name}:</span>
            <span className="font-bold text-slate-100">{entry.value} {entry.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CycloneAnalysisCharts: React.FC<CycloneAnalysisChartsProps> = ({
  cyclone,
  prediction,
}) => {
  if (!cyclone) {
    return (
      <Card className="p-8 text-center text-slate-500">
        Select a cyclone to render meteorological time-series and intensity charts.
      </Card>
    );
  }

  // Combine observed history and predicted points into a single chronological timeline
  const combinedTimelineData = [
    ...(cyclone.history || []).map((h) => ({
      epoch: formatIsoDate(h.timestamp),
      observedWind: h.windSpeedKnots,
      predictedWind: null,
      observedPressure: h.centralPressureHpa,
      predictedPressure: null,
      type: 'Observed',
    })),
    // Current observation as junction point
    {
      epoch: 'Current Fix',
      observedWind: cyclone.current.windSpeedKnots,
      predictedWind: cyclone.current.windSpeedKnots,
      observedPressure: cyclone.current.centralPressureHpa,
      predictedPressure: cyclone.current.centralPressureHpa,
      type: 'Junction',
    },
    // Future predictions
    ...(prediction?.points || []).map((p) => ({
      epoch: `+${p.leadTimeHours}h (${formatIsoDate(p.validTime)})`,
      observedWind: null,
      predictedWind: p.windSpeedKnots,
      observedPressure: null,
      predictedPressure: p.centralPressureHpa,
      type: 'Predicted',
    })),
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Wind Speed Time-Series & Intensity Forecast */}
      <Card>
        <CardHeader
          title="Wind Speed Trajectory (Observed vs Predicted)"
          subtitle="Sustained wind in knots (1-minute mean)"
          icon={<Wind className="h-5 w-5 text-rose-400" />}
        />
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedTimelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="observedWindGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="predictedWindGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="epoch" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 10', 'dataMax + 15']} />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area 
                  type="monotone" 
                  dataKey="observedWind" 
                  name="Observed History" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#observedWindGrad)" 
                  unit="kt"
                />
                <Area 
                  type="monotone" 
                  dataKey="predictedWind" 
                  name="AI Forecast" 
                  stroke="#22D3EE" 
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1} 
                  fill="url(#predictedWindGrad)" 
                  unit="kt"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Central Barometric Pressure Evolution */}
      <Card>
        <CardHeader
          title="Minimum Central Pressure (hPa)"
          subtitle="Observed deepening vs forecast filling rate"
          icon={<Gauge className="h-5 w-5 text-cyan-400" />}
        />
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedTimelineData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="epoch" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} domain={['dataMin - 10', 'dataMax + 10']} reversed />
                <Tooltip content={<CustomChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line 
                  type="monotone" 
                  dataKey="observedPressure" 
                  name="Observed Pressure" 
                  stroke="#FBBF24" 
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0B1220' }}
                  unit="hPa"
                />
                <Line 
                  type="monotone" 
                  dataKey="predictedPressure" 
                  name="Forecast Pressure" 
                  stroke="#38BDF8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#0B1220' }}
                  unit="hPa"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
