import type { NextApiRequest, NextApiResponse } from 'next';

import { readWorkerEnvString } from '@/lib/cloudflare/r2-geojson-upload';

const MAX_BYTES = 8_000_000;

function hostAllowed(hostname: string, allowedBases: string[]): boolean {
  const h = hostname.toLowerCase();
  if (h.endsWith('.r2.dev') || h.includes('.r2.cloudflarestorage.com')) return true;
  for (const base of allowedBases) {
    try {
      const u = new URL(base);
      if (u.hostname.toLowerCase() === h) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

/**
 * GET /api/mapa/geojson-proxy?u=<urlencoded-public-r2-url>
 *
 * Proxy same-origin para o mapa web (`?file=`). O bucket R2 público muitas vezes
 * não envia `Access-Control-Allow-Origin`, e o browser bloqueia o fetch cross-origin.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Método não permitido' });
  }

  const raw = typeof req.query.u === 'string' ? req.query.u.trim() : '';
  if (!raw) {
    return res.status(400).json({
      ok: false,
      error: 'Parâmetro u= (URL pública do GeoJSON) é obrigatório.',
    });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return res.status(400).json({ ok: false, error: 'URL inválida em u=.' });
  }

  if (target.protocol !== 'https:' && target.protocol !== 'http:') {
    return res.status(400).json({ ok: false, error: 'Apenas http(s) permitido.' });
  }

  const publicBase = (await readWorkerEnvString('R2_PUBLIC_BASE_URL', 'R2_PUBLIC_BASE_UR')) ?? '';
  const allowed = publicBase ? [publicBase] : [];
  if (!hostAllowed(target.hostname, allowed)) {
    return res.status(403).json({
      ok: false,
      error: 'Host não permitido para proxy GeoJSON.',
      host: target.hostname,
    });
  }

  try {
    const upstream = await fetch(target.toString(), {
      method: 'GET',
      headers: { Accept: 'application/geo+json, application/json, */*' },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({
        ok: false,
        error: `Origem R2 respondeu HTTP ${upstream.status}.`,
      });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.byteLength > MAX_BYTES) {
      return res.status(413).json({ ok: false, error: 'GeoJSON demasiado grande.' });
    }

    const contentType =
      upstream.headers.get('content-type')?.includes('json') === true
        ? upstream.headers.get('content-type')!
        : 'application/geo+json; charset=utf-8';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-FortSmart-Proxy', 'geojson-r2');
    return res.status(200).send(buf);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[geojson-proxy]', msg);
    return res.status(502).json({
      ok: false,
      error: `Falha ao obter GeoJSON remoto: ${msg.slice(0, 200)}`,
    });
  }
}
