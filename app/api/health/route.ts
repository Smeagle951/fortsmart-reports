import { NextResponse } from 'next/server';

/** Mesma condição que `prepare` usa para modo R2 (sem revelar valores). */
function r2GeojsonEnvReady(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID?.trim() &&
    process.env.R2_ACCESS_KEY_ID?.trim() &&
    process.env.R2_SECRET_ACCESS_KEY?.trim() &&
    process.env.R2_BUCKET_NAME?.trim() &&
    process.env.R2_PUBLIC_BASE_URL?.trim()
  );
}

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
    /** `true` se `/api/mapa/upload-geojson/prepare` pode usar modo R2+`?file=`. */
    r2_geojson_env_ready: r2GeojsonEnvReady(),
  });
}
