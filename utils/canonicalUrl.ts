function trimTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

/**
 * Normaliza o valor da Vercel/painel: muitas vezes só vem o host (`relatorios.fortsmart-agro.com.br`)
 * sem `https://`. Sem o esquema, `new URL()` quebra e o middleware pode derrubar a rota.
 * Aceita também `https://...` completo.
 */
export function normalizeCanonicalBaseUrl(raw: string): string | null {
  let s = String(raw ?? '').trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) {
    s = `https://${s.replace(/^\/+/, '')}`;
  }
  try {
    const u = new URL(s);
    if (!u.hostname) return null;
    return trimTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return null;
  }
}

/**
 * Retorna uma URL absoluta usando o domínio canônico quando configurado.
 *
 * - Configure `NEXT_PUBLIC_CANONICAL_URL` na Vercel. Pode ser só o host (como no painel):
 *   `relatorios.fortsmart-agro.com.br` — o código adiciona `https://` automaticamente.
 * - Ou a URL completa: `https://relatorios.fortsmart-agro.com.br`
 * - Se não existir, cai para `window.location.origin` (client) ou string vazia (server).
 */
export function getCanonicalOrigin(): string {
  const env =
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_CANONICAL_URL) ||
    '';
  const fromEnv = String(env || '').trim();
  if (fromEnv) {
    const normalized = normalizeCanonicalBaseUrl(fromEnv);
    if (normalized) return normalized;
  }
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

