'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import {
  decodeGeoJsonFromQuery,
  isFeatureCollectionGj,
  looksLikeHttpsGeoJsonFetchUrl,
  parseJsonFileText,
} from './geojsonUtils';

/** URL do GeoJSON: `file=` oficial; `files=` aceite por compatibilidade (erro comum na query). */
export function geoFileUrlFromSearchParams(sp: URLSearchParams | null): string | undefined {
  const v = sp?.get('file')?.trim() || sp?.get('files')?.trim();
  return v || undefined;
}

export type UseMapGeoJsonFromUrlOptions = {
  initialFeatureCollection?: FeatureCollection | null;
  searchParams: URLSearchParams | null;
  pathname: string | null;
  /**
   * Quando definido, tenta carregar snapshot a partir do path (ex.: /mapa-talhoes/m/:token).
   * No dashboard GIS use `null` para depender só de ?file= / ?id= / ?d=.
   */
  legacyTokenPathRegex?: RegExp | null;
};

export type UseMapGeoJsonFromUrlResult = {
  raw: FeatureCollection | null;
  setRaw: Dispatch<SetStateAction<FeatureCollection | null>>;
  err: string | null;
  setErr: Dispatch<SetStateAction<string | null>>;
  loadingShare: boolean;
  hostHint: string | null;
};

export function useMapGeoJsonFromUrl({
  initialFeatureCollection = null,
  searchParams: sp,
  pathname,
  legacyTokenPathRegex = /^\/mapa-talhoes\/m\/([^/]+)\/?$/,
}: UseMapGeoJsonFromUrlOptions): UseMapGeoJsonFromUrlResult {
  const [raw, setRaw] = useState<FeatureCollection | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loadingShare, setLoadingShare] = useState(false);
  const [hostHint, setHostHint] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const h = window.location.hostname.toLowerCase();
    if (h.includes('fortsmart') && !h.startsWith('relatorios.') && !h.includes('localhost')) {
      setHostHint(
        'Se abriu a partir do app e o mapa fica vazio: confirme o domínio relatorios.fortsmart-agro.com.br (o mesmo do link partilhado).',
      );
    }
  }, []);

  useEffect(() => {
    if (initialFeatureCollection == null) return;
    setRaw(initialFeatureCollection);
    setErr(null);
  }, [initialFeatureCollection]);

  useEffect(() => {
    if (initialFeatureCollection != null) return;
    const fileUrl = geoFileUrlFromSearchParams(sp);
    if (!fileUrl) return;
    let cancelled = false;
    const ac = new AbortController();

    void (async () => {
      if (!looksLikeHttpsGeoJsonFetchUrl(fileUrl)) {
        setErr('Parâmetro file= deve ser uma URL http(s) válida para o GeoJSON.');
        return;
      }
      try {
        setLoadingShare(true);
        setErr(null);
        const res = await fetch(fileUrl, { signal: ac.signal, mode: 'cors', cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          setErr(`Falha ao carregar arquivo GeoJSON (${res.status}). Verifique permissões CORS no armazenamento.`);
          return;
        }
        const text = await res.text();
        if (cancelled) return;
        const fc = parseJsonFileText(text);
        if (fc && fc.features.length > 0) {
          setRaw(fc);
          setErr(null);
        } else {
          setErr('Falha ao carregar arquivo GeoJSON: FeatureCollection ausente ou vazio.');
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const msg = e instanceof Error ? e.message : String(e);
        setErr(
          msg.includes('Failed to fetch') || msg.includes('NetworkError')
            ? 'Falha de rede ao carregar GeoJSON (CORS ou URL inacessível).'
            : `Falha ao carregar GeoJSON: ${msg}`,
        );
      } finally {
        if (!cancelled) setLoadingShare(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [initialFeatureCollection, sp]);

  useEffect(() => {
    if (initialFeatureCollection != null) return;
    if (geoFileUrlFromSearchParams(sp)) return;
    const idParam = sp?.get('id')?.trim();
    if (!idParam) return;

    let cancelled = false;
    const ac = new AbortController();

    void (async () => {
      try {
        setLoadingShare(true);
        setErr(null);
        const res = await fetch(`/api/mapa-talhoes/snapshot/${encodeURIComponent(idParam)}`, {
          signal: ac.signal,
        });
        if (cancelled) return;
        if (!res.ok) {
          setErr(
            res.status === 404
              ? 'Link expirado ou inválido. Gere um novo mapa na app FortSmart (Plantio → Exportar KML / mapa web).'
              : `Não foi possível carregar o mapa partilhado (${res.status}).`,
          );
          return;
        }
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        if (isFeatureCollectionGj(data as GeoJsonObject)) {
          setRaw(data as FeatureCollection);
          setErr(null);
        } else {
          setErr('Resposta do servidor sem GeoJSON válido.');
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setErr('Falha de rede ao carregar o mapa partilhado.');
      } finally {
        if (!cancelled) setLoadingShare(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [initialFeatureCollection, sp]);

  useEffect(() => {
    if (initialFeatureCollection != null) return;
    if (geoFileUrlFromSearchParams(sp)) return;
    if (sp?.get('id')?.trim()) return;
    const d = sp?.get('d');
    if (!d) return;
    const fc = decodeGeoJsonFromQuery(d);
    if (fc) {
      setRaw(fc);
      setErr(null);
    } else {
      setErr(
        'O parâmetro d= na URL está incompleto ou inválido (navegadores cortam URLs muito longas). Use Visualizar mapa (web) no app ou importe um .geojson.',
      );
    }
  }, [sp, initialFeatureCollection]);

  useEffect(() => {
    if (initialFeatureCollection != null) return;
    if (!legacyTokenPathRegex) return;
    if (geoFileUrlFromSearchParams(sp)) return;
    if (sp?.get('id')?.trim()) return;
    if (raw != null) return;

    const m = pathname?.match(legacyTokenPathRegex);
    const token = m?.[1]?.trim();
    if (!token) return;

    let cancelled = false;
    const ac = new AbortController();

    void (async () => {
      try {
        setLoadingShare(true);
        setErr(null);
        const res = await fetch(`/api/mapa-talhoes/snapshot/${encodeURIComponent(token)}`, {
          signal: ac.signal,
        });
        if (cancelled) return;
        if (!res.ok) {
          setErr(
            res.status === 404
              ? 'Link expirado ou inválido. Gere um novo mapa na app FortSmart (Plantio → Exportar KML / mapa web).'
              : `Não foi possível carregar o mapa partilhado (${res.status}).`,
          );
          return;
        }
        const data = (await res.json()) as unknown;
        if (cancelled) return;
        if (isFeatureCollectionGj(data as GeoJsonObject)) {
          setRaw(data as FeatureCollection);
          setErr(null);
        } else {
          setErr('Resposta do servidor sem GeoJSON válido.');
        }
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setErr('Falha de rede ao carregar o mapa partilhado.');
      } finally {
        if (!cancelled) setLoadingShare(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [initialFeatureCollection, raw, pathname, sp, legacyTokenPathRegex]);

  return { raw, setRaw, err, setErr, loadingShare, hostHint };
}
