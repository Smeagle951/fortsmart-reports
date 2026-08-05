import type { NextRequest } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  adminSessionFromCookieHeader,
  verifyAdminSessionToken,
} from './admin-session';

/** Rotas de diagnóstico — não expor em produção sem sessão admin. */
export const DIAGNOSTIC_API_PATHS = [
  '/api/supabase-status',
  '/api/relatorio-public',
] as const;

export function isAdminSession(req: NextRequest): boolean {
  return verifyAdminSessionToken(req.cookies.get(ADMIN_SESSION_COOKIE)?.value);
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/** Em produção, só admin autenticado ou ambiente local. */
export function allowDiagnosticAccess(req: NextRequest): boolean {
  if (!isProduction()) return true;
  return isAdminSession(req);
}

/** Para route handlers que leem cookie via `headers()`. */
export function allowDiagnosticFromCookieHeader(
  cookieHeader: string | null | undefined,
): boolean {
  if (!isProduction()) return true;
  return adminSessionFromCookieHeader(cookieHeader);
}

export function isSensitivePublicPath(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower.endsWith('.md')) return true;
  if (lower.endsWith('.env') || lower.includes('.env.')) return true;
  if (lower.includes('readme')) return true;
  if (lower.includes('/deploy-guide')) return true;
  if (lower.includes('.git')) return true;
  if (lower.endsWith('.sql')) return true;
  return false;
}
