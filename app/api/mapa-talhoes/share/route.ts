import { randomBytes } from 'crypto';

import { NextResponse, type NextRequest } from 'next/server';

import type { FeatureCollection } from 'geojson';

import { getSupabaseService } from '@/lib/supabase';

const MAX_BODY_BYTES = 4_500_000;
const TTL_MS = 90 * 24 * 60 * 60 * 1000;

function isFeatureCollection(x: unknown): x is FeatureCollection {
  return (
    x !== null &&
    typeof x === 'object' &&
    (x as FeatureCollection).type === 'FeatureCollection' &&
    Array.isArray((x as FeatureCollection).features)
  );
}

function extractFc(body: unknown): FeatureCollection | null {
  if (isFeatureCollection(body)) return body;
  if (body !== null && typeof body === 'object' && 'geojson' in body) {
    const g = (body as { geojson?: unknown }).geojson;
    if (isFeatureCollection(g)) return g;
  }
  return null;
}

/**
 * O link devolvido ao app **deve** apontar para o mesmo host do POST (ex. relatorios.…),
 * nunca forçar só NEXT_PUBLIC_CANONICAL_URL: se a canonical for o site institucional, o
 * utilizador abre um sítio sem esta rota/Supabase e o mapa fica vazio ou 404.
 */
function publicOrigin(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  if (host) {
    return `${proto}://${host}`;
  }
  const canonical = process.env.NEXT_PUBLIC_CANONICAL_URL?.trim();
  if (canonical) {
    try {
      return new URL(canonical).origin;
    } catch {
      /* fallthrough */
    }
  }
  return new URL(req.url).origin;
}

/**
 * POST /api/mapa-talhoes/share
 * Corpo: FeatureCollection GeoJSON (ou `{ "geojson": { … } }`).
 * Resposta: `{ ok, url, token }` — URL curta /mapa-talhoes/m/:token
 */
export async function POST(req: NextRequest) {
  const svc = getSupabaseService();
  if (!svc) {
    return NextResponse.json(
      { ok: false, code: 'supabase_unconfigured', error: 'Servidor sem Supabase (service role).' },
      { status: 503 },
    );
  }

  const len = Number(req.headers.get('content-length') ?? '0');
  if (len > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'Payload demasiado grande (máx. ~4,5 MB).' },
      { status: 413 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido.' }, { status: 400 });
  }

  const fc = extractFc(body);
  if (!fc) {
    return NextResponse.json(
      { ok: false, error: 'Esperado um FeatureCollection GeoJSON válido.' },
      { status: 400 },
    );
  }
  if (!Array.isArray(fc.features) || fc.features.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        code: 'no_features',
        error:
          'Nenhum polígono no GeoJSON. Confirme que os talhões têm coordenadas no mapa; sem geometria não há o que desenhar.',
      },
      { status: 400 },
    );
  }

  const serialized = JSON.stringify(fc);
  if (serialized.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { ok: false, error: 'GeoJSON demasiado grande para link curto (tente menos talhões ou use export ficheiro).' },
      { status: 413 },
    );
  }

  const id = randomBytes(9).toString('base64url');
  const expiresAt = new Date(Date.now() + TTL_MS).toISOString();

  const { error } = await svc.from('mapa_talhoes_shares').insert({
    id,
    geojson: fc as unknown as Record<string, unknown>,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('[mapa-talhoes/share] insert:', error.message);
    if (error.message.includes('relation') && error.message.includes('does not exist')) {
      return NextResponse.json(
        {
          ok: false,
          code: 'table_missing',
          error:
            'Tabela mapa_talhoes_shares inexistente. Execute a migração: fortsmart-reports/supabase/migrations/20260422120000_mapa_talhoes_shares.sql (ou docs/migrations/20260422120000_mapa_talhoes_shares.sql).',
        },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: false, error: 'Falha ao guardar snapshot.' }, { status: 500 });
  }

  const origin = publicOrigin(req);
  const url = `${origin.replace(/\/$/, '')}/mapa-talhoes/m/${id}`;

  return NextResponse.json({ ok: true, token: id, url });
}
