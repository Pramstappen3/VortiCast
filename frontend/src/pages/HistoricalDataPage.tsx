import React, { useState, useEffect } from 'react';
import { cycloneService } from '../services/cycloneService';
import { HistoricalCycloneArchiveRecord } from '../mocks/mockData';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  Calendar, 
  Wind, 
  Gauge, 
  AlertOctagon 
} from 'lucide-react';
import { formatWindSpeed, formatPressure, getCategoryBadgeStyle } from '../utils/formatters';

export const HistoricalDataPage: React.FC = () => {
  const [records, setRecords] = useState<HistoricalCycloneArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await cycloneService.getHistoricalArchive();
        setRecords(data);
      } catch (err) {
        console.error('Failed to load historical data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredRecords = records.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.year.toString().includes(searchQuery);
    const matchesBasin = selectedBasin === 'ALL' || r.basin.includes(selectedBasin);
    return matchesSearch && matchesBasin;
  });

  const exportCsv = () => {
    const headers = ['Name', 'Year', 'Basin', 'PeakCategory', 'MaxWindKnots', 'MinPressureHpa', 'Fatalities', 'DamageUSD'];
    const rows = filteredRecords.map((r) => [
      r.name,
      r.year,
      `"${r.basin}"`,
      `"${r.peakCategory}"`,
      r.maxWindKnots,
      r.minPressureHpa,
      `"${r.fatalitiesEstimate}"`,
      `"${r.damageEstimateUsd}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vorticast_historical_cyclones_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <History className="h-5 w-5 text-cyan-400" />
            <span>Historical Cyclone Archive & Best-Track Database</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Curated archive of benchmark historical cyclone events for retrospective validation and climate reanalysis.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Download className="h-3.5 w-3.5" />}
          onClick={exportCsv}
        >
          Export CSV ({filteredRecords.length})
        </Button>
      </div>

      {/* Filter toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by storm name or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="bg-navy-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              <option value="ALL">All Basins</option>
              <option value="North Indian Ocean">North Indian Ocean</option>
              <option value="Western North Pacific">Western North Pacific</option>
              <option value="North Atlantic">North Atlantic</option>
              <option value="Eastern North Pacific">Eastern North Pacific</option>
              <option value="South Indian Ocean">South Indian Ocean</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Historical Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Storm / Cyclone</th>
                <th className="py-3 px-4">Season</th>
                <th className="py-3 px-4">Basin</th>
                <th className="py-3 px-4">Peak Intensity</th>
                <th className="py-3 px-4">Max Wind</th>
                <th className="py-3 px-4">Min Pressure</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Casualties / Damage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No historical records match the filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const badge = getCategoryBadgeStyle(item.peakCategory);

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 font-sans font-bold text-slate-100">
                        {item.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {item.year}
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        {item.basin}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {item.peakCategory}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-300">
                        {formatWindSpeed(item.maxWindKnots)}
                      </td>
                      <td className="py-3.5 px-4 text-amber-300">
                        {formatPressure(item.minPressureHpa)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {item.durationDays} days
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <span className="text-slate-300 font-semibold">{item.damageEstimateUsd}</span>
                        <span className="text-slate-500 text-[10px] block">({item.fatalitiesEstimate} fatalities)</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
