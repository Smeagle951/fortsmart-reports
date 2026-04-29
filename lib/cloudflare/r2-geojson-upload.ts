import { randomBytes } from 'crypto';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const SNAPSHOT_FOLDER = 'geojson';

/** `mapa_2026_ab12cd34ef` */
export function generateMapObjectId(): string {
  const y = new Date().getFullYear();
  const hex = randomBytes(5).toString('hex');
  return `mapa_${y}_${hex}`;
}

export function geojsonStorageKey(mapId: string): string {
  return `${SNAPSHOT_FOLDER}/${mapId}.geojson`;
}

export type R2PrepareResult =
  | { ok: true; uploadUrl: string; publicUrl: string; storagePath: string; mapId: string }
  | { ok: false; code: string; message: string };

/** Verifica ambiente obrigatório para upload assinado R2 → URL pública (GET público configurado no bucket). */
export function r2CredentialsPresent(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim() &&
    process.env.R2_BUCKET_NAME?.trim() &&
    process.env.R2_PUBLIC_BASE_URL?.trim()
  );
}

/**
 * Cria PUT assinado (S3-compatível) sobre Cloudflare R2.
 * Bucket deve permitir GET público em `${R2_PUBLIC_BASE_URL}/{key}` (domínio r2.dev ou custom).
 */
export async function prepareR2GeoJsonUpload(): Promise<R2PrepareResult> {
  const accountId = process.env.R2_ACCOUNT_ID!.trim();
  const bucket = process.env.R2_BUCKET_NAME!.trim();
  const publicRoot = process.env.R2_PUBLIC_BASE_URL!.trim().replace(/\/+$/, '');

  const mapId = generateMapObjectId();
  const key = geojsonStorageKey(mapId);
  const publicUrl = `${publicRoot}/${key}`;

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    },
    forcePathStyle: true,
  });

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: 'application/geo+json',
    CacheControl: 'public, max-age=300',
  });

  let uploadUrl = '';
  try {
    uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[R2/prepare]', msg);
    return {
      ok: false,
      code: 'r2_sign_failed',
      message:
        msg.length > 0
          ? msg.slice(0, 400)
          : 'Falha ao assinar PUT no R2.',
    };
  }

  return { ok: true, uploadUrl, publicUrl, storagePath: key, mapId };
}
