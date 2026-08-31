/**
 * Forecast chart component using Recharts.
 * Shows historical data + forecast with confidence band and clear boundary marker.
 *
 * RULES OF HOOKS: ALL hooks must be called unconditionally at the top,
 * before any early returns. useMemo is now above the !mounted guard.
 */

import {
  LineChart,
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

  // Build confidence band polygon data (must be here, before any return)
  const confidenceBandData = useMemo(() => {
    const forecastPoints = data.filter(d => d.isForecast && d.upper !== undefined && d.lower !== undefined);
    if (forecastPoints.length === 0) return [];

    const upperPoints = forecastPoints.map(d => ({
      displayMonth: d.displayMonth,
      value: d.upper!,
      index: d.index,
    }));

    const lowerPoints = [...forecastPoints].reverse().map(d => ({
      displayMonth: d.displayMonth,
      value: d.lower!,
      index: d.index,
    }));

    return [...upperPoints, ...lowerPoints];
  }, [data]);

  // Separate data sets (pure derivations — no hook, but keep after useMemo for clarity)
  const historicalData = data.filter(d => !d.isForecast);
  const forecastData = data.filter(d => d.isForecast);
  const combinedData = data.map((d, i) => ({ ...d, index: i }));
  const boundaryIndex = data.findIndex(d => d.isBoundary && !d.isForecast);

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

  // ── Custom tooltip (defined after hooks, inside render — not a hook) ──────
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string; payload: ChartDataPoint }>;
  }) => {
    if (!active || !payload || !payload.length) return null;

    const point = payload[0].payload;
    const isForecast = point.isForecast;

    return (
      <div className="bg-surface border border-hairline rounded-card p-3 shadow-elevated min-w-[200px]">
        <p className="text-caption text-ink-muted uppercase tracking-wider mb-2">
          {formatMonthDisplay(point.month)}
          {isForecast && <span className="ml-2 px-1.5 py-0.5 text-[10px] font-medium rounded bg-accent/10 text-accent">Forecast</span>}
        </p>
        <div className="flex items-center gap-2 text-body-sm font-medium text-ink-primary">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payload[0].color }} />
          <span>{payload[0].name}: </span>
          <span className="tabular-nums">
            {unit === 'm' ? formatGwLevel(payload[0].value) : formatEc(payload[0].value)}
          </span>
        </div>
        {isForecast && point.upper !== undefined && point.lower !== undefined && (
          <div className="mt-1.5 text-caption text-ink-muted">
            95% CI: {unit === 'm' ? formatGwLevel(point.lower) : formatEc(point.lower)} – {unit === 'm' ? formatGwLevel(point.upper) : formatEc(point.upper)}
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
          {yLabel} — Historical (solid) & Forecast (dashed) with 95% confidence band
        </p>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
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

            {/* Confidence band */}
            {confidenceBandData.length > 0 && (
              <Area
                type="monotone"
                data={confidenceBandData}
                dataKey="value"
                stroke="none"
                fill="var(--color-accent)"
                fillOpacity={0.12}
                isAnimationActive={_animate}
              />
            )}

            {/* Historical line — solid */}
            <Line
              type="monotone"
              dataKey="value"
              data={historicalData}
              stroke="var(--color-ink-primary)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, strokeWidth: 2, fill: 'var(--color-surface)' }}
              name="Historical"
              legendType="line"
              connectNulls={true}
              isAnimationActive={_animate}
            />

            {/* Forecast line — dashed */}
            {forecastData.length > 0 && (
              <Line
                type="monotone"
                dataKey="value"
                data={forecastData}
                stroke="var(--color-accent)"
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, fill: 'var(--color-surface)', stroke: 'var(--color-accent)' }}
                name="Forecast"
                legendType="line"
                connectNulls={true}
                isAnimationActive={_animate}
              />
            )}

            {/* Forecast boundary reference line */}
            {boundaryIndex >= 0 && (
              <ReferenceLine
                x={boundaryIndex}
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
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex items-center justify-between text-caption text-ink-muted">
        <span>Shaded area = 95% confidence interval</span>
        <span>Source: Simulated (India-WRIS / CGWB / IMD)</span>
      </div>
    </div>
  );
}