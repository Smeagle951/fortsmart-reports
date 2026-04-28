import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';
import { mapaSnapshotBucketName } from '@/lib/mapa-snapshot-storage';

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

/** Alguns drivers devolvem `jsonb` já como objeto; raros casos como string JSON. */
function geojsonFromCell(cell: unknown): FeatureCollection | null {
  if (isFeatureCollection(cell)) return cell;
  if (typeof cell === 'string' && cell.trim()) {
    try {
      const parsed = JSON.parse(cell) as unknown;
      return isFeatureCollection(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** ids legados (base64url 12+) ou mapa_ANO_hex (enterprise). */
function mapIdLooksValid(raw: string): boolean {
  const s = raw.trim();
  if (s.length < 10 || s.length > 128) return false;
  return /^mapa_\d{4}_[a-f0-9]{10}$/i.test(s) || /^[-_A-Za-z0-9]+$/.test(s);
}

/** Lê snapshot público por id (GeoJSON inline ou objeto no Storage). */
export async function getMapaTalhoesShareById(id: string): Promise<FeatureCollection | null> {
  let raw = String(id ?? '').trim();
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* já cru */
  }
  if (!mapIdLooksValid(raw)) return null;

  const svc = getSupabaseService();
  if (!svc) return null;

  const { data, error } = await svc
    .from('mapa_talhoes_shares')
    .select('geojson, storage_path, expires_at')
    .eq('id', raw)
    .maybeSingle();

  if (error || !data) return null;

  const exp = data.expires_at as string | null | undefined;
  if (typeof exp === 'string' && exp.length > 0 && new Date(exp) < new Date()) {
    return null;
  }

  const spath = typeof data.storage_path === 'string' ? data.storage_path.trim() : '';
  if (spath.length > 0) {
    const bucket = mapaSnapshotBucketName();
    const { data: dl, error: dErr } = await svc.storage.from(bucket).download(spath);
    if (dErr || !dl) return null;
    try {
      const text = await dl.text();
      const parsed = JSON.parse(text) as unknown;
      return isFeatureCollection(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return geojsonFromCell(data.geojson);
}
