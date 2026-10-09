import React from 'react';

export default function RiskBadge({ level, score, showScore = true, size = 'md' }) {
  const normLevel = (level || 'LOW').toUpperCase();

  const config = {
    LOW: {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      dot: 'bg-emerald-500',
      label: 'Low Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-50 border-amber-200 text-amber-800',
      dot: 'bg-amber-500',
      label: 'Medium Risk',
    },
    HIGH: {
      bg: 'bg-rose-50 border-rose-200 text-rose-800',
      dot: 'bg-rose-500 animate-pulse',
      label: 'High Risk',
    },
  }[normLevel] || {
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    dot: 'bg-slate-400',
    label: normLevel,
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
    lg: 'text-sm px-3.5 py-1.5 font-bold',
  }[size] || 'text-xs px-2.5 py-1 font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${sizeClasses} tracking-wide transition-all`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
      {showScore && score !== undefined && score !== null && (
        <span className="opacity-80 font-mono text-[11px]">
          ({Math.round(score)}/100)
        </span>
      )}
    </span>
  );
}
