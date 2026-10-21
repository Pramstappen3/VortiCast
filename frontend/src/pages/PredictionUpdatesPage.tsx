import React, { useState } from 'react';
import { PredictionUpdateDelta } from '../types/prediction';
import { RecentPredictionUpdates } from '../components/dashboard/RecentPredictionUpdates';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Activity, Clock, Filter, AlertCircle } from 'lucide-react';

interface PredictionUpdatesPageProps {
  updates: PredictionUpdateDelta[];
}

export const PredictionUpdatesPage: React.FC<PredictionUpdatesPageProps> = ({ updates }) => {
  const [selectedStormFilter, setSelectedStormFilter] = useState<string>('ALL');

  const storms = ['ALL', ...Array.from(new Set(updates.map((u) => u.cycloneName)))];

  const filteredUpdates = selectedStormFilter === 'ALL'
    ? updates
    : updates.filter((u) => u.cycloneName === selectedStormFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <span>Operational Prediction Updates & Trajectory Shift Timeline</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological audit log of forecast track revisions, intensity upgrades/downgrades, and meteorological causality.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            value={selectedStormFilter}
            onChange={(e) => setSelectedStormFilter(e.target.value)}
            className="bg-navy-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 outline-none focus:border-cyan-400"
          >
            {storms.map((s) => (
              <option key={s} value={s}>
                {s === 'ALL' ? 'All Active Systems' : `Filter: ${s}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Updates Timeline Component */}
      <RecentPredictionUpdates updates={filteredUpdates} />
    </div>
  );
};
