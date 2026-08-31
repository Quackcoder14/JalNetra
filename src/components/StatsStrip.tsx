/**
 * Summary statistics strip for the national overview page.
 */

import { NationalStats } from '../data/types';
import { StatCard } from './RiskBadge';

interface StatsStripProps {
  stats: NationalStats;
}

export function StatsStrip({ stats }: StatsStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6" role="region" aria-label="National groundwater statistics">
      <StatCard
        label="Districts Monitored"
        value={stats.totalDistricts}
        icon={
          <svg className="w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        }
      />
      <StatCard
        label="Over-Exploited"
        value={`${stats.pctOverExploited}%`}
        trend="up"
        trendLabel="Critical"
        icon={
          <svg className="w-6 h-6" style={{ color: '#DC2626' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        }
      />
      <StatCard
        label="Critical"
        value={`${stats.pctCritical}%`}
        trend="up"
        trendLabel="Attention needed"
        icon={
          <svg className="w-6 h-6" style={{ color: '#F97316' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
        }
      />
      <StatCard
        label="Rising Salinity"
        value={stats.districtsWithRisingSalinity}
        trend="up"
        trendLabel="Coastal risk"
        icon={
          <svg className="w-6 h-6" style={{ color: '#7C3AED' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M12 22V12" />
            <path d="M18 22V12" />
            <path d="M6 22V12" />
            <path d="M12 22C17.5228 22 22 17.5228 22 12" />
            <path d="M2 12C2 6.47715 6.47715 2 12 2" />
          </svg>
        }
      />
    </div>
  );
}