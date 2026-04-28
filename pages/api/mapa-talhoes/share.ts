import { randomBytes } from 'crypto';

import type { NextApiRequest, NextApiResponse } from 'next';
import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';

const MAX_BODY_BYTES = 4_500_000;
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * App Router (`app/api/.../route`) limita o body a ~1MB — GeoJSON de vários talhões
 * estoura; Pages API com bodyParser consegue aceitar até 4,5MB (alinhado ao Vercel).
 */
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4.5mb',
    },
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

function extractFc(body: unknown): FeatureCollection | null {
  if (isFeatureCollection(body)) return body;
  if (body !== null && typeof body === 'object' && 'geojson' in body) {
    const g = (body as { geojson?: unknown }).geojson;
    if (isFeatureCollection(g)) return g;
  }
  return null;
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  }

  const svc = getSupabaseService();
  if (!svc) {
    return res.status(503).json({
      ok: false,
      code: 'supabase_unconfigured',
      error: 'Servidor sem Supabase (service role).',
    });
  }

  const cl = req.headers['content-length'];
  const len = typeof cl === 'string' ? Number(cl) : 0;
  if (len > MAX_BODY_BYTES) {
    return res.status(413).json({ ok: false, error: 'Payload demasiado grande (máx. ~4,5 MB).' });
  }

  const body: unknown = req.body;
  const fc = extractFc(body);
  if (!fc) {
    return res.status(400).json({ ok: false, error: 'Esperado um FeatureCollection GeoJSON válido.' });
  }
  if (!Array.isArray(fc.features) || fc.features.length === 0) {
    return res.status(400).json({
      ok: false,
      code: 'no_features',
      error:
        'Nenhum polígono no GeoJSON. Confirme que os talhões têm coordenadas no mapa; sem geometria não há o que desenhar.',
    });
  }

  const serialized = JSON.stringify(fc);
  if (serialized.length > MAX_BODY_BYTES) {
    return res
      .status(413)
      .json({ ok: false, error: 'GeoJSON demasiado grande para link curto (tente menos talhões ou use export ficheiro).' });
  }

  const id = randomBytes(9).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  const { error } = await svc.from('mapa_talhoes_shares').insert({
    id,
    geojson: fc as unknown as Record<string, unknown>,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[mapa-talhoes/share] insert:', error.message);
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return res.status(503).json({
        ok: false,
        code: 'table_missing',
        error:
          'Tabela mapa_talhoes_shares inexistente. Execute: fortsmart-reports/supabase/migrations/20260422120000_mapa_talhoes_shares.sql (ou docs/migrations/20260422120000_mapa_talhoes_shares.sql).',
      });
    }
    return res.status(500).json({ ok: false, error: 'Falha ao guardar snapshot.' });
  }

  const origin = publicOriginFromReq(req);
  const base = `${origin.replace(/\/$/, '')}`;
  /** Link canónico (`?id=`) — evita URLs longas tipo `?d=` ou path dedicado só client */
  const url = `${base}/mapa-talhoes?id=${encodeURIComponent(id)}`;

  return res.status(200).json({
    success: true,
    ok: true,
    map_id: id,
    token: id,
    url,
  });
}
