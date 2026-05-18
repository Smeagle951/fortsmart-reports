import { NextResponse } from 'next/server';

import { resolveCloudApiBase, resolveWindowsApiBearer } from '@/lib/cloud-api-base';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteCtx = { params: { farmId: string } };

export async function GET(_req: Request, ctx: RouteCtx) {
  const farmId = ctx.params.farmId?.trim() ?? '';
  if (!UUID_RE.test(farmId)) {
    return NextResponse.json({ error: 'farmId deve ser UUID da fazenda cloud' }, { status: 400 });
  }
  const bearer = resolveWindowsApiBearer();
  if (!bearer) {
    return NextResponse.json(
      {
        error:
          'Servidor sem FORTSMART_WINDOWS_API_BEARER (ou FORTSMART_CLOUD_API_BEARER). Defina no .env.local / Vercel.',
      },
      { status: 503 },
    );
  }
  const base = resolveCloudApiBase();
  const url = `${base}/windows/planting/${encodeURIComponent(farmId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: `Falha de rede: ${msg}` }, { status: 502 });
  }
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      { error: `Resposta não-JSON (${res.status})`, bodyPreview: text.slice(0, 500) },
      { status: 502 },
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: `API cloud ${res.status}`, detail: json },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
    );
  }
  return NextResponse.json(json);
}
