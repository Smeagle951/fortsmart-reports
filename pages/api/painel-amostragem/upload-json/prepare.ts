import type { NextApiRequest, NextApiResponse } from 'next';

import {
  prepareR2JsonUploadForSoilPanel,
  r2CredentialsPresent,
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

  if (!r2CredentialsPresent()) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: 'r2_unconfigured',
      error: 'Ambiente R2 não configurado no servidor.',
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

  const base = publicOriginFromReq(req).replace(/\/$/, '');
  const fileParam = encodeURIComponent(prepared.publicUrl);
  return res.status(200).json({
    ok: true,
    success: true,
    requires_complete: false,
    storage_backend: 'r2',
    map_id: prepared.mapId,
    bucket: process.env.R2_BUCKET_NAME!.trim(),
    storage_path: prepared.storagePath,
    upload_url: prepared.uploadUrl,
    public_url: prepared.publicUrl,
    expires_in_seconds: 3600,
    url_partial: `/painel-amostragem?file=${fileParam}`,
    url: `${base}/painel-amostragem?file=${fileParam}`,
  });
}
