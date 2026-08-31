/**
 * Map legend showing CGWB classification tiers for the active layer.
 * Accurately color-matched with map markers and glassmorphic styling.
 */

import { TIER_CONFIG, getTierColor } from '../../lib/risk';
import { CGWBClassification } from '../../data/types';

interface LegendProps {
  activeLayer: 'drawdown' | 'salinity';
  className?: string;
}

export function Legend({ activeLayer, className = '' }: LegendProps) {
  // For drawdown layer, show all tiers except Saline
  // For salinity layer, emphasize Saline and coastal-relevant tiers
  const drawdownTiers: CGWBClassification[] = [
    'Safe',
    'Semi-Critical',
    'Critical',
    'Over-Exploited',
  ];

  const salinityTiers: CGWBClassification[] = [
    'Saline',
    'Critical',
    'Over-Exploited',
    'Semi-Critical',
    'Safe',
  ];

  const tiers = activeLayer === 'drawdown' ? drawdownTiers : salinityTiers;

  return (
    <div
      className={`glass-card p-4 shadow-elevated ${className}`}
      role="img"
      aria-label={`${activeLayer === 'drawdown' ? 'Drawdown' : 'Salinity'} risk legend`}
    >
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-hairline">
        <h3 className="text-body-sm font-bold text-ink-primary flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span>{activeLayer === 'drawdown' ? 'Drawdown Risk Tiers' : 'Salinity Intrusion Tiers'}</span>
        </h3>
        <span className="text-[11px] font-semibold text-accent uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10">
          CGWB
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {tiers.map(tier => {
          const config = TIER_CONFIG[tier];
          const markerColor = getTierColor(tier);

          return (
            <div
              key={tier}
              className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
            >
              {/* Solid marker dot matching the map circle identically with glow */}
              <div className="relative flex items-center justify-center flex-shrink-0">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{
                    backgroundColor: markerColor,
                    boxShadow: `0 0 8px ${markerColor}60, 0 1px 3px rgba(0,0,0,0.15)`,
                  }}
                  aria-hidden="true"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-body-sm font-semibold text-ink-primary truncate">
                    {config.label}
                  </span>
                  <span
                    className="text-[11px] font-medium px-1.5 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: config.bgColor,
                      borderColor: config.borderColor,
                      color: config.color,
                    }}
                  >
                    Tier {config.severity}
                  </span>
                </div>
                <p className="text-caption text-ink-muted truncate mt-0.5">{config.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3.5 pt-3 border-t border-hairline text-caption text-ink-muted leading-relaxed">
        <p>
          <strong className="text-ink-secondary">Classification:</strong> Based on CGWB Dynamic Groundwater Resource Assessment.
          {activeLayer === 'salinity' && ' Saline tier highlights high coastal electrical conductivity (EC).'}
        </p>
      </div>
    </div>
  );
}