import { NextResponse } from 'next/server';
import { loadAmostragemSoloByShareToken } from '@/lib/amostragem-solo/load-relatorio';
import { getFeatureCollection } from '@/lib/amostragem-solo/payload';
import { buildShpZipBuffer } from '@/lib/amostragem-solo/shp';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token') ?? '';
  if (!token) {
    return NextResponse.json({ error: 'token obrigatório' }, { status: 400 });
  }
  const payload = await loadAmostragemSoloByShareToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'não encontrado' }, { status: 404 });
  }
  const fc = getFeatureCollection(payload);
  try {
    const buffer = buildShpZipBuffer(fc);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="amostragem_solo.zip"',
      },
    });
  } catch (e) {
    console.error('[amostragem/shp]', e);
    return NextResponse.json({ error: 'falha ao gerar shapefile' }, { status: 500 });
  }
}
