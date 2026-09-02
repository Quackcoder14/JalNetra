/**
 * Forecast chart component using Recharts.
 * Shows historical data + forecast with confidence band and clear boundary marker.
 *
 * KEY FIX: All series share ONE unified dataset (combinedData) with separate
 * dataKeys: historicalValue, forecastValue, upper, lower.
 * Per-<Line> data props always start at x=0, so the forecast line was rendering
 * over the historical region. Using shared data + null-gapped dataKeys fixes this.
 */

import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { ChartDataPoint } from '../../lib/format';
import { formatGwLevel, formatMonthDisplay, formatEc } from '../../lib/format';
import { useEffect, useState, useMemo } from 'react';

interface ForecastChartProps {
  data: ChartDataPoint[];
  title: string;
  yLabel: string;
  unit: 'm' | 'µS/cm';
  height?: number;
  showLegend?: boolean;
  animate?: boolean;
}

/** Unified row fed into ComposedChart — all series share this array */
interface UnifiedPoint {
  month: string;
  displayMonth: string;
  /** Set for historical ticks; null for pure-forecast ticks */
  historicalValue: number | null;
  /** Set for forecast ticks (+ bridge vertex on the last historical tick); null otherwise */
  forecastValue: number | null;
  /** 95% CI upper bound — only on forecast ticks */
  upper: number | null;
  /** 95% CI lower bound — only on forecast ticks */
  lower: number | null;
  isForecast: boolean;
  isBoundary?: boolean;
}

export function ForecastChart({
  data,
  title,
  yLabel,
  unit,
  height = 360,
  showLegend = true,
  animate: _animate = true,
}: ForecastChartProps) {
  // ── ALL HOOKS FIRST — unconditionally, before any early returns ──────────

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Build a single flat dataset.
   * - historicalValue: filled for historical points, null for forecast
   * - forecastValue:   filled for forecast points AND the last historical point
   *                    (bridge vertex so the dashed line visually connects)
   * - upper/lower:     filled only on forecast points
   */
  const { unified, boundaryDisplayMonth } = useMemo(() => {
    const rows: UnifiedPoint[] = [];
    let lastHistValue: number | null = null;
    let boundaryDM = '';
    let bridgeDone = false;

    data.forEach((d) => {
      if (!d.isForecast) {
        lastHistValue = d.value;
        if (d.isBoundary) boundaryDM = d.displayMonth;
        rows.push({
          month: d.month,
          displayMonth: d.displayMonth,
          historicalValue: d.value,
          forecastValue: null,
          upper: null,
          lower: null,
          isForecast: false,
          isBoundary: d.isBoundary,
        });
      } else {
        if (!bridgeDone && lastHistValue !== null) {
          // Patch the last historical row: also fill forecastValue with the
          // same value so the two lines share a common vertex (visual bridge).
          const lastRow = rows[rows.length - 1];
          if (lastRow && !lastRow.isForecast) {
            lastRow.forecastValue = lastHistValue;
          }
          bridgeDone = true;
        }
        rows.push({
          month: d.month,
          displayMonth: d.displayMonth,
          historicalValue: null,
          forecastValue: d.value,
          upper: d.upper ?? null,
          lower: d.lower ?? null,
          isForecast: true,
          isBoundary: d.isBoundary,
        });
      }
    });

    return { unified: rows, boundaryDisplayMonth: boundaryDM };
  }, [data]);

  const hasForecast = unified.some((d) => d.isForecast);
  const hasConfidenceBand = unified.some((d) => d.upper !== null && d.lower !== null);

  // ── Early return guard AFTER all hooks ───────────────────────────────────
  if (!mounted) {
    return (
      <div className="h-[360px] w-full bg-surface rounded-card border border-hairline flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-ink-muted">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-body-sm">Loading chart…</p>
        </div>
      </div>
    );
  }

  // ── Custom tooltip ────────────────────────────────────────────────────────
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number | null; name: string; color: string; payload: UnifiedPoint }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const entry = payload.find((p) => p.value !== null && p.value !== undefined);
    if (!entry) return null;

    const point = entry.payload;
    const isForecast = point.isForecast;

    return (
      <div className="bg-surface border border-hairline rounded-card p-3 shadow-elevated min-w-[200px]">
        <p className="text-caption text-ink-muted uppercase tracking-wider mb-2">
          {formatMonthDisplay(point.month)}
          {isForecast && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/10 text-accent">Forecast</span>}
        </p>
        <div className="flex items-center gap-2 text-body-sm font-medium text-ink-primary">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span>{isForecast ? 'Forecast' : 'Historical'}: </span>
          <span className="tabular-nums">
            {unit === 'm' ? formatGwLevel(entry.value!) : formatEc(entry.value!)}
          </span>
        </div>
        {isForecast && point.upper !== null && point.lower !== null && (
          <div className="mt-1.5 text-caption text-ink-muted">
            95% CI: {unit === 'm' ? formatGwLevel(point.lower!) : formatEc(point.lower!)} – {unit === 'm' ? formatGwLevel(point.upper!) : formatEc(point.upper!)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-surface rounded-card border border-hairline p-4">
      <div className="mb-4">
        <h3 className="text-display-sm font-semibold text-ink-primary">{title}</h3>
        <p className="text-caption text-ink-muted mt-0.5">
          {yLabel} — Historical (solid) &amp; Forecast (dashed) with 95% confidence band
        </p>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {/*
           * ComposedChart: lets Line + Area share one dataset.
           * All series use unified[] by index — x-positions are guaranteed correct.
           */}
          <ComposedChart data={unified} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--color-hairline)"
              vertical={false}
              horizontal={true}
            />
            <XAxis
              dataKey="displayMonth"
              tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'Inter' }}
              axisLine={{ stroke: 'var(--color-hairline)' }}
              tickLine={{ stroke: 'var(--color-hairline)' }}
              interval="preserveStartEnd"
              dy={8}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-ink-muted)', fontFamily: 'Inter' }}
              axisLine={{ stroke: 'var(--color-hairline)' }}
              tickLine={{ stroke: 'var(--color-hairline)' }}
              tickFormatter={value => unit === 'm' ? `${value}m` : `${value}`}
              width={50}
            />

            {/* 95% confidence band — upper fills accent colour, lower fills surface to punch a hole */}
            {hasConfidenceBand && (
              <Area
                type="monotone"
                dataKey="upper"
                stroke="none"
                fill="var(--color-accent)"
                fillOpacity={0.15}
                legendType="none"
                connectNulls={false}
                isAnimationActive={_animate}
                activeDot={false as never}
              />
            )}
            {hasConfidenceBand && (
              <Area
                type="monotone"
                dataKey="lower"
                stroke="none"
                fill="var(--color-surface)"
                fillOpacity={1}
                legendType="none"
                connectNulls={false}
                isAnimationActive={_animate}
                activeDot={false as never}
              />
            )}

            {/* Historical line — solid, dark */}
            <Line
              type="monotone"
              dataKey="historicalValue"
              stroke="var(--color-ink-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: 'var(--color-surface)' }}
              name="Historical"
              legendType="line"
              connectNulls={false}
              isAnimationActive={_animate}
            />

            {/* Forecast line — dashed, accent colour */}
            {hasForecast && (
              <Line
                type="monotone"
                dataKey="forecastValue"
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, fill: 'var(--color-surface)', stroke: 'var(--color-accent)' }}
                name="Forecast"
                legendType="line"
                connectNulls={false}
                isAnimationActive={_animate}
              />
            )}

            {/* Forecast boundary reference line — keyed on displayMonth string */}
            {boundaryDisplayMonth && (
              <ReferenceLine
                x={boundaryDisplayMonth}
                stroke="var(--color-ink-muted)"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast starts',
                  position: 'top',
                  offset: -8,
                  fill: 'var(--color-ink-muted)',
                  fontSize: 10,
                  fontWeight: 500,
                  fontFamily: 'Inter',
                }}
              />
            )}

            <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'none' }} offset={10} />

            {showLegend && (
              <Legend
                wrapperStyle={{ paddingTop: 8 }}
                layout="horizontal"
                align="center"
                iconType="line"
                formatter={(value: string) => value}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-caption text-ink-muted">
        <span>Shaded area = 95% confidence interval</span>
        <span>Source: Simulated (India-WRIS / CGWB / IMD)</span>
      </div>
    </div>
  );
}