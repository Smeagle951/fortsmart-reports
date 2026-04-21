import { NextResponse } from 'next/server';
import { resolveFortsmartApiBase } from '@/lib/fortsmart-api-base';

/**
 * GET /api/talhoes — proxy server-side para o backend Node (Neon).
 * Next.js **não** usa DATABASE_URL aqui; só chama a API Node (`resolveFortsmartApiBase`).
 */
export async function GET() {
  const base = resolveFortsmartApiBase();

  try {
    const r = await fetch(`${base}/talhoes`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    const body = await r.json().catch(() => ({}));
    return NextResponse.json(body, { status: r.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        ok: false,
        error: 'fortsmart_api_unreachable',
        message,
        hint:
          'Em produção: Vercel → FORTSMART_API_URL=https://api.fortsmart-agro.com.br (sem barra final). Local: npm run dev no backend ou a mesma URL da API pública.',
      },
      { status: 502 },
    );
  }
}
