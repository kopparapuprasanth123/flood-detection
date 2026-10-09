import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import { predictRisk, getLocations } from '../services/api';
import {
  Calculator,
  Droplets,
  Mountain,
  Gauge,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  BrainCircuit,
  Info
} from 'lucide-react';

export default function Prediction() {
  const [searchParams] = useSearchParams();
  const initialLocParam = searchParams.get('loc');

  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(initialLocParam || '');

  // Form Fields
  const [formData, setFormData] = useState({
    rainfall_last_hour: 35.0,
    rainfall_accumulated_24h: 85.0,
    forecast_rainfall_next_6h: 28.0,
    elevation_m: 4.5,
    drainage_capacity_mmh: 30.0,
    current_water_level_m: 2.1,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);

  const applyLocationDefaults = (loc) => {
    setSelectedLocId(loc.id);
    setFormData((prev) => ({
      ...prev,
      elevation_m: loc.elevation_m,
      drainage_capacity_mmh: loc.drainage_capacity_mmh,
      current_water_level_m: Number((loc.critical_water_level_m * 0.75).toFixed(2)),
    }));
  };

  // Load locations on mount
  useEffect(() => {
    let isMounted = true;
    getLocations()
      .then((data) => {
        if (isMounted) {
          setLocations(data);
          if (initialLocParam) {
            const matched = data.find((l) => l.id === initialLocParam);
            if (matched) {
              applyLocationDefaults(matched);
            }
          }
        }
      })
      .catch((e) => {
        console.error('Failed to load locations for prediction form:', e);
      });
    return () => {
      isMounted = false;
    };
  }, [initialLocParam]);

  const handleLocationChange = (locId) => {
    setSelectedLocId(locId);
    if (!locId) return;
    const loc = locations.find((l) => l.id === locId);
    if (loc) {
      applyLocationDefaults(loc);
    }
  };

  const handleChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(val) || 0,
    }));
  };

  const handlePreset = (type) => {
    if (type === 'HIGH') {
      setFormData({
        rainfall_last_hour: 58.0,
        rainfall_accumulated_24h: 135.0,
        forecast_rainfall_next_6h: 45.0,
        elevation_m: 2.1,
        drainage_capacity_mmh: 18.0,
        current_water_level_m: 2.7,
      });
    } else if (type === 'MEDIUM') {
      setFormData({
        rainfall_last_hour: 24.0,
        rainfall_accumulated_24h: 62.0,
        forecast_rainfall_next_6h: 18.0,
        elevation_m: 5.5,
        drainage_capacity_mmh: 38.0,
        current_water_level_m: 1.8,
      });
    } else {
      // LOW
      setFormData({
        rainfall_last_hour: 4.0,
        rainfall_accumulated_24h: 12.0,
        forecast_rainfall_next_6h: 5.0,
        elevation_m: 14.0,
        drainage_capacity_mmh: 55.0,
        current_water_level_m: 0.8,
      });
    }
  };

  const handleReset = () => {
    setFormData({
      rainfall_last_hour: 15.0,
      rainfall_accumulated_24h: 40.0,
      forecast_rainfall_next_6h: 12.0,
      elevation_m: 6.0,
      drainage_capacity_mmh: 35.0,
      current_water_level_m: 1.2,
    });
    setPredictionResult(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const selectedLoc = locations.find((l) => l.id === selectedLocId);
      const payload = {
        rainfall_last_hour: Number(formData.rainfall_last_hour),
        rainfall_accumulated_24h: Number(formData.rainfall_accumulated_24h),
        forecast_rainfall_next_6h: Number(formData.forecast_rainfall_next_6h),
        elevation_m: Number(formData.elevation_m),
        drainage_capacity_mmh: Number(formData.drainage_capacity_mmh),
        current_water_level_m: Number(formData.current_water_level_m),
        location_id: selectedLocId || null,
        location_name: selectedLoc ? selectedLoc.name : 'Custom Scenario',
      };

      const result = await predictRisk(payload);
      setPredictionResult(result);
    } catch (err) {
      console.error('Prediction failed:', err);
      setError(
        err.response?.data?.detail
          ? JSON.stringify(err.response.data.detail)
          : 'Failed to obtain risk prediction from backend. Check API connection.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Explainable Decision Support
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Scikit-learn RF + Weighted Heuristic
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Urban Flood Risk Prediction Engine
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Submit custom hydrological parameters or select an urban station to calculate normalized risk factors, machine learning flood probabilities, and preventive municipal actions.
          </p>
        </div>

        {/* Demo Scenario Presets */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <span className="text-xs font-semibold text-slate-500 mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset('HIGH')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            Cloudburst (High)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('MEDIUM')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition-colors"
          >
            Moderate Rain (Med)
          </button>
          <button
            type="button"
            onClick={() => handlePreset('LOW')}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
          >
            Dry Run (Low)
          </button>
        </div>
      </div>

      {/* Main Grid: Form (5 cols) + Results (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600" />
                <span>Simulation Parameters</span>
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>

            {/* Optional Location Pre-population */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Monitored Station (Optional Pre-fill)
              </label>
              <select
                value={selectedLocId}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full px-3 py-2 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              >
                <option value="">Custom Manual Simulation</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Rainfall 1h */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Rainfall Last Hour
                </span>
                <span className="font-mono text-blue-600">{formData.rainfall_last_hour} mm/h</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="300"
                required
                value={formData.rainfall_last_hour}
                onChange={(e) => handleChange('rainfall_last_hour', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Peak cloudburst rate in mm per hour</span>
            </div>

            {/* 24h Accumulated Rainfall */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-700" /> Accumulated Rainfall (24h)
                </span>
                <span className="font-mono text-blue-600">{formData.rainfall_accumulated_24h} mm</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="800"
                required
                value={formData.rainfall_accumulated_24h}
                onChange={(e) => handleChange('rainfall_accumulated_24h', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Total watershed soil saturation depth</span>
            </div>

            {/* 6h Forecast Rainfall */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> Projected Rainfall (Next 6h)
                </span>
                <span className="font-mono text-blue-600">{formData.forecast_rainfall_next_6h} mm</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="500"
                required
                value={formData.forecast_rainfall_next_6h}
                onChange={(e) => handleChange('forecast_rainfall_next_6h', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Incoming storm system forecast</span>
            </div>

            {/* Terrain Elevation */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-emerald-500" /> Terrain Elevation
                </span>
                <span className="font-mono text-slate-700">{formData.elevation_m} m AMSL</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="-5"
                max="1000"
                required
                value={formData.elevation_m}
                onChange={(e) => handleChange('elevation_m', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Topographic height above mean sea level</span>
            </div>

            {/* Drainage Capacity */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-500" /> Drainage Capacity
                </span>
                <span className="font-mono text-slate-700">{formData.drainage_capacity_mmh} mm/h</span>
              </div>
              <input
                type="number"
                step="0.1"
                min="1"
                max="200"
                required
                value={formData.drainage_capacity_mmh}
                onChange={(e) => handleChange('drainage_capacity_mmh', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Culvert discharge rate (lower if clogged)</span>
            </div>

            {/* Current Water Level */}
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-500" /> Current Water Level
                </span>
                <span className="font-mono text-slate-700">{formData.current_water_level_m} m</span>
              </div>
              <input
                type="number"
                step="0.05"
                min="0"
                max="20"
                required
                value={formData.current_water_level_m}
                onChange={(e) => handleChange('current_water_level_m', e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
              />
              <span className="text-[10px] text-slate-400">Stage height in retention canal or underpass</span>
            </div>

            {/* Error banner */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2"
            >
              <BrainCircuit className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Computing Risk Analysis...' : 'Predict Flood Risk'}</span>
            </button>
          </form>
        </div>

        {/* Prediction Results Display Column */}
        <div className="lg:col-span-7 flex flex-col">
          {predictionResult ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex-1 space-y-5">
              {/* Score Header Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {predictionResult.data_mode === 'ml_enhanced' ? 'ML Ensemble Mode' : 'Heuristic Model'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(predictionResult.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    {predictionResult.location_name || 'Custom Catchment Assessment'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Multi-factor composite risk evaluation
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Risk Score</span>
                    <span className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                      {Math.round(predictionResult.risk_score)}
                      <span className="text-base text-slate-400 font-normal"> / 100</span>
                    </span>
                  </div>
                  <div>
                    <RiskBadge
                      level={predictionResult.risk_level}
                      score={predictionResult.risk_score}
                      showScore={false}
                      size="lg"
                    />
                  </div>
                </div>
              </div>

              {/* Scikit-Learn ML Model Callout */}
              {predictionResult.ml_prediction && (
                <div className="p-3.5 rounded-xl bg-indigo-50/80 border border-indigo-200/80 flex items-start gap-3">
                  <BrainCircuit className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <div className="flex items-center gap-2">
                      <strong className="text-indigo-950 font-bold">
                        {predictionResult.ml_prediction.model_name}
                      </strong>
                      <span className="px-1.5 py-0.5 rounded bg-indigo-200/70 text-indigo-800 text-[10px] font-mono font-semibold">
                        {predictionResult.ml_prediction.flood_probability_percent}% Flooding Probability
                      </span>
                    </div>
                    <p className="text-indigo-800 mt-0.5 leading-relaxed">
                      Random forest binary classifier calibrated on historical metropolitan monsoon telemetry.
                    </p>
                  </div>
                </div>
              )}

              {/* Factor Contribution Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                  Contributing Vulnerability Factors
                </h4>

                <div className="space-y-3">
                  {predictionResult.contributing_factors.map((factor, idx) => {
                    return (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-bold text-slate-800">
                            {factor.factor_name}
                          </span>
                          <span className="font-mono text-slate-600">
                            Raw: <strong>{factor.raw_value} {factor.unit}</strong> | Subscore: <strong>{factor.normalized_subscore}/100</strong>
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden mb-1.5">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              factor.normalized_subscore >= 70
                                ? 'bg-rose-500'
                                : factor.normalized_subscore >= 40
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, factor.normalized_subscore)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{factor.description}</span>
                          <span className="font-medium text-slate-600">
                            Weight: {factor.weight_percentage}% ({factor.weighted_contribution.toFixed(1)} pts)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recommended Preventive Actions */}
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  <span>Recommended Municipal Actions</span>
                </h4>
                <ul className="space-y-1.5 text-xs text-blue-950 font-medium">
                  {predictionResult.recommended_actions.map((act, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{act}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Heuristic Disclaimer */}
              <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p>{predictionResult.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center flex-1 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Calculator className="w-7 h-7" />
              </div>
              <h4 className="text-base font-bold text-slate-800">Ready for Risk Simulation</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Adjust the hydrological parameters on the left or select a preset scenario, then click <strong>Predict Flood Risk</strong> to run the model.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
