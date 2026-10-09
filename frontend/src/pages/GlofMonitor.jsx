import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Waves,
  AlertTriangle,
  Activity,
  Radio,
  Sliders,
  ShieldAlert,
  Volume2,
  RefreshCw,
  Eye,
  CheckCircle2,
  MapPin,
  ThermometerSnowflake,
  Satellite,
  Compass,
  ArrowRight,
  TrendingUp,
  FileText,
  Clock,
  Send,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  getGlofBasins,
  assessGlofRisk,
  simulateGlofBreach,
  getGlofProtocols,
  broadcastGlofAlert
} from '../services/api';

export default function GlofMonitor() {
  const [basins, setBasins] = useState([]);
  const [selectedBasinId, setSelectedBasinId] = useState('NEP-GLOF-001');
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assessor Form State
  const [lakeVolume, setLakeVolume] = useState(2.4);
  const [rateOfRise, setRateOfRise] = useState(1.25);
  const [moraineStability, setMoraineStability] = useState(28.0);
  const [tempAnomaly, setTempAnomaly] = useState(3.8);
  const [acousticVibration, setAcousticVibration] = useState(8.4);
  const [insarCreep, setInsarCreep] = useState(42.0);
  const [distanceKm, setDistanceKm] = useState(14.5);
  const [rainfallMm, setRainfallMm] = useState(0.0);

  // Calculation Results
  const [assessmentResult, setAssessmentResult] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [isAssessing, setIsAssessing] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(null);
  const [showExplainer, setShowExplainer] = useState(true);

  // Fetch initial basins and protocols
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [basinsData, protocolsData] = await Promise.all([
          getGlofBasins(),
          getGlofProtocols()
        ]);
        if (isMounted) {
          setBasins(basinsData);
          setProtocols(protocolsData);
          if (basinsData.length > 0) {
            loadBasinPreset(basinsData[0]);
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load GLOF data:', err);
          setError('Failed to fetch GLOF basin telemetry. Ensure backend is running.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadBasinPreset = (basin) => {
    setSelectedBasinId(basin.id);
    setLakeVolume(basin.lake_volume_million_m3);
    setRateOfRise(basin.rate_of_rise_m_per_hour);
    setMoraineStability(basin.moraine_stability_index);
    setTempAnomaly(basin.temperature_anomaly_c);
    setAcousticVibration(basin.acoustic_vibration_level);
    setInsarCreep(basin.insar_creep_rate_mm_yr);
    setDistanceKm(basin.distance_to_settlement_km);
    setRainfallMm(0.0);
    setBroadcastSuccess(null);

    // Run calculation
    triggerAssessment({
      lake_volume_million_m3: basin.lake_volume_million_m3,
      rate_of_rise_m_per_hour: basin.rate_of_rise_m_per_hour,
      moraine_stability_index: basin.moraine_stability_index,
      temperature_anomaly_c: basin.temperature_anomaly_c,
      acoustic_vibration_level: basin.acoustic_vibration_level,
      insar_creep_rate_mm_yr: basin.insar_creep_rate_mm_yr,
      distance_to_settlement_km: basin.distance_to_settlement_km,
      rainfall_mm: 0.0
    });

    triggerSimulation({
      lake_volume_million_m3: basin.lake_volume_million_m3,
      breach_height_m: 25.0,
      breach_width_m: 35.0,
      distance_km: basin.distance_to_settlement_km
    });
  };

  const triggerAssessment = async (overrideParams = null) => {
    setIsAssessing(true);
    try {
      const payload = overrideParams || {
        basin_id: selectedBasinId,
        lake_volume_million_m3: parseFloat(lakeVolume),
        rate_of_rise_m_per_hour: parseFloat(rateOfRise),
        moraine_stability_index: parseFloat(moraineStability),
        temperature_anomaly_c: parseFloat(tempAnomaly),
        acoustic_vibration_level: parseFloat(acousticVibration),
        insar_creep_rate_mm_yr: parseFloat(insarCreep),
        distance_to_settlement_km: parseFloat(distanceKm),
        rainfall_mm: parseFloat(rainfallMm)
      };
      const res = await assessGlofRisk(payload);
      setAssessmentResult(res);
    } catch (e) {
      console.error('Assessment failed:', e);
    } finally {
      setIsAssessing(false);
    }
  };

  const triggerSimulation = async (overrideParams = null) => {
    setIsSimulating(true);
    try {
      const payload = overrideParams || {
        lake_volume_million_m3: parseFloat(lakeVolume),
        breach_height_m: 25.0,
        breach_width_m: 35.0,
        distance_km: parseFloat(distanceKm)
      };
      const res = await simulateGlofBreach(payload);
      setSimResult(res);
    } catch (e) {
      console.error('Simulation failed:', e);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleBroadcastAlert = async () => {
    if (!selectedBasinId) return;
    try {
      const alert = await broadcastGlofAlert(selectedBasinId);
      setBroadcastSuccess(`GLOF Alert Bulletin dispatched successfully! ID: ${alert.id}`);
      setTimeout(() => setBroadcastSuccess(null), 6000);
    } catch (e) {
      console.error('Broadcast failed:', e);
      alert('Failed to broadcast alert to central vault.');
    }
  };

  const selectedBasin = basins.find((b) => b.id === selectedBasinId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Mountain className="w-96 h-96 text-blue-300" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-bold tracking-wide uppercase flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5" /> High-Altitude Outburst Engine
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Satellite className="w-3.5 h-3.5" /> Sentinel-1 InSAR Active
              </span>
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> Riverbed Geophones Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              GLOF & Non-Rainfall Outburst Flood Early Warning
            </h1>
            <p className="text-slate-300 text-sm leading-relaxed">
              Real-time monitoring of Glacial Lake Outburst Floods (GLOF), Landslide Dam (LDOF) breaches,
              and transboundary surge torrents across <strong>Nepal and Himalayan river basins</strong>.
              Predicts catastrophic surge waves when <strong>local rainfall is zero</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              onClick={() => {
                if (selectedBasin) loadBasinPreset(selectedBasin);
              }}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4" /> Reset Telemetry
            </button>
            <button
              onClick={handleBroadcastAlert}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition"
            >
              <Send className="w-4 h-4" /> Broadcast Warning
            </button>
          </div>
        </div>

        {broadcastSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{broadcastSuccess}</span>
          </div>
        )}
      </div>

      {/* The Zero-Rainfall Paradox Explained */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white flex items-center justify-between border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                The Non-Rainfall Flood Paradox: Why Nepal & Himalayan Valleys Flood Under Blue Skies
              </h2>
              <p className="text-xs text-slate-500">
                Scientific breakdown of why conventional rainfall gauges fail to detect Himalayan flash floods
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExplainer(!showExplainer)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
          >
            {showExplainer ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {showExplainer && (
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/40">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider">
                <Mountain className="w-4 h-4" /> 1. Moraine Collapse (GLOF)
              </div>
              <h4 className="font-semibold text-slate-800 text-xs">Example: Thame 2024 & Dig Tsho</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Glaciers retreat leaving loose gravel and ice dams. Sub-surface permafrost thaw or ice avalanches trigger sudden breach, unleashing millions of cubic meters of water downstream without a drop of rain.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" /> 2. Landslide Dams (LDOF)
              </div>
              <h4 className="font-semibold text-slate-800 text-xs">Example: Melamchi 2021 & Sunkoshi</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Earthquakes or steep slope failures choke narrow river gorges, forming temporary lakes. When the unconsolidated debris dam ruptures, massive flash debris surges sweep downstream villages.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider">
                <Waves className="w-4 h-4" /> 3. Transboundary Headwaters
              </div>
              <h4 className="font-semibold text-slate-800 text-xs">Example: Bhote Koshi & Trishuli</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Cloudbursts or glacial breaches occur 40 km across the border in the Tibetan Plateau. The flood wave rushes down steep Himalayan gradients into Nepal where the local sky is completely clear.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <ThermometerSnowflake className="w-4 h-4" /> 4. Cryospheric Heatwave
              </div>
              <h4 className="font-semibold text-slate-800 text-xs">Example: Seti River & Annapurna</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Abnormal thermal spikes rapidly liquefy high-altitude snowpacks and sub-surface glacial ice, producing diurnal river surges far exceeding bankfull thresholds during dry, sunny weather.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Nepal Monitored Basins Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-600" />
            Monitored High-Hazard Basins in Nepal & Himalayas
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Select a basin to inspect live telemetry and simulate wave routing
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {basins.map((basin) => {
            const isSelected = basin.id === selectedBasinId;
            const isCritical = basin.status === 'CRITICAL_SURGE';
            const isElevated = basin.status === 'ELEVATED_WATCH';

            return (
              <div
                key={basin.id}
                onClick={() => loadBasinPreset(basin)}
                className={`cursor-pointer rounded-xl p-4.5 border transition-all duration-200 relative ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-md'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 font-medium">{basin.id}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-tight">{basin.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" /> {basin.region}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                      isCritical
                        ? 'bg-rose-100 text-rose-700 border border-rose-300'
                        : isElevated
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    }`}
                  >
                    {basin.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {basin.case_study_notes}
                </p>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Rise dh/dt</span>
                    <span className={`text-xs font-mono font-bold ${basin.rate_of_rise_m_per_hour > 0.8 ? 'text-red-600' : 'text-slate-800'}`}>
                      +{basin.rate_of_rise_m_per_hour} m/h
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Volume</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {basin.lake_volume_million_m3}M m³
                    </span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-400 uppercase">Lead Time</span>
                    <span className="text-xs font-mono font-bold text-blue-600">
                      ~{Math.round((basin.distance_to_settlement_km / 24.5) * 60)} min
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Analysis and Simulation Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Telemetry Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Non-Rainfall Telemetry & Hydraulic Parameters
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {selectedBasin?.id || 'CUSTOM'}
              </span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Rate of Rise dh/dt (The Gold Standard for Zero-Rainfall Alerts) */}
              <div className="space-y-1.5 p-3 rounded-lg bg-red-50/50 border border-red-100">
                <div className="flex justify-between font-semibold text-slate-800">
                  <span className="flex items-center gap-1.5 text-red-700">
                    <Activity className="w-3.5 h-3.5" /> Upstream Water Rise Rate (dh/dt)
                  </span>
                  <span className="font-mono text-red-700 font-bold">{rateOfRise} m/hour</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="3.0"
                  step="0.05"
                  value={rateOfRise}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setRateOfRise(val);
                  }}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Threshold: &gt;0.8 m/h triggers emergency evacuation even if Rain = 0 mm
                </span>
              </div>

              {/* Lake Volume */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Impounded Glacial / Dam Lake Volume</span>
                  <span className="font-mono text-blue-600 font-bold">{lakeVolume} Million m³</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="90.0"
                  step="0.5"
                  value={lakeVolume}
                  onChange={(e) => setLakeVolume(parseFloat(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Moraine Stability Index */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Moraine Dam Stability (0 = Impending Collapse)</span>
                  <span className="font-mono text-amber-600 font-bold">{moraineStability}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="95"
                  step="1"
                  value={moraineStability}
                  onChange={(e) => setMoraineStability(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Riverbed Acoustic Geophone Signal */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Radio className="w-3.5 h-3.5 text-indigo-500" /> Bedrock Geophone Rumble (0-10)
                  </span>
                  <span className="font-mono text-indigo-600 font-bold">{acousticVibration} / 10</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.2"
                  value={acousticVibration}
                  onChange={(e) => setAcousticVibration(parseFloat(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-500 block">
                  Acoustic sensors detect boulder collision and debris waves 20+ mins upstream
                </span>
              </div>

              {/* InSAR Satellite Creep */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <Satellite className="w-3.5 h-3.5 text-slate-500" /> InSAR Moraine Creep Rate
                  </span>
                  <span className="font-mono text-slate-800 font-bold">{insarCreep} mm/year</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="80"
                  step="1"
                  value={insarCreep}
                  onChange={(e) => setInsarCreep(parseFloat(e.target.value))}
                  className="w-full accent-slate-600 cursor-pointer"
                />
              </div>

              {/* Cryosphere Thermal Anomaly */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span className="flex items-center gap-1">
                    <ThermometerSnowflake className="w-3.5 h-3.5 text-cyan-600" /> Temperature Anomaly (Above Norm)
                  </span>
                  <span className="font-mono text-cyan-700 font-bold">+{tempAnomaly} °C</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="8.0"
                  step="0.2"
                  value={tempAnomaly}
                  onChange={(e) => setTempAnomaly(parseFloat(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>

              {/* Distance to Downstream Settlement */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Downstream Settlement Distance</span>
                  <span className="font-mono text-slate-800 font-bold">{distanceKm} km</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="50.0"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-slate-700 cursor-pointer"
                />
              </div>

              {/* Local Rainfall Slider (Fixed at 0 to prove non-rainfall detection) */}
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Local Rainfall Telemetry</span>
                  <span className="text-[10px] text-slate-500">Sunny / dry valley conditions</span>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-xs">
                  {rainfallMm} mm (Zero Rain)
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  triggerAssessment();
                  triggerSimulation();
                }}
                disabled={isAssessing || isSimulating}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                {isAssessing || isSimulating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Activity className="w-4 h-4" />
                )}
                Recalculate Outburst Risk & Hydrograph
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Outburst Risk & Dam-Break Simulation */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-Time Risk Score & Lead Time Card */}
          {assessmentResult && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Non-Rainfall Risk Engine Output
                  </span>
                  <h3 className="text-base font-bold text-slate-900">
                    Glacial / Dam Outburst Hazard Assessment
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase border ${
                      assessmentResult.risk_level === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-700 border-rose-300'
                        : assessmentResult.risk_level === 'HIGH'
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    }`}
                  >
                    {assessmentResult.risk_level} RISK
                  </span>
                  <span className="text-xl font-black font-mono text-slate-900">
                    {assessmentResult.risk_score} / 100
                  </span>
                </div>
              </div>

              {/* 3 Metric Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-100">
                  <div className="flex items-center gap-1.5 text-rose-700 text-xs font-bold mb-1">
                    <Clock className="w-4 h-4" /> Evacuation Lead Time
                  </div>
                  <div className="text-xl font-mono font-black text-rose-900">
                    {assessmentResult.evacuation_lead_time_minutes} min
                  </div>
                  <div className="text-[10px] text-rose-600 mt-0.5">
                    Before crest reaches village ({distanceKm} km)
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
                  <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold mb-1">
                    <Waves className="w-4 h-4" /> Peak Breach Outflow
                  </div>
                  <div className="text-xl font-mono font-black text-blue-900">
                    {assessmentResult.peak_discharge_m3s.toLocaleString()} m³/s
                  </div>
                  <div className="text-[10px] text-blue-600 mt-0.5">
                    Froehlich dam break envelope
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold mb-1">
                    <TrendingUp className="w-4 h-4" /> Wave Crest Surge Depth
                  </div>
                  <div className="text-xl font-mono font-black text-indigo-900">
                    {assessmentResult.surge_crest_height_m} meters
                  </div>
                  <div className="text-[10px] text-indigo-600 mt-0.5">
                    At downstream riverbanks
                  </div>
                </div>
              </div>

              {/* Factor Contribution Meters */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-800 block">
                  Contributing Non-Rainfall Sensor Factors
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {assessmentResult.contributing_factors.map((f, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700">{f.name}</span>
                        <span className="font-mono font-bold text-slate-900">
                          {f.value} {f.unit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            f.status === 'DANGER'
                              ? 'bg-rose-500'
                              : f.status === 'WARNING'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, f.score)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 block leading-tight">{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical Directives */}
              <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-[11px]">
                  <ShieldAlert className="w-4 h-4" /> Civil Defense Action Directives
                </div>
                <ul className="space-y-1 text-slate-300">
                  {assessmentResult.action_directives.map((dir, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-400 font-bold shrink-0">•</span>
                      <span>{dir}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Dam-Break Outflow Hydrograph Chart */}
          {simResult && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Hydrodynamic Dam-Break Flood Wave Routing (Arrival vs Time)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Discharge and flood crest stage simulated at {distanceKm} km downstream settlement
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Velocity: {simResult.wave_velocity_kmh} km/h
                </span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={simResult.hydrograph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="glofDischarge" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="glofDepth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#DC2626" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis
                      dataKey="time_minutes"
                      tick={{ fontSize: 11 }}
                      unit=" min"
                      stroke="#94A3B8"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fontSize: 11 }}
                      stroke="#2563EB"
                      unit=" m³/s"
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 11 }}
                      stroke="#DC2626"
                      unit=" m"
                    />
                    <Tooltip
                      formatter={(val, name) => [
                        name === 'discharge_m3s' ? `${val} m³/s` : `${val} m`,
                        name === 'discharge_m3s' ? 'Flood Outflow Discharge' : 'Surge Crest Depth'
                      ]}
                      labelFormatter={(t) => `T+ ${t} Minutes Post-Breach`}
                    />
                    <Legend
                      formatter={(val) =>
                        val === 'discharge_m3s' ? 'Discharge (m³/s)' : 'Surge Crest Depth (m)'
                      }
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="discharge_m3s"
                      stroke="#2563EB"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#glofDischarge)"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="estimated_depth_m"
                      stroke="#DC2626"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#glofDepth)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                <span>
                  First Surge Wave Arrival: <strong>{simResult.arrival_time_minutes} min</strong>
                </span>
                <span>
                  Peak Crest Depth: <strong>{simResult.peak_crest_depth_m} meters</strong>
                </span>
                <span className="font-semibold text-rose-600">
                  {simResult.evacuation_urgency.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sensor Comparison Matrix: Rainfall Gauge vs Non-Rainfall Telemetry */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-indigo-600" />
          Sensor Comparison: Why Traditional Rain Gauges Fail During Non-Rainfall Floods
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="py-2.5 px-3">Telemetry System</th>
                <th className="py-2.5 px-3">Typical Reading During GLOF / LDOF</th>
                <th className="py-2.5 px-3">Failure Mode / Limitation</th>
                <th className="py-2.5 px-3">How FloodGuard AI Solves It</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-3 font-semibold text-rose-600">Standard Rain Gauges</td>
                <td className="py-3 px-3 font-mono">0.0 mm / hour</td>
                <td className="py-3 px-3 text-slate-600">
                  Reports false &quot;Safe&quot; status because rain fell in Tibet or sun is out locally.
                </td>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Bypasses rainfall dependency; triggers alerts using hydraulic surge rate (dh/dt).
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-blue-600">Ultrasonic dh/dt Gauges</td>
                <td className="py-3 px-3 font-mono">+1.25 m / hour surge</td>
                <td className="py-3 px-3 text-slate-600">Requires line of sight and rugged river mounting.</td>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Polls rate-of-rise every 30 seconds; alerts when dh/dt exceeds 0.8 m/h.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-indigo-600">Acoustic Bedrock Geophones</td>
                <td className="py-3 px-3 font-mono">8.4 / 10 Vibration Intensity</td>
                <td className="py-3 px-3 text-slate-600">Sensitive to mountain road traffic noise.</td>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Frequency band-pass filtering (10-50 Hz) specifically isolates boulder bedload rumbling.
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-semibold text-emerald-600">Satellite InSAR Radar</td>
                <td className="py-3 px-3 font-mono">42 mm/yr Moraine Displacement</td>
                <td className="py-3 px-3 text-slate-600">6-12 day repeat pass revisit interval.</td>
                <td className="py-3 px-3 font-medium text-slate-800">
                  Integrates Copernicus Sentinel-1 interferograms for multi-week moraine failure forecasting.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering Solutions & Action Protocols */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-blue-600" />
          Technical Solutions & Mitigation Protocols for Nepal / Himalayan Floods
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {protocols.map((proto, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-3">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-wider pb-2 border-b border-slate-100">
                <Mountain className="w-4 h-4" /> {proto.category}
              </div>
              <div className="space-y-3">
                {proto.solutions.map((sol, sIdx) => (
                  <div key={sIdx} className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      {sol.title}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      <strong>Problem:</strong> {sol.problem_solved}
                    </p>
                    <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-100">
                      {sol.engineering_details}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
