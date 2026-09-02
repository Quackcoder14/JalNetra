/**
 * JalNetra API Layer
 * Hybrid engine: connects to live FastAPI backend on Render with seamless client-side fallback.
 */

import {
  getAllDistrictSummaries,
  getDistrictDetail,
  getNationalStatistics,
  refreshMockData,
} from './mockData';
import {
  generateSimulation,
  generateBacktest,
  generateRechargeRecommendations,
} from './generateMockData';
import {
  DistrictSummary,
  DistrictDetail,
  NationalStats,
  ApiResponse,
  CGWBClassification,
  SimulationInput,
  SimulationResult,
  BacktestResult,
  RechargeFeatureCollection,
} from './types';

// API Base URL (defaults to production Render backend)
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://jalnetra-api.onrender.com';

// Simulated network delay for mock fallback (ms)
const NETWORK_DELAY = 150;

/**
 * Standard mock API response wrapper.
 */
function mockResponse<T>(data: T): ApiResponse<T> {
  return {
    data,
    meta: {
      source: 'mock',
      generatedAt: new Date().toISOString(),
      disclaimer: 'Simulated telemetry for national prototype analysis.',
    },
  };
}

/**
 * Fetch with automatic timeout and fallback to mock generator.
 */
async function fetchWithFallback<T>(
  endpoint: string,
  options?: RequestInit,
  fallbackFn?: () => T
): Promise<ApiResponse<T>> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout (handles Render spinup)

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        return json;
      }
    }
  } catch (_err) {
    // Graceful fallback to client-side data engine
  }

  if (fallbackFn) {
    return mockResponse(fallbackFn());
  }

  throw new Error(`Failed to fetch from ${endpoint} and no fallback provided`);
}

/**
 * GET /api/districts
 * Returns lightweight summaries for map/alerts view.
 */
export async function fetchDistricts(): Promise<ApiResponse<DistrictSummary[]>> {
  return fetchWithFallback<DistrictSummary[]>(
    '/api/districts',
    undefined,
    () => getAllDistrictSummaries()
  );
}

/**
 * GET /api/districts/{id}
 * Returns full district detail with history + forecast.
 */
export async function fetchDistrict(id: string): Promise<ApiResponse<DistrictDetail | null>> {
  return fetchWithFallback<DistrictDetail | null>(
    `/api/districts/${encodeURIComponent(id)}`,
    undefined,
    () => getDistrictDetail(id) ?? null
  );
}

/**
 * GET /api/national-stats
 * Returns computed national statistics.
 */
export async function fetchNationalStats(): Promise<ApiResponse<NationalStats>> {
  return fetchWithFallback<NationalStats>(
    '/api/national-stats',
    undefined,
    () => getNationalStatistics()
  );
}

/**
 * POST /api/refresh
 * Simulates data refresh with updated parameters.
 */
export async function refreshData(): Promise<ApiResponse<{
  districts: DistrictSummary[];
  nationalStats: NationalStats;
  refreshedAt: string;
}>> {
  const { summaries, nationalStats } = refreshMockData();
  return mockResponse({
    districts: summaries,
    nationalStats,
    refreshedAt: new Date().toISOString(),
  });
}

/**
 * GET /api/classifications
 * Returns available CGWB classification tiers with metadata.
 */
export async function fetchClassifications(): Promise<ApiResponse<{
  tiers: Array<{ value: CGWBClassification; label: string; color: string; description: string }>;
}>> {
  return mockResponse({
    tiers: [
      { value: 'Safe', label: 'Safe', color: '#16A34A', description: 'Groundwater development < 70%' },
      { value: 'Semi-Critical', label: 'Semi-Critical', color: '#EAB308', description: 'Groundwater development 70-90%' },
      { value: 'Critical', label: 'Critical', color: '#F97316', description: 'Groundwater development 90-100%' },
      { value: 'Over-Exploited', label: 'Over-Exploited', color: '#DC2626', description: 'Groundwater development > 100%' },
      { value: 'Saline', label: 'Saline', color: '#7C3AED', description: 'Coastal salinity intrusion' },
    ],
  });
}

/**
 * GET /api/health
 * Health check endpoint.
 */
export async function fetchHealth(): Promise<ApiResponse<{ status: 'ok'; version: string }>> {
  return fetchWithFallback<{ status: 'ok'; version: string }>(
    '/health',
    undefined,
    () => ({ status: 'ok', version: '1.0.0-hybrid' })
  );
}

/**
 * POST /api/simulate
 * Policy Simulator — returns 12-month baseline vs simulated drawdown curves.
 */
export async function simulatePolicy(
  input: SimulationInput
): Promise<ApiResponse<SimulationResult>> {
  return fetchWithFallback<SimulationResult>(
    '/api/simulate',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
    () => generateSimulation(input)
  );
}

/**
 * GET /api/districts/{district_id}/backtest
 * Model Validation & Holdout Backtesting.
 */
export async function backtestDistrict(
  districtId: string
): Promise<ApiResponse<BacktestResult>> {
  return fetchWithFallback<BacktestResult>(
    `/api/districts/${encodeURIComponent(districtId)}/backtest`,
    undefined,
    () => generateBacktest(districtId)
  );
}

/**
 * GET /api/districts/{district_id}/recharge
 * Spatial Recharge Site Recommender.
 */
export async function fetchRechargeRecommendations(
  districtId: string
): Promise<ApiResponse<RechargeFeatureCollection>> {
  return fetchWithFallback<RechargeFeatureCollection>(
    `/api/districts/${encodeURIComponent(districtId)}/recharge`,
    undefined,
    () => generateRechargeRecommendations(districtId)
  );
}