import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import { getWeather, getLocations } from '../services/api';
import {
  CloudRain,
  Thermometer,
  Wind,
  Droplets,
  RefreshCw,
  Radio
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function Weather({ selectedLocationId }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(selectedLocationId || 'LOC-001');
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load locations
  useEffect(() => {
    let isMounted = true;
    getLocations()
      .then((locs) => {
        if (isMounted) {
          setLocations(locs);
          if (locs.length > 0 && !selectedLocId) {
            setSelectedLocId(locs[0].id);
          }
        }
      })
      .catch((e) => {
        console.error('Failed to load locations for weather view:', e);
      });
    return () => {
      isMounted = false;
    };
  }, [selectedLocId]);

  // Fetch weather whenever selected location changes
  const fetchWeather = async () => {
    if (!locations.length) return;
    const loc = locations.find((l) => l.id === selectedLocId) || locations[0];
    if (!loc) return;

    try {
      setLoading(true);
      const res = await getWeather(loc.latitude, loc.longitude);
      setWeatherData(res);
    } catch (err) {
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    if (locations.length > 0) {
      const loc = locations.find((l) => l.id === selectedLocId) || locations[0];
      if (loc) {
        getWeather(loc.latitude, loc.longitude)
          .then((res) => {
            if (isMounted) {
              setWeatherData(res);
              setLoading(false);
            }
          })
          .catch((err) => {
            console.error('Weather fetch error:', err);
            if (isMounted) setLoading(false);
          });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [selectedLocId, locations]);

  const current = weatherData?.current || {};
  const hourly = weatherData?.hourly || [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Open-Meteo Forecast Integration
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Numerical Weather Prediction (NWP)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Meteorological Telemetry & Precipitation Radar
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Atmospheric moisture tracking, projected cloudburst volume, and hourly precipitation forecast models.
          </p>
        </div>

        {/* Location selector */}
        <div className="flex items-center gap-3">
          <select
            value={selectedLocId}
            onChange={(e) => setSelectedLocId(e.target.value)}
            className="px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.latitude.toFixed(2)}°N, {loc.longitude.toFixed(2)}°E)
              </option>
            ))}
          </select>

          <button
            onClick={fetchWeather}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition-colors"
            title="Refresh forecast"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Forecast Label Disclaimer Banner */}
      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
        <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900">
          <span className="font-bold">Meteorological Forecast Notice: </span>
          The data shown below represents Open-Meteo numerical atmospheric projections. It is intended for early warning flood trajectory planning and is not an in-situ water gauge sensor measurement.
          {weatherData?.is_fallback && (
            <span className="block mt-1 font-semibold text-amber-700">
              * Active mode: Deterministic meteorological fallback model (Open-Meteo offline or rate-limited).
            </span>
          )}
        </div>
      </div>

      {/* 4 Weather Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Current Rain Intensity"
          value={`${current.precipitation ?? 0} mm/h`}
          subtitle="Real-time atmospheric rate"
          icon={CloudRain}
          color="blue"
          badgeText="Radar"
        />
        <MetricCard
          title="24h Projected Rain"
          value={`${weatherData?.accumulated_24h_mm || 0} mm`}
          subtitle="Cumulative hydrological runoff"
          icon={Droplets}
          color="amber"
          badgeText="Accumulated"
        />
        <MetricCard
          title="Ambient Temperature"
          value={`${current.temperature_2m ?? 28}°C`}
          subtitle={`Apparent: ${current.apparent_temperature ?? 32}°C`}
          icon={Thermometer}
          color="green"
        />
        <MetricCard
          title="Surface Wind Speed"
          value={`${current.wind_speed_10m ?? 14} km/h`}
          subtitle={`Relative Humidity: ${current.relative_humidity_2m ?? 80}%`}
          icon={Wind}
          color="navy"
        />
      </div>

      {/* Hourly Precipitation & Probability Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              24-Hour Precipitation Volume & Probability Profile
            </h3>
            <p className="text-xs text-slate-500">
              Hourly rainfall depth (mm) correlated with precipitation probability (%)
            </p>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Provider: <strong>{weatherData?.source || 'Open-Meteo NWP'}</strong>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#64748b' }} unit=" mm" />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  borderColor: '#334155',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <Legend
                verticalAlign="top"
                formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
              />
              <Bar
                yAxisId="left"
                dataKey="precipitation"
                name="Rainfall Depth (mm)"
                fill="#3B82F6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="precipitation_probability"
                name="Precip Probability (%)"
                fill="#93C5FD"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hourly Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">
          Chronological Forecast Matrix (Next 12 Hours)
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2.5 px-3">Hour</th>
                <th className="py-2.5 px-3">Precipitation Depth</th>
                <th className="py-2.5 px-3">Rainfall Probability</th>
                <th className="py-2.5 px-3">Surface Temp</th>
                <th className="py-2.5 px-3">Risk Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {hourly.slice(0, 12).map((h, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{h.time}</td>
                  <td className="py-2.5 px-3 font-semibold text-blue-600">{h.precipitation} mm</td>
                  <td className="py-2.5 px-3 text-slate-600">{h.precipitation_probability}%</td>
                  <td className="py-2.5 px-3 text-slate-600">{h.temperature_2m}°C</td>
                  <td className="py-2.5 px-3">
                    {h.precipitation >= 25 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                        Severe Deluge
                      </span>
                    ) : h.precipitation >= 10 ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">
                        Moderate Rain
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Light / None
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
