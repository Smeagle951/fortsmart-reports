import { NextResponse } from 'next/server';

/**
 * GET /api/health — não depende de Supabase.
 * Se esta URL retornar 200, o app Next (fortsmart-reports) está no ar na Vercel.
 * Se retornar 404, o deploy não está usando a pasta fortsmart-reports (confira Root Directory).
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    app: 'fortsmart-reports',
    route: '/api/health',
  });
}
