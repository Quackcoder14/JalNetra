/**
 * Alerts Dashboard page - ranked list of districts by risk severity.
 * Sortable, filterable table with refresh capability.
 */

import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDistricts, useRefresh } from '../hooks/useMockData';
import { ClassificationBadge, ExtractionTrendBadge, SalinityRiskBadge } from '../components/RiskBadge';
import { formatGwLevel, formatRelativeTime } from '../lib/format';
import { TIER_CONFIG } from '../lib/risk';
import { CGWBClassification, DistrictSummary } from '../data/types';

type SortField = 'risk' | 'district' | 'state' | 'classification' | 'gwLevel' | 'salinity' | 'updated';
type SortDirection = 'asc' | 'desc';

interface AlertRow extends DistrictSummary {
  drawdownRiskScore: number;
  salinityRiskScoreDisplay?: number;
}

export function AlertsDashboard() {
  const { data: districts, loading, error, refresh: refreshDistricts } = useDistricts();
  const { refreshing, triggerRefresh } = useRefresh();
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<CGWBClassification | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute risk scores for each district
  const enrichedDistricts = useMemo((): AlertRow[] => {
    return districts.map(d => ({
      ...d,
      drawdownRiskScore: computeDrawdownRisk(d),
      salinityRiskScoreDisplay: d.isCoastal ? d.salinityRiskScore : undefined,
    }));
  }, [districts]);

  // Filter and sort
  const filteredSorted = useMemo(() => {
    let result = enrichedDistricts;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.state.toLowerCase().includes(q)
      );
    }

    // State filter
    if (stateFilter !== 'all') {
      result = result.filter(d => d.state === stateFilter);
    }

    // Tier filter
    if (tierFilter !== 'all') {
      result = result.filter(d => d.cgwbClassification === tierFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'risk':
          comparison = b.drawdownRiskScore - a.drawdownRiskScore;
          break;
        case 'district':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'state':
          comparison = a.state.localeCompare(b.state);
          break;
        case 'classification':
          comparison = TIER_CONFIG[b.cgwbClassification].severity - TIER_CONFIG[a.cgwbClassification].severity;
          break;
        case 'gwLevel':
          comparison = b.latestGwLevel - a.latestGwLevel;
          break;
        case 'salinity':
          comparison = (b.salinityRiskScoreDisplay ?? -1) - (a.salinityRiskScoreDisplay ?? -1);
          break;
        case 'updated':
          comparison = new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [enrichedDistricts, searchQuery, stateFilter, tierFilter, sortField, sortDirection]);

  // Unique states for filter dropdown
  const states = useMemo(() => {
    const unique = new Set(districts.map(d => d.state));
    return Array.from(unique).sort();
  }, [districts]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleRefresh = useCallback(async () => {
    await triggerRefresh();
    refreshDistricts();
  }, [triggerRefresh, refreshDistricts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[500px]">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-body text-ink-muted">Loading alerts…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-surface rounded-card border border-hairline p-8 text-center">
            <svg className="w-12 h-12 mx-auto text-red-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <h2 className="text-display-md font-semibold text-ink-primary mb-2">Unable to Load Alerts</h2>
            <p className="text-ink-secondary mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-accent text-white rounded-card font-medium hover:bg-accent-light transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground">
      {/* Header */}
      <header className="bg-surface border-b border-hairline sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-display-lg font-bold text-ink-primary">Alert Dashboard</h1>
              <p className="mt-1 text-body text-ink-secondary">
                Districts ranked by groundwater drawdown risk — {filteredSorted.length} of {districts.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-card font-medium hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{refreshing ? 'Refreshing…' : 'Refresh Data'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search district or state…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface border border-hairline rounded-card text-body-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow"
                aria-label="Search districts"
              />
            </div>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="px-4 py-2 bg-surface border border-hairline rounded-card text-body-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow min-w-[160px]"
              aria-label="Filter by state"
            >
              <option value="all">All States</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as CGWBClassification | 'all')}
              className="px-4 py-2 bg-surface border border-hairline rounded-card text-body-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-shadow min-w-[180px]"
              aria-label="Filter by risk tier"
            >
              <option value="all">All Tiers</option>
              <option value="Over-Exploited">Over-Exploited</option>
              <option value="Critical">Critical</option>
              <option value="Semi-Critical">Semi-Critical</option>
              <option value="Safe">Safe</option>
              <option value="Saline">Saline</option>
            </select>
          </div>
        </div>
      </header>

      {/* Table */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-surface rounded-card border border-hairline overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="District risk alerts">
              <thead className="bg-hairline/50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-caption font-semibold text-ink-muted uppercase tracking-wider">
                    District
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-caption font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">
                    State
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-caption font-semibold text-ink-muted uppercase tracking-wider">
                    Classification
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('risk')}
                      className="flex items-center justify-end gap-1 hover:text-accent transition-colors"
                      aria-sort={sortField === 'risk' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Risk Score
                      <SortIcon field={sortField} direction={sortDirection} current="risk" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-caption font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('gwLevel')}
                      className="flex items-center justify-end gap-1 hover:text-accent transition-colors"
                      aria-sort={sortField === 'gwLevel' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      GW Level
                      <SortIcon field={sortField} direction={sortDirection} current="gwLevel" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-caption font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('salinity')}
                      className="flex items-center justify-center gap-1 hover:text-accent transition-colors"
                      aria-sort={sortField === 'salinity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Salinity
                      <SortIcon field={sortField} direction={sortDirection} current="salinity" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-caption font-semibold text-ink-muted uppercase tracking-wider hidden md:table-cell">
                    Extraction
                  </th>
                  <th scope="col" className="px-4 py-3 text-center text-caption font-semibold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('updated')}
                      className="flex items-center justify-center gap-1 hover:text-accent transition-colors"
                      aria-sort={sortField === 'updated' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Updated
                      <SortIcon field={sortField} direction={sortDirection} current="updated" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline">
                {filteredSorted.map((district, index) => (
                  <tr
                    key={district.id}
                    className="hover:bg-hairline/50 transition-colors cursor-pointer"
                    onClick={() => window.location.href = `/district/${district.id}`}
                    onKeyDown={e => { if (e.key === 'Enter') window.location.href = `/district/${district.id}`; }}
                    tabIndex={0}
                    role="row"
                    style={{ animationDelay: `${index * 20}ms` }}
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/district/${district.id}`}
                        className="font-medium text-ink-primary hover:text-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
                        onClick={e => e.stopPropagation()}
                      >
                        {district.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary hidden md:table-cell">{district.state}</td>
                    <td className="px-4 py-3">
                      <ClassificationBadge classification={district.cgwbClassification} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell font-mono tabular-nums text-body-sm font-medium text-ink-primary">
                      {district.drawdownRiskScore}
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell font-mono tabular-nums text-body-sm text-ink-secondary">
                      {formatGwLevel(district.latestGwLevel)}
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      {district.salinityRiskScoreDisplay !== undefined ? (
                        <SalinityRiskBadge score={district.salinityRiskScoreDisplay} size="sm" />
                      ) : (
                        <span className="text-ink-muted text-caption">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <ExtractionTrendBadge trend={district.extractionTrend} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell text-caption text-ink-muted">
                      {formatRelativeTime(district.lastUpdated)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {filteredSorted.length === 0 && (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 mx-auto text-ink-muted mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <h3 className="text-display-sm font-semibold text-ink-primary mb-1">No districts match</h3>
              <p className="text-ink-secondary">Try adjusting your filters or search query</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3 border-t border-hairline flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-ink-muted">
            <span>Showing {filteredSorted.length} of {districts.length} districts</span>
            <span className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-[10px] font-medium">MOCK DATA</span>
              <span>Last updated: {formatRelativeTime(districts[0]?.lastUpdated || new Date().toISOString())}</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

function computeDrawdownRisk(district: DistrictSummary): number {
  const tierSeverity = TIER_CONFIG[district.cgwbClassification].severity;
  const tierScore = (tierSeverity / 5) * 40;
  const trendScore = district.gwTrend === 'declining' ? 30 : district.gwTrend === 'stable' ? 15 : 0;
  const deficitScore = Math.min(20, Math.max(0, (district.rainfallDeficitPct / 50) * 20));
  const extractionScore = district.extractionTrend === 'rising' ? 10 : district.extractionTrend === 'stable' ? 5 : 0;
  return Math.round(tierScore + trendScore + deficitScore + extractionScore);
}

interface SortIconProps {
  field: SortField;
  direction: SortDirection;
  current: SortField;
}

function SortIcon({ field, direction, current }: SortIconProps) {
  if (field !== current) {
    return (
      <svg className="w-3 h-3 text-ink-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 16l5-5 5 5" />
        <path d="M7 8l5 5 5-5" />
      </svg>
    );
  }
  return (
    <svg className="w-3 h-3 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      {direction === 'asc' ? <path d="M7 16l5-5 5 5" /> : <path d="M7 8l5 5 5-5" />}
    </svg>
  );
}