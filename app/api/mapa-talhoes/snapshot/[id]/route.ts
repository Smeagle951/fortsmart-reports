import { NextResponse, type NextRequest } from 'next/server';

import { getMapaTalhoesShareById } from '@/lib/mapa-talhoes-share';

/**
 * GET /api/mapa-talhoes/snapshot/:id
 * Devolve o FeatureCollection guardado no link curto (fallback client-side e integrações).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ ok: false, error: 'id_required' }, { status: 400 });
  }

  const fc = await getMapaTalhoesShareById(id);
  if (!fc) {
    return NextResponse.json(
      { ok: false, error: 'not_found_or_expired' },
      { status: 404 },
    );
  }

  return NextResponse.json(fc, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' },
  });
}
