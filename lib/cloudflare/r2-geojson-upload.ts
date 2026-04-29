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

type R2ObjectSpec = {
  folder: string;
  extension: string;
  contentType: string;
  idPrefix: string;
};

/** Resolvido a partir de `R2_*` com fallbacks para nomes usados no painel Cloudflare. */
export type R2ResolvedEnv = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
};

/**
 * Lista chaves lógicas ausentes (sem expor valores).
 * O **prepare** usa S3 API + credenciais em `process.env`, não o binding `GEOJSON_BUCKET`.
 */
export function r2ConfigurationGaps(): string[] {
  const g: string[] = [];
  const account =
    process.env.R2_ACCOUNT_ID?.trim() || process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  if (!account) {
    g.push('R2_ACCOUNT_ID ou CLOUDFLARE_ACCOUNT_ID');
  }
  if (!process.env.R2_ACCESS_KEY_ID?.trim()) {
    g.push('R2_ACCESS_KEY_ID');
  }
  if (!process.env.R2_SECRET_ACCESS_KEY?.trim()) {
    g.push('R2_SECRET_ACCESS_KEY');
  }
  const bucket =
    process.env.R2_BUCKET_NAME?.trim() || process.env.CLOUDFLARE_R2_BUCKET?.trim();
  if (!bucket) {
    g.push('R2_BUCKET_NAME ou CLOUDFLARE_R2_BUCKET');
  }
  if (!process.env.R2_PUBLIC_BASE_URL?.trim()) {
    g.push('R2_PUBLIC_BASE_URL');
  }
  return g;
}

export function resolveR2Env(): R2ResolvedEnv | null {
  const gaps = r2ConfigurationGaps();
  if (gaps.length > 0) return null;
  return {
    accountId:
      process.env.R2_ACCOUNT_ID!.trim() ||
      process.env.CLOUDFLARE_ACCOUNT_ID!.trim(),
    accessKeyId: process.env.R2_ACCESS_KEY_ID!.trim(),
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!.trim(),
    bucketName:
      process.env.R2_BUCKET_NAME!.trim() ||
      process.env.CLOUDFLARE_R2_BUCKET!.trim(),
    publicBaseUrl: process.env.R2_PUBLIC_BASE_URL!.trim(),
  };
}

/** Verifica ambiente obrigatório para upload assinado R2 → URL pública (GET público configurado no bucket). */
export function r2CredentialsPresent(): boolean {
  return r2ConfigurationGaps().length === 0;
}

/**
 * Cria PUT assinado (S3-compatível) sobre Cloudflare R2.
 * Bucket deve permitir GET público em `${R2_PUBLIC_BASE_URL}/{key}` (domínio r2.dev ou custom).
 */
export async function prepareR2GeoJsonUpload(): Promise<R2PrepareResult> {
  return prepareR2Upload({
    folder: SNAPSHOT_FOLDER,
    extension: 'geojson',
    contentType: 'application/geo+json',
    idPrefix: 'mapa',
  });
}

export async function prepareR2JsonUploadForSoilPanel(): Promise<R2PrepareResult> {
  return prepareR2Upload({
    folder: 'painel-amostragem',
    extension: 'json',
    contentType: 'application/json',
    idPrefix: 'amostragem',
  });
}

async function prepareR2Upload(spec: R2ObjectSpec): Promise<R2PrepareResult> {
  const cfg = resolveR2Env();
  if (!cfg) {
    return {
      ok: false,
      code: 'r2_unconfigured',
      message: `Configure: ${r2ConfigurationGaps().join('; ')}.`,
    };
  }
  const publicRoot = cfg.publicBaseUrl.replace(/\/+$/, '');

  const mapId = `${spec.idPrefix}_${new Date().getFullYear()}_${randomBytes(5).toString('hex')}`;
  const key = `${spec.folder}/${mapId}.${spec.extension}`;
  const publicUrl = `${publicRoot}/${key}`;

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
    forcePathStyle: true,
  });

  const command = new PutObjectCommand({
    Bucket: cfg.bucketName,
    Key: key,
    ContentType: spec.contentType,
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
