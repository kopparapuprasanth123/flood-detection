import React, { useState, useEffect } from 'react';
import FloodMap from '../components/FloodMap';
import RiskBadge from '../components/RiskBadge';
import { getRiskAssessments } from '../services/api';
import {
  Filter,
  ShieldAlert,
  Layers,
  Droplets,
  Gauge,
  Mountain,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function FloodMapPage({ selectedLocationId, onSelectLocation }) {
  const [locations, setLocations] = useState([]);
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [activeLocId, setActiveLocId] = useState(selectedLocationId || 'LOC-002');

  useEffect(() => {
    let isMounted = true;
    getRiskAssessments()
      .then((res) => {
        if (isMounted) {
          setLocations(res);
          if (!activeLocId && res.length > 0) {
            setActiveLocId(res[0].location_id);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load map risk data:', err);
      });
    return () => {
      isMounted = false;
    };
  }, [activeLocId]);

  const handleMarkerSelect = (id) => {
    setActiveLocId(id);
    if (onSelectLocation) onSelectLocation(id);
  };

  const effectiveActiveLocId = selectedLocationId || activeLocId;

  // Filter locations based on severity pill
  const filteredLocations = locations.filter((loc) => {
    if (filterRisk === 'ALL') return true;
    return loc.risk_level === filterRisk;
  });

  const selectedData = locations.find((l) => l.location_id === effectiveActiveLocId) || locations[0];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Live Urban Flood Map (GIS Surveillance)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time geospatial hydrological monitoring using OpenStreetMap, digital elevation, and telemetry models
          </p>
        </div>

        {/* Severity Filters */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs self-start">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setFilterRisk(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                filterRisk === lvl
                  ? lvl === 'HIGH'
                    ? 'bg-rose-600 text-white'
                    : lvl === 'MEDIUM'
                    ? 'bg-amber-500 text-white'
                    : lvl === 'LOW'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {lvl === 'ALL' ? 'All Zones' : `${lvl}`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map (8 cols) + Inspection Sidebar (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Leaflet Interactive Map */}
        <div className="lg:col-span-8">
          <FloodMap
            locations={filteredLocations}
            selectedLocationId={effectiveActiveLocId}
            onSelectLocation={handleMarkerSelect}
            height="620px"
          />
        </div>

        {/* Right: Station Risk Inspector Panel */}
        <div className="lg:col-span-4 flex flex-col">
          {selectedData ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex-1 flex flex-col justify-between space-y-4">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
                      Station: {selectedData.location_id}
                      {selectedData.is_simulated && ' • Simulated Sensor'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
                      {selectedData.location_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Lat: {selectedData.latitude.toFixed(4)}, Lon: {selectedData.longitude.toFixed(4)}
                    </p>
                  </div>
                  <RiskBadge
                    level={selectedData.risk_level}
                    score={selectedData.risk_score}
                    size="md"
                  />
                </div>

                {/* Score Big Display */}
                <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      Calculated Risk Index
                    </span>
                    <div className="text-3xl font-extrabold text-slate-900 mt-0.5 font-mono">
                      {Math.round(selectedData.risk_score)}
                      <span className="text-sm font-normal text-slate-400"> / 100</span>
                    </div>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-400 block text-[10px] uppercase">Category</span>
                    <strong className="text-slate-800 text-sm font-bold">{selectedData.risk_level} SEVERITY</strong>
                  </div>
                </div>

                {/* Key Hydrological Factors */}
                <div className="mt-4 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Hydrology & Terrain Telemetry
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-blue-500" /> Current Rain
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {selectedData.rainfall_current_mm} mm/h
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                        <Gauge className="w-3 h-3 text-amber-500" /> Water Level
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {selectedData.water_level_m}m
                        <span className="text-[10px] text-slate-400 font-normal"> / {selectedData.critical_water_level_m}m</span>
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                        <Mountain className="w-3 h-3 text-emerald-500" /> Elevation
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {selectedData.elevation_m}m AMSL
                      </p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-500" /> Threshold Limit
                      </span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {selectedData.critical_water_level_m} m
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tactical Recommendation Directive */}
                <div className="mt-4 p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80">
                  <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                    <span>Disaster Directive</span>
                  </div>
                  <p className="text-xs text-blue-950 font-medium leading-relaxed">
                    {selectedData.recommended_action}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2 border-t border-slate-100">
                <Link
                  to={`/predict?loc=${selectedData.location_id}`}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                >
                  <span>Run Custom Forecast Simulation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 flex flex-col items-center justify-center flex-1">
              <Layers className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Select a station marker on the map to inspect risk details.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
