/**
 * AquaSentinel Type Definitions
 * Shaped to match expected FastAPI backend responses for future drop-in replacement.
 */

export type CGWBClassification =
  | 'Safe'
  | 'Semi-Critical'
  | 'Critical'
  | 'Over-Exploited'
  | 'Saline';

export type ExtractionTrend = 'rising' | 'falling' | 'stable';

export interface MonthlyReading {
  month: string;           // ISO format: 'YYYY-MM'
  value: number;           // groundwater level in meters below ground level (mbgl)
}

export interface ForecastPoint {
  month: string;           // ISO format: 'YYYY-MM'
  value: number;           // forecasted value
  upper: number;           // upper confidence bound
  lower: number;           // lower confidence bound
}

export interface DistrictSeed {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  cgwbClassification: CGWBClassification;
  isCoastal: boolean;
  baseGwLevel: number;         // typical starting mbgl
  gwTrend: number;             // mbgl per month (positive = declining)
  gwSeasonalAmplitude: number; // seasonal swing mbgl
  rainfallDeficitPct: number;  // % deficit vs historical average
  extractionTrend: ExtractionTrend;
  polygon?: [number, number][]; // district polygon boundary [lat, lng][]
  // Coastal-specific
  baseEc?: number;             // EC in µS/cm
  ecTrend?: number;            // EC trend per month
  ecSeasonalAmplitude?: number;
  salinityRiskScore?: number;  // 0-100
}

export interface DistrictSummary {
  id: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  cgwbClassification: CGWBClassification;
  isCoastal: boolean;
  latestGwLevel: number;       // most recent historical reading
  gwTrend: 'improving' | 'declining' | 'stable';
  rainfallDeficitPct: number;
  extractionTrend: ExtractionTrend;
  polygon?: [number, number][]; // district polygon boundary [lat, lng][]
  salinityRiskScore?: number;  // only for coastal
  lastUpdated: string;         // ISO timestamp
}

export interface DistrictDetail extends DistrictSummary {
  gwHistory: MonthlyReading[];     // 60 months
  gwForecast: ForecastPoint[];     // 12 months
  ecHistory?: MonthlyReading[];    // coastal only, 60 months
  ecForecast?: ForecastPoint[];    // coastal only, 12 months
}

export interface NationalStats {
  totalDistricts: number;
  pctOverExploited: number;
  pctCritical: number;
  districtsWithRisingSalinity: number;
  lastUpdated: string;
}

export interface ApiResponse<T> {
  data: T;
  meta: {
    source: 'mock' | 'india-wris' | 'cgwb' | 'imd';
    generatedAt: string;
    disclaimer: string;
  };
}

export interface LayerType {
  id: 'drawdown' | 'salinity';
  label: string;
}

export const LAYER_TYPES: LayerType[] = [
  { id: 'drawdown', label: 'Drawdown Risk' },
  { id: 'salinity', label: 'Salinity Risk' },
];

export const CGWB_TIER_ORDER: CGWBClassification[] = [
  'Safe',
  'Semi-Critical',
  'Critical',
  'Over-Exploited',
  'Saline',
];

export const EXTRACTION_TREND_LABELS: Record<ExtractionTrend, string> = {
  rising: 'Rising',
  falling: 'Falling',
  stable: 'Stable',
};

// ─── Policy Simulator ────────────────────────────────────────────────────────

export interface SimulationInput {
  district_id: string;
  rainfall_delta_pct: number;     // −50 to +50
  extraction_delta_pct: number;   // −30 to +50
  recharge_structures_added: number; // 0–20
}

export interface SimulationMonth {
  month: string;             // 'YYYY-MM'
  baseline: number;          // ŷ_base(t)
  simulated: number;         // ŷ_sim(t)
  delta: number;             // simulated − baseline
}

export interface SimulationResult {
  district_id: string;
  district_name: string;
  original_classification: CGWBClassification;
  simulated_classification: CGWBClassification;
  months: SimulationMonth[];
  summary: {
    avg_delta_m: number;
    max_improvement_m: number;
    classification_changed: boolean;
  };
  meta: {
    alpha: number; beta: number; gamma: number;
    r_hist_mm: number; e_base_m: number; v_cap_m: number;
  };
}

// ─── Backtest / Model Validation ─────────────────────────────────────────────

export interface BacktestPoint {
  month: string;
  actual: number;
  predicted: number;
}

export interface BacktestResult {
  district_id: string;
  district_name: string;
  holdout_months: 6;
  points: BacktestPoint[];
  metrics: {
    r2: number;    // coefficient of determination
    rmse: number;  // root mean square error (m)
    mae: number;   // mean absolute error (m)
  };
}

// ─── Recharge Site Recommendations ───────────────────────────────────────────

export interface RechargeProperties {
  block_id: string;
  block_name: string;
  district_name: string;
  structure_type: 'Check Dam' | 'Percolation Tank' | 'Farm Pond' | 'Recharge Shaft';
  slope_pct: number;
  stream_order: number;
  cgwb_status: CGWBClassification;
  priority: 'High' | 'Medium';
  rationale: string;
}

export interface RechargeFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  properties: RechargeProperties;
}

export interface RechargeFeatureCollection {
  type: 'FeatureCollection';
  district_id: string;
  features: RechargeFeature[];
}