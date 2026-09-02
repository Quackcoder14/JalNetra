import { getTierConfig, getExtractionTrendConfig, getGwTrendConfig, getSalinityRiskBand, getTierColor } from '../lib/risk';
import { CGWBClassification, ExtractionTrend } from '../data/types';

interface ClassificationBadgeProps {
  classification: CGWBClassification;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}

export function ClassificationBadge({
  classification,
  size = 'md',
  showDescription = false,
}: ClassificationBadgeProps) {
  const config = getTierConfig(classification);
  const markerColor = getTierColor(classification);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-caption',
    md: 'px-2.5 py-1 text-body-sm',
    lg: 'px-3 py-1.5 text-body font-semibold',
  };

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm ${
          sizeClasses[size]
        }`}
        style={{
          backgroundColor: config.bgColor,
          borderColor: config.borderColor,
          color: config.color,
        }}
      >
        <span
          className="w-2 h-2 rounded-full border border-white"
          style={{ backgroundColor: markerColor }}
        />
        {config.label}
      </span>
      {showDescription && (
        <span className="text-body-sm text-ink-muted max-w-xs truncate">
          {config.description}
        </span>
      )}
    </div>
  );
}

interface TrendBadgeProps {
  trend: ExtractionTrend | string;
  size?: 'sm' | 'md';
}

export function ExtractionTrendBadge({ trend, size = 'md' }: TrendBadgeProps) {
  const config = getExtractionTrendConfig(trend);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-caption',
    md: 'px-2.5 py-1 text-body-sm font-medium',
  };

  const icons = {
    up: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    ),
    down: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    ),
    horizontal: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M12 5v14" />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color + '40',
        color: config.color,
      }}
    >
      {icons[config.icon]}
      {config.label}
    </span>
  );
}

interface GwTrendBadgeProps {
  trend: 'improving' | 'declining' | 'stable' | string;
  size?: 'sm' | 'md';
}

export function GwTrendBadge({ trend, size = 'md' }: GwTrendBadgeProps) {
  const config = getGwTrendConfig(trend);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-caption',
    md: 'px-2.5 py-1 text-body-sm font-medium',
  };

  const icons = {
    up: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M18 15l-6-6-6 6" />
      </svg>
    ),
    down: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M6 9l6 6 6-6" />
      </svg>
    ),
    horizontal: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    ),
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color + '40',
        color: config.color,
      }}
    >
      {icons[config.icon]}
      {config.label}
    </span>
  );
}

interface SalinityRiskBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function SalinityRiskBadge({ score, size = 'md' }: SalinityRiskBadgeProps) {
  const config = getSalinityRiskBand(score);
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-caption',
    md: 'px-2.5 py-1 text-body-sm font-medium',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full border ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.color + '40',
        color: config.color,
      }}
    >
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 22V12" />
        <path d="M18 22V12" />
        <path d="M6 22V12" />
      </svg>
      {config.label}
    </span>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, trendLabel, icon }: StatCardProps) {
  const trendColors = {
    up: { color: '#DC2626', bg: 'rgba(254, 242, 242, 0.9)', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 15l-6-6-6 6"/></svg> },
    down: { color: '#16A34A', bg: 'rgba(220, 252, 231, 0.9)', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 9l6 6 6-6"/></svg> },
    neutral: { color: '#64748B', bg: 'rgba(241, 245, 249, 0.9)', icon: <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14"/></svg> },
  };

  const t = trend ? trendColors[trend] : null;

  return (
    <div className="glass-card p-4 sm:p-5 hover:shadow-card-hover transition-all duration-300 group">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-ink-muted uppercase tracking-wider mb-1">{label}</p>
          <p className="text-stat text-ink-primary font-extrabold tabular-nums tracking-tight group-hover:text-accent transition-colors">{value}</p>
          {trend && trendLabel && (
            <div className="flex items-center gap-1.5 mt-1.5" style={{ color: t!.color }}>
              {t!.icon}
              <span className="text-caption font-semibold">{trendLabel}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center border border-white/80 shadow-sm"
            style={{ backgroundColor: t?.bg || 'rgba(2, 132, 199, 0.1)' }}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}