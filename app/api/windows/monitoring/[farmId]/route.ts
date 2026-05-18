import { NextResponse } from 'next/server';

import { resolveCloudApiBase, resolveWindowsApiBearer } from '@/lib/cloud-api-base';

export const dynamic = 'force-dynamic';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RouteCtx = { params: { farmId: string } };

function friendlyHttpMessage(status: number): string {
  if (status === 401) return 'Não autorizado: Bearer inválido, revogado ou em falta.';
  if (status === 403) return 'Proibido: a API key não está associada a esta fazenda (farmId).';
  if (status >= 500) return 'Erro no servidor da API cloud. Tente mais tarde ou verifique logs.';
  if (status === 404) return 'Recurso não encontrado na API cloud.';
  return `API cloud respondeu com HTTP ${status}.`;
}

export async function GET(_req: Request, ctx: RouteCtx) {
  const farmId = ctx.params.farmId?.trim() ?? '';
  if (!UUID_RE.test(farmId)) {
    return NextResponse.json({ success: false, error: 'farmId deve ser UUID da fazenda cloud' }, { status: 400 });
  }
  const bearer = resolveWindowsApiBearer();
  if (!bearer) {
    return NextResponse.json(
      {
        success: false,
        error:
          'Servidor sem FORTSMART_WINDOWS_API_BEARER (ou FORTSMART_CLOUD_API_BEARER). Defina no .env.local / Vercel.',
      },
      { status: 503 },
    );
  }
  const base = resolveCloudApiBase();
  const url = `${base}/windows/monitoring/${encodeURIComponent(farmId)}`;
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(120_000),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ success: false, error: `Falha de rede: ${msg}` }, { status: 502 });
  }
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: `Resposta não-JSON (${res.status})`,
        bodyPreview: text.slice(0, 500),
      },
      { status: 502 },
    );
  }
  if (!res.ok) {
    const detail = json && typeof json === 'object' ? json : undefined;
    return NextResponse.json(
      {
        success: false,
        error: friendlyHttpMessage(res.status),
        detail,
      },
      { status: res.status >= 400 && res.status < 600 ? res.status : 502 },
    );
  }
  if (json && typeof json === 'object' && json !== null && 'success' in json) {
    return NextResponse.json(json);
  }
  return NextResponse.json({ success: true, data: json });
}
