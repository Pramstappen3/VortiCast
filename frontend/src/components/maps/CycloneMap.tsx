import React, { useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  CircleMarker,
  Circle,
  useMap 
} from 'react-leaflet';
import L from 'leaflet';
import { Cyclone, TrackPoint } from '../../types/cyclone';
import { ForecastPoint } from '../../types/prediction';
import { formatCoordinates, formatWindSpeed, formatPressure, getCategoryBadgeStyle } from '../../utils/formatters';
import { Wind, Navigation, AlertTriangle } from 'lucide-react';

interface CycloneMapProps {
  cyclones: Cyclone[];
  selectedCyclone: Cyclone | null;
  onSelectCyclone?: (c: Cyclone) => void;
  forecastPoints?: ForecastPoint[];
  showForecastCone?: boolean;
  showHistoricalTrack?: boolean;
}

// Helper to auto-recenter map when selected cyclone changes
const RecenterMap: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 6 }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
};

// Custom SVG icon generator for storm center
const createStormIcon = (category: string, isSelected: boolean) => {
  let color = '#22D3EE'; // default cyan
  if (category.includes('5') || category.includes('Super')) color = '#C084FC'; // purple
  else if (category.includes('4')) color = '#F43F5E'; // rose
  else if (category.includes('3')) color = '#FB923C'; // orange
  else if (category.includes('2')) color = '#FBBF24'; // amber
  else if (category.includes('1')) color = '#FACC15'; // yellow
  else if (category.includes('Storm')) color = '#34D399'; // emerald

  const size = isSelected ? 36 : 28;
  const pulseSize = isSelected ? 48 : 36;

  return L.divIcon({
    className: 'custom-cyclone-marker',
    html: `
      <div style="position: relative; width: ${pulseSize}px; height: ${pulseSize}px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background: ${color}; opacity: 0.25; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: #0B1220; border: 2.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 12px ${color}80; color: ${color}; font-weight: bold; font-size: 11px;">
          🌀
        </div>
      </div>
    `,
    iconSize: [pulseSize, pulseSize],
    iconAnchor: [pulseSize / 2, pulseSize / 2],
    popupAnchor: [0, -pulseSize / 2],
  });
};

export const CycloneMap: React.FC<CycloneMapProps> = ({
  cyclones,
  selectedCyclone,
  onSelectCyclone,
  forecastPoints = [],
  showForecastCone = true,
  showHistoricalTrack = true,
}) => {
  // Tile server configuration from env or fallback
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
  const tileAttribution = import.meta.env.VITE_MAP_ATTRIBUTION || '&copy; OpenStreetMap contributors &copy; CARTO';

  // Fallback map center
  const defaultCenter: [number, number] = selectedCyclone
    ? [selectedCyclone.current.lat, selectedCyclone.current.lon]
    : cyclones.length > 0
    ? [cyclones[0].current.lat, cyclones[0].current.lon]
    : [20.0, 90.0];

  if (cyclones.length === 0) {
    return (
      <div className="h-full w-full min-h-[400px] flex flex-col items-center justify-center bg-navy-950 text-slate-400 p-8 text-center rounded-xl border border-slate-800">
        <AlertTriangle className="h-10 w-10 text-amber-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-200">No Cyclone Records Detected</h3>
        <p className="text-sm text-slate-400 max-w-md mt-1">
          Currently no active tropical cyclones or tropical depressions are registered in the global monitoring database.
        </p>
      </div>
    );
  }

  // Build coordinates for historical observed track
  const historicalCoords: [number, number][] = (selectedCyclone?.history || []).map((pt) => [pt.lat, pt.lon]);

  // Build coordinates for predicted trajectory
  const forecastCoords: [number, number][] = [
    ...(selectedCyclone ? [[selectedCyclone.current.lat, selectedCyclone.current.lon] as [number, number]] : []),
    ...forecastPoints.map((pt) => [pt.lat, pt.lon] as [number, number]),
  ];

  return (
    <div className="relative w-full h-full min-h-[460px] rounded-xl overflow-hidden border border-slate-800 shadow-panel">
      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-navy-900/90 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg shadow-lg text-[11px] text-slate-300">
        <div className="font-semibold text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400"></span>
          <span>Track Classification</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 bg-amber-400"></span>
            <span>Observed Track</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-t border-dashed border-cyan-400"></span>
            <span>AI Trajectory (+12h to +120h)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500/80"></span>
            <span>Cat 4 - 5 Extreme</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
            <span>Cat 1 - 3 Severe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
            <span>Tropical Storm</span>
          </div>
        </div>
      </div>

      <MapContainer
        center={defaultCenter}
        zoom={selectedCyclone ? 5 : 4}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <RecenterMap center={defaultCenter} zoom={selectedCyclone ? 5 : 4} />
        <TileLayer url={tileUrl} attribution={tileAttribution} maxZoom={18} />

        {/* Historical Observed Line */}
        {showHistoricalTrack && historicalCoords.length > 1 && (
          <Polyline
            positions={historicalCoords}
            pathOptions={{ color: '#F59E0B', weight: 2.5, opacity: 0.8 }}
          />
        )}

        {/* Historical Observed Markers */}
        {showHistoricalTrack &&
          selectedCyclone?.history.map((pt) => (
            <CircleMarker
              key={pt.id}
              center={[pt.lat, pt.lon]}
              radius={4}
              pathOptions={{
                color: '#F59E0B',
                fillColor: '#0B1220',
                fillOpacity: 1,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-2 text-xs">
                  <p className="font-semibold text-amber-400">Observed History Point</p>
                  <p className="text-slate-300">{formatCoordinates(pt.lat, pt.lon)}</p>
                  <p className="text-slate-400">Wind: {formatWindSpeed(pt.windSpeedKnots)}</p>
                  <p className="text-slate-500 text-[10px]">{pt.timestamp}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Forecast Trajectory Line (Cyan Dashed) */}
        {forecastCoords.length > 1 && (
          <Polyline
            positions={forecastCoords}
            pathOptions={{
              color: '#22D3EE',
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.9,
            }}
          />
        )}

        {/* Forecast Uncertainty Circles (Cone of Uncertainty) */}
        {showForecastCone &&
          forecastPoints.map((fp) => (
            <Circle
              key={`cone-${fp.id}`}
              center={[fp.lat, fp.lon]}
              radius={(fp.uncertaintyRadiusKm || 50) * 1000}
              pathOptions={{
                color: '#0891B2',
                fillColor: '#22D3EE',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '4, 4',
              }}
            />
          ))}

        {/* Forecast Trajectory Waypoints */}
        {forecastPoints.map((fp) => (
          <CircleMarker
            key={fp.id}
            center={[fp.lat, fp.lon]}
            radius={5}
            pathOptions={{
              color: '#22D3EE',
              fillColor: '#111C2E',
              fillOpacity: 1,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2.5 text-xs bg-navy-900 text-slate-100 min-w-[170px]">
                <div className="flex items-center justify-between border-b border-slate-700/60 pb-1 mb-1.5">
                  <span className="font-bold text-cyan-400 font-mono">+{fp.leadTimeHours}h Forecast</span>
                  <span className="text-[10px] text-slate-400">AI Ensemble</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Intensity:</span>
                    <span className="font-semibold text-slate-200">{fp.intensityCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Est. Wind:</span>
                    <span className="font-mono text-cyan-300 font-bold">{formatWindSpeed(fp.windSpeedKnots)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Pressure:</span>
                    <span className="font-mono text-slate-300">{formatPressure(fp.centralPressureHpa)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Uncertainty:</span>
                    <span className="font-mono text-slate-400">±{fp.uncertaintyRadiusKm} km</span>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                    Valid: {new Date(fp.validTime).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })} UTC
                  </p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Active Cyclone Center Markers */}
        {cyclones.map((cyclone) => {
          const isSelected = selectedCyclone?.id === cyclone.id;
          const badgeStyle = getCategoryBadgeStyle(cyclone.current.category);

          return (
            <Marker
              key={cyclone.id}
              position={[cyclone.current.lat, cyclone.current.lon]}
              icon={createStormIcon(cyclone.current.category, isSelected)}
              eventHandlers={{
                click: () => onSelectCyclone && onSelectCyclone(cyclone),
              }}
            >
              <Popup>
                <div className="p-3 bg-navy-900 text-slate-100 min-w-[210px]">
                  <div className="flex items-center justify-between border-b border-slate-700/70 pb-1.5 mb-2">
                    <div>
                      <h4 className="font-bold text-sm tracking-wide text-white">{cyclone.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{cyclone.code}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
                      {badgeStyle.label}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Position:</span>
                      <span className="font-mono text-slate-200">{formatCoordinates(cyclone.current.lat, cyclone.current.lon)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Sustained Wind:</span>
                      <span className="font-mono font-bold text-cyan-300">
                        {formatWindSpeed(cyclone.current.windSpeedKnots)} ({cyclone.current.windSpeedKmh} km/h)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Central Pressure:</span>
                      <span className="font-mono text-slate-200">{formatPressure(cyclone.current.centralPressureHpa)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Movement:</span>
                      <span className="font-mono text-slate-300">
                        {cyclone.current.movementDirection} @ {cyclone.current.movementSpeedKmh} km/h
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
                    <button
                      onClick={() => onSelectCyclone && onSelectCyclone(cyclone)}
                      className="w-full text-center text-xs py-1.5 px-3 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors"
                    >
                      Focus Cyclone Track
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
