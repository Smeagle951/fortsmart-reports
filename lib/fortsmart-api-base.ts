/**
 * URL base da API Node (Express + Prisma / Neon).
 * Só para código **server-side** (Route Handlers, Server Actions).
 *
 * Ordem: `FORTSMART_API_URL` → fallback Vercel → fallback local.
 */
export function resolveFortsmartApiBase(): string {
  const fromEnv = process.env.FORTSMART_API_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  if (process.env.VERCEL) return 'https://api.fortsmart-agro.com.br';
  return 'http://127.0.0.1:3000';
}
