import React from 'react';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  badgeText = null,
  onClick = null,
}) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50/70 text-blue-600 border-blue-100',
      accent: 'text-blue-600',
      border: 'hover:border-blue-300',
    },
    green: {
      bg: 'bg-emerald-50/70 text-emerald-600 border-emerald-100',
      accent: 'text-emerald-600',
      border: 'hover:border-emerald-300',
    },
    amber: {
      bg: 'bg-amber-50/70 text-amber-600 border-amber-100',
      accent: 'text-amber-600',
      border: 'hover:border-amber-300',
    },
    red: {
      bg: 'bg-rose-50/70 text-rose-600 border-rose-100',
      accent: 'text-rose-600',
      border: 'hover:border-rose-300',
    },
    navy: {
      bg: 'bg-slate-100 text-slate-800 border-slate-200',
      accent: 'text-slate-900',
      border: 'hover:border-slate-400',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs transition-all duration-200 hover:shadow-md ${scheme.border} ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
          {title}
        </span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${scheme.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
          {value}
        </div>
        {badgeText && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
          {subtitle}
        </p>
      )}
    </div>
  );
}
