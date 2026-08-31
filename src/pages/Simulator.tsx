/**
 * Simulator Page - Intuitive Groundwater Policy & What-If Simulator
 * Side-by-side layout: Controls on Left, Graph & Real-Time Impact adjacent on Right.
 */

import { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDistricts, useSimulator, useBacktest } from '../hooks/useMockData';
import { SimulatorPanel } from '../components/simulator/SimulatorPanel';
import { BacktestModal } from '../components/simulator/BacktestModal';
import { ClassificationBadge } from '../components/RiskBadge';

export function Simulator() {
  const { id: paramId } = useParams<{ id?: string }>();
  const { data: districts, loading: distLoading } = useDistricts();
  const [selectedId, setSelectedId] = useState<string>(paramId ?? '');

  // Select initial district once loaded
  useMemo(() => {
    if (!selectedId && districts.length > 0) {
      if (paramId) {
        const found = districts.find(d => d.id === paramId || d.id.includes(paramId) || paramId.includes(d.id));
        setSelectedId(found ? found.id : districts[0].id);
      } else {
        setSelectedId(districts[0].id);
      }
    }
  }, [districts, paramId, selectedId]);

  const selected = districts.find(d => d.id === selectedId) || districts[0];
  const { data: simResult, loading: simLoading, input, setInput } = useSimulator(selected?.id);
  const { data: btResult, loading: btLoading, triggered: btTriggered, trigger: btTrigger } = useBacktest(selected?.id);

  if (distLoading || !selected) {
    return (
      <div className="min-h-screen bg-ground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-body font-semibold text-ink-primary">Loading Groundwater Policy Simulator…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ground pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <header className="bg-white/80 backdrop-blur-md border-b border-white/90 shadow-[0_2px_15px_-3px_rgba(15,41,66,0.04)] sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Link to="/" className="flex items-center gap-1 text-caption font-bold text-ink-secondary hover:text-accent transition-colors">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                  Overview
                </Link>
                <span className="text-ink-muted">/</span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-sky-100 text-sky-900 text-[11px] font-bold">
                  🧪 Policy Simulator
                </span>
              </div>
              <h1 className="text-display-lg font-black text-ink-primary tracking-tight">
                Groundwater Stress & Policy Simulator
              </h1>
            </div>

            {/* Quick district badge & drilldown button */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <ClassificationBadge classification={selected.cgwbClassification} size="sm" />
              {selected.isCoastal && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-bold bg-purple-50 text-purple-700 border border-purple-200">
                  🌊 Coastal
                </span>
              )}
              <Link
                to={`/district/${selected.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-accent hover:bg-accent-dark text-white font-bold text-body-sm rounded-xl shadow-sm transition-all"
              >
                <span>View Full Analysis →</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Layout ── */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* District Selector Bar */}
        <div className="glass-card p-3.5 sm:p-4 border border-white/90 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="district-select" className="block text-[11px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                Select District to Simulate
              </label>
              <select
                id="district-select"
                value={selected.id}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-ink-primary shadow-xs focus:outline-none focus:ring-2 focus:ring-accent transition-shadow"
                style={{ maxWidth: '100%' }}
              >
                {districts.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.state}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick stats — compact row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Depth</span>
                <span className="text-sm font-black text-ink-primary tabular-nums">{selected.latestGwLevel.toFixed(1)} m</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Trend</span>
                <span className="text-sm font-bold text-ink-secondary capitalize">{selected.gwTrend}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Deficit</span>
                <span className="text-sm font-black text-ink-primary tabular-nums">{selected.rainfallDeficitPct}%</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-xl border border-slate-200/70 text-center">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Pumping</span>
                <span className="text-sm font-bold text-ink-secondary capitalize">{selected.extractionTrend}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Interactive Side-by-Side Simulator (Controls Left • Graph Adjacent Right) ── */}
        <SimulatorPanel
          districtId={selected.id}
          input={input}
          setInput={setInput}
          result={simResult}
          loading={simLoading}
        />

        {/* ── Model Accuracy Backtesting Section ── */}
        <BacktestModal
          districtId={selected.id}
          result={btResult}
          loading={btLoading}
          triggered={btTriggered}
          onTrigger={btTrigger}
        />
      </main>
    </div>
  );
}
