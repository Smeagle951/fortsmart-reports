function trimTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/**
 * Retorna uma URL absoluta usando o domínio canônico quando configurado.
 *
 * - Configure `NEXT_PUBLIC_CANONICAL_URL` na Vercel, ex.: `https://relatorios.fortsmart-agro.com.br`
 * - Se não existir, cai para `window.location.origin` (client) ou string vazia (server).
 */
export function getCanonicalOrigin(): string {
  const env =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CANONICAL_URL) ||
    '';
  const fromEnv = String(env || '').trim();
  if (fromEnv) return trimTrailingSlash(fromEnv);
  if (typeof window !== 'undefined' && window.location?.origin) {
    return trimTrailingSlash(window.location.origin);
  }
  return '';
}

/**
 * Monta a URL final para compartilhamento.
 * Se `pathAndQuery` for relativo (ex. `/r/abc?x=1`), ele é anexado ao origin canônico.
 */
export function buildShareUrl(pathAndQuery?: string): string {
  const origin = getCanonicalOrigin();
  if (!origin) return '';
  const p = String(pathAndQuery ?? '').trim();
  if (!p) return origin;
  if (/^https?:\/\//i.test(p)) return p;
  return origin + (p.startsWith('/') ? p : `/${p}`);
}

