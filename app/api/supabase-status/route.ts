import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

import { allowDiagnosticFromCookieHeader } from '@/lib/security/production-guard';

/**
 * GET /api/supabase-status — apenas desenvolvimento ou admin autenticado.
 */
export async function GET() {
  const h = await headers();
  if (!allowDiagnosticFromCookieHeader(h.get('cookie'))) {
    return new NextResponse(null, { status: 404 });
  }

  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.URL_SUPABASE ||
    '';
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    rTokenRouteReady: url.length > 0 && hasServiceKey,
    hasSupabaseUrl: url.length > 0,
    hasServiceRoleKey: hasServiceKey,
  });
}
