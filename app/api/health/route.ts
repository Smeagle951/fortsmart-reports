import { NextResponse } from 'next/server';

import { isR2ConfiguredAsync } from '@/lib/cloudflare/r2-geojson-upload';

/**
 * GET /api/health — não depende de Supabase.
 * Se esta URL retornar 200, o app Next (fortsmart-reports) está no ar na Vercel.
 * Se retornar 404, o deploy não está usando a pasta fortsmart-reports (confira Root Directory).
 */
export async function GET() {
  const r2Ready = await isR2ConfiguredAsync();
  return NextResponse.json({
    ok: true,
    app: 'fortsmart-reports',
    route: '/api/health',
    /** `true` se `/api/mapa/upload-geojson/prepare` pode usar modo R2+`?file=`. */
    r2_geojson_env_ready: r2Ready,
  });
}
