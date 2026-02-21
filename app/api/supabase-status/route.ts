import { NextResponse } from 'next/server';

/**
 * GET /api/supabase-status
 * Diagnóstico: retorna se as variáveis para /r/[token] estão configuradas no Vercel.
 * A rota /r/[token] usa SERVICE_ROLE (server-side); anon key não é usada para ela.
 */
export async function GET() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.URL_SUPABASE ||
    '';
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const host = url ? url.replace(/^https?:\/\//, '').replace(/\/$/, '') : null;

  // /r/[token] só funciona com SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
  const rTokenReady = url.length > 0 && hasServiceKey;

  return NextResponse.json({
    rTokenRouteReady: rTokenReady,
    supabaseHost: host,
    hasSupabaseUrl: url.length > 0,
    hasServiceRoleKey: hasServiceKey,
    hint: rTokenReady
      ? 'Rota /r/[token] configurada. Use o mesmo projeto do app (ex: qnujboesewzikwypidja.supabase.co).'
      : 'Para /r/[token] parar de dar 404: no Vercel (Settings → Environment Variables) defina SUPABASE_URL (ou NEXT_PUBLIC_SUPABASE_URL) e SUPABASE_SERVICE_ROLE_KEY do mesmo projeto do app. Depois faça Redeploy.',
  });
}
