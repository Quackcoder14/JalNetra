/**
 * Alerts Dashboard page - ranked list of districts by risk severity.
 * Sortable, filterable table with refresh capability and bulletproof error handling.
 */

import { useState, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDistricts, useRefresh } from '../hooks/useMockData';
import { ClassificationBadge, ExtractionTrendBadge, SalinityRiskBadge } from '../components/RiskBadge';
import { formatGwLevel, formatRelativeTime } from '../lib/format';
import { getTierConfig, computeDrawdownRiskScore } from '../lib/risk';
import { CGWBClassification, DistrictSummary } from '../data/types';

type SortField = 'risk' | 'district' | 'state' | 'classification' | 'gwLevel' | 'salinity' | 'updated';
type SortDirection = 'asc' | 'desc';

interface AlertRow extends DistrictSummary {
  drawdownRiskScore: number;
  salinityRiskScoreDisplay?: number;
}

export function AlertsDashboard() {
  const navigate = useNavigate();
  const { data: districts, loading, error, refresh: refreshDistricts } = useDistricts();
  const { refreshing, triggerRefresh } = useRefresh();
  const [sortField, setSortField] = useState<SortField>('risk');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [stateFilter, setStateFilter] = useState<string>('all');
  const [tierFilter, setTierFilter] = useState<CGWBClassification | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Compute risk scores safely for each district
  const enrichedDistricts = useMemo((): AlertRow[] => {
    if (!Array.isArray(districts)) return [];
    return districts.map(d => ({
      ...d,
      drawdownRiskScore: computeDrawdownRiskScore(d),
      salinityRiskScoreDisplay: d.isCoastal ? d.salinityRiskScore : undefined,
    }));
  }, [districts]);

  // Filter and sort
  const filteredSorted = useMemo(() => {
    let result = [...enrichedDistricts];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(d =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.state || '').toLowerCase().includes(q)
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
          comparison = (b.drawdownRiskScore ?? 0) - (a.drawdownRiskScore ?? 0);
          break;
        case 'district':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'state':
          comparison = (a.state || '').localeCompare(b.state || '');
          break;
        case 'classification':
          comparison = getTierConfig(b.cgwbClassification).severity - getTierConfig(a.cgwbClassification).severity;
          break;
        case 'gwLevel':
          comparison = (b.latestGwLevel ?? 0) - (a.latestGwLevel ?? 0);
          break;
        case 'salinity':
          comparison = (b.salinityRiskScoreDisplay ?? -1) - (a.salinityRiskScoreDisplay ?? -1);
          break;
        case 'updated':
          comparison = new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [enrichedDistricts, searchQuery, stateFilter, tierFilter, sortField, sortDirection]);

  // Unique states for filter dropdown
  const states = useMemo(() => {
    if (!Array.isArray(districts)) return [];
    const unique = new Set(districts.map(d => d.state).filter(Boolean));
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
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-body font-semibold text-ink-primary">Loading National Alerts…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="glass-card rounded-2xl border border-white/90 p-8 text-center shadow-md">
            <div className="w-12 h-12 mx-auto text-amber-500 mb-4 bg-amber-50 rounded-xl flex items-center justify-center text-2xl">
              ⚠️
            </div>
            <h2 className="text-display-md font-bold text-ink-primary mb-2">Unable to Load Alerts</h2>
            <p className="text-ink-secondary mb-6">{error}</p>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-body-sm font-bold transition-all shadow-sm"
            >
              Retry Sync
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground pb-12 animate-fade-in">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/90 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold">
                  LIVE TELEMETRY
                </span>
                <span className="text-[11px] font-bold text-ink-muted">
                  {districts.length} Observation Stations
                </span>
              </div>
              <h1 className="text-display-lg font-black text-ink-primary tracking-tight">
                National Alert Dashboard
              </h1>
              <p className="mt-0.5 text-body-sm text-ink-secondary">
                Districts ranked by groundwater drawdown &amp; salinity risk — {filteredSorted.length} shown
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3.5 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-body-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                <span>{refreshing ? 'Syncing…' : 'Sync Live Data'}</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="mt-4 flex flex-col sm:flex-row gap-2.5 flex-wrap">
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
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-body-sm font-medium text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                aria-label="Search districts"
              />
            </div>
            <select
              value={stateFilter}
              onChange={e => setStateFilter(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-body-sm font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent transition-shadow min-w-[150px]"
              aria-label="Filter by state"
            >
              <option value="all">All States ({states.length})</option>
              {states.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
            <select
              value={tierFilter}
              onChange={e => setTierFilter(e.target.value as CGWBClassification | 'all')}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-body-sm font-semibold text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent transition-shadow min-w-[160px]"
              aria-label="Filter by risk tier"
            >
              <option value="all">All Risk Tiers</option>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="glass-card rounded-2xl border border-white/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full" role="grid" aria-label="District risk alerts">
              <thead className="bg-slate-50/80 border-b border-slate-200/80">
                <tr>
                  <th scope="col" className="px-4 py-3.5 text-left text-caption font-bold text-ink-muted uppercase tracking-wider">
                    District
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-caption font-bold text-ink-muted uppercase tracking-wider hidden md:table-cell">
                    State
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-left text-caption font-bold text-ink-muted uppercase tracking-wider">
                    Classification
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right text-caption font-bold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('risk')}
                      className="inline-flex items-center justify-end gap-1 hover:text-accent font-bold transition-colors ml-auto"
                      aria-sort={sortField === 'risk' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Risk Score
                      <SortIcon field={sortField} direction={sortDirection} current="risk" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-right text-caption font-bold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('gwLevel')}
                      className="inline-flex items-center justify-end gap-1 hover:text-accent font-bold transition-colors ml-auto"
                      aria-sort={sortField === 'gwLevel' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      GW Level
                      <SortIcon field={sortField} direction={sortDirection} current="gwLevel" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center text-caption font-bold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('salinity')}
                      className="inline-flex items-center justify-center gap-1 hover:text-accent font-bold transition-colors mx-auto"
                      aria-sort={sortField === 'salinity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Salinity
                      <SortIcon field={sortField} direction={sortDirection} current="salinity" />
                    </button>
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center text-caption font-bold text-ink-muted uppercase tracking-wider hidden md:table-cell">
                    Extraction Trend
                  </th>
                  <th scope="col" className="px-4 py-3.5 text-center text-caption font-bold text-ink-muted uppercase tracking-wider hidden lg:table-cell">
                    <button
                      onClick={() => handleSort('updated')}
                      className="inline-flex items-center justify-center gap-1 hover:text-accent font-bold transition-colors mx-auto"
                      aria-sort={sortField === 'updated' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      Updated
                      <SortIcon field={sortField} direction={sortDirection} current="updated" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white/70">
                {filteredSorted.map((district, index) => (
                  <tr
                    key={district.id}
                    className="hover:bg-sky-50/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/district/${district.id}`)}
                    onKeyDown={e => { if (e.key === 'Enter') navigate(`/district/${district.id}`); }}
                    tabIndex={0}
                    role="row"
                    style={{ animationDelay: `${index * 15}ms` }}
                  >
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/district/${district.id}`}
                        className="font-bold text-body-sm text-ink-primary hover:text-accent transition-colors focus-visible:outline-none rounded"
                        onClick={e => e.stopPropagation()}
                      >
                        {district.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-body-sm text-ink-secondary hidden md:table-cell font-medium">
                      {district.state}
                    </td>
                    <td className="px-4 py-3.5">
                      <ClassificationBadge classification={district.cgwbClassification} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell font-mono tabular-nums text-body-sm font-black text-ink-primary">
                      {district.drawdownRiskScore}
                    </td>
                    <td className="px-4 py-3.5 text-right hidden lg:table-cell font-mono tabular-nums text-body-sm font-semibold text-ink-secondary">
                      {formatGwLevel(district.latestGwLevel)}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell">
                      {district.salinityRiskScoreDisplay !== undefined ? (
                        <SalinityRiskBadge score={district.salinityRiskScoreDisplay} size="sm" />
                      ) : (
                        <span className="text-ink-muted text-caption font-bold">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center hidden md:table-cell">
                      <ExtractionTrendBadge trend={district.extractionTrend} size="sm" />
                    </td>
                    <td className="px-4 py-3.5 text-center hidden lg:table-cell text-caption text-ink-muted font-medium">
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
              <div className="w-12 h-12 mx-auto text-ink-muted mb-3 text-3xl">🔍</div>
              <h3 className="text-display-sm font-bold text-ink-primary mb-1">No districts match filters</h3>
              <p className="text-body-sm text-ink-secondary">Try adjusting your search query or state selection</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-4 py-3.5 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-caption text-ink-muted bg-slate-50/50">
            <span className="font-semibold">Showing {filteredSorted.length} of {districts.length} monitoring stations</span>
            <span className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">INDIA-WRIS SYNCED</span>
              <span>Updated: {formatRelativeTime(districts[0]?.lastUpdated || new Date().toISOString())}</span>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

interface SortIconProps {
  field: SortField;
  direction: SortDirection;
  current: SortField;
}

function SortIcon({ field, direction, current }: SortIconProps) {
  if (field !== current) {
    return (
      <svg className="w-3.5 h-3.5 text-ink-muted inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M7 16l5-5 5 5" />
        <path d="M7 8l5 5 5-5" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-accent inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      {direction === 'asc' ? <path d="M7 16l5-5 5 5" /> : <path d="M7 8l5 5 5-5" />}
    </svg>
  );
}