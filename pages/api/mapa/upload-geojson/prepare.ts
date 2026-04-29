import type { NextApiRequest, NextApiResponse } from 'next';

import { prepareR2GeoJsonUpload, r2CredentialsPresent } from '@/lib/cloudflare/r2-geojson-upload';

function publicOriginFromReq(req: NextApiRequest): string {
  const xfh = String(req.headers['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();
  const host = xfh || String(req.headers.host ?? '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim() || 'https';
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

/**
 * POST /api/mapa/upload-geojson/prepare
 *
 * Fluxo oficial enterprise: **Cloudflare R2** (env `R2_*`) → PUT assinado + mapa via `?file=`.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, success: false, error: 'Método não permitido' });
  }

  if (!r2CredentialsPresent()) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: 'r2_unconfigured',
      error: 'Cloudflare R2 não configurado (R2_* ausente).',
    });
  }

  const base = publicOriginFromReq(req).replace(/\/$/, '');
  const r2 = await prepareR2GeoJsonUpload();
  if (!r2.ok) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: r2.code,
      error: r2.message,
    });
  }
  const fileParam = encodeURIComponent(r2.publicUrl);
  return res.status(200).json({
    success: true,
    ok: true,
    requires_complete: false,
    storage_backend: 'r2',
    map_id: r2.mapId,
    bucket: process.env.R2_BUCKET_NAME!.trim(),
    storage_path: r2.storagePath,
    upload_url: r2.uploadUrl,
    /** R2 público onde o objeto estará disponível depois do PUT. */
    public_url: r2.publicUrl,
    expires_in_seconds: 3600,
    url_partial: `/mapa-talhoes?file=${fileParam}`,
    url: `${base}/mapa-talhoes?file=${fileParam}`,
  });
}
