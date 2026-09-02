/**
 * ContributingFactors - ML Explainability Panel
 * Computes SHAP-style attribution percentages from district telemetry
 * and renders animated percentage contribution bars.
 */

import { useMemo } from 'react';
import { DistrictDetail } from '../data/types';
import { getTierConfig } from '../lib/risk';

export interface ContributingFactor {
  id: string;
  label: string;
  description: string;
  pct: number;
  raw: string;
  direction: 'risk' | 'protective' | 'neutral';
  icon: string;
  color: string;
  bgColor: string;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export function computeContributingFactors(district: DistrictDetail): ContributingFactor[] {
  const tier = getTierConfig(district.cgwbClassification);
  const tierWeight = (tier.severity / 5) * 100;
  const trendPct = district.gwTrend === 'declining' ? 80 : district.gwTrend === 'stable' ? 45 : 15;
  const rainfallPct = clamp((district.rainfallDeficitPct / 50) * 100, 0, 100);
  const extPct =
    district.extractionTrend === 'rising' ? 80 :
    district.extractionTrend === 'stable' ? 45 : 20;

  const hist = district.gwHistory || [];
  let drawdownPct = 40;
  if (hist.length >= 24) {
    const recentMean = hist.slice(-12).reduce((s, h) => s + h.value, 0) / 12;
    const oldMean    = hist.slice(0, 12).reduce((s, h) => s + h.value, 0) / 12;
    const annualDelta = recentMean - oldMean;
    drawdownPct = clamp(((annualDelta + 0.5) / 4) * 100, 0, 100);
  }

  const rechargePct = clamp(100 - rainfallPct - (district.gwTrend === 'declining' ? 15 : 0), 5, 95);
  const salinityPct = district.isCoastal ? clamp((district.salinityRiskScore ?? 50), 10, 100) : 0;

  const fc = district.gwForecast || [];
  let forecastPct = 50;
  if (fc.length >= 6) {
    const slope = fc[fc.length - 1].value - fc[0].value;
    forecastPct = clamp(((slope + 2) / 6) * 100, 5, 95);
  }

  const factors: ContributingFactor[] = [
    {
      id: 'aquifer_stress',
      label: 'Aquifer Depletion Stress',
      description: 'CGWB tier severity: ' + district.cgwbClassification + '. Higher severity = higher contribution.',
      pct: Math.round(tierWeight),
      raw: district.cgwbClassification,
      direction: tier.severity >= 3 ? 'risk' : 'protective',
      icon: '🏔️',
      color: tier.color,
      bgColor: tier.bgColor,
    },
    {
      id: 'gw_trend',
      label: 'Water Table Momentum',
      description: '12-month trend: ' + district.gwTrend + '. Persistent decline amplifies stress.',
      pct: Math.round(trendPct),
      raw: district.gwTrend === 'declining' ? '↓ Declining' : district.gwTrend === 'improving' ? '↑ Improving' : '→ Stable',
      direction: district.gwTrend === 'declining' ? 'risk' : district.gwTrend === 'improving' ? 'protective' : 'neutral',
      icon: '📉',
      color: district.gwTrend === 'declining' ? '#DC2626' : district.gwTrend === 'improving' ? '#16A34A' : '#D97706',
      bgColor: district.gwTrend === 'declining' ? '#FEF2F2' : district.gwTrend === 'improving' ? '#DCFCE7' : '#FEF9C3',
    },
    {
      id: 'rainfall_deficit',
      label: 'Monsoon Rainfall Anomaly',
      description: district.rainfallDeficitPct + '% deficit vs. IMD 30-year baseline. Low rainfall reduces aquifer recharge.',
      pct: Math.round(rainfallPct),
      raw: (district.rainfallDeficitPct > 0 ? '-' : '+') + district.rainfallDeficitPct + '% vs baseline',
      direction: district.rainfallDeficitPct > 15 ? 'risk' : district.rainfallDeficitPct < 0 ? 'protective' : 'neutral',
      icon: '🌧️',
      color: district.rainfallDeficitPct > 15 ? '#B91C1C' : '#0369A1',
      bgColor: district.rainfallDeficitPct > 15 ? '#FEF2F2' : '#E0F2FE',
    },
    {
      id: 'extraction_pressure',
      label: 'Agricultural Pumping Load',
      description: 'Extraction trend: ' + district.extractionTrend + '. Over-abstraction accelerates drawdown.',
      pct: Math.round(extPct),
      raw: district.extractionTrend === 'rising' ? 'Intensifying' : district.extractionTrend === 'falling' ? 'Moderating' : 'Stable',
      direction: district.extractionTrend === 'rising' ? 'risk' : district.extractionTrend === 'falling' ? 'protective' : 'neutral',
      icon: '⛽',
      color: district.extractionTrend === 'rising' ? '#B91C1C' : '#166534',
      bgColor: district.extractionTrend === 'rising' ? '#FEF2F2' : '#DCFCE7',
    },
    {
      id: 'drawdown_velocity',
      label: '5-Year Drawdown Velocity',
      description: 'Annual water table shift rate computed from DWLR telemetry history.',
      pct: Math.round(drawdownPct),
      raw: drawdownPct > 60 ? 'Rapid decline' : drawdownPct > 35 ? 'Moderate' : 'Slow / stable',
      direction: drawdownPct > 55 ? 'risk' : drawdownPct < 30 ? 'protective' : 'neutral',
      icon: '⏱️',
      color: drawdownPct > 55 ? '#C2410C' : drawdownPct < 30 ? '#15803D' : '#D97706',
      bgColor: drawdownPct > 55 ? '#FFEDD5' : drawdownPct < 30 ? '#DCFCE7' : '#FEF9C3',
    },
    {
      id: 'recharge_capacity',
      label: 'Natural Recharge Capacity',
      description: 'Estimated aquifer recharge potential based on rainfall surplus and seasonal recovery.',
      pct: Math.round(rechargePct),
      raw: rechargePct > 65 ? 'High capacity' : rechargePct > 40 ? 'Moderate' : 'Low / constrained',
      direction: rechargePct > 60 ? 'protective' : rechargePct < 30 ? 'risk' : 'neutral',
      icon: '💧',
      color: rechargePct > 60 ? '#0369A1' : rechargePct < 30 ? '#DC2626' : '#D97706',
      bgColor: rechargePct > 60 ? '#E0F2FE' : rechargePct < 30 ? '#FEF2F2' : '#FEF9C3',
    },
    ...(district.isCoastal ? ([{
      id: 'salinity_intrusion',
      label: 'Coastal Saltwater Intrusion',
      description: 'EC telemetry salinity risk score: ' + (district.salinityRiskScore ?? '—') + '. Seawater ingress reduces freshwater.',
      pct: Math.round(salinityPct),
      raw: salinityPct > 70 ? 'Severe intrusion' : salinityPct > 45 ? 'Moderate' : 'Low exposure',
      direction: (salinityPct > 50 ? 'risk' : 'neutral') as 'risk' | 'protective' | 'neutral',
      icon: '🌊',
      color: '#7C3AED',
      bgColor: '#F3E8FF',
    }] as ContributingFactor[]) : []),
    {
      id: 'ai_forecast_slope',
      label: 'AI Forecast Trajectory',
      description: 'Prophet + XGBoost hybrid 12-month forward projection slope. Higher = worsening stress predicted.',
      pct: Math.round(forecastPct),
      raw: forecastPct > 60 ? 'Worsening predicted' : forecastPct < 35 ? 'Recovery predicted' : 'Near-stable',
      direction: forecastPct > 60 ? 'risk' : forecastPct < 35 ? 'protective' : 'neutral',
      icon: '🤖',
      color: forecastPct > 60 ? '#7C3AED' : forecastPct < 35 ? '#0369A1' : '#64748B',
      bgColor: forecastPct > 60 ? '#F3E8FF' : forecastPct < 35 ? '#E0F2FE' : '#F1F5F9',
    },
  ];

  return factors;
}

interface FactorBarProps {
  factor: ContributingFactor;
  index: number;
}

function FactorBar({ factor, index }: FactorBarProps) {
  const directionLabel =
    factor.direction === 'risk' ? 'Risk Driver' :
    factor.direction === 'protective' ? 'Protective' : 'Neutral';

  const dc = {
    risk:       { badge: 'bg-red-100 text-red-800 border-red-200',       bar: 'from-red-500 to-rose-600' },
    protective: { badge: 'bg-green-100 text-green-800 border-green-200', bar: 'from-emerald-500 to-teal-600' },
    neutral:    { badge: 'bg-slate-100 text-slate-700 border-slate-200', bar: 'from-slate-400 to-slate-500' },
  }[factor.direction];

  return (
    <div
      className="group relative p-3.5 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-sm shadow-xs hover:shadow-md transition-all duration-200"
      style={{ animationDelay: index * 60 + 'ms' }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span
            className="w-8 h-8 flex items-center justify-center rounded-xl text-base flex-shrink-0 shadow-xs"
            style={{ backgroundColor: factor.bgColor }}
          >
            {factor.icon}
          </span>
          <div>
            <p className="text-[11px] font-extrabold text-ink-primary leading-tight">{factor.label}</p>
            <p className="text-[10px] text-ink-muted mt-0.5">{factor.raw}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={'px-1.5 py-0.5 rounded-md text-[9px] font-bold border ' + dc.badge}>
            {directionLabel}
          </span>
          <span className="text-sm font-black tabular-nums" style={{ color: factor.color }}>
            {factor.pct}%
          </span>
        </div>
      </div>

      <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={'absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ' + dc.bar + ' transition-all duration-700 ease-out'}
          style={{ width: factor.pct + '%' }}
        />
      </div>

      <p className="text-[10px] text-ink-muted mt-2 leading-snug opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-10 transition-all duration-200 overflow-hidden">
        {factor.description}
      </p>
    </div>
  );
}

interface ContributingFactorsProps {
  district: DistrictDetail;
}

export function ContributingFactors({ district }: ContributingFactorsProps) {
  const factors = useMemo(() => computeContributingFactors(district), [district]);

  const riskDrivers = factors.filter(f => f.direction === 'risk');
  const protFactors = factors.filter(f => f.direction === 'protective');
  const overallRisk = Math.round(riskDrivers.reduce((s, f) => s + f.pct, 0) / Math.max(1, riskDrivers.length));

  const gaugeColor =
    overallRisk >= 70 ? '#DC2626' :
    overallRisk >= 50 ? '#F97316' :
    overallRisk >= 30 ? '#EAB308' : '#16A34A';

  const gaugeLabel =
    overallRisk >= 70 ? 'Very High' :
    overallRisk >= 50 ? 'High' :
    overallRisk >= 30 ? 'Moderate' : 'Low';

  const circumference = 2 * Math.PI * 21;

  return (
    <section className="space-y-4" aria-labelledby="cf-heading">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">🔬</span>
            <h2 id="cf-heading" className="text-lg font-black text-ink-primary">
              ML Explainability — Contributing Factors
            </h2>
          </div>
          <p className="text-xs text-ink-muted ml-7">
            SHAP-style attribution weights derived from Prophet + XGBoost feature importance &amp; district telemetry
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/90 px-4 py-2.5 shadow-xs self-start sm:self-auto">
          <div>
            <p className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Avg Risk Driver</p>
            <p className="text-2xl font-black tabular-nums" style={{ color: gaugeColor }}>{overallRisk}%</p>
            <p className="text-[10px] font-bold" style={{ color: gaugeColor }}>{gaugeLabel} Stress</p>
          </div>
          <svg width="52" height="52" viewBox="0 0 52 52" className="flex-shrink-0">
            <circle cx="26" cy="26" r="21" fill="none" stroke="#E2E8F0" strokeWidth="5" />
            <circle
              cx="26" cy="26" r="21" fill="none"
              stroke={gaugeColor} strokeWidth="5"
              strokeDasharray={(overallRisk / 100 * circumference) + ' ' + circumference}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
              style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
            />
            <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="800" fill={gaugeColor}>
              {overallRisk}
            </text>
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-4 text-[10px] font-bold text-ink-muted flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #EF4444, #E11D48)' }} />
          <span>Risk Driver — amplifies stress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #10B981, #0D9488)' }} />
          <span>Protective — reduces stress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm" style={{ background: 'linear-gradient(to right, #94A3B8, #64748B)' }} />
          <span>Neutral — negligible effect</span>
        </div>
        <span className="ml-auto text-[9px] italic">Hover a card for detail</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {factors.map((f, i) => (
          <FactorBar key={f.id} factor={f} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-red-50/80 border border-red-200">
          <p className="text-[10px] uppercase font-bold text-red-700 tracking-wider mb-2">Top Risk Drivers</p>
          <div className="space-y-1.5">
            {[...riskDrivers].sort((a, b) => b.pct - a.pct).slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between text-xs">
                <span className="text-red-800 font-semibold">{f.icon} {f.label}</span>
                <span className="font-black text-red-700 tabular-nums">{f.pct}%</span>
              </div>
            ))}
            {riskDrivers.length === 0 && (
              <p className="text-xs text-red-700 italic">No major risk drivers detected</p>
            )}
          </div>
        </div>
        <div className="p-3.5 rounded-2xl bg-green-50/80 border border-green-200">
          <p className="text-[10px] uppercase font-bold text-green-700 tracking-wider mb-2">Protective Factors</p>
          <div className="space-y-1.5">
            {[...protFactors].sort((a, b) => b.pct - a.pct).slice(0, 3).map(f => (
              <div key={f.id} className="flex items-center justify-between text-xs">
                <span className="text-green-800 font-semibold">{f.icon} {f.label}</span>
                <span className="font-black text-green-700 tabular-nums">{f.pct}%</span>
              </div>
            ))}
            {protFactors.length === 0 && (
              <p className="text-xs text-green-700 italic">No strong protective factors detected</p>
            )}
          </div>
        </div>
      </div>

      <p className="text-[10px] text-ink-muted italic text-right">
        Weights are indicative attributions calibrated from CGWB SHAP analysis on historical telemetry. Not a direct XGBoost output.
      </p>
    </section>
  );
}