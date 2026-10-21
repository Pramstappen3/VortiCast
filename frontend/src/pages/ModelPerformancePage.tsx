import React, { useState, useEffect } from 'react';
import { modelService } from '../services/modelService';
import { ModelPerformanceReport } from '../types/model';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Cpu, CheckCircle2, TrendingDown, Layers, ShieldCheck, Info } from 'lucide-react';

export const ModelPerformancePage: React.FC = () => {
  const [report, setReport] = useState<ModelPerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      setLoading(true);
      try {
        const data = await modelService.getModelPerformanceReport();
        setReport(data);
      } catch (err) {
        console.error('Failed to load performance report', err);
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  if (loading || !report) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-slate-800 animate-pulse rounded"></div>
        <div className="h-96 w-full bg-slate-900 animate-pulse rounded-xl"></div>
      </div>
    );
  }

  // Data formatted for Recharts bar chart
  const trackComparisonData = report.metricsByLeadTime.map((m) => ({
    leadTime: m.label,
    'VortiCast AI (GNN)': m.vorticastMaeKm,
    'ECMWF IFS': m.ecmwfMaeKm,
    'NCEP GFS': m.gfsMaeKm,
  }));

  const intensityData = report.metricsByLeadTime.map((m) => ({
    leadTime: m.label,
    'Intensity Error (MAE kt)': m.intensityMaeKnots,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <span>AI Model Evaluation & Verification Benchmarks</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical Mean Absolute Error (MAE) and Root Mean Squared Error (RMSE) against international best-track archives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="emerald" size="md" dot>
            Verified Best-Track
          </Badge>
          <span className="text-xs font-mono text-slate-400">{report.version}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-navy-900 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Overall Track MAE</span>
            <CheckCircle2 className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-300">
            {report.overallTrackMaeKm.toFixed(1)} km
          </div>
          <p className="text-[11px] text-slate-500 mt-1">All lead times (12h - 120h pooled)</p>
        </Card>

        <Card className="p-4 bg-navy-900 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Intensity Error (RMSE)</span>
            <TrendingDown className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300">
            {report.overallIntensityRmseKnots.toFixed(1)} kt
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Maximum 1-min sustained wind</p>
        </Card>

        <Card className="p-4 bg-navy-900 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Validation Epochs</span>
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            1,420 Fixes
          </div>
          <p className="text-[11px] text-slate-500 mt-1">{report.validationSeason}</p>
        </Card>
      </div>

      {/* Track Error Comparison Chart */}
      <Card>
        <CardHeader
          title="Track Forecast Error Comparison by Lead Time (MAE in Kilometers)"
          subtitle="Lower values indicate higher trajectory accuracy (VortiCast vs Operational Numerical Baselines)"
          icon={<Cpu className="h-5 w-5 text-cyan-400" />}
        />
        <CardContent>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trackComparisonData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="leadTime" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} unit=" km" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111C2E',
                    borderColor: '#24344D',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="VortiCast AI (GNN)" fill="#22D3EE" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ECMWF IFS" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="NCEP GFS" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Evaluation Methodology Notes */}
      <Card className="p-4 bg-navy-950/60 border-slate-800/80">
        <div className="flex items-start gap-3 text-xs text-slate-400">
          <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block mb-1">Evaluation Transparency Disclosure</span>
            <p className="leading-relaxed">
              {report.notes} All error metrics strictly compute great-circle distance between model predictions and official posthumous best-track fixes issued by the Joint Typhoon Warning Center (JTWC), National Hurricane Center (NHC), and India Meteorological Department (IMD).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
