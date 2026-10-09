import React from 'react';
import RiskBadge from './RiskBadge';
import { CheckCircle2, Clock, MapPin, Droplets } from 'lucide-react';

export default function AlertTable({
  alerts = [],
  onAcknowledge,
  isAcknowledging = false,
  showActions = true,
  emptyMessage = 'No active flood alerts reported.'
}) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-semibold text-slate-800">Normal Hydrological Conditions</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
            <th className="py-3 px-4">Location & Basin</th>
            <th className="py-3 px-4">Risk Severity</th>
            <th className="py-3 px-4">Hydrology / Rainfall</th>
            <th className="py-3 px-4">Action Directive</th>
            <th className="py-3 px-4">Reported</th>
            <th className="py-3 px-4">Status</th>
            {showActions && <th className="py-3 px-4 text-right">Control</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {alerts.map((alert) => {
            const isAck = alert.status === 'ACKNOWLEDGED';
            const formattedTime = alert.timestamp
              ? new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '--:--';

            return (
              <tr
                key={alert.id}
                className={`transition-colors hover:bg-slate-50/60 ${
                  isAck ? 'opacity-70 bg-slate-50/30' : ''
                }`}
              >
                {/* Location */}
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{alert.location_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    ID: {alert.location_id}
                    {alert.is_simulated && (
                      <span className="ml-1.5 px-1 rounded bg-amber-50 text-amber-700 text-[9px] border border-amber-200 font-sans">
                        Simulated
                      </span>
                    )}
                  </div>
                </td>

                {/* Risk Severity */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <RiskBadge level={alert.risk_level} score={alert.risk_score} size="sm" />
                </td>

                {/* Hydrological conditions */}
                <td className="py-3.5 px-4 max-w-xs">
                  <div className="flex items-center gap-1 font-medium text-slate-700">
                    <Droplets className="w-3 h-3 text-blue-500 shrink-0" />
                    <span>{alert.rainfall_conditions}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Water Stage: <strong>{alert.water_level_m}m</strong>
                  </div>
                </td>

                {/* Action Directive */}
                <td className="py-3.5 px-4 max-w-xs">
                  <p className="text-slate-700 font-medium leading-relaxed">
                    {alert.recommended_action}
                  </p>
                </td>

                {/* Timestamp */}
                <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formattedTime}</span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {isAck ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Acknowledged
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                      ACTIVE ALERT
                    </span>
                  )}
                </td>

                {/* Acknowledge Action */}
                {showActions && (
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    {!isAck ? (
                      <button
                        onClick={() => onAcknowledge && onAcknowledge(alert.id)}
                        disabled={isAcknowledging}
                        className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
                      >
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">Logged</span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
