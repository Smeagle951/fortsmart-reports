'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizeMonitoringWindowsPayload } from '@/lib/cloud-monitoring/adapter';
import {
  clearCloudMonitoringSnapshot,
  loadCloudMonitoringSnapshot,
  saveCloudMonitoringSnapshot,
} from '@/lib/cloud-monitoring/snapshot-store';

export type UseCloudMonitoringState = {
  loading: boolean;
  error: string | null;
  lastSync: string | null;
};

/**
 * Fluxo cloud-first espelhado em `useCloudPlanting`: snapshot local + GET via proxy Next.
 */
export function useCloudMonitoring(farmCloudId: string | null | undefined) {
  const farm = farmCloudId?.trim() ?? '';
  const hasFarm = !!farm;

  const [raw, setRaw] = useState<unknown>(null);
  const [fromSnapshot, setFromSnapshot] = useState(false);
  const [state, setState] = useState<UseCloudMonitoringState>({
    loading: false,
    error: null,
    lastSync: null,
  });

  const normalized = useMemo(() => normalizeMonitoringWindowsPayload(raw), [raw]);

  useEffect(() => {
    if (!hasFarm) {
      setRaw(null);
      setFromSnapshot(false);
      return;
    }
    const snap = loadCloudMonitoringSnapshot(farm);
    if (snap?.raw) {
      setRaw(snap.raw);
      setFromSnapshot(true);
    } else {
      setRaw(null);
      setFromSnapshot(false);
    }
  }, [farm, hasFarm]);

  const fetchFromCloud = useCallback(async () => {
    if (!hasFarm) {
      setState((s) => ({ ...s, error: 'Defina o UUID da fazenda (farm cloud).' }));
      return;
    }
    setState({ loading: true, error: null, lastSync: null });
    try {
      const res = await fetch(`/api/windows/monitoring/${encodeURIComponent(farm)}`, {
        cache: 'no-store',
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        const msg =
          body && typeof body === 'object' && body !== null && 'error' in body
            ? String((body as { error?: unknown }).error ?? res.statusText)
            : res.statusText;
        throw new Error(msg || `HTTP ${res.status}`);
      }
      saveCloudMonitoringSnapshot(farm, body);
      setRaw(body);
      setFromSnapshot(false);
      setState({
        loading: false,
        error: null,
        lastSync: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setState({ loading: false, error: msg, lastSync: null });
    }
  }, [farm, hasFarm]);

  const clear = useCallback(() => {
    if (!hasFarm) return;
    clearCloudMonitoringSnapshot(farm);
    setRaw(null);
    setFromSnapshot(false);
    setState({ loading: false, error: null, lastSync: null });
  }, [farm, hasFarm]);

  return {
    farmCloudId: farm || null,
    hasFarmCloudId: hasFarm,
    /** Modelo já normalizado (preferir na UI). */
    data: normalized,
    normalized,
    raw,
    fromSnapshot,
    loading: state.loading,
    error: state.error,
    lastSync: state.lastSync,
    fetchFromCloud,
    clear,
  };
}

export type UseCloudMonitoringReturn = ReturnType<typeof useCloudMonitoring>;
