import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  Radio, 
  User, 
  Bell, 
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Cyclone } from '../../types/cyclone';
import { apiConfig } from '../../services/api';

interface TopNavProps {
  onOpenMobileSidebar: () => void;
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone: (c: Cyclone) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenMobileSidebar,
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  onRefresh,
  isRefreshing,
}) => {
  const [currentUtcTime, setCurrentUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentUtcTime(
        now.toUTCString().replace('GMT', 'UTC')
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-navy-900 border-b border-slate-800/80 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4">
      {/* Left: Mobile hamburger & Active Cyclone Quick Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Cyclone Selection Dropdown */}
        <div className="relative">
          <div className="flex items-center gap-2 bg-navy-950/70 border border-slate-700/60 rounded-lg px-3 py-1.5 hover:border-slate-600 transition-colors">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold hidden sm:inline">
              Target Cyclone:
            </span>
            <select
              value={selectedCyclone?.id || ''}
              onChange={(e) => {
                const found = cyclones.find((c) => c.id === e.target.value);
                if (found) onSelectCyclone(found);
              }}
              className="bg-transparent text-sm font-semibold text-cyan-300 outline-none cursor-pointer pr-1"
              aria-label="Select target cyclone"
            >
              {cyclones.map((c) => (
                <option key={c.id} value={c.id} className="bg-navy-900 text-slate-100">
                  {c.name} ({c.code}) — {c.current.windSpeedKnots}kt
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Middle: Current Live UTC Date & Time */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 font-mono bg-navy-950/50 px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
        <span className="text-slate-200">{currentUtcTime}</span>
      </div>

      {/* Right controls: Data status indicator, Refresh, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Data Status Indicator */}
        <div 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border bg-navy-950/80 border-slate-800 text-slate-300"
          title={apiConfig.useMock ? "Connected to Verified Demonstration Benchmark Dataset" : "Live Backend API Pipeline Active"}
        >
          <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span className="hidden sm:inline font-mono text-[11px]">
            {apiConfig.useMock ? 'DEMO DATASET' : 'LIVE FEED'}
          </span>
        </div>

        {/* Refresh button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 rounded-lg transition-colors"
            title="Refresh cyclone feeds"
            aria-label="Refresh cyclone data"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        )}

        {/* Notification indicator */}
        <button
          className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg relative"
          title="Cyclone Advisories"
          aria-label="Advisories"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500"></span>
        </button>

        {/* User Profile Placeholder */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shadow">
            ME
          </div>
          <div className="hidden xl:block text-left text-xs">
            <p className="font-medium text-slate-200 leading-tight">Meteorologist</p>
            <p className="text-[10px] text-slate-500">Forecaster Node</p>
          </div>
        </div>
      </div>
    </header>
  );
};
