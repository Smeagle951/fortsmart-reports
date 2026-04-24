import { NextResponse, type NextRequest } from 'next/server';
import { normalizeCanonicalBaseUrl } from '@/utils/canonicalUrl';

function getHostFromOrigin(origin: string): string {
  try {
    return new URL(origin).host;
  } catch {
    return '';
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Painel interno /admin (dataset AgroIntelige) — não exposto na UI pública
  if (pathname.startsWith('/admin')) {
    if (!pathname.startsWith('/admin/login')) {
      const ok = req.cookies.get('fs_admin')?.value === '1';
      if (!ok) {
        const login = new URL('/admin/login', req.url);
        login.searchParams.set('next', pathname);
        return NextResponse.redirect(login);
      }
    }
  }

  const raw = String(process.env.NEXT_PUBLIC_CANONICAL_URL ?? '').trim();
  const canonicalOrigin = raw ? normalizeCanonicalBaseUrl(raw) : null;
  if (!canonicalOrigin) return NextResponse.next();

  const canonicalHost = getHostFromOrigin(canonicalOrigin);
  if (!canonicalHost) return NextResponse.next();

  const hostname = req.nextUrl.hostname;

  // Não mexer em localhost/dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') return NextResponse.next();

  // Se já está no host canônico, segue.
  if (hostname === canonicalHost) return NextResponse.next();

  // Mapa de talhões (link curto / dados Supabase): sempre no host canónico dos relatórios.
  // Evita abrir /mapa-talhoes noutro subdomínio ligado ao mesmo deploy (página vazia sem token resolvido no SSR).
  if (pathname.startsWith('/mapa-talhoes')) {
    const url = new URL(req.nextUrl.pathname + req.nextUrl.search, canonicalOrigin);
    return NextResponse.redirect(url, 308);
  }

  // Redirecionar principalmente quando entra por vercel.app (ou qualquer outro alias),
  // preservando path + query.
  const shouldRedirect = hostname.endsWith('.vercel.app') || hostname === 'fortsmart-reports.vercel.app';
  if (!shouldRedirect) return NextResponse.next();

  const url = req.nextUrl.clone();
  const redirectTo = new URL(url.pathname + url.search, canonicalOrigin);
  return NextResponse.redirect(redirectTo, 308);
}

export const config = {
  matcher: [
    // Evita assets internos
    '/((?!_next|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
};

