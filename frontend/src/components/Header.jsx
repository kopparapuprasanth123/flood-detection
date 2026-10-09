import React from 'react';
import { Menu, RefreshCw, MapPin, Activity } from 'lucide-react';

export default function Header({
  locations = [],
  selectedLocationId,
  onSelectLocation,
  lastUpdated,
  onRefresh,
  isLoading,
  onToggleSidebar,
}) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Syncing...';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left Side: Mobile Menu Button & Context Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Disaster Operations Command
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Live Telemetry
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden md:block">
              Intelligent multi-factor urban flood risk estimation & preventive action dispatch
            </p>
          </div>
        </div>

        {/* Right Side: Global Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Selector */}
          <div className="relative flex items-center">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
            <select
              value={selectedLocationId || ''}
              onChange={(e) => onSelectLocation(e.target.value)}
              className="pl-8 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs sm:text-sm font-medium text-slate-700 rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Monitored Basins</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sync Timestamp Pill */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>Updated: <strong className="font-mono text-slate-800">{formattedTime}</strong></span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh hydrological telemetry and weather models"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs hover:shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
