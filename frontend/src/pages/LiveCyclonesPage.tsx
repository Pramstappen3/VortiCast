import React, { useState, useMemo } from 'react';
import { Cyclone } from '../types/cyclone';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Wind, 
  Gauge, 
  MapPin, 
  ExternalLink,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { formatCoordinates, formatWindSpeed, formatPressure, getCategoryBadgeStyle, formatIsoDate } from '../utils/formatters';
import { useNavigate } from 'react-router-dom';

interface LiveCyclonesPageProps {
  cyclones: Cyclone[];
  onSelectCyclone: (c: Cyclone) => void;
  windUnit: 'kt' | 'kmh' | 'mph';
}

export const LiveCyclonesPage: React.FC<LiveCyclonesPageProps> = ({
  cyclones,
  onSelectCyclone,
  windUnit,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBasin, setSelectedBasin] = useState('ALL');
  const [sortField, setSortField] = useState<'wind' | 'pressure' | 'name'>('wind');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredCyclones = useMemo(() => {
    return cyclones
      .filter((c) => {
        const matchesSearch =
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.basin.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBasin = selectedBasin === 'ALL' || c.basin === selectedBasin;
        return matchesSearch && matchesBasin;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortField === 'wind') {
          comp = a.current.windSpeedKnots - b.current.windSpeedKnots;
        } else if (sortField === 'pressure') {
          comp = (a.current.centralPressureHpa || 9999) - (b.current.centralPressureHpa || 9999);
        } else {
          comp = a.name.localeCompare(b.name);
        }
        return sortOrder === 'desc' ? -comp : comp;
      });
  }, [cyclones, searchTerm, selectedBasin, sortField, sortOrder]);

  const basins = ['ALL', ...Array.from(new Set(cyclones.map((c) => c.basin)))];

  const toggleSort = (field: 'wind' | 'pressure' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Wind className="h-5 w-5 text-cyan-400" />
            <span>Active Global Cyclones Directory</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time advisory registry verified across JTWC, NHC, IMD, and JMA warning regions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="cyan" size="md">
            {filteredCyclones.length} Systems Active
          </Badge>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by storm name, basin, code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-navy-950 border border-slate-700/80 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Basin Filter */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <select
              value={selectedBasin}
              onChange={(e) => setSelectedBasin(e.target.value)}
              className="bg-navy-950 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
            >
              {basins.map((basin) => (
                <option key={basin} value={basin}>
                  {basin === 'ALL' ? 'All Ocean Basins' : basin}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Cyclones Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-navy-950/90 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('name')}>
                  <div className="flex items-center gap-1.5">
                    <span>Storm System</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Basin</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('wind')}>
                  <div className="flex items-center gap-1.5">
                    <span>Sustained Wind</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4 cursor-pointer hover:text-slate-200" onClick={() => toggleSort('pressure')}>
                  <div className="flex items-center gap-1.5">
                    <span>Pressure</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Center Fix</th>
                <th className="py-3 px-4">Landfall Alert</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {filteredCyclones.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No active cyclones match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCyclones.map((cyclone) => {
                  const badge = getCategoryBadgeStyle(cyclone.current.category);

                  return (
                    <tr
                      key={cyclone.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      onClick={() => {
                        onSelectCyclone(cyclone);
                      }}
                    >
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                          {cyclone.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{cyclone.code}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-300">
                        {cyclone.basin}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          {cyclone.current.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300 font-bold">
                        {formatWindSpeed(cyclone.current.windSpeedKnots, windUnit)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {formatPressure(cyclone.current.centralPressureHpa)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {formatCoordinates(cyclone.current.lat, cyclone.current.lon)}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        {cyclone.landfallThreat ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-semibold">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping"></span>
                            Watch Active
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-sans">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<ExternalLink className="h-3 w-3" />}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectCyclone(cyclone);
                            navigate('/');
                          }}
                        >
                          View Track
                        </Button>
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
