/**
 * National Overview page - landing page with choropleth map, glassmorphic stats,
 * and double-click minimisable quick-info card.
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDistricts, useNationalStats, useRechargeRecommendations } from '../hooks/useMockData';
import { IndiaChoropleth } from '../components/map/IndiaChoropleth';
import { LayerToggle } from '../components/map/LayerToggle';
import { Legend } from '../components/map/Legend';
import { StatsStrip } from '../components/StatsStrip';
import { ClassificationBadge } from '../components/RiskBadge';
import { getTierColor } from '../lib/risk';

export function NationalOverview() {
  const { data: districts, loading: districtsLoading, error: districtsError } = useDistricts();
  const { data: stats, loading: statsLoading } = useNationalStats();
  const [activeLayer, setActiveLayer] = useState<'drawdown' | 'salinity'>('drawdown');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [isInfoMinimised, setIsInfoMinimised] = useState<boolean>(false);

  // Recharge sites for selected district (or pan-India priority sites if none selected)
  const activeDistrictForRecharge = selectedDistrict ?? 'all';
  const { data: rechargeData, visible: showRechargeSites, toggle: toggleRechargeSites } = useRechargeRecommendations(activeDistrictForRecharge);

  const handleDistrictClick = (id: string) => {
    setSelectedDistrict(id);
  };

  const handleDistrictDoubleClick = (id: string) => {
    if (selectedDistrict === id) {
      setIsInfoMinimised(prev => !prev);
    } else {
      setSelectedDistrict(id);
      setIsInfoMinimised(false);
    }
  };

  // Clear selection when layer changes
  useEffect(() => {
    setSelectedDistrict(null);
    setIsInfoMinimised(false);
  }, [activeLayer]);

  if (districtsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col items-center justify-center h-[500px] glass-card">
            <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin shadow-sm" />
            <p className="mt-4 text-body font-semibold text-ink-primary">Loading JalNetra Groundwater Telemetry…</p>
            <p className="text-caption text-ink-muted mt-1">Connecting to India-WRIS &amp; CGWB telemetry network</p>
          </div>
        </div>
      </div>
    );
  }

  if (districtsError) {
    return (
      <div className="min-h-screen bg-ground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="glass-card p-8 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100 shadow-sm">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4M12 16h.01" />
              </svg>
            </div>
            <h2 className="text-display-md font-bold text-ink-primary mb-2">Unable to Load Telemetry</h2>
            <p className="text-ink-secondary mb-5 text-body-sm">{districtsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl font-semibold shadow-md shadow-sky-500/25 transition-all"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedDistrictData = districts.find(d => d.id === selectedDistrict);

  return (
    <div className="min-h-screen bg-ground animate-fade-in">
      {/* Page Header */}
      <header className="bg-white/70 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_12px_-3px_rgba(15,41,66,0.04)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200/70 text-sky-800 text-[10px] font-extrabold uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Pan-India Surveillance Grid
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
                Groundwater Stress & Salinity Telemetry
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                Monitoring <strong>{stats?.totalDistricts ?? districts.length} stations</strong> across all 28 States & 8 Union Territories
              </p>
            </div>
            
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                onClick={toggleRechargeSites}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  showRechargeSites
                    ? 'bg-blue-600 text-white border-blue-700 shadow-sm shadow-blue-500/20'
                    : 'bg-white text-ink-secondary border-slate-200 hover:bg-slate-50 hover:text-ink-primary shadow-2xs'
                }`}
                title="Toggle artificial recharge candidate sites"
              >
                <span>🏗️</span>
                <span>{showRechargeSites ? 'Hide Recharge Sites' : 'Recharge Sites'}</span>
              </button>
              <LayerToggle activeLayer={activeLayer} onChange={setActiveLayer} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Stats Strip */}
        {stats && <StatsStrip stats={stats} />}

        {/* Map + Legend Grid */}
        <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          {/* Map Section */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            <IndiaChoropleth
              districts={districts}
              activeLayer={activeLayer}
              selectedDistrictId={selectedDistrict ?? undefined}
              onDistrictClick={handleDistrictClick}
              onDistrictDoubleClick={handleDistrictDoubleClick}
              isInfoMinimised={isInfoMinimised}
              rechargeCollection={rechargeData}
              showRechargeLayer={showRechargeSites}
            />

            {/* Selected District Quick Info Preview Card with double-click minimise toggle */}
            {selectedDistrictData && (
              isInfoMinimised ? (
                /* Minimised compact glass bar */
                <div
                  className="glass-card p-3 flex items-center justify-between gap-3 shadow-md border border-white hover:border-accent/40 cursor-pointer transition-all"
                  onDoubleClick={() => setIsInfoMinimised(false)}
                  title="Double-click to expand district details"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 border-2 border-white shadow-sm"
                      style={{ backgroundColor: getTierColor(selectedDistrictData.cgwbClassification) }}
                    />
                    <div>
                      <h4 className="font-bold text-ink-primary text-body-sm leading-none">
                        {selectedDistrictData.name}, {selectedDistrictData.state}
                      </h4>
                      <span className="text-[11px] text-ink-muted">
                        GW: {selectedDistrictData.latestGwLevel.toFixed(1)}m • {selectedDistrictData.cgwbClassification}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsInfoMinimised(false)}
                      className="px-3 py-1 bg-white hover:bg-sky-50 text-accent font-semibold text-caption rounded-lg border border-sky-200 transition-colors flex items-center gap-1"
                    >
                      <span>Expand Details</span>
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
                      </svg>
                    </button>
                    <Link
                      to={`/simulator/${selectedDistrictData.id}`}
                      className="px-3 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-semibold text-caption rounded-lg border border-sky-200 transition-colors flex items-center gap-1"
                    >
                      <span>🧪 Simulate</span>
                    </Link>
                    <Link
                      to={`/district/${selectedDistrictData.id}`}
                      className="px-3 py-1 bg-accent hover:bg-accent-dark text-white font-semibold text-caption rounded-lg transition-colors"
                    >
                      Open Analysis →
                    </Link>
                  </div>
                </div>
              ) : (
                /* Full expanded glass info card */
                <div
                  className="glass-card p-4 sm:p-5 shadow-card hover:shadow-card-hover transition-all border border-white/90"
                  onDoubleClick={() => setIsInfoMinimised(true)}
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-hairline mb-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md border-2 border-white"
                        style={{ backgroundColor: getTierColor(selectedDistrictData.cgwbClassification) }}
                      >
                        {selectedDistrictData.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-display-sm text-ink-primary">
                            {selectedDistrictData.name}
                          </h3>
                          <span className="text-body-sm font-semibold text-ink-muted">
                            ({selectedDistrictData.state})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <ClassificationBadge classification={selectedDistrictData.cgwbClassification} size="sm" />
                          {selectedDistrictData.isCoastal && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              🌊 Coastal Basin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Minimise toggle button */}
                    <button
                      onClick={() => setIsInfoMinimised(true)}
                      className="p-1.5 text-ink-muted hover:text-ink-primary hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors"
                      title="Minimise card (or double-click anywhere on card/marker)"
                      aria-label="Minimise info card"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14" />
                      </svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Latest GW Level</span>
                      <span className="text-body font-extrabold text-ink-primary tabular-nums">
                        {selectedDistrictData.latestGwLevel.toFixed(1)} m
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">GW Trend</span>
                      <span className="text-body font-semibold capitalize text-ink-secondary">
                        {selectedDistrictData.gwTrend}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Extraction</span>
                      <span className="text-body font-semibold capitalize text-ink-secondary">
                        {selectedDistrictData.extractionTrend}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/70 border border-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">Rainfall Deficit</span>
                      <span className="text-body font-extrabold text-ink-primary tabular-nums">
                        {selectedDistrictData.rainfallDeficitPct}%
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                    <p className="text-caption text-ink-muted">
                      💡 <strong>Tip:</strong> Double-click the map point or card to minimise
                    </p>
                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <Link
                        to={`/simulator/${selectedDistrictData.id}`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-sky-50 hover:bg-sky-100 text-sky-800 font-semibold text-body-sm rounded-xl border border-sky-200 transition-all"
                      >
                        <span>🧪 Policy Simulator</span>
                      </Link>
                      <Link
                        to={`/district/${selectedDistrictData.id}`}
                        className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-dark text-white font-semibold text-body-sm rounded-xl shadow-md shadow-sky-500/20 transition-all"
                      >
                        <span>Explore Full Forecast</span>
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Legend & Summary Sidebar */}
          <aside className="lg:col-span-1 flex flex-col gap-4">
            <Legend activeLayer={activeLayer} className="sticky top-20" />

            {/* Quick stats for active layer */}
            <div className="glass-card p-4 shadow-elevated">
              <h3 className="text-body-sm font-bold text-ink-primary mb-3 flex items-center justify-between pb-2 border-b border-hairline">
                <span>Layer Breakdown</span>
                <span className="text-caption font-semibold text-accent">Active Risk</span>
              </h3>
              <dl className="space-y-2.5 text-body-sm">
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                  <dt className="text-ink-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('Over-Exploited') }} />
                    <span>Over-Exploited</span>
                  </dt>
                  <dd className="font-bold text-red-600 tabular-nums">
                    {districts.filter(d => d.cgwbClassification === 'Over-Exploited').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                  <dt className="text-ink-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('Critical') }} />
                    <span>Critical</span>
                  </dt>
                  <dd className="font-bold text-orange-600 tabular-nums">
                    {districts.filter(d => d.cgwbClassification === 'Critical').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                  <dt className="text-ink-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('Semi-Critical') }} />
                    <span>Semi-Critical</span>
                  </dt>
                  <dd className="font-bold text-yellow-600 tabular-nums">
                    {districts.filter(d => d.cgwbClassification === 'Semi-Critical').length}
                  </dd>
                </div>
                <div className="flex items-center justify-between p-1.5 rounded-lg hover:bg-white/60 transition-colors">
                  <dt className="text-ink-secondary flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('Safe') }} />
                    <span>Safe</span>
                  </dt>
                  <dd className="font-bold text-green-600 tabular-nums">
                    {districts.filter(d => d.cgwbClassification === 'Safe').length}
                  </dd>
                </div>
                {activeLayer === 'salinity' && (
                  <div className="flex items-center justify-between p-1.5 rounded-lg border-t border-hairline pt-2.5">
                    <dt className="text-ink-secondary flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getTierColor('Saline') }} />
                      <span>Saline Coastal</span>
                    </dt>
                    <dd className="font-bold text-purple-700 tabular-nums">
                      {districts.filter(d => d.cgwbClassification === 'Saline').length}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Data Source */}
            <div className="glass-card p-3.5 border border-sky-200/80 bg-sky-50/50">
              <p className="text-caption text-sky-900 leading-relaxed">
                <strong className="font-bold text-sky-950">📡 Prophet + XGBoost AI Hybrid Engine:</strong> 12-month groundwater level predictions combining Prophet seasonal trends with XGBoost residual boosting and 95% confidence intervals.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}