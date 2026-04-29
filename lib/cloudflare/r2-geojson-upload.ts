import { randomBytes } from 'crypto';

import { getCloudflareContext } from '@opennextjs/cloudflare';
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
  | {
      ok: true;
      uploadUrl: string;
      publicUrl: string;
      storagePath: string;
      mapId: string;
      bucketName: string;
    }
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
 * Lê uma variável definida no painel Cloudflare (Workers).
 * No deploy OpenNext, `process.env` pode ficar vazio no runtime; o valor vem em `getCloudflareContext().env`.
 *
 * @see https://opennext.js.org/cloudflare/howtos/env-vars
 */
export async function readWorkerEnvString(...keys: string[]): Promise<string | undefined> {
  for (const key of keys) {
    const fromProcess = process.env[key]?.trim();
    if (fromProcess) return fromProcess;
  }
  try {
    const { env } = await getCloudflareContext();
    const record = env as Record<string, unknown>;
    for (const key of keys) {
      const raw = record[key];
      if (typeof raw === 'string' && raw.trim().length > 0) return raw.trim();
    }
  } catch {
    /* next dev sem Worker, SSR, etc. */
  }
  return undefined;
}

/** Lista chaves lógicas ausentes (sem expor valores). */
export async function r2ConfigurationGapsAsync(): Promise<string[]> {
  const g: string[] = [];
  if (!(await readWorkerEnvString('R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID'))) {
    g.push('R2_ACCOUNT_ID ou CLOUDFLARE_ACCOUNT_ID');
  }
  if (!(await readWorkerEnvString('R2_ACCESS_KEY_ID'))) {
    g.push('R2_ACCESS_KEY_ID');
  }
  if (!(await readWorkerEnvString('R2_SECRET_ACCESS_KEY'))) {
    g.push('R2_SECRET_ACCESS_KEY');
  }
  if (!(await readWorkerEnvString('R2_BUCKET_NAME', 'CLOUDFLARE_R2_BUCKET'))) {
    g.push('R2_BUCKET_NAME ou CLOUDFLARE_R2_BUCKET');
  }
  if (!(await readWorkerEnvString('R2_PUBLIC_BASE_URL'))) {
    g.push('R2_PUBLIC_BASE_URL');
  }
  return g;
}

export async function isR2ConfiguredAsync(): Promise<boolean> {
  return (await r2ConfigurationGapsAsync()).length === 0;
}

export async function resolveR2EnvAsync(): Promise<R2ResolvedEnv | null> {
  const accountId = await readWorkerEnvString('R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID');
  const accessKeyId = await readWorkerEnvString('R2_ACCESS_KEY_ID');
  const secretAccessKey = await readWorkerEnvString('R2_SECRET_ACCESS_KEY');
  const bucketName = await readWorkerEnvString('R2_BUCKET_NAME', 'CLOUDFLARE_R2_BUCKET');
  const publicBaseUrl = await readWorkerEnvString('R2_PUBLIC_BASE_URL');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName || !publicBaseUrl) {
    return null;
  }
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    publicBaseUrl,
  };
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
  const cfg = await resolveR2EnvAsync();
  if (!cfg) {
    const gaps = await r2ConfigurationGapsAsync();
    return {
      ok: false,
      code: 'r2_unconfigured',
      message:
        gaps.length > 0
          ? `Configure: ${gaps.join('; ')}.`
          : 'Ambiente R2 incompleto.',
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

  return {
    ok: true,
    uploadUrl,
    publicUrl,
    storagePath: key,
    mapId,
    bucketName: cfg.bucketName,
  };
}
