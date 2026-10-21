import React, { useState } from 'react';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { 
  Settings, 
  Wind, 
  Gauge, 
  Map, 
  RefreshCw, 
  Server, 
  Check, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { apiConfig } from '../services/api';

interface SettingsPageProps {
  windUnit: 'kt' | 'kmh' | 'mph';
  setWindUnit: (u: 'kt' | 'kmh' | 'mph') => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  windUnit,
  setWindUnit,
}) => {
  const [pressureUnit, setPressureUnit] = useState<'hpa' | 'mb'>('hpa');
  const [refreshInterval, setRefreshInterval] = useState('60');
  const [mockMode, setMockMode] = useState(apiConfig.useMock);
  const [apiUrl, setApiUrl] = useState(apiConfig.baseUrl);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = () => {
    apiConfig.useMock = mockMode;
    apiConfig.baseUrl = apiUrl;
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5 text-cyan-400" />
            <span>Platform Preferences & Operational Settings</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure meteorological display units, telemetry refresh cadence, and backend API integration endpoints.
          </p>
        </div>

        {savedNotice && (
          <Badge variant="emerald" size="md" dot>
            Preferences Saved
          </Badge>
        )}
      </div>

      {/* 1. Meteorological Units */}
      <Card>
        <CardHeader
          title="Meteorological Measurement Units"
          subtitle="Define units for wind speed velocities and atmospheric barometry"
          icon={<Wind className="h-5 w-5 text-cyan-400" />}
        />
        <CardContent className="space-y-4">
          {/* Wind Speed */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200">Wind Velocity Standard</span>
              <p className="text-[11px] text-slate-400">Default operational unit across dashboard and trajectories</p>
            </div>
            <div className="flex items-center gap-2">
              {(['kt', 'kmh', 'mph'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setWindUnit(unit)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                    windUnit === unit
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-navy-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Barometric Pressure */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold text-slate-200">Barometric Pressure</span>
              <p className="text-[11px] text-slate-400">Atmospheric pressure scale for central cyclone fixes</p>
            </div>
            <div className="flex items-center gap-2">
              {(['hpa', 'mb'] as const).map((unit) => (
                <button
                  key={unit}
                  onClick={() => setPressureUnit(unit)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-colors ${
                    pressureUnit === unit
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold'
                      : 'bg-navy-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Backend API Integration & Fallback Mode */}
      <Card>
        <CardHeader
          title="Backend API Configuration & Verification Mode"
          subtitle="Configure centralized HTTP connection parameters for VortiCast services"
          icon={<Server className="h-5 w-5 text-cyan-400" />}
        />
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-200">
              API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full bg-navy-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-400"
              placeholder="http://localhost:8000/api/v1"
            />
            <p className="text-[10px] text-slate-500">
              Configured via <code className="text-cyan-400">VITE_API_BASE_URL</code> in environment.
            </p>
          </div>

          {/* Demonstration Mode Switch */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-navy-950/70 border border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Demonstration Dataset Fallback</span>
              <p className="text-[11px] text-slate-400">
                When enabled, the frontend utilizes validated benchmark mock models when the backend API is disconnected.
              </p>
            </div>
            <button
              onClick={() => setMockMode(!mockMode)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                mockMode
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
            >
              {mockMode ? 'ENABLED (SAFE DEMO)' : 'DISABLED (STRICT LIVE)'}
            </button>
          </div>

          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Check className="h-3.5 w-3.5" />}
              onClick={handleSave}
            >
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
