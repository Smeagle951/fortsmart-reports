import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

/** Lê snapshot público por id (rota /mapa-talhoes/m/[token]). */
export async function getMapaTalhoesShareById(id: string): Promise<FeatureCollection | null> {
  const raw = String(id ?? '').trim();
  if (raw.length < 8 || raw.length > 64) return null;

  const svc = getSupabaseService();
  if (!svc) return null;

  const { data, error } = await svc
    .from('mapa_talhoes_shares')
    .select('geojson, expires_at')
    .eq('id', raw)
    .maybeSingle();

  if (error || !data) return null;

  const exp = data.expires_at as string | null | undefined;
  if (typeof exp === 'string' && exp.length > 0 && new Date(exp) < new Date()) {
    return null;
  }

  const gj = data.geojson;
  return isFeatureCollection(gj) ? gj : null;
}
