import type { NextApiRequest, NextApiResponse } from 'next';
import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';
import { mapaSnapshotBucketName } from '@/lib/mapa-snapshot-storage';

const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const SNAPSHOT_FOLDER = 'snapshots';

const MAP_ID_RE = /^mapa_\d{4}_[a-f0-9]{10}$/i;

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

function publicOriginFromReq(req: NextApiRequest): string {
  const xfh = String(req.headers['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();
  const host = xfh || String(req.headers.host ?? '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https')
    .split(',')[0]
    .trim() || 'https';
  if (host) {
    return `${proto}://${host}`;
  }
  const canonical = process.env.NEXT_PUBLIC_CANONICAL_URL?.trim();
  if (canonical) {
    try {
      return new URL(canonical).origin;
    } catch {
      /* fallthrough */
    }
  }
  return 'https://relatorios.fortsmart-agro.com.br';
}

function storagePathForMapId(mapId: string): string {
  return `${SNAPSHOT_FOLDER}/${mapId}.geojson`;
}

type CompleteBody = {
  map_id?: string;
  safra?: string | null;
  cultura?: string | null;
  total_talhoes?: number | null;
};

/**
 * POST /api/mapa/upload-geojson/complete
 * Chamado pelo app **depois** do PUT bem-sucedido ao Storage; persiste linha DB e valida GeoJSON.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, success: false, error: 'Método não permitido' });
  }

  const svc = getSupabaseService();
  if (!svc) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: 'supabase_unconfigured',
      error: 'Servidor sem Supabase (service role).',
    });
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as CompleteBody) : {};
  const mapIdRaw = typeof body.map_id === 'string' ? body.map_id.trim() : '';

  if (!mapIdRaw || !MAP_ID_RE.test(mapIdRaw)) {
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'map_id inválido (esperado formato mapa_ANO_HEX).',
    });
  }

  const bucket = mapaSnapshotBucketName();
  const storagePath = storagePathForMapId(mapIdRaw);

  const { data: blob, error: downErr } = await svc.storage.from(bucket).download(storagePath);

  if (downErr || !blob) {
    console.error('[mapa/complete] download:', storagePath, downErr?.message);
    return res.status(400).json({
      ok: false,
      success: false,
      code: 'storage_object_missing',
      error:
        'GeoJSON não encontrado no Storage. Confirme que o PUT para upload_url terminou antes de chamar „complete“. ',
    });
  }

  let fc: FeatureCollection;
  try {
    const txt = await blob.text();
    const parsed = JSON.parse(txt) as unknown;
    if (!isFeatureCollection(parsed) || parsed.features.length === 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        code: 'invalid_geojson',
        error: 'FeatureCollection vazio ou inválido após upload.',
      });
    }
    fc = parsed;
  } catch (e) {
    console.error('[mapa/complete] parse:', e);
    return res.status(400).json({
      ok: false,
      success: false,
      error: 'Ficheiro no Storage não é GeoJSON válido.',
    });
  }

  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  const totalTalhoesRaw = body.total_talhoes;
  const totalTalhoes =
    typeof totalTalhoesRaw === 'number' &&
    Number.isFinite(totalTalhoesRaw) &&
    totalTalhoesRaw >= 0
      ? Math.floor(totalTalhoesRaw)
      : fc.features.filter((f) => {
          const gt = String((f.geometry as { type?: string } | undefined)?.type ?? '').toUpperCase();
          return gt === 'MULTIPOLYGON' || gt === 'POLYGON';
        }).length;

  const { error } = await svc.from('mapa_talhoes_shares').insert({
    id: mapIdRaw,
    geojson: null as unknown as Record<string, unknown>,
    storage_path: storagePath,
    expires_at: expiresAt,
    safra:
      typeof body.safra === 'string' && body.safra.trim().length > 0 ? body.safra.trim() : null,
    cultura:
      typeof body.cultura === 'string' && body.cultura.trim().length > 0
        ? body.cultura.trim()
        : null,
    total_talhoes: totalTalhoes,
  });

  if (error) {
    console.error('[mapa/complete] insert:', error.message);
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        success: false,
        error:
          'Este map_id já existe. Repita desde „prepare“. ',
      });
    }
    if (
      String(error.message ?? '').includes('relation') &&
      String(error.message ?? '').includes('does not exist')
    ) {
      return res.status(503).json({
        ok: false,
        success: false,
        code: 'table_missing',
        error: 'Tabela mapa_talhoes_shares inexistente ou migração SQL não aplicada.',
      });
    }

    let hint = '';
    if (String(error.message ?? '').includes('null value violates') && String(error.message ?? '').includes('geojson')) {
      hint =
        ' Execute a migração que torna geojson opcional e adiciona storage_path (docs/migrations/20260428120000_mapa_talhoes_storage_path.sql).';
    }

    return res.status(500).json({
      ok: false,
      success: false,
      code: 'insert_failed',
      pg_code: error.code,
      hint,
      error: String(error.message ?? 'Falha ao registar snapshot.').slice(0, 400),
    });
  }

  const origin = publicOriginFromReq(req);
  const base = `${origin.replace(/\/$/, '')}`;
  const url = `${base}/mapa-talhoes?id=${encodeURIComponent(mapIdRaw)}`;

  return res.status(200).json({
    success: true,
    ok: true,
    map_id: mapIdRaw,
    url,
  });
}
