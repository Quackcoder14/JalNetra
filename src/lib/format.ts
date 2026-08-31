/**
 * Formatting utilities for numbers, dates, and display values.
 */

import { MonthlyReading, ForecastPoint } from '../data/types';

/**
 * Format a number with commas for thousands.
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true,
  });
}

/**
 * Format groundwater level in mbgl.
 */
export function formatGwLevel(mbgl: number): string {
  return `${formatNumber(mbgl, 2)} m`;
}

/**
 * Format EC (electrical conductivity) in µS/cm.
 */
export function formatEc(ec: number): string {
  return `${formatNumber(ec, 0)} µS/cm`;
}

/**
 * Format percentage.
 */
export function formatPercent(pct: number, showSign: boolean = true): string {
  const sign = pct > 0 && showSign ? '+' : '';
  return `${sign}${formatNumber(pct, 1)}%`;
}

/**
 * Format month string (YYYY-MM) to display format (MMM YYYY).
 */
export function formatMonthDisplay(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

/**
 * Format month for chart axis (short).
 */
export function formatMonthShort(monthStr: string): string {
  const [year, month] = monthStr.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short' });
}

/**
 * Format ISO timestamp to readable date/time.
 */
export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Format relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatTimestamp(iso);
}

/**
 * Get the boundary month where forecast starts (last historical month).
 */
export function getForecastBoundary(history: MonthlyReading[] = []): string {
  if (!history || history.length === 0) return '';
  return history[history.length - 1]?.month || '';
}

/**
 * Combine historical and forecast data for chart.
 * Adds a flag to distinguish historical vs forecast points.
 */
export interface ChartDataPoint {
  month: string;
  displayMonth: string;
  value: number | null;
  upper?: number;
  lower?: number;
  isForecast: boolean;
  isBoundary?: boolean;
  index?: number;
}

export function prepareChartData(
  history: MonthlyReading[] = [],
  forecast: ForecastPoint[] = []
): ChartDataPoint[] {
  const safeHistory = history || [];
  const safeForecast = forecast || [];
  const boundaryMonth = getForecastBoundary(safeHistory);
  const data: ChartDataPoint[] = [];

  // Historical points
  safeHistory.forEach((h, i) => {
    if (!h) return;
    data.push({
      month: h.month,
      displayMonth: formatMonthShort(h.month),
      value: h.value,
      isForecast: false,
      isBoundary: h.month === boundaryMonth,
      index: i,
    });
  });

  // Forecast points
  safeForecast.forEach((f, i) => {
    if (!f) return;
    data.push({
      month: f.month,
      displayMonth: formatMonthShort(f.month),
      value: f.value,
      upper: f.upper,
      lower: f.lower,
      isForecast: true,
      isBoundary: i === 0,
      index: safeHistory.length + i,
    });
  });

  return data;
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 1) + '…';
}

/**
 * Format large numbers with k/M suffixes.
 */
export function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return formatNumber(num);
}