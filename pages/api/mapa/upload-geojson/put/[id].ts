import type { NextApiRequest, NextApiResponse } from 'next';
import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';

const MAX_BODY_BYTES = 4_500_000;
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const MAP_ID_RE = /^mapa_\d{4}_[a-f0-9]{10}$/i;

export const config = {
  api: {
    bodyParser: false,
  },
};

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buf.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('body_too_large');
    }
    chunks.push(buf);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    res.setHeader('Allow', 'PUT');
    return res.status(405).json({ ok: false, success: false, error: 'Método não permitido' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id || !MAP_ID_RE.test(id)) {
    return res.status(400).json({ ok: false, success: false, error: 'map_id inválido.' });
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

  let fc: FeatureCollection;
  try {
    const raw = await readRawBody(req);
    const parsed = JSON.parse(raw.toString('utf8')) as unknown;
    if (!isFeatureCollection(parsed) || parsed.features.length === 0) {
      return res.status(400).json({
        ok: false,
        success: false,
        code: 'invalid_geojson',
        error: 'FeatureCollection vazio ou inválido.',
      });
    }
    fc = parsed;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message === 'body_too_large' ? 413 : 400;
    return res.status(status).json({
      ok: false,
      success: false,
      code: message === 'body_too_large' ? 'payload_too_large' : 'invalid_json',
      error:
        message === 'body_too_large'
          ? 'GeoJSON demasiado grande para fallback Supabase.'
          : 'Corpo enviado não é GeoJSON válido.',
    });
  }

  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const { error } = await svc.from('mapa_talhoes_shares').insert({
    id,
    geojson: fc as unknown as Record<string, unknown>,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[mapa/upload-geojson/put] insert:', JSON.stringify(error));
    if (error.code === '23505') {
      return res.status(409).json({
        ok: false,
        success: false,
        code: 'map_id_exists',
        error: 'Este map_id já existe. Repita a exportação.',
      });
    }
    return res.status(500).json({
      ok: false,
      success: false,
      code: 'insert_failed',
      pg_code: error.code,
      error: String(error.message ?? 'Falha ao guardar GeoJSON.').slice(0, 400),
    });
  }

  return res.status(200).json({ ok: true, success: true, map_id: id });
}
