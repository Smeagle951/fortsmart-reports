/**
 * Resolução de URL/keys Supabase do FortSmart Agro.
 * Sem fallback de chave no repositório — configure env (Vercel / .env.local).
 */

/** Projeto legado (app principal) — não usar para relatórios web. */
const LEGACY_SUPABASE_PROJECT_REF = 'ywkhjrpdoouxnqdmfddc';

function isLegacySupabaseUrl(url: string): boolean {
  return url.includes(LEGACY_SUPABASE_PROJECT_REF);
}

function pickFirstValidUrl(...candidates: Array<string | undefined>): string {
  for (const raw of candidates) {
    const url = raw?.trim();
    if (!url) continue;
    if (isLegacySupabaseUrl(url)) continue;
    return url;
  }
  return '';
}

export function resolveFortsmartSupabaseUrl(): string {
  return pickFirstValidUrl(
    process.env.URL_SUPABASE,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
  );
}

function supabaseProjectRefFromUrl(url: string): string | null {
  const m = url.match(/https?:\/\/([^.]+)\.supabase\.co/);
  return m?.[1] ?? null;
}

function supabaseProjectRefFromJwt(key: string): string | null {
  try {
    const parts = key.split('.');
    if (parts.length < 2) return null;
    const payload = JSON.parse(
      Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'),
    ) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

function jwtMatchesSupabaseUrl(key: string, url: string): boolean {
  const urlRef = supabaseProjectRefFromUrl(url);
  const keyRef = supabaseProjectRefFromJwt(key);
  if (!urlRef || !keyRef) return true;
  return urlRef === keyRef;
}

function pickFirstValidKey(url: string, ...candidates: Array<string | undefined>): string {
  for (const raw of candidates) {
    const key = raw?.trim();
    if (!key) continue;
    if (key.startsWith('sb_publishable_')) continue;
    if (keyRefIsLegacy(key)) continue;
    if (!jwtMatchesSupabaseUrl(key, url)) continue;
    return key;
  }
  return '';
}

function keyRefIsLegacy(key: string): boolean {
  const ref = supabaseProjectRefFromJwt(key);
  return ref === LEGACY_SUPABASE_PROJECT_REF;
}

export function resolveFortsmartSupabaseAnonKey(): string {
  const url = resolveFortsmartSupabaseUrl();
  return pickFirstValidKey(
    url,
    process.env.SUPABASE_ANON_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Service role: aceita nomes usados no painel Vercel/Supabase. */
export function resolveFortsmartSupabaseServiceRoleKey(): string {
  const url = resolveFortsmartSupabaseUrl();
  return pickFirstValidKey(
    url,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  );
}

export function hasFortsmartSupabaseConfig(): boolean {
  const url = resolveFortsmartSupabaseUrl();
  const anon = resolveFortsmartSupabaseAnonKey();
  const service = resolveFortsmartSupabaseServiceRoleKey();
  return url.length > 0 && (anon.length > 0 || service.length > 0);
}
