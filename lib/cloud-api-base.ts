import { resolveFortsmartApiBase } from '@/lib/fortsmart-api-base';

/**
 * Base da API cloud (Express `fortsmart-cloud-api`), onde vivem `/windows/*`.
 * Preferir `FORTSMART_CLOUD_API_URL`; caso contrário reutiliza `FORTSMART_API_URL`.
 * Só para Route Handlers / server-side.
 */
export function resolveCloudApiBase(): string {
  const dedicated = process.env.FORTSMART_CLOUD_API_URL?.trim();
  if (dedicated) return dedicated.replace(/\/$/, '');
  return resolveFortsmartApiBase();
}

/** Bearer da API key (mesmo formato do middleware `requireApiKey`). */
export function resolveWindowsApiBearer(): string | null {
  const raw =
    process.env.FORTSMART_WINDOWS_API_BEARER?.trim() ??
    process.env.FORTSMART_CLOUD_API_BEARER?.trim() ??
    '';
  return raw || null;
}
