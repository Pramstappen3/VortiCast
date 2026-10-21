import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { LiveCyclonesPage } from './pages/LiveCyclonesPage';
import { TrackPredictionPage } from './pages/TrackPredictionPage';
import { CycloneAnalysisPage } from './pages/CycloneAnalysisPage';
import { HistoricalDataPage } from './pages/HistoricalDataPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { PredictionUpdatesPage } from './pages/PredictionUpdatesPage';
import { SettingsPage } from './pages/SettingsPage';
import { Cyclone, CycloneSummaryStats } from './types/cyclone';
import { PredictionRun, PredictionUpdateDelta } from './types/prediction';
import { cycloneService } from './services/cycloneService';
import { predictionService } from './services/predictionService';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './components/ui/Button';

export const App: React.FC = () => {
  const [cyclones, setCyclones] = useState<Cyclone[]>([]);
  const [selectedCyclone, setSelectedCyclone] = useState<Cyclone | null>(null);
  const [summaryStats, setSummaryStats] = useState<CycloneSummaryStats | null>(null);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionRun | null>(null);
  const [predictionUpdates, setPredictionUpdates] = useState<PredictionUpdateDelta[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // User preferences
  const [windUnit, setWindUnit] = useState<'kt' | 'kmh' | 'mph'>('kt');

  const loadData = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      // 1. Fetch Summary Stats and Active Cyclones concurrently
      const [statsRes, cyclonesRes, updatesRes] = await Promise.all([
        cycloneService.getSummaryStats(),
        cycloneService.getActiveCyclones(),
        predictionService.getRecentPredictionUpdates(),
      ]);

      setSummaryStats(statsRes);
      setCyclones(cyclonesRes);
      setPredictionUpdates(updatesRes);

      // 2. Select initial or preserved cyclone
      let current = selectedCyclone;
      if (!current || !cyclonesRes.some((c) => c.id === current?.id)) {
        current = cyclonesRes[0] || null;
        setSelectedCyclone(current);
      }

      // 3. If a cyclone is selected, load its trajectory prediction
      if (current) {
        const predRes = await predictionService.getPredictionForCyclone(current.id);
        setCurrentPrediction(predRes);
      }
    } catch (err: any) {
      console.error('[VortiCast] Error initializing data pipelines:', err);
      setError(err?.message || 'Failed to initialize meteorological telemetry feed.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Whenever selected cyclone changes, fetch its corresponding forecast trajectory
  const handleSelectCyclone = async (cyclone: Cyclone) => {
    setSelectedCyclone(cyclone);
    try {
      const pred = await predictionService.getPredictionForCyclone(cyclone.id);
      setCurrentPrediction(pred);
    } catch (err) {
      console.error('[VortiCast] Error fetching prediction for cyclone:', cyclone.id, err);
      setCurrentPrediction(null);
    }
  };

  if (error && cyclones.length === 0) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="bg-navy-900 border border-rose-500/30 p-8 rounded-xl max-w-md w-full text-center space-y-4 shadow-panel">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/30 mx-auto flex items-center justify-center text-rose-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">Telemetry Feed Disconnected</h2>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={() => loadData()}
            className="w-full"
          >
            Retry Connection
          </Button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <Layout
              cyclones={cyclones}
              selectedCyclone={selectedCyclone}
              onSelectCyclone={handleSelectCyclone}
              onRefresh={() => loadData(true)}
              isRefreshing={isRefreshing}
            />
          }
        >
          <Route
            path="/"
            element={
              <DashboardPage
                cyclones={cyclones}
                selectedCyclone={selectedCyclone}
                onSelectCyclone={handleSelectCyclone}
                summaryStats={summaryStats}
                currentPrediction={currentPrediction}
                predictionUpdates={predictionUpdates}
                loading={loading}
                windUnit={windUnit}
              />
            }
          />
          <Route
            path="/cyclones"
            element={
              <LiveCyclonesPage
                cyclones={cyclones}
                onSelectCyclone={handleSelectCyclone}
                windUnit={windUnit}
              />
            }
          />
          <Route
            path="/predictions"
            element={
              <TrackPredictionPage
                cyclones={cyclones}
                selectedCyclone={selectedCyclone}
                onSelectCyclone={handleSelectCyclone}
                prediction={currentPrediction}
                windUnit={windUnit}
              />
            }
          />
          <Route
            path="/analysis"
            element={
              <CycloneAnalysisPage
                cyclones={cyclones}
                selectedCyclone={selectedCyclone}
                onSelectCyclone={handleSelectCyclone}
                prediction={currentPrediction}
                windUnit={windUnit}
              />
            }
          />
          <Route
            path="/historical"
            element={<HistoricalDataPage />}
          />
          <Route
            path="/performance"
            element={<ModelPerformancePage />}
          />
          <Route
            path="/updates"
            element={<PredictionUpdatesPage updates={predictionUpdates} />}
          />
          <Route
            path="/settings"
            element={
              <SettingsPage
                windUnit={windUnit}
                setWindUnit={setWindUnit}
              />
            }
          />
          {/* Wildcard catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
