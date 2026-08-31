/**
 * JalNetra - District Drill-Down Analytics Page
 * High-precision, bulletproof telemetry and AI forecast view for any district.
 * Full mobile responsiveness, safe fallbacks, and zero chance of blank screens.
 */

import { useParams, Link } from 'react-router-dom';
import { useDistrict, useRechargeRecommendations } from '../hooks/useMockData';
import { ForecastChart } from '../components/charts/ForecastChart';
import { ClassificationBadge, ExtractionTrendBadge, GwTrendBadge, SalinityRiskBadge } from '../components/RiskBadge';
import { prepareChartData, formatGwLevel, formatPercent, formatRelativeTime } from '../lib/format';
import { computeDrawdownRiskScore, computeSalinityRiskScore } from '../lib/risk';

export function DistrictDrillDown() {
  const { id } = useParams<{ id: string }>();
  const { data: district, loading, error, refresh } = useDistrict(id);
  const { data: rechargeData, visible: showRecharge, toggle: toggleRecharge, load: loadRecharge } = useRechargeRecommendations(district?.id || id || 'sangrur');

  if (loading) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl max-w-sm w-full text-center border border-white/90 shadow-md">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-body font-bold text-ink-primary">Loading District Telemetry…</h3>
          <p className="text-caption text-ink-muted mt-1">Retrieving CGWB historical logs & AI forecast curves</p>
        </div>
      </div>
    );
  }

  if (error || !district) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center p-4">
        <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center border border-white/90 shadow-md">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-display-md font-bold text-ink-primary mb-2">District Data Unavailable</h2>
          <p className="text-ink-secondary text-body-sm mb-6">{error || 'Unable to retrieve station telemetry records'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => refresh()}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-ink-primary rounded-xl text-xs font-bold transition-colors"
            >
              Retry Sync
            </button>
            <Link
              to="/"
              className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
            >
              Back to Overview Map
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const gwHistory = district.gwHistory || [];
  const gwForecast = district.gwForecast || [];
  const ecHistory = district.ecHistory;
  const ecForecast = district.ecForecast;

  const chartData = prepareChartData(gwHistory, gwForecast);
  const ecChartData = district.isCoastal && ecHistory && ecForecast ? prepareChartData(ecHistory, ecForecast) : null;

  const drawdownRiskScore = computeDrawdownRiskScore(district);
  const salinityRiskScore = computeSalinityRiskScore(district);

  const riskLevel = drawdownRiskScore >= 70 ? 'Very High' : drawdownRiskScore >= 50 ? 'High' : drawdownRiskScore >= 30 ? 'Moderate' : 'Low';
  const riskColor = drawdownRiskScore >= 70 ? '#DC2626' : drawdownRiskScore >= 50 ? '#F97316' : drawdownRiskScore >= 30 ? '#EAB308' : '#16A34A';

  return (
    <div className="min-h-screen bg-ground page-enter pb-16">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-16 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink-secondary hover:text-ink-primary text-xs font-bold transition-colors"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Overview Map</span>
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-bold text-ink-muted">{district.state}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to={`/simulator/${district.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-700 hover:to-cyan-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                <span>🧪 Policy Simulator</span>
              </Link>
              <ClassificationBadge classification={district.cgwbClassification} size="md" />
              {district.isCoastal && (
                <SalinityRiskBadge score={salinityRiskScore} size="md" />
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-ink-primary tracking-tight">
                {district.name}
              </h1>
              <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">
                {district.state} District • Station Coordinates: {district.lat.toFixed(4)}°N, {district.lng.toFixed(4)}°E
              </p>
            </div>
            <span className="text-[11px] text-ink-muted font-medium">
              Last Telemetry Ping: {formatRelativeTime(district.lastUpdated)}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="glass-card p-4 rounded-2xl border border-white/90 shadow-xs">
            <p className="text-[11px] text-ink-muted font-extrabold uppercase tracking-wider mb-1">Drawdown Risk</p>
            <p className="text-3xl font-black tabular-nums" style={{ color: riskColor }}>{drawdownRiskScore}</p>
            <p className="text-xs font-bold mt-1" style={{ color: riskColor }}>{riskLevel} Risk Zone</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-white/90 shadow-xs">
            <p className="text-[11px] text-ink-muted font-extrabold uppercase tracking-wider mb-1">Current GW Depth</p>
            <p className="text-3xl font-black tabular-nums text-ink-primary">{formatGwLevel(district.latestGwLevel)}</p>
            <div className="mt-1">
              <GwTrendBadge trend={district.gwTrend} size="sm" />
            </div>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-white/90 shadow-xs">
            <p className="text-[11px] text-ink-muted font-extrabold uppercase tracking-wider mb-1">Rainfall Anomaly</p>
            <p className="text-3xl font-black tabular-nums text-ink-primary">{formatPercent(district.rainfallDeficitPct)}</p>
            <p className="text-[11px] text-ink-muted mt-1 font-medium">vs 30-year IMD baseline</p>
          </div>
          <div className="glass-card p-4 rounded-2xl border border-white/90 shadow-xs">
            <p className="text-[11px] text-ink-muted font-extrabold uppercase tracking-wider mb-1">Pumping Pressure</p>
            <div className="mt-2">
              <ExtractionTrendBadge trend={district.extractionTrend} size="md" />
            </div>
          </div>
        </div>

        {/* Groundwater Depth Chart */}
        <section aria-labelledby="gw-chart-title">
          <ForecastChart
            data={chartData}
            title="12-Month Groundwater Level Trajectory"
            yLabel="Depth below ground level"
            unit="m"
            height={360}
          />
        </section>

        {/* Contributing Factors Grid */}
        <section aria-labelledby="factors-title">
          <h2 id="factors-title" className="text-lg font-black text-ink-primary mb-3">
            Hydrogeological Contributing Factors
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <FactorCard
              label="Rainfall Deficit"
              value={formatPercent(district.rainfallDeficitPct)}
              description={district.rainfallDeficitPct > 20
                ? 'Severe deficit slows seasonal natural replenishment'
                : district.rainfallDeficitPct > 0
                  ? 'Moderate deficit below 30-year historical mean'
                  : 'Monsoon surplus aids active aquifer recovery'}
              trend={district.rainfallDeficitPct > 10 ? 'negative' : district.rainfallDeficitPct > 0 ? 'caution' : 'positive'}
              icon="🌧️"
            />
            <FactorCard
              label="12-Month GW Slope"
              value={district.gwTrend === 'declining' ? 'Declining' : district.gwTrend === 'improving' ? 'Improving' : 'Stable'}
              description={district.gwTrend === 'declining'
                ? 'Persistent water table drop over past 12 months'
                : district.gwTrend === 'improving'
                  ? 'Post-monsoon water table recharge observed'
                  : 'Aquifer maintains stable equilibrium'}
              trend={district.gwTrend === 'declining' ? 'negative' : district.gwTrend === 'improving' ? 'positive' : 'neutral'}
              icon="📉"
            />
            <FactorCard
              label="Extraction Pressure"
              value={district.extractionTrend === 'rising' ? 'Intensifying' : district.extractionTrend === 'falling' ? 'Moderating' : 'Stable'}
              description={district.extractionTrend === 'rising'
                ? 'Heavy agricultural / industrial tubewell pumping'
                : district.extractionTrend === 'falling'
                  ? 'Lower seasonal groundwater abstraction'
                  : 'Constant baseline abstraction'}
              trend={district.extractionTrend === 'rising' ? 'negative' : district.extractionTrend === 'falling' ? 'positive' : 'neutral'}
              icon="⛽"
            />
            <FactorCard
              label={district.isCoastal ? 'Coastal Proximity' : 'Aquifer Geology'}
              value={district.isCoastal ? 'Coastal Aquifer' : 'Inland Alluvial / Hard Rock'}
              description={district.isCoastal
                ? 'Proximity to sea elevates saltwater intrusion risk'
                : 'Semi-confined deep formation with limited natural recharge'}
              trend={district.isCoastal ? 'caution' : 'neutral'}
              icon={district.isCoastal ? '🌊' : '🪨'}
            />
          </div>
        </section>

        {/* Coastal Salinity Chart if coastal */}
        {district.isCoastal && ecChartData && (
          <section aria-labelledby="ec-chart-title">
            <ForecastChart
              data={ecChartData}
              title="Coastal Salinity (Electrical Conductivity) Forecast"
              yLabel="Electrical Conductivity (EC)"
              unit="µS/cm"
              height={360}
            />
          </section>
        )}

        {/* Artificial Recharge Recommendations */}
        <section className="glass-card p-4 sm:p-6 rounded-2xl border border-white/90 shadow-sm" aria-labelledby="recharge-title">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 id="recharge-title" className="text-base sm:text-lg font-black text-ink-primary flex items-center gap-2">
                <span>🏗️</span>
                <span>Artificial Recharge Site Recommendations ({district.name})</span>
              </h3>
              <p className="text-xs text-ink-secondary mt-0.5">
                GIS-prioritized candidate locations for check dams, percolation tanks, and recharge shafts
              </p>
            </div>
            <button
              onClick={() => {
                if (!rechargeData) loadRecharge();
                toggleRecharge();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto"
            >
              <span>{showRecharge ? 'Collapse Sites ▲' : 'Explore Candidate Sites ▼'}</span>
            </button>
          </div>

          {showRecharge && rechargeData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {rechargeData.features.map((feat, idx) => {
                const p = feat.properties;
                const isHigh = p.priority === 'High';
                return (
                  <div
                    key={p.block_id || idx}
                    className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 mb-2">
                      <div>
                        <h4 className="font-bold text-xs text-ink-primary">{p.block_name}</h4>
                        <span className="text-[10px] text-ink-muted font-mono">{feat.geometry.coordinates[1].toFixed(3)}°N, {feat.geometry.coordinates[0].toFixed(3)}°E</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isHigh ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {p.priority} Priority
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px] p-2 bg-slate-50 rounded-lg mb-2">
                      <div>
                        <span className="text-ink-muted block text-[10px]">Type</span>
                        <span className="font-bold text-ink-primary">{p.structure_type}</span>
                      </div>
                      <div>
                        <span className="text-ink-muted block text-[10px]">Slope</span>
                        <span className="font-bold text-ink-primary">{p.slope_pct}%</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-secondary leading-relaxed">
                      <strong>GIS Rule:</strong> {p.rationale}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

interface FactorCardProps {
  label: string;
  value: string;
  description: string;
  trend: 'positive' | 'negative' | 'caution' | 'neutral';
  icon: string;
}

function FactorCard({ label, value, description, trend, icon }: FactorCardProps) {
  const trendStyles = {
    positive: { color: '#16A34A', bg: '#DCFCE7' },
    negative: { color: '#DC2626', bg: '#FEF2F2' },
    caution: { color: '#CA8A04', bg: '#FEF9C3' },
    neutral: { color: '#64748B', bg: '#F1F5F9' },
  };

  const style = trendStyles[trend];

  return (
    <div className="glass-card rounded-2xl border border-white/90 p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: style.bg }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-ink-muted font-extrabold uppercase tracking-wider">{label}</p>
          <p className="text-sm font-bold text-ink-primary mt-0.5">{value}</p>
          <p className="text-[11px] text-ink-secondary mt-1 leading-snug">{description}</p>
        </div>
      </div>
    </div>
  );
}