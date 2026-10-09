import React, { useState, useEffect } from 'react';
import MetricCard from '../components/MetricCard';
import FloodMap from '../components/FloodMap';
import RiskBadge from '../components/RiskBadge';
import AlertTable from '../components/AlertTable';
import { getDashboardData, acknowledgeAlert } from '../services/api';
import {
  MapPin,
  AlertTriangle,
  Droplets,
  BellRing,
  ArrowUpRight,
  Mountain
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Link } from 'react-router-dom';

export default function Dashboard({ selectedLocationId, onSelectLocation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAcking, setIsAcking] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getDashboardData();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to connect to FloodGuard API backend. Ensure FastAPI server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    getDashboardData()
      .then((res) => {
        if (mounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          console.error('Failed to load dashboard:', err);
          setError('Failed to connect to FloodGuard API backend. Ensure FastAPI server is running on port 8000.');
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      setIsAcking(true);
      await acknowledgeAlert(alertId);
      await fetchData();
    } catch (err) {
      console.error('Failed acknowledging alert:', err);
    } finally {
      setIsAcking(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500 space-y-3">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm font-semibold tracking-wide">Syncing Hydrological Telemetry & Risk Models...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 max-w-2xl mx-auto my-8 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-base">Backend Connection Offline</h3>
            <p className="text-xs mt-1 text-rose-700 leading-relaxed">{error}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter assessments if a location is selected from header
  const assessments = data?.location_assessments || [];
  const filteredAssessments = selectedLocationId
    ? assessments.filter((a) => a.location_id === selectedLocationId)
    : assessments;

  const COLORS = ['#EF4444', '#F59E0B', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Top Welcome / Situation Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-800 rounded-2xl p-6 text-white shadow-md border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-400 border border-blue-500/30">
              Operational Status: Level 2 Watch
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Sensor Mode
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-1.5">
            Metropolitan Hydrological Situation Room
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Real-time urban catchment monitoring synthesizing rainfall gauges, digital elevation, stormwater capacity, and canal freeboard levels.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/glof"
            className="px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-1.5"
          >
            <Mountain className="w-4 h-4" />
            <span>GLOF Outburst</span>
          </Link>
          <Link
            to="/predict"
            className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <span>Simulate Cloudburst</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            to="/map"
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs sm:text-sm transition-all"
          >
            Full GIS Map
          </Link>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Monitored Basins"
          value={data?.monitored_locations_count || 10}
          subtitle="Telemetry & simulated stations"
          icon={MapPin}
          color="navy"
          badgeText="Active"
        />
        <MetricCard
          title="High Risk Zones"
          value={data?.high_risk_count || 0}
          subtitle="Urgent action required"
          icon={AlertTriangle}
          color="red"
          badgeText="Critical"
        />
        <MetricCard
          title="Avg Basin Rainfall"
          value={`${data?.avg_rainfall_mm || 0} mm/h`}
          subtitle="Precipitation rate across zone"
          icon={Droplets}
          color="blue"
          badgeText="Radar Synced"
        />
        <MetricCard
          title="Active Alerts"
          value={data?.active_alerts_count || 0}
          subtitle="Disaster warning notices"
          icon={BellRing}
          color="amber"
          badgeText="Live"
        />
      </div>

      {/* Main Grid: Interactive Map & Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Map */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <span>Interactive Urban Flood Risk Map</span>
                <span className="text-xs font-normal text-slate-500">(Leaflet GIS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Click any colored node to inspect water stage, drainage status, and emergency recommendations.
              </p>
            </div>
            <Link
              to="/map"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Expand Map</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <FloodMap
            locations={assessments}
            selectedLocationId={selectedLocationId}
            onSelectLocation={onSelectLocation}
            height="460px"
          />
        </div>

        {/* Right: Charts Column */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          {/* Risk Severity Distribution Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h4 className="font-bold text-slate-900 text-sm mb-1">Risk Severity Distribution</h4>
            <p className="text-xs text-slate-500 mb-4">Current distribution across monitored urban zones</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.risk_distribution || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {(data?.risk_distribution || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(val) => <span className="text-xs text-slate-700 font-medium">{val}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Precipitation Trend Chart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-slate-900 text-sm">24h Rainfall Trend</h4>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                mm / 3h
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Hourly cumulative hydrograph</p>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.rainfall_trend || []}>
                  <defs>
                    <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} unit="mm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="rainfall_mm"
                    stroke="#2563EB"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#rainGradient)"
                    name="Rainfall"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Active Alerts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Active Alerts & Warnings</h3>
            <p className="text-xs text-slate-500">Live operational bulletins requiring municipal intervention</p>
          </div>
          <Link to="/alerts" className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            <span>View All Alerts</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <AlertTable
          alerts={data?.recent_alerts || []}
          onAcknowledge={handleAcknowledge}
          isAcknowledging={isAcking}
        />
      </div>

      {/* Location-wise Risk Assessment Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Monitored Locations & Vulnerability Matrix</h3>
            <p className="text-xs text-slate-500">
              Multi-parameter telemetry across {assessments.length} urban drainage catchments
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
            Showing {filteredAssessments.length} of {assessments.length} locations
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Station / Catchment</th>
                <th className="py-3 px-4">Risk Severity</th>
                <th className="py-3 px-4">Current Rainfall</th>
                <th className="py-3 px-4">Water Level / Critical</th>
                <th className="py-3 px-4">Elevation</th>
                <th className="py-3 px-4">Disaster Action Directive</th>
                <th className="py-3 px-4 text-right">Quick Predict</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssessments.map((a) => (
                <tr key={a.location_id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>{a.location_name}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      ID: {a.location_id} {a.is_simulated && '• Simulated'}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <RiskBadge level={a.risk_level} score={a.risk_score} size="sm" />
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {a.rainfall_current_mm} mm/h
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="font-bold text-slate-900">{a.water_level_m}m</span>
                    <span className="text-slate-400 text-[11px]"> / {a.critical_water_level_m}m</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap">
                    {a.elevation_m}m AMSL
                  </td>
                  <td className="py-3.5 px-4 max-w-xs text-slate-600 truncate" title={a.recommended_action}>
                    {a.recommended_action}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Link
                      to={`/predict?loc=${a.location_id}`}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors"
                    >
                      Predict Risk
                    </Link>
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
