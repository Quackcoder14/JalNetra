/**
 * Mock data exports - pre-generated at build time for performance.
 * In production, this would be replaced by actual API calls.
 */

import { generateMockData } from './generateMockData';
import { DistrictDetail, DistrictSummary, NationalStats } from './types';

// Default global seed - change to "refresh" data
const DEFAULT_SEED = 20260827;

// Pre-generated dataset
const { districts, summaries, nationalStats } = generateMockData(DEFAULT_SEED);

export const MOCK_DISTRICTS: DistrictDetail[] = districts;
export const MOCK_SUMMARIES: DistrictSummary[] = summaries;
export const MOCK_NATIONAL_STATS: NationalStats = nationalStats;

// Lookup maps for O(1) access
export const DISTRICT_DETAIL_MAP: Map<string, DistrictDetail> = new Map(
  districts.map(d => [d.id, d])
);

export const DISTRICT_SUMMARY_MAP: Map<string, DistrictSummary> = new Map(
  summaries.map(d => [d.id, d])
);

/**
 * Get all district details (full data for drill-down).
 */
export function getAllDistricts(): DistrictDetail[] {
  return MOCK_DISTRICTS;
}

/**
 * Get all district summaries (lightweight for map/alerts).
 */
export function getAllDistrictSummaries(): DistrictSummary[] {
  return MOCK_SUMMARIES;
}

/**
 * Get a single district by ID with fuzzy matching:
 * 1. Exact ID match
 * 2. Partial ID match (slug contains or is contained)
 * 3. Name match (case-insensitive)
 * 4. Fallback to first district so page never goes blank
 */
export function getDistrictDetail(id: string): DistrictDetail | undefined {
  if (!id) return MOCK_DISTRICTS[0];
  const clean = id.toLowerCase().trim();

  // 1. Exact
  const exact = DISTRICT_DETAIL_MAP.get(clean) ?? DISTRICT_DETAIL_MAP.get(id);
  if (exact) return exact;

  // 2. Partial ID
  const partial = MOCK_DISTRICTS.find(
    d => d.id.toLowerCase().includes(clean) || clean.includes(d.id.toLowerCase())
  );
  if (partial) return partial;

  // 3. Name match
  const named = MOCK_DISTRICTS.find(
    d => d.name.toLowerCase() === clean || d.name.toLowerCase().includes(clean)
  );
  if (named) return named;

  // 4. Fallback
  return MOCK_DISTRICTS[0];
}


/**
 * Get national statistics.
 */
export function getNationalStatistics(): NationalStats {
  return MOCK_NATIONAL_STATS;
}

/**
 * Refresh mock data with a new seed (simulates data refresh).
 * Returns new dataset - in a real app this would be an API call.
 */
export function refreshMockData(newSeed?: number): {
  districts: DistrictDetail[];
  summaries: DistrictSummary[];
  nationalStats: NationalStats;
} {
  const seed = newSeed ?? Date.now();
  return generateMockData(seed);
}