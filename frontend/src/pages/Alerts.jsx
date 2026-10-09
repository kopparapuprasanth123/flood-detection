import React, { useState, useEffect } from 'react';
import AlertTable from '../components/AlertTable';
import { getAlerts, acknowledgeAlert, createAlert, getLocations } from '../services/api';
import {
  PlusCircle,
  RefreshCw,
  X,
  Send,
  ShieldAlert
} from 'lucide-react';

export default function Alerts({ selectedLocationId }) {
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [levelFilter, setLevelFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState(selectedLocationId || '');
  const [isAcking, setIsAcking] = useState(false);

  // Modal State for Creating Simulated Alert
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalForm, setModalForm] = useState({
    location_id: 'LOC-002',
    risk_level: 'HIGH',
    risk_score: 84.0,
    rainfall_conditions: 'Torrential downpour 45 mm/h detected',
    water_level_m: 2.1,
    recommended_action: 'Barricade underpass approaches and start high-capacity pumping.',
  });

  const fetchAlertsData = async () => {
    try {
      setLoading(true);
      const [alertsRes, locsRes] = await Promise.all([
        getAlerts(),
        getLocations()
      ]);
      setAlerts(alertsRes);
      setLocations(locsRes);
    } catch (e) {
      console.error('Failed to load alerts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([getAlerts(), getLocations()])
      .then(([alertsRes, locsRes]) => {
        if (isMounted) {
          setAlerts(alertsRes);
          setLocations(locsRes);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('Failed to load alerts on mount:', e);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAcknowledge = async (alertId) => {
    try {
      setIsAcking(true);
      await acknowledgeAlert(alertId);
      await fetchAlertsData();
    } catch (e) {
      console.error('Failed to acknowledge alert:', e);
    } finally {
      setIsAcking(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const loc = locations.find((l) => l.id === modalForm.location_id);
      const payload = {
        location_id: modalForm.location_id,
        location_name: loc ? loc.name : 'Unknown Station',
        risk_level: modalForm.risk_level,
        risk_score: Number(modalForm.risk_score),
        rainfall_conditions: modalForm.rainfall_conditions,
        water_level_m: Number(modalForm.water_level_m),
        recommended_action: modalForm.recommended_action,
        is_simulated: true,
      };

      await createAlert(payload);
      setShowCreateModal(false);
      await fetchAlertsData();
    } catch (err) {
      console.error('Failed to dispatch simulated alert:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter alerts
  const filteredAlerts = alerts.filter((a) => {
    if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
    if (levelFilter !== 'ALL' && a.risk_level !== levelFilter) return false;
    if (locationFilter && a.location_id !== locationFilter) return false;
    return true;
  });

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
              SQLite Alert Vault
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {activeCount} Active Warnings
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Emergency Flood Alerts & Warning Bulletins
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Monitor, acknowledge, and dispatch early warning bulletins across metropolitan stormwater zones.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue Simulated Alert</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Status:</span>
            {['ALL', 'ACTIVE', 'ACKNOWLEDGED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All' : st}
              </button>
            ))}
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 p-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 px-2">Severity:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-colors ${
                  levelFilter === lvl
                    ? lvl === 'HIGH'
                      ? 'bg-rose-600 text-white'
                      : lvl === 'MEDIUM'
                      ? 'bg-amber-500 text-white'
                      : lvl === 'LOW'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="pl-3 pr-8 py-1.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={fetchAlertsData}
          disabled={loading}
          className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 font-semibold"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Alerts Table */}
      <AlertTable
        alerts={filteredAlerts}
        onAcknowledge={handleAcknowledge}
        isAcknowledging={isAcking}
        showActions={true}
        emptyMessage="No alerts matching the selected filters."
      />

      {/* Simulated Alert Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Issue Simulated Alert (Hackathon Demo)
                </h3>
                <p className="text-xs text-slate-500">
                  Broadcasts an instant early warning bulletin to the SQLite database
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Urban Basin
                </label>
                <select
                  value={modalForm.location_id}
                  onChange={(e) => setModalForm({ ...modalForm, location_id: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 font-medium"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Risk Severity
                  </label>
                  <select
                    value={modalForm.risk_level}
                    onChange={(e) => setModalForm({ ...modalForm, risk_level: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  >
                    <option value="HIGH">HIGH SEVERITY</option>
                    <option value="MEDIUM">MEDIUM SEVERITY</option>
                    <option value="LOW">LOW SEVERITY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Risk Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={modalForm.risk_score}
                    onChange={(e) => setModalForm({ ...modalForm, risk_score: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rainfall / Hydrology Conditions
                </label>
                <input
                  type="text"
                  required
                  value={modalForm.rainfall_conditions}
                  onChange={(e) => setModalForm({ ...modalForm, rainfall_conditions: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Water Stage Level (meters)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  value={modalForm.water_level_m}
                  onChange={(e) => setModalForm({ ...modalForm, water_level_m: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recommended Action Directive
                </label>
                <textarea
                  rows="2"
                  required
                  value={modalForm.recommended_action}
                  onChange={(e) => setModalForm({ ...modalForm, recommended_action: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Transmitting...' : 'Dispatch Alert'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
