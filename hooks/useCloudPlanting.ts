'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { normalizePlantingWindowsPayload } from '@/lib/cloud-planting/adapter';
import { getCloudPlantingSnapshot, setCloudPlantingSnapshot } from '@/lib/cloud-planting/snapshot-store';

export type CloudPlantingLoadState = {
  loading: boolean;
  error: string | null;
  lastFetchedAt: string | null;
};

/**
 * Leitura cloud-first: normaliza sempre via `normalizePlantingWindowsPayload`.
 * Snapshot local (`cloudPlantingSnapshots`) é opcional — preenchido ao carregar da API.
 */
export function useCloudPlanting(farmCloudId: string | null | undefined) {
  const farm = farmCloudId?.trim() ?? '';
  const hasFarm = !!farm;

  const [raw, setRaw] = useState<unknown>(null);
  const [fromSnapshot, setFromSnapshot] = useState(false);
  const [load, setLoad] = useState<CloudPlantingLoadState>({
    loading: false,
    error: null,
    lastFetchedAt: null,
  });

  const normalized = useMemo(() => normalizePlantingWindowsPayload(raw), [raw]);

  useEffect(() => {
    if (!hasFarm) {
      setRaw(null);
      setFromSnapshot(false);
      return;
    }
    const snap = getCloudPlantingSnapshot(farm);
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
      setLoad((s) => ({ ...s, error: 'Defina o UUID da fazenda (farm cloud).' }));
      return;
    }
    setLoad({ loading: true, error: null, lastFetchedAt: null });
    try {
      const res = await fetch(`/api/windows/planting/${encodeURIComponent(farm)}`, {
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
      setCloudPlantingSnapshot(farm, body);
      setRaw(body);
      setFromSnapshot(false);
      setLoad({
        loading: false,
        error: null,
        lastFetchedAt: new Date().toISOString(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLoad({ loading: false, error: msg, lastFetchedAt: null });
    }
  }, [farm, hasFarm]);

  return {
    farmCloudId: farm || null,
    hasFarmCloudId: hasFarm,
    /** Dados já passados pelo adapter (selectors na UI devem usar isto). */
    data: normalized,
    raw,
    fromSnapshot,
    load,
    fetchFromCloud,
    /** Reaplica snapshot atual do storage (útil após import manual). */
    refreshFromLocalSnapshot: () => {
      if (!hasFarm) return;
      const snap = getCloudPlantingSnapshot(farm);
      if (snap?.raw) {
        setRaw(snap.raw);
        setFromSnapshot(true);
      }
    },
  };
}
