/**
 * React hooks for mock data fetching with loading states.
 * In production, these would call the real API endpoints.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchDistricts,
  fetchDistrict,
  fetchNationalStats,
  refreshData,
  simulatePolicy,
  backtestDistrict,
  fetchRechargeRecommendations,
} from '../data/api';
import {
  DistrictSummary, DistrictDetail, NationalStats, ApiResponse,
  SimulationInput, SimulationResult,
  BacktestResult,
  RechargeFeatureCollection,
} from '../data/types';

/**
 * Hook for fetching all district summaries (map/alerts view).
 */
export function useDistricts() {
  const [data, setData] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<DistrictSummary[]> = await fetchDistricts();
      setData(response.data);
    } catch (err) {
      setError('Failed to load districts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

/**
 * Hook for fetching a single district detail (drill-down view).
 */
export function useDistrict(id: string | undefined) {
  const [data, setData] = useState<DistrictDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const targetId = id && id.trim() ? id.trim() : 'sangrur';
      const response: ApiResponse<DistrictDetail | null> = await fetchDistrict(targetId);
      setData(response.data);
    } catch (err) {
      setError('Failed to load district');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

/**
 * Hook for national statistics (overview page).
 */
export function useNationalStats() {
  const [data, setData] = useState<NationalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: ApiResponse<NationalStats> = await fetchNationalStats();
      setData(response.data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}

/**
 * Hook for manual data refresh with loading state.
 */
export function useRefresh() {
  const [refreshing, setRefreshing] = useState(false);

  const triggerRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshData();
      // Note: In a real app, we'd invalidate queries here.
      // For this prototype, consumers should call their own refresh functions.
      return true;
    } catch (err) {
      console.error('Refresh failed:', err);
      return false;
    } finally {
      setRefreshing(false);
    }
  }, []);

  return { refreshing, triggerRefresh };
}

/**
 * Hook for the Policy Simulator.
 * Accepts simulation inputs and debounces API calls by 350ms.
 * Auto-runs when inputs change (after debounce).
 */
export function useSimulator(districtId: string | undefined) {
  const [data, setData] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState<Omit<SimulationInput, 'district_id'>>({
    rainfall_delta_pct: 0,
    extraction_delta_pct: 0,
    recharge_structures_added: 0,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(
    async (params: Omit<SimulationInput, 'district_id'>) => {
      if (!districtId) return;
      setLoading(true);
      setError(null);
      try {
        const res: ApiResponse<SimulationResult> = await simulatePolicy({
          district_id: districtId,
          ...params,
        });
        setData(res.data);
      } catch (err) {
        setError('Simulation failed');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [districtId]
  );

  // Run with debounce whenever inputs change
  useEffect(() => {
    if (!districtId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      run(input);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [input, districtId, run]);

  // Initial run with zero inputs
  useEffect(() => {
    if (districtId) run(input);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  return { data, loading, error, input, setInput };
}

/**
 * Hook for model backtesting / validation.
 * Fetches holdout results lazily on demand.
 */
export function useBacktest(districtId: string | undefined) {
  const [data, setData] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triggered, setTriggered] = useState(false);

  const fetch = useCallback(async () => {
    if (!districtId) return;
    setLoading(true);
    setError(null);
    try {
      // Allow 1.5s for real model computation / smooth loading UX
      const [res] = await Promise.all([
        backtestDistrict(districtId),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
      setData(res.data);
    } catch (err) {
      setError('Backtest failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  const trigger = useCallback(() => {
    setTriggered(true);
    fetch();
  }, [fetch]);

  // Re-fetch if district changes while triggered
  useEffect(() => {
    if (triggered && districtId) fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  return { data, loading, error, triggered, trigger };
}

/**
 * Hook for recharge site recommendations.
 * Fetches lazily on demand.
 */
export function useRechargeRecommendations(districtId: string | undefined) {
  const [data, setData] = useState<RechargeFeatureCollection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const load = useCallback(async () => {
    if (!districtId) return;
    setLoading(true);
    setError(null);
    try {
      const res: ApiResponse<RechargeFeatureCollection> = await fetchRechargeRecommendations(districtId);
      setData(res.data);
    } catch (err) {
      setError('Failed to load recharge recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [districtId]);

  const toggle = useCallback(() => {
    setVisible(prev => {
      const next = !prev;
      if (next && !data && !loading) load();
      return next;
    });
  }, [data, loading, load]);

  // Re-load if district changes while visible
  useEffect(() => {
    if (visible && districtId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [districtId]);

  return { data, loading, error, visible, toggle, load };
}