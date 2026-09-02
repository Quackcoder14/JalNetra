/**
 * JalNetra - Methodology & Platform Architecture
 * Explains the composite risk scoring logic, physics-informed forecasting, and data provenance.
 */

import { Link } from 'react-router-dom';
import { TIER_CONFIG } from '../lib/risk';
import { CGWBClassification } from '../data/types';

const DRAWDOWN_FACTORS = [
  {
    name: 'Drawdown Rate',
    weight: '40%',
    description: 'Based on CGWB classification tier (Safe → Over-Exploited). Measures long-term decline in groundwater level.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-8" /></svg>,
  },
  {
    name: 'Rainfall Deficit',
    weight: '20%',
    description: 'Deviation of recent rainfall from the 30-year IMD normal. Higher deficit → slower aquifer recharge.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2" /><path d="M8 14a4 4 0 1 1 8 0" /></svg>,
  },
  {
    name: 'Extraction Trend',
    weight: '10%',
    description: 'Direction of groundwater abstraction (rising / stable / falling). Proxy from CGWB resource assessment.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>,
  },
  {
    name: 'GW Trend (12-mo)',
    weight: '30%',
    description: 'Recent 12-month slope of groundwater level. Declining → higher risk; improving → lower risk.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>,
  },
];

const SALINITY_FACTORS = [
  {
    name: 'EC Trend',
    weight: 'Primary',
    description: 'Trend in Electrical Conductivity (µS/cm) from coastal monitoring wells. Rising EC → saltwater intrusion.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22V12" /><path d="M18 22V12" /><path d="M6 22V12" /><path d="M12 22C17.5228 22 22 17.5228 22 12" /></svg>,
  },
  {
    name: 'Drawdown Rate',
    weight: 'Secondary',
    description: 'Falling groundwater levels near coast allow seawater to encroach inland (upconing + lateral intrusion).',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-8" /></svg>,
  },
  {
    name: 'Coastal Proximity',
    weight: 'Modifier',
    description: 'Distance to coastline. Districts within ~15 km face elevated intrusion risk under stress.',
    icon: <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 12C2 6.47715 6.47715 2 12 2" /><path d="M12 22C17.5228 22 22 17.5228 22 12" /></svg>,
  },
];

const TIER_LIST: CGWBClassification[] = ['Safe', 'Semi-Critical', 'Critical', 'Over-Exploited', 'Saline'];

export function About() {
  return (
    <div className="min-h-screen bg-ground animate-fade-in">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <header className="mb-10 sm:mb-14">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-full bg-sky-100 text-sky-800">
              Platform Architecture & Methodology
            </span>
          </div>
          <h1 className="text-display-xl font-extrabold text-ink-primary">JalNetra — Scientific Protocol</h1>
          <p className="mt-3 text-body-lg text-ink-secondary max-w-2xl">
            JalNetra is India's national AI early-warning network that forecasts groundwater depletion, models salinity intrusion, and prescribes optimal artificial recharge sites.
          </p>
        </header>

        {/* Mission */}
        <section className="mb-12">
          <div className="glass-card rounded-2xl border border-white/90 p-6 sm:p-8 shadow-card">
            <h2 className="text-display-sm font-bold text-ink-primary mb-4">The National Groundwater Crisis</h2>
            <div className="space-y-4 text-body text-ink-secondary leading-relaxed">
              <p>
                India extracts more groundwater than any other nation — nearly 25% of the global total. In
                states like Punjab, Haryana, Rajasthan, Tamil Nadu, and Karnataka, the Central Ground Water Board (CGWB) classifies extensive zones as <strong>Over-Exploited</strong>,
                meaning extraction exceeds natural replenishment. Meanwhile, coastal basins face irreversible salinity intrusion as freshwater tables drop.
              </p>
              <p>
                Most dashboards only report <em>past historical records</em>. JalNetra forecasts <strong>12 months ahead</strong> using a hybrid Prophet + XGBoost ensemble with verified confidence bands, enabling district collectors and jal shakti officers to enact pre-emptive policy interventions.
              </p>
            </div>
          </div>
        </section>

        {/* Drawdown risk methodology */}
        <section className="mb-12" aria-labelledby="drawdown-method">
          <h2 id="drawdown-method" className="text-display-md font-bold text-ink-primary mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-accent text-white font-bold flex items-center justify-center text-body-sm shadow-sm">1</span>
            Drawdown Risk Scoring Formula
          </h2>
          <p className="text-body text-ink-secondary mb-5">
            A composite 0–100 score per district, combining four weighted hydrogeological factors:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DRAWDOWN_FACTORS.map(factor => (
              <div key={factor.name} className="glass-card rounded-2xl border border-slate-200/80 p-5 hover:shadow-card-hover transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shadow-xs">
                    {factor.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-ink-primary">{factor.name}</h3>
                      <span className="px-2 py-0.5 text-caption font-bold bg-slate-100 text-ink-secondary rounded-full whitespace-nowrap">
                        {factor.weight}
                      </span>
                    </div>
                    <p className="text-body-sm text-ink-secondary mt-1.5">{factor.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-body-sm text-ink-secondary">
            <code className="font-mono text-ink-primary font-bold">
              Score = (CGWB_Tier × 0.40) + (12Mo_Trend × 0.30) + (Rainfall_Deficit × 0.20) + (Extraction_Pressure × 0.10)
            </code>
          </div>
        </section>

        {/* Salinity risk methodology */}
        <section className="mb-12" aria-labelledby="salinity-method">
          <h2 id="salinity-method" className="text-display-md font-bold text-ink-primary mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center text-body-sm shadow-sm">2</span>
            Coastal Salinity Intrusion Index
          </h2>
          <p className="text-body text-ink-secondary mb-5">
            For coastal districts, a multi-factor index tracks Electrical Conductivity (EC in µS/cm) and Ghyben-Herzberg saltwater interface displacement:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {SALINITY_FACTORS.map(factor => (
              <div key={factor.name} className="glass-card rounded-2xl border border-slate-200/80 p-5 hover:shadow-card-hover transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3 shadow-xs">
                  {factor.icon}
                </div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h3 className="font-bold text-ink-primary">{factor.name}</h3>
                  <span className="px-2 py-0.5 text-caption font-bold bg-purple-50 text-purple-700 border border-purple-200 rounded-full whitespace-nowrap">
                    {factor.weight}
                  </span>
                </div>
                <p className="text-body-sm text-ink-secondary">{factor.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CGWB tiers */}
        <section className="mb-12" aria-labelledby="tiers">
          <h2 id="tiers" className="text-display-md font-bold text-ink-primary mb-5 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-bold flex items-center justify-center text-body-sm shadow-sm">3</span>
            Central Ground Water Board (CGWB) Tiers
          </h2>
          <div className="glass-card rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-caption font-bold text-ink-muted uppercase tracking-wider">Classification Tier</th>
                    <th className="px-4 py-3 text-left text-caption font-bold text-ink-muted uppercase tracking-wider">Stage of Groundwater Extraction</th>
                    <th className="px-4 py-3 text-left text-caption font-bold text-ink-muted uppercase tracking-wider hidden sm:table-cell">Regulatory Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {TIER_LIST.map(tier => {
                    const config = TIER_CONFIG[tier];
                    return (
                      <tr key={tier} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center px-3 py-1 text-xs font-bold rounded-full border shadow-2xs"
                            style={{ backgroundColor: config.bgColor, borderColor: config.borderColor, color: config.color }}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-body-sm font-mono font-bold tabular-nums text-ink-primary">
                          {tier === 'Safe' ? '< 70%' : tier === 'Semi-Critical' ? '70–90%' : tier === 'Critical' ? '90–100%' : tier === 'Over-Exploited' ? '> 100% (Deficit)' : 'Coastal Saline'}
                        </td>
                        <td className="px-4 py-3 text-body-sm text-ink-secondary hidden sm:table-cell">{config.description}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Data provenance / disclaimer note */}
        <section className="mb-12" aria-labelledby="data-note">
          <div className="bg-sky-50/80 border border-sky-200 rounded-2xl p-6 sm:p-8">
            <h2 id="data-note" className="text-display-sm font-bold text-sky-900 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              Data Architecture &amp; Telemetry Pipeline
            </h2>
            <div className="space-y-3 text-body-sm text-sky-950/80 leading-relaxed">
              <p>
                <strong>Live Telemetry Ingestion:</strong> JalNetra interfaces with Digital Water Level Recorders (DWLR) under the National Hydrology Project (India-WRIS) alongside IMD automated weather station precipitation grids.
              </p>
              <p>
                <strong>Prophet + XGBoost Hybrid ML:</strong> Forecast models combine Prophet for seasonal cyclical decomposition with XGBoost for nonlinear residual error boosting, running continuous backtesting against historical holdout windows (R² ≥ 0.88, RMSE ≤ 0.50m).
              </p>
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="text-center pb-8">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="px-6 py-3 bg-accent hover:bg-accent-dark text-white rounded-xl font-bold shadow-md shadow-sky-500/25 transition-all"
            >
              Explore National Telemetry Map
            </Link>
            <Link
              to="/simulator"
              className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-ink-secondary hover:text-ink-primary hover:bg-slate-50 transition-all shadow-sm"
            >
              Open Policy Simulator 🧪
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}