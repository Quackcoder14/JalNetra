/**
 * Risk scoring and tier color/label mappings.
 * Centralized so UI components stay consistent.
 */

import { CGWBClassification, ExtractionTrend } from '../data/types';

/**
 * CGWB tier display configuration.
 */
export const TIER_CONFIG: Record<CGWBClassification, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  markerColor: string;
  description: string;
  severity: number; // 1-5 for sorting
}> = {
  'Safe': {
    label: 'Safe',
    color: '#15803D',
    bgColor: '#DCFCE7',
    borderColor: '#86EFAC',
    markerColor: '#16A34A',
    description: 'Groundwater development < 70%',
    severity: 1,
  },
  'Semi-Critical': {
    label: 'Semi-Critical',
    color: '#A16207',
    bgColor: '#FEF9C3',
    borderColor: '#FDE047',
    markerColor: '#EAB308',
    description: 'Groundwater development 70–90%',
    severity: 2,
  },
  'Critical': {
    label: 'Critical',
    color: '#C2410C',
    bgColor: '#FFEDD5',
    borderColor: '#FDBA74',
    markerColor: '#F97316',
    description: 'Groundwater development 90–100%',
    severity: 3,
  },
  'Over-Exploited': {
    label: 'Over-Exploited',
    color: '#B91C1C',
    bgColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    markerColor: '#DC2626',
    description: 'Groundwater development > 100%',
    severity: 4,
  },
  'Saline': {
    label: 'Saline',
    color: '#6D28D9',
    bgColor: '#F3E8FF',
    borderColor: '#D8B4FE',
    markerColor: '#7C3AED',
    description: 'Coastal salinity intrusion',
    severity: 5,
  },
};

/**
 * Extraction trend display config.
 */
export const EXTRACTION_TREND_CONFIG: Record<ExtractionTrend, {
  label: string;
  icon: 'up' | 'down' | 'horizontal';
  color: string;
  bgColor: string;
}> = {
  rising: {
    label: 'Rising',
    icon: 'up',
    color: '#991B1B',
    bgColor: '#FEF2F2',
  },
  falling: {
    label: 'Falling',
    icon: 'down',
    color: '#166534',
    bgColor: '#DCFCE7',
  },
  stable: {
    label: 'Stable',
    icon: 'horizontal',
    color: '#854D0E',
    bgColor: '#FEF9C3',
  },
};

/**
 * GW trend display config.
 */
export const GW_TREND_CONFIG = {
  improving: { label: 'Improving', color: '#166534', bgColor: '#DCFCE7', icon: 'down' },
  declining: { label: 'Declining', color: '#991B1B', bgColor: '#FEF2F2', icon: 'up' },
  stable: { label: 'Stable', color: '#854D0E', bgColor: '#FEF9C3', icon: 'horizontal' },
} as const;

/**
 * Salinity risk score bands.
 */
export function getSalinityRiskBand(score: number): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score >= 80) return { label: 'Very High', color: '#991B1B', bgColor: '#FEF2F2' };
  if (score >= 60) return { label: 'High', color: '#9A3412', bgColor: '#FFEDD5' };
  if (score >= 40) return { label: 'Moderate', color: '#854D0E', bgColor: '#FEF9C3' };
  if (score >= 20) return { label: 'Low', color: '#166534', bgColor: '#DCFCE7' };
  return { label: 'Very Low', color: '#166534', bgColor: '#DCFCE7' };
}

/**
 * Composite drawdown risk score (0-100) for ranking.
 * Factors: classification severity (40%), GW trend (30%), rainfall deficit (20%), extraction trend (10%).
 */
export function computeDrawdownRiskScore(district: {
  cgwbClassification: CGWBClassification;
  gwTrend: 'improving' | 'declining' | 'stable';
  rainfallDeficitPct: number;
  extractionTrend: ExtractionTrend;
}): number {
  const tierSeverity = TIER_CONFIG[district.cgwbClassification].severity; // 1-5
  const tierScore = (tierSeverity / 5) * 40;

  const trendScore = district.gwTrend === 'declining' ? 30 : district.gwTrend === 'stable' ? 15 : 0;

  const deficitScore = Math.min(20, Math.max(0, (district.rainfallDeficitPct / 50) * 20));

  const extractionScore = district.extractionTrend === 'rising' ? 10 : district.extractionTrend === 'stable' ? 5 : 0;

  return Math.round(tierScore + trendScore + deficitScore + extractionScore);
}

/**
 * Composite salinity risk score (0-100) for coastal districts.
 * Uses pre-computed salinityRiskScore if available, otherwise computes from EC trend + drawdown + proximity.
 */
export function computeSalinityRiskScore(district: {
  isCoastal: boolean;
  salinityRiskScore?: number;
  cgwbClassification: CGWBClassification;
  gwTrend: 'improving' | 'declining' | 'stable';
}): number {
  if (!district.isCoastal) return 0;
  if (district.salinityRiskScore !== undefined) return district.salinityRiskScore;

  // Fallback computation
  const tierSeverity = TIER_CONFIG[district.cgwbClassification].severity;
  const tierScore = (tierSeverity / 5) * 50;
  const trendScore = district.gwTrend === 'declining' ? 30 : district.gwTrend === 'stable' ? 15 : 0;
  const coastalBonus = 20; // base coastal risk

  return Math.min(100, Math.round(tierScore + trendScore + coastalBonus));
}

/**
 * Sort districts by risk severity (highest first).
 */
export function sortByRiskSeverity<T extends { cgwbClassification: CGWBClassification }>(
  districts: T[]
): T[] {
  return [...districts].sort((a, b) => {
    const severityA = TIER_CONFIG[a.cgwbClassification].severity;
    const severityB = TIER_CONFIG[b.cgwbClassification].severity;
    return severityB - severityA; // descending
  });
}

/**
 * Get color for a classification tier (for map markers).
 */
export function getTierColor(classification: CGWBClassification): string {
  const colors: Record<CGWBClassification, string> = {
    'Safe': '#16A34A',
    'Semi-Critical': '#EAB308',
    'Critical': '#F97316',
    'Over-Exploited': '#DC2626',
    'Saline': '#7C3AED',
  };
  return colors[classification];
}

/**
 * Get marker size based on severity.
 */
export function getMarkerSize(classification: CGWBClassification): number {
  const sizes: Record<CGWBClassification, number> = {
    'Safe': 10,
    'Semi-Critical': 12,
    'Critical': 14,
    'Over-Exploited': 16,
    'Saline': 14,
  };
  return sizes[classification];
}