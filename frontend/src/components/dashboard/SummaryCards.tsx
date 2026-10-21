import React from 'react';
import { CycloneSummaryStats } from '../../types/cyclone';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { Wind, Activity, Gauge, Clock, ShieldCheck } from 'lucide-react';
import { formatIsoDate } from '../../utils/formatters';

interface SummaryCardsProps {
  stats: CycloneSummaryStats | null;
  loading: boolean;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ stats, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-dashed border-slate-800 text-center text-slate-500 text-sm">
          No statistical telemetry available.
        </Card>
      </div>
    );
  }

  const cards = [
    {
      title: 'Active Cyclones',
      value: stats.activeCount.toString(),
      subtext: 'Global monitoring basins',
      icon: Activity,
      iconColor: 'text-cyan-400',
      borderColor: 'border-cyan-500/30',
      badge: 'Live',
    },
    {
      title: 'Strongest Wind Speed',
      value: `${stats.strongestWindKnots} kt`,
      subtext: stats.strongestStormName,
      icon: Wind,
      iconColor: 'text-rose-400',
      borderColor: 'border-rose-500/30',
      badge: 'Peak Core',
    },
    {
      title: 'AI Forecast Confidence',
      value: stats.averageConfidencePct !== null ? `${stats.averageConfidencePct.toFixed(1)}%` : 'N/A',
      subtext: 'Track ensemble concordance',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/30',
      badge: 'GNN Model',
    },
    {
      title: 'Last Data Ingestion',
      value: formatIsoDate(stats.lastUpdatedTimestamp),
      subtext: 'UTC advisory cycle',
      icon: Clock,
      iconColor: 'text-indigo-400',
      borderColor: 'border-indigo-500/30',
      badge: 'Synced',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card
            key={idx}
            className="p-4 hover:border-slate-700 transition-all duration-200 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                {card.title}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-navy-950 text-slate-300 border border-slate-800">
                  {card.badge}
                </span>
                <div className={`p-1.5 rounded-md bg-navy-950 ${card.iconColor}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>

            <div className="mt-1">
              <div className="text-2xl font-bold font-mono text-slate-100 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-400 mt-1 truncate" title={card.subtext}>
                {card.subtext}
              </p>
            </div>

            {/* Subtle bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-[2px] bg-slate-800 group-hover:${card.borderColor} transition-colors`} />
          </Card>
        );
      })}
    </div>
  );
};
