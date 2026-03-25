import { NextResponse, type NextRequest } from 'next/server';

function trimTrailingSlash(s: string): string {
  return s.endsWith('/') ? s.slice(0, -1) : s;
}

function getCanonicalOrigin(): string {
  const raw = String(process.env.NEXT_PUBLIC_CANONICAL_URL ?? '').trim();
  if (!raw) return '';
  return trimTrailingSlash(raw);
}

function getHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

export function middleware(req: NextRequest) {
  const canonicalOrigin = getCanonicalOrigin();
  if (!canonicalOrigin) return NextResponse.next();

  const canonicalHost = getHost(canonicalOrigin);
  if (!canonicalHost) return NextResponse.next();

  const hostname = req.nextUrl.hostname;

  // Não mexer em localhost/dev
  if (hostname === 'localhost' || hostname === '127.0.0.1') return NextResponse.next();

  // Se já está no host canônico, segue.
  if (hostname === canonicalHost) return NextResponse.next();

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

