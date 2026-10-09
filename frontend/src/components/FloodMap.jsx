import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import RiskBadge from './RiskBadge';
import {
  Droplets,
  Gauge,
  Mountain,
  Compass,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';

// Custom Marker Generator with Pulsing Risk Rings
const createCustomMarker = (riskLevel, riskScore) => {
  const norm = (riskLevel || 'LOW').toUpperCase();
  let bgGradient = 'bg-emerald-500 text-white shadow-emerald-500/40 ring-emerald-400/30';
  if (norm === 'MEDIUM') {
    bgGradient = 'bg-amber-500 text-white shadow-amber-500/40 ring-amber-400/30';
  } else if (norm === 'HIGH') {
    bgGradient = 'bg-rose-600 text-white shadow-rose-600/40 ring-rose-400/40 animate-pulse';
  }

  const html = `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-lg border-2 border-white ring-4 ${bgGradient}">
        ${Math.round(riskScore || 0)}
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'flood-marker-custom',
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
};

// Component to dynamically pan/zoom when a location is selected externally
function MapCenterController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && center[0] && center[1]) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function FloodMap({
  locations = [],
  selectedLocationId = null,
  onSelectLocation = null,
  height = '560px',
}) {
  const defaultCenter = [13.0450, 80.2300]; // Metro Coastal District center

  // Determine current active center if a location is selected
  const activeLocation = locations.find((l) => l.location_id === selectedLocationId || l.id === selectedLocationId);
  const mapCenter = activeLocation
    ? [activeLocation.latitude, activeLocation.longitude]
    : defaultCenter;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm" style={{ height }}>
      {/* Interactive Map */}
      <MapContainer
        center={defaultCenter}
        zoom={12}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterController center={mapCenter} zoom={activeLocation ? 14 : 12} />

        {locations.map((loc) => {
          const locId = loc.location_id || loc.id;
          const locName = loc.location_name || loc.name;
          const riskLevel = loc.risk_level || 'LOW';
          const riskScore = loc.risk_score || 0;
          const rainfall = loc.rainfall_current_mm !== undefined ? loc.rainfall_current_mm : (loc.rainfall_1h || 0);
          const waterLevel = loc.water_level_m !== undefined ? loc.water_level_m : 1.2;
          const critLevel = loc.critical_water_level_m || 2.5;
          const elevation = loc.elevation_m || 5.0;
          const action = loc.recommended_action || 'Continue standard surveillance';

          const icon = createCustomMarker(riskLevel, riskScore);

          return (
            <Marker
              key={locId}
              position={[loc.latitude, loc.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  if (onSelectLocation) onSelectLocation(locId);
                },
              }}
            >
              <Popup className="flood-popup">
                <div className="p-3.5 min-w-[260px] max-w-[300px]">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm leading-tight">
                        {locName}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        ID: {locId}
                        {loc.is_simulated && (
                          <span className="ml-1 px-1 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200 font-sans">
                            Simulated Station
                          </span>
                        )}
                      </p>
                    </div>
                    <RiskBadge level={riskLevel} score={riskScore} size="sm" />
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" /> Rainfall
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{rainfall} mm/h</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-amber-500" /> Water Level
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {waterLevel}m <span className="text-[10px] text-slate-500 font-normal">/ {critLevel}m</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                        <Mountain className="w-3 h-3 text-emerald-500" /> Elevation
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{elevation} m</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                        <Layers className="w-3 h-3 text-slate-500" /> Drainage
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{loc.drainage_capacity_mmh || 35} mm/h</p>
                    </div>
                  </div>

                  {/* Recommendation Directive */}
                  <div className="text-[11px] bg-blue-50/70 border border-blue-100 rounded-lg p-2 text-blue-900 mb-2">
                    <strong className="block font-semibold text-[10px] uppercase text-blue-800 mb-0.5">
                      Tactical Directive
                    </strong>
                    {action}
                  </div>

                  {/* Action Link */}
                  {onSelectLocation && (
                    <button
                      onClick={() => onSelectLocation(locId)}
                      className="w-full mt-1 py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Inspect Risk Factors</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Legend */}
      <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200 text-xs">
        <div className="font-bold text-slate-800 mb-2 flex items-center gap-1 text-[11px] uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-blue-500" /> Risk Score Legend
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200"></span>
            <span className="text-slate-700 font-medium">Low Risk (&lt; 40)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 ring-2 ring-amber-200"></span>
            <span className="text-slate-700 font-medium">Medium Risk (40 - 69)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-600 ring-2 ring-rose-200 animate-pulse"></span>
            <span className="text-slate-700 font-medium">High Risk (70 - 100)</span>
          </div>
        </div>
      </div>

      {/* Map Header Overlay */}
      <div className="absolute top-4 left-4 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-md border border-slate-200 flex items-center gap-2">
        <Compass className="w-4 h-4 text-blue-600 animate-spin-slow" />
        <span className="text-xs font-bold text-slate-800">
          GIS Hydro-Risk Layer: {locations.length} Stations Active
        </span>
      </div>
    </div>
  );
}
