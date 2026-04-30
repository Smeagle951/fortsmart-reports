import type { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes } from 'crypto';

import {
  prepareR2JsonUploadForSoilPanel,
  isR2ConfiguredAsync,
} from '@/lib/cloudflare/r2-geojson-upload';

function publicOriginFromReq(req: NextApiRequest): string {
  const xfh = String(req.headers['x-forwarded-host'] ?? '')
    .split(',')[0]
    .trim();
  const host = xfh || String(req.headers.host ?? '').split(',')[0].trim();
  const proto = String(req.headers['x-forwarded-proto'] ?? 'https').split(',')[0].trim() || 'https';
  if (host) return `${proto}://${host}`;
  const canonical = process.env.NEXT_PUBLIC_CANONICAL_URL?.trim();
  if (canonical) {
    try {
      return new URL(canonical).origin;
    } catch {
      return 'https://relatorios.fortsmart-agro.com.br';
    }
  }
  return 'https://relatorios.fortsmart-agro.com.br';
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, success: false, error: 'Método não permitido' });
  }

  const base = publicOriginFromReq(req).replace(/\/$/, '');
  if (!(await isR2ConfiguredAsync())) {
    const mapId = `amostragem_${new Date().getFullYear()}_${randomBytes(5).toString('hex')}`;
    const fallbackFileUrl = `${base}/api/painel-amostragem/upload-json/put/${encodeURIComponent(mapId)}`;
    const fileParam = encodeURIComponent(fallbackFileUrl);
    return res.status(200).json({
      ok: true,
      success: true,
      requires_complete: false,
      storage_backend: 'supabase_share_fallback',
      map_id: mapId,
      bucket: 'mapa_talhoes_shares',
      storage_path: mapId,
      upload_url: fallbackFileUrl,
      public_url: fallbackFileUrl,
      expires_in_seconds: 3600,
      url_partial: `/painel-amostragem?file=${fileParam}`,
      url: `${base}/painel-amostragem?file=${fileParam}`,
    });
  }

  const prepared = await prepareR2JsonUploadForSoilPanel();
  if (!prepared.ok) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: prepared.code,
      error: prepared.message,
    });
  }

  const fileParam = encodeURIComponent(prepared.publicUrl);
  return res.status(200).json({
    ok: true,
    success: true,
    requires_complete: false,
    storage_backend: 'r2',
    map_id: prepared.mapId,
    bucket: prepared.bucketName,
    storage_path: prepared.storagePath,
    upload_url: prepared.uploadUrl,
    public_url: prepared.publicUrl,
    expires_in_seconds: 3600,
    url_partial: `/painel-amostragem?file=${fileParam}`,
    url: `${base}/painel-amostragem?file=${fileParam}`,
  });
}
