import { createHmac, timingSafeEqual } from 'crypto';

/** Cookie de sessão do painel /admin e APIs de diagnóstico. */
export const ADMIN_SESSION_COOKIE = 'fs_admin';

/** Sessão curta (12h) — reduz janela se o cookie vazar. */
export const ADMIN_SESSION_MAX_AGE_SEC = 60 * 60 * 12;

function adminSessionSecret(): string {
  const dedicated = process.env.ADMIN_SESSION_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) return dedicated;
  const pwd = process.env.ADMIN_PASSWORD?.trim();
  if (pwd && pwd.length >= 8) return `fs-admin-v1:${pwd}`;
  return '';
}

/** Token opaco assinado: `v1.<expUnix>.<hmacBase64url>` */
export function createAdminSessionToken(): string {
  const secret = adminSessionSecret();
  if (!secret) {
    throw new Error('ADMIN_PASSWORD ou ADMIN_SESSION_SECRET não configurado');
  }
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE_SEC;
  const payload = `v1.${exp}`;
  const sig = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyAdminSessionToken(value: string | undefined | null): boolean {
  if (!value) return false;
  // Cookie legado previsível (`fs_admin=1`) — rejeitar sempre.
  if (value === '1') return false;

  const secret = adminSessionSecret();
  if (!secret) return false;

  const parts = value.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;

  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  const expected = createHmac('sha256', secret).update(payload).digest('base64url');
  const actual = parts[2];
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(actual);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function parseCookieHeader(
  cookieHeader: string | null | undefined,
  name: string,
): string | undefined {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) === name) {
      return decodeURIComponent(trimmed.slice(eq + 1));
    }
  }
  return undefined;
}

export function adminSessionFromCookieHeader(
  cookieHeader: string | null | undefined,
): boolean {
  return verifyAdminSessionToken(
    parseCookieHeader(cookieHeader, ADMIN_SESSION_COOKIE),
  );
}
