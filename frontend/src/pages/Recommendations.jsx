import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import RiskBadge from '../components/RiskBadge';
import {
  CheckSquare,
  Square,
  Truck,
  Waves,
  Layers,
  Activity,
  Info,
  ChevronDown,
  ChevronUp,
  Mountain,
  ArrowRight
} from 'lucide-react';

export default function Recommendations() {
  const [activeTier, setActiveTier] = useState('HIGH');
  const [expandedReason, setExpandedReason] = useState(null);

  // Interactive Checklist State for demo
  const [completedTasks, setCompletedTasks] = useState({
    'high-1': true,
    'high-2': false,
    'med-1': true,
  });

  const toggleTask = (id) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const protocols = {
    HIGH: {
      title: 'Tier 3: High Flood Vulnerability Protocol (Risk Score ≥ 70)',
      color: 'border-rose-200 bg-rose-50/40 text-rose-900',
      badgeColor: 'HIGH',
      summary:
        'Triggered when cumulative precipitation and canal stage deplete drainage freeboard, causing immediate surface inundation.',
      actions: [
        {
          id: 'high-1',
          title: 'Verify Telemetry Sensors & Ground Truth Readings',
          reason:
            'Telemetry sensors may report anomalous spikes due to debris clogging or mechanical drift. Ground crew physical verification prevents false alarms.',
          timeline: 'Immediate (< 15 mins)',
          department: 'Civic Hydrology & Sensor Telemetry Unit',
        },
        {
          id: 'high-2',
          title: 'Mobilize Auxiliary Dewatering Diesel Pumps',
          reason:
            'When gravity-fed runoff is impeded by high canal stages, mechanical pumping at 2500+ GPM is necessary to evacuate water from underpasses and basements.',
          timeline: '< 30 mins',
          department: 'Municipal Stormwater Drainage Works',
        },
        {
          id: 'high-3',
          title: 'Erect Warning Barricades at Vulnerable Underpasses',
          reason:
            'Vehicles entering submerged underpasses present extreme drowning and electrocution hazards. Visual barriers avert life-threatening entrapment.',
          timeline: '< 45 mins',
          department: 'Metropolitan Traffic Police & First Responders',
        },
        {
          id: 'high-4',
          title: 'Notify Regional Disaster Management Cell (NDMA / SDMA)',
          reason:
            'Pre-warning higher disaster cells enables emergency shelters, generator backups, and inflatable rescue boats to be placed on 1-hour standby.',
          timeline: '< 60 mins',
          department: 'Disaster Coordination Command',
        },
        {
          id: 'high-5',
          title: 'Broadcast Public Safety Weather Advisory',
          reason:
            'Inform residents in ground-floor tenements to relocate valuable electrical items and avoid traversing inundated stormwater corridors.',
          timeline: '< 90 mins',
          department: 'Civil Information & Public Relations',
        },
      ],
    },
    MEDIUM: {
      title: 'Tier 2: Medium Hydrological Precautionary Protocol (Risk Score 40–69)',
      color: 'border-amber-200 bg-amber-50/40 text-amber-900',
      badgeColor: 'MEDIUM',
      summary:
        'Triggered by sustained precipitation with moderate runoff risk. Rapid preventive clearing prevents escalation to inundation.',
      actions: [
        {
          id: 'med-1',
          title: 'Dispatch Culvert & Sluice Desilting Crews',
          reason:
            'Removing fallen tree limbs, silt build-up, and accumulated plastic trash bags restores up to 40% of conduit hydraulic flow capacity.',
          timeline: 'Within 2 hours',
          department: 'Urban Sanitation & Canal Maintenance',
        },
        {
          id: 'med-2',
          title: 'Inspect Sluice Gates & Retention Basin Inlets',
          reason:
            'Verifying that automated tidal flaps and retention pond sluices operate smoothly prevents backflow during high tides.',
          timeline: 'Within 3 hours',
          department: 'Water Resources Department (WRD)',
        },
        {
          id: 'med-3',
          title: 'Stage Mobile Standby Pumping Units',
          reason:
            'Positioning trailer-mounted suction pumps adjacent to flood-prone depressions saves crucial transit time if precipitation intensifies.',
          timeline: 'Within 4 hours',
          department: 'Emergency Engineering Reserve',
        },
        {
          id: 'med-4',
          title: 'Issue Advisory to Underground Metro & Parking Basements',
          reason:
            'Encourages property managers to test flood barriers, check sump pumps, and clear vehicle access ramps.',
          timeline: 'Within 4 hours',
          department: 'Building Safety & Urban Local Body',
        },
      ],
    },
    LOW: {
      title: 'Tier 1: Low Routine Surveillance Protocol (Risk Score < 40)',
      color: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      badgeColor: 'LOW',
      summary:
        'Normal hydrological conditions. Focus on preventive maintenance, telemetry diagnostics, and routine drainage sweeping.',
      actions: [
        {
          id: 'low-1',
          title: 'Maintain Automated Telemetry Surveillance',
          reason:
            'Continual 15-minute polling ensures sensor batteries, solar panels, and 4G IoT uplinks remain calibrated and responsive.',
          timeline: 'Continuous (24/7)',
          department: 'IoT Telemetry Support Desk',
        },
        {
          id: 'low-2',
          title: 'Execute Scheduled Stormwater Inlet Sweeping',
          reason:
            'Routine clearing of street curbs and storm grates prevents organic leaf litter from hardening into impermeable mats.',
          timeline: 'Daily schedule',
          department: 'Municipal Highway Maintenance',
        },
        {
          id: 'low-3',
          title: 'Monitor 48-Hour Open-Meteo & Radar Forecasts',
          reason:
            'Tracking synoptic cloud movements allows municipal command to anticipate depression formations 24 to 48 hours in advance.',
          timeline: 'Every 6 hours',
          department: 'Meteorological Watch Desk',
        },
      ],
    },
  };

  const currentProtocol = protocols[activeTier];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
              Standard Operating Procedures (SOP)
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Urban Hydrology Decision Matrix
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Action Protocols & Preventive Recommendations
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
            Prescriptive disaster mitigation workflows tailored to calculated risk scores and contributing topographical vulnerabilities.
          </p>
        </div>

        {/* Tier Selector Buttons */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {['HIGH', 'MEDIUM', 'LOW'].map((tier) => (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTier === tier
                  ? tier === 'HIGH'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : tier === 'MEDIUM'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tier} Protocol
            </button>
          ))}
        </div>
      </div>

      {/* Critical Regulatory Disclaimer */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs flex items-start gap-3 shadow-xs">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Advisory Decision-Support Disclaimer: </span>
          The actions and timelines suggested in FloodGuard AI serve as predictive operational decision support for civic engineers and municipal planners. They do not automatically issue statutory evacuation orders or close public highways without human confirmation.
        </div>
      </div>

      {/* Active Tier Protocol Details */}
      <div className={`p-6 rounded-2xl border ${currentProtocol.color} shadow-xs space-y-6`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <RiskBadge level={currentProtocol.badgeColor} showScore={false} size="sm" />
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {currentProtocol.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {currentProtocol.summary}
            </p>
          </div>
          <span className="text-xs font-bold font-mono px-3 py-1 rounded-lg bg-white/80 border border-slate-200 text-slate-700 self-start sm:self-auto">
            {currentProtocol.actions.length} Action Directives
          </span>
        </div>

        {/* Action Directives List */}
        <div className="space-y-3">
          {currentProtocol.actions.map((act) => {
            const isCompleted = !!completedTasks[act.id];
            const isExpanded = expandedReason === act.id;

            return (
              <div
                key={act.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs transition-all hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      type="button"
                      onClick={() => toggleTask(act.id)}
                      className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="Mark directive as completed / staged"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300" />
                      )}
                    </button>

                    <div>
                      <h4
                        className={`text-sm font-bold text-slate-900 ${
                          isCompleted ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {act.title}
                      </h4>

                      <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                        <span className="font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {act.timeline}
                        </span>
                        <span>•</span>
                        <span className="text-slate-600">{act.department}</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle Explain Reason Button */}
                  <button
                    onClick={() => setExpandedReason(isExpanded ? null : act.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <span>{isExpanded ? 'Hide Rationale' : 'Why this action?'}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expanded Rationale explanation */}
                {isExpanded && (
                  <div className="mt-3 p-3 rounded-lg bg-blue-50/70 border border-blue-100 text-xs text-blue-950 leading-relaxed animate-in fade-in duration-150">
                    <strong className="block font-bold text-[10px] uppercase tracking-wider text-blue-800 mb-0.5">
                      Hydrological & Operational Rationale
                    </strong>
                    {act.reason}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Scientific Knowledge Box: Why Flooding Occurs in Urban Environments */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-600" />
          <span>Hydrological Causation Factors in Urban Flood Modeling</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h5 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-500" /> Impermeable Urban Sprawl
            </h5>
            <p className="leading-relaxed">
              Asphalt and concrete decrease natural soil percolation from ~80% down to &lt;15%, converting rainfall almost instantaneously into rapid surface runoff.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h5 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
              <Waves className="w-4 h-4 text-blue-500" /> Tidal & Canal Backwater Lock
            </h5>
            <p className="leading-relaxed">
              When high tides or swollen arterial rivers match the discharge elevation of municipal storm canals, gravity drainage stalls, leading to rapid street pooling.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <h5 className="font-bold text-slate-800 text-xs mb-1 flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-amber-500" /> Siltation & Conduit Choking
            </h5>
            <p className="leading-relaxed">
              Storm drains designed for 40 mm/hr may lose over 60% of conveyance capacity due to construction sediment, plastic debris, and unmaintained silt sumps.
            </p>
          </div>
        </div>
      </div>

      {/* Non-Rainfall GLOF & Landslide Dam Protocol Callout */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 max-w-2xl">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <Mountain className="w-4 h-4" /> Non-Rainfall Flash Floods (Nepal & Himalayan GLOF Protocol)
          </div>
          <h4 className="font-bold text-base text-white">
            Facing Flash Floods With Zero Rainfall (Glacial Lake & Dam Breaches)?
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard rainfall sensors report 0 mm during glacial moraine collapses (e.g. Thame 2024) or landslide gorge damming (e.g. Melamchi 2021). Use the dedicated GLOF early warning module with rate-of-rise (dh/dt) telemetry and acoustic geophone detection.
          </p>
        </div>
        <Link
          to="/glof"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition"
        >
          Open GLOF Early Warning Engine <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
