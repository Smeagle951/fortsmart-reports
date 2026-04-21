/**
 * Micro-cache in-process: tokens que falharam com `not_found` (Postgres + Supabase).
 * Reduz martelamento em /r/[token] inválido; TTL curto (10–30s) para não atrasar publicação recente.
 */

const map = new Map<string, number>();

function ttlMs(): number {
  if (process.env.FORTSMART_RELATORIO_NOT_FOUND_CACHE_MS === '0') return 0;
  const n = Number(process.env.FORTSMART_RELATORIO_NOT_FOUND_CACHE_MS);
  if (Number.isFinite(n) && n >= 1_000 && n <= 120_000) return Math.floor(n);
  return 20_000;
}

export function peekTokenNotFoundCached(token: string): boolean {
  if (ttlMs() <= 0) return false;
  const t = String(token ?? '').trim();
  if (!t) return false;
  const until = map.get(t);
  if (until == null) return false;
  if (Date.now() > until) {
    map.delete(t);
    return false;
  }
  return true;
}

export function setTokenNotFoundCached(token: string): void {
  if (ttlMs() <= 0) return;
  const t = String(token ?? '').trim();
  if (!t) return;
  map.set(t, Date.now() + ttlMs());
  if (map.size > 2_000) {
    const now = Date.now();
    for (const [k, u] of map) {
      if (u < now) map.delete(k);
    }
  }
}
