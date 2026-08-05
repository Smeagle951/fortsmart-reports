import { NextResponse, type NextRequest } from 'next/server';

import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/security/admin-session';
import {
  allowDiagnosticAccess,
  DIAGNOSTIC_API_PATHS,
  isSensitivePublicPath,
} from '@/lib/security/production-guard';
import { normalizeCanonicalBaseUrl } from '@/utils/canonicalUrl';

const DEFAULT_CANONICAL_ORIGIN = 'https://relatorios.fortsmart-agro.com.br';

function getHostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return '';
  }
}

function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    'X-Robots-Tag',
    'noindex, nofollow, noarchive, nosnippet, noimageindex',
  );
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  return response;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (isSensitivePublicPath(pathname)) {
    return withSecurityHeaders(new NextResponse(null, { status: 404 }));
  }

  if (
    DIAGNOSTIC_API_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    ) &&
    !allowDiagnosticAccess(req)
  ) {
    return withSecurityHeaders(new NextResponse(null, { status: 404 }));
  }

  // Painel interno /admin (dataset AgroIntelige) — não exposto na UI pública
  if (pathname.startsWith('/admin')) {
    if (!pathname.startsWith('/admin/login')) {
      const ok = verifyAdminSessionToken(
        req.cookies.get(ADMIN_SESSION_COOKIE)?.value,
      );
      if (!ok) {
        const login = new URL('/admin/login', req.url);
        login.searchParams.set('next', pathname);
        return withSecurityHeaders(NextResponse.redirect(login));
      }
    }
  }

  const raw = String(process.env.NEXT_PUBLIC_CANONICAL_URL ?? '').trim();
  const canonicalOrigin = raw
    ? normalizeCanonicalBaseUrl(raw)
    : normalizeCanonicalBaseUrl(DEFAULT_CANONICAL_ORIGIN);
  if (!canonicalOrigin) return withSecurityHeaders(NextResponse.next());

  const canonicalHost = getHostFromOrigin(canonicalOrigin);
  if (!canonicalHost) return withSecurityHeaders(NextResponse.next());

  const hostname = req.nextUrl.hostname;

  // Não mexer em localhost/dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return withSecurityHeaders(NextResponse.next());
  }

  // Se já está no host canônico, segue.
  if (hostname === canonicalHost) {
    return withSecurityHeaders(NextResponse.next());
  }

  // Mapa de talhões e dashboard GIS (GeoJSON ?file= / relatório ?token=): host canónico dos relatórios.
  if (pathname.startsWith('/mapa-talhoes') || pathname.startsWith('/dashboard')) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, canonicalOrigin);
    return withSecurityHeaders(NextResponse.redirect(url, 308));
  }

  // Redirecionar principalmente quando entra por vercel.app (ou qualquer outro alias),
  // preservando path + query.
  const shouldRedirect =
    hostname.endsWith('.vercel.app') || hostname === 'fortsmart-reports.vercel.app';
  if (!shouldRedirect) return withSecurityHeaders(NextResponse.next());

  const url = req.nextUrl.clone();
  const redirectTo = new URL(url.pathname + url.search, canonicalOrigin);
  return withSecurityHeaders(NextResponse.redirect(redirectTo, 308));
}

export const config = {
  matcher: [
    // Inclui robots.txt/sitemap para aplicar headers; rotas estáticas geradas pelo App Router.
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
