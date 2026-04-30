import type { NextApiRequest, NextApiResponse } from 'next';

import { getSupabaseService } from '@/lib/supabase';

const MAX_BODY_BYTES = 8_000_000;
const TTL_MS = 90 * 24 * 60 * 60 * 1000;
const SHARE_ID_RE = /^amostragem_\d{4}_[a-f0-9]{10}$/i;

export const config = {
  api: {
    bodyParser: false,
  },
};

function isPanelPayload(x: unknown): x is Record<string, unknown> {
  return (
    x !== null &&
    typeof x === 'object' &&
    'campaign' in x &&
    'points' in x &&
    Array.isArray((x as { points?: unknown }).points)
  );
}

function payloadFromCell(cell: unknown): Record<string, unknown> | null {
  if (isPanelPayload(cell)) return cell;
  if (typeof cell === 'string' && cell.trim()) {
    try {
      const parsed = JSON.parse(cell) as unknown;
      return isPanelPayload(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
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
  if (req.method !== 'PUT' && req.method !== 'GET') {
    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ ok: false, success: false, error: 'Método não permitido' });
  }

  const id = typeof req.query.id === 'string' ? req.query.id.trim() : '';
  if (!id || !SHARE_ID_RE.test(id)) {
    return res.status(400).json({ ok: false, success: false, error: 'id inválido.' });
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

  if (req.method === 'GET') {
    const { data, error } = await svc
      .from('mapa_talhoes_shares')
      .select('geojson, expires_at')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return res.status(404).json({ ok: false, error: 'not_found_or_expired' });
    }

    const expiresAt = data.expires_at as string | null | undefined;
    if (typeof expiresAt === 'string' && expiresAt.length > 0 && new Date(expiresAt) < new Date()) {
      return res.status(404).json({ ok: false, error: 'not_found_or_expired' });
    }

    const payload = payloadFromCell(data.geojson);
    if (!payload) {
      return res.status(404).json({ ok: false, error: 'not_found_or_expired' });
    }

    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(payload);
  }

  let payload: Record<string, unknown>;
  try {
    const raw = await readRawBody(req);
    const parsed = JSON.parse(raw.toString('utf8')) as unknown;
    if (!isPanelPayload(parsed)) {
      return res.status(400).json({
        ok: false,
        success: false,
        code: 'invalid_payload',
        error: 'JSON inválido: deve conter campaign e points.',
      });
    }
    payload = parsed;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message === 'body_too_large' ? 413 : 400;
    return res.status(status).json({
      ok: false,
      success: false,
      code: message === 'body_too_large' ? 'payload_too_large' : 'invalid_json',
      error:
        message === 'body_too_large'
          ? 'JSON demasiado grande para fallback Supabase.'
          : 'Corpo enviado não é JSON válido.',
    });
  }

  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();
  const { error } = await svc.from('mapa_talhoes_shares').insert({
    id,
    geojson: payload,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[painel-amostragem/upload-json/put] insert:', JSON.stringify(error));
    return res.status(error.code === '23505' ? 409 : 500).json({
      ok: false,
      success: false,
      code: error.code === '23505' ? 'share_id_exists' : 'insert_failed',
      pg_code: error.code,
      error: String(error.message ?? 'Falha ao guardar JSON.').slice(0, 400),
    });
  }

  return res.status(200).json({ ok: true, success: true, map_id: id });
}
