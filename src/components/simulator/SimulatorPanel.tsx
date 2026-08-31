/**
 * SimulatorPanel — Side-by-Side Layout
 * LEFT: Scenario presets + interactive policy lever sliders
 * RIGHT: 12-month drawdown chart + impact summary (visible without scrolling)
 */

import { useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { SimulationResult } from '../../data/types';
import { TIER_CONFIG } from '../../lib/risk';

// ─── Slider Row ───────────────────────────────────────────────────────────────

interface SliderRowProps {
  id: string;
  label: string;
  explanation: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: string;
  positiveIsGood: boolean;
  onChange: (v: number) => void;
}

function SliderRow({
  id, label, explanation, value, min, max, step, unit,
  icon, positiveIsGood, onChange,
}: SliderRowProps) {
  const neutral = value === 0;
  const good = positiveIsGood ? value > 0 : value < 0 && !neutral;
  const accentColor = neutral ? '#64748B' : good ? '#16A34A' : '#DC2626';
  const bgColor = neutral ? '#F1F5F9' : good ? '#DCFCE7' : '#FEF2F2';
  const borderColor = neutral ? '#CBD5E1' : good ? '#86EFAC' : '#FCA5A5';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="flex items-center gap-1.5 text-body-sm font-bold text-ink-primary">
          <span className="text-base">{icon}</span>
          <span>{label}</span>
        </label>
        <span
          className="tabular-nums text-xs font-extrabold px-2 py-0.5 rounded-full border"
          style={{ color: accentColor, backgroundColor: bgColor, borderColor }}
        >
          {value > 0 ? '+' : ''}{value}{unit}
        </span>
      </div>
      <p className="text-[11px] text-ink-muted leading-tight -mt-0.5">{explanation}</p>
      <input
        id={id}
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-2 appearance-none rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/40 bg-slate-200"
        style={{ accentColor }}
      />
      <div className="flex justify-between text-[10px] font-medium text-ink-muted">
        <span>{min}{unit}</span>
        <span className="text-ink-tertiary">Baseline</span>
        <span>{max > 0 ? '+' : ''}{max}{unit}</span>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function SimTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const baseline = Number(d?.baseline ?? 0);
  const simulated = Number(d?.simulated ?? 0);
  const delta = Number(d?.delta ?? 0);
  const isRecovery = delta <= 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-elevated min-w-[195px]">
      <p className="text-[11px] font-bold text-ink-primary border-b border-hairline pb-1.5 mb-1.5">
        🗓️ {d?.month}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Baseline Depth</span>
          <span className="font-semibold text-slate-700">{baseline.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-sky-600 font-semibold">With Policy</span>
          <span className="font-bold text-sky-700">{simulated.toFixed(2)} m</span>
        </div>
        <div className="flex justify-between gap-4 pt-1 border-t border-hairline font-bold">
          <span className="text-ink-secondary">Net Effect</span>
          <span className={isRecovery ? 'text-green-700' : 'text-red-600'}>
            {isRecovery ? `+${Math.abs(delta).toFixed(2)} m gain` : `−${delta.toFixed(2)} m drop`}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────

interface SimulatorPanelProps {
  districtId: string;
  input: { rainfall_delta_pct: number; extraction_delta_pct: number; recharge_structures_added: number };
  setInput: (v: any) => void;
  result: SimulationResult | null;
  loading: boolean;
}

export function SimulatorPanel({
  districtId: _districtId, input, setInput, result, loading,
}: SimulatorPanelProps) {
  const update = useCallback(
    (key: string) => (v: number) => setInput((prev: any) => ({ ...prev, [key]: v })),
    [setInput]
  );

  const preset = (rain: number, ext: number, dams: number) =>
    setInput({ rainfall_delta_pct: rain, extraction_delta_pct: ext, recharge_structures_added: dams });

  const chartData = result?.months.map(m => ({
    month: m.month.slice(0, 7),
    baseline: m.baseline,
    simulated: m.simulated,
    delta: m.delta,
  })) ?? [];

  const simConfig = result ? TIER_CONFIG[result.simulated_classification] : null;
  const origConfig = result ? TIER_CONFIG[result.original_classification] : null;
  const avgDelta = result?.summary.avg_delta_m ?? 0;
  const isNetPositive = avgDelta <= 0;
  const hasChange = result?.summary.classification_changed;

  return (
    /* ── TWO-COLUMN GRID: controls | chart ── */
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-4 items-start">

      {/* ════ LEFT COLUMN — Controls ════ */}
      <div className="space-y-3">

        {/* Scenario Presets */}
        <div className="glass-card p-3.5">
          <p className="text-caption font-bold text-ink-primary mb-2 flex items-center gap-1.5">
            ⚡ <span>Quick Scenarios</span>
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: '🏛️ Jal Shakti Drive', sub: '+15% Rain, −20% Pump, 10 dams', fn: () => preset(15, -20, 10), cls: 'bg-green-50 border-green-200 text-green-900 hover:bg-green-100' },
              { label: '🌾 Drip Irrigation', sub: '−25% Pump, 4 dams', fn: () => preset(0, -25, 4), cls: 'bg-sky-50 border-sky-200 text-sky-900 hover:bg-sky-100' },
              { label: '☀️ Drought Shock', sub: '−30% Rain, +20% Pump', fn: () => preset(-30, 20, 0), cls: 'bg-red-50 border-red-200 text-red-900 hover:bg-red-100' },
              { label: '🔄 Reset Baseline', sub: 'Current Status Quo', fn: () => preset(0, 0, 0), cls: 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200' },
            ].map(({ label, sub, fn, cls }) => (
              <button key={label} onClick={fn}
                className={`p-2 border rounded-lg text-left transition-all ${cls}`}>
                <span className="text-[11px] font-bold block">{label}</span>
                <span className="text-[10px] opacity-80">{sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Levers */}
        <div className="glass-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink-primary text-body-sm">Policy Levers</h3>
            {loading && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
                <span className="w-2 h-2 rounded-full border-2 border-sky-600 border-t-transparent animate-spin" />
                Computing…
              </span>
            )}
          </div>

          <SliderRow
            id="rainfall-slider"
            label="Monsoon Rainfall"
            explanation="Surplus or deficit vs 30-year baseline"
            value={input.rainfall_delta_pct}
            min={-50} max={50} step={5} unit="%"
            icon="🌧️" positiveIsGood={true}
            onChange={update('rainfall_delta_pct')}
          />
          <SliderRow
            id="extraction-slider"
            label="Tubewell Pumping Rate"
            explanation="Agricultural extraction intensity change"
            value={input.extraction_delta_pct}
            min={-30} max={50} step={5} unit="%"
            icon="⛽" positiveIsGood={false}
            onChange={update('extraction_delta_pct')}
          />
          <SliderRow
            id="recharge-slider"
            label="Check Dams & Recharge Tanks"
            explanation="New rainwater harvesting structures built"
            value={input.recharge_structures_added}
            min={0} max={20} step={1} unit=" units"
            icon="🏗️" positiveIsGood={true}
            onChange={update('recharge_structures_added')}
          />
        </div>

        {/* Impact Summary Card (shown once result available) */}
        {result && (
          <div className={`p-3.5 rounded-xl border-2 ${isNetPositive ? 'bg-emerald-50 border-emerald-300' : 'bg-red-50 border-red-300'}`}>
            <div className="flex items-start gap-2.5">
              <span className="text-2xl mt-0.5">{isNetPositive ? '💧' : '⚠️'}</span>
              <div>
                <p className={`font-extrabold text-body-sm ${isNetPositive ? 'text-emerald-900' : 'text-red-900'}`}>
                  {isNetPositive
                    ? `Water table recovers by +${Math.abs(avgDelta).toFixed(2)} m on average`
                    : `Water table drops an extra −${Math.abs(avgDelta).toFixed(2)} m on average`}
                </p>
                <p className={`text-[11px] mt-0.5 ${isNetPositive ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isNetPositive
                    ? `Est. ${(Math.abs(avgDelta) * 1.4).toFixed(1)} billion litres of aquifer storage protected`
                    : 'Increased well-failure risk for farming & domestic supply'}
                </p>

                {hasChange && origConfig && simConfig && (
                  <div className="mt-2 flex items-center gap-2 text-[11px] font-bold">
                    <span style={{ color: origConfig.color }}>{result.original_classification}</span>
                    <span className="text-ink-muted">➔</span>
                    <span style={{ color: simConfig.color }}>{result.simulated_classification}</span>
                    <span className="text-ink-muted font-normal">(status change!)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ════ RIGHT COLUMN — Chart + Metric Chips ════ */}
      <div className="glass-card p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <div>
            <h3 className="font-extrabold text-ink-primary text-body">12-Month Water Table Trajectory</h3>
            <p className="text-caption text-ink-muted">
              Grey dashed = Status Quo Baseline &nbsp;·&nbsp; Blue = Simulated with Policy (mbgl depth)
            </p>
          </div>
          {result && (
            <span className={`px-2.5 py-1 rounded-full text-caption font-bold border flex-shrink-0 ${
              isNetPositive ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'
            }`}>
              Avg {isNetPositive ? '+' : '−'}{Math.abs(avgDelta).toFixed(2)} m
            </span>
          )}
        </div>

        {/* Chart */}
        {result ? (
          <>
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 6, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={v => v.slice(5)}
                    interval={1}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#94A3B8' }}
                    tickFormatter={v => `${v}m`}
                    width={42}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<SimTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 10, fontSize: 11 }} />
                  <Line
                    type="monotone"
                    dataKey="baseline"
                    name="Baseline (No Action)"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 2.5, fill: '#94A3B8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="simulated"
                    name="Simulated (With Policy)"
                    stroke="#0284C7"
                    strokeWidth={3}
                    dot={{ r: 3.5, fill: '#0284C7' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Bottom metric chips */}
            <div className="mt-3 pt-3 border-t border-hairline grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Avg Shift</p>
                <p className={`text-body-sm font-black tabular-nums mt-0.5 ${isNetPositive ? 'text-green-700' : 'text-red-600'}`}>
                  {isNetPositive ? '+' : '−'}{Math.abs(avgDelta).toFixed(2)} m
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Peak Gain</p>
                <p className="text-body-sm font-black tabular-nums text-green-700 mt-0.5">
                  +{result.summary.max_improvement_m.toFixed(2)} m
                </p>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] uppercase font-bold text-ink-muted tracking-wider">Risk Tier</p>
                <p className="text-body-sm font-black mt-0.5" style={{ color: simConfig?.color }}>
                  {result.simulated_classification}
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Placeholder while first simulation loads */
          <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-ink-muted">
            <div className="w-10 h-10 border-[3px] border-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-body-sm font-semibold">Generating forecast curve…</p>
          </div>
        )}
      </div>
    </div>
  );
}
