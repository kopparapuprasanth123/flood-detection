import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Map,
  Calculator,
  BellRing,
  CloudRain,
  ShieldAlert,
  Radio,
  X,
  Waves,
  Mountain
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Live Flood Map', path: '/map', icon: Map },
    { name: 'Flood Prediction', path: '/predict', icon: Calculator },
    { name: 'GLOF & Outburst Floods', path: '/glof', icon: Mountain },
    { name: 'Alerts & Warnings', path: '/alerts', icon: BellRing },
    { name: 'Weather Monitoring', path: '/weather', icon: CloudRain },
    { name: 'Action Protocols', path: '/recommendations', icon: ShieldAlert },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Waves className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base tracking-tight">
                  FloodGuard
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Urban Disaster Intel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Operational Status Banner */}
        <div className="mx-4 mt-4 px-3.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="text-xs">
            <span className="text-slate-300 font-semibold">Telemetry Engine Active</span>
            <span className="block text-[10px] text-slate-400">10 Monitored Stations</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-600/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5 opacity-90" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* System & Hackathon Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-semibold">Architecture</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">v1.0-FastAPI</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Radio className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Open-Meteo & ML RF Models</span>
            </div>
            <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800/80 leading-relaxed">
              Demonstration prototype for urban flood early-warning.
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
