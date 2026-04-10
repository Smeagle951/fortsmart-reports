import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  if (pathname.startsWith('/admin/login')) {
    return NextResponse.next();
  }
  const ok = request.cookies.get('fs_admin')?.value === '1';
  if (!ok) {
    const login = new URL('/admin/login', request.url);
    login.searchParams.set('next', pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
