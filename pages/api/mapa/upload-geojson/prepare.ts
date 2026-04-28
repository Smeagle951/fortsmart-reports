import { randomBytes } from 'crypto';

import type { NextApiRequest, NextApiResponse } from 'next';

import { getSupabaseService } from '@/lib/supabase';
import { mapaSnapshotBucketName } from '@/lib/mapa-snapshot-storage';

const SNAPSHOT_FOLDER = 'snapshots';

/** `mapa_2026_ab12cd34ef` */
function generateMapId(): string {
  const y = new Date().getFullYear();
  const hex = randomBytes(5).toString('hex');
  return `mapa_${y}_${hex}`;
}

/** path objeto no bucket = …/snapshots/mapa_YEAR_hex.geojson */
function storagePathForMapId(mapId: string): string {
  return `${SNAPSHOT_FOLDER}/${mapId}.geojson`;
}

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
 * Cria token legível + URL assinada para PUT direto ao Storage (geoJSON não passa pelo body da Vercel).
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

  const bucket = mapaSnapshotBucketName();
  let mapId = '';
  let signed: {
    signedUrl: string;
    path: string;
    token: string;
  } | null = null;
  let lastSignMsg = '';

  for (let attempt = 0; attempt < 8; attempt++) {
    mapId = generateMapId();
    const path = storagePathForMapId(mapId);

    const out = await svc.storage.from(bucket).createSignedUploadUrl(path, {
      upsert: true,
    });

    if (!out.error && out.data) {
      signed = {
        signedUrl: out.data.signedUrl,
        path: out.data.path ?? path,
        token: String((out.data as { token?: unknown }).token ?? ''),
      };
      break;
    }

    const msg = String(out.error?.message ?? '');
    lastSignMsg = msg;
    if (
      msg.toLowerCase().includes('bucket') ||
      msg.includes('not_found') ||
      msg.includes('Not found')
    ) {
      console.error('[mapa/upload prepare] bucket:', bucket, out.error?.message);
      return res.status(503).json({
        ok: false,
        success: false,
        code: 'bucket_missing',
        bucket,
        error:
          `Bucket Storage "${bucket}" inexistente ou inacessível. Crie o bucket privado em Supabase → Storage (${bucket}) ou defina SUPABASE_MAP_SNAPSHOT_BUCKET.`,
      });
    }

    console.error(`[mapa/upload prepare] createSignedUploadUrl (${attempt + 1}/8):`, msg);
    if (attempt < 7) {
      await new Promise((r) => setTimeout(r, 150 * (attempt + 1)));
    }
  }

  if (!signed) {
    return res.status(503).json({
      ok: false,
      success: false,
      code: 'storage_sign_failed',
      error: lastSignMsg || 'Falha ao criar URL de upload assinado.',
    });
  }

  const base = publicOriginFromReq(req).replace(/\/$/, '');

  return res.status(200).json({
    success: true,
    ok: true,
    map_id: mapId,
    bucket,
    /** Caminho dentro do bucket; usado no passo „complete“. */
    storage_path: signed.path,
    upload_url: signed.signedUrl,
    upload_token: signed.token.length > 0 ? signed.token : undefined,
    expires_in_seconds: 7200,
    url_partial: `/mapa-talhoes?id=${encodeURIComponent(mapId)}`,
    url: `${base}/mapa-talhoes?id=${encodeURIComponent(mapId)}`,
  });
}
