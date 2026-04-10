import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cultura = searchParams.get('cultura')?.trim();
  const problema = searchParams.get('problema')?.trim();
  const estado = searchParams.get('estado')?.trim();
  const daeMin = searchParams.get('daeMin');
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '200', 10) || 200, 500);

  try {
    const admin = createAdminClient();
    let q = admin
      .schema('ai')
      .from('ai_dataset_normalized')
      .select(
        'source_hash, source_module, cultura, estagio_fenologico, problema, acao, resultado, region, estado_uf, dae, recorded_at',
      )
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (cultura) q = q.ilike('cultura', `%${cultura}%`);
    if (problema) q = q.ilike('problema', `%${problema}%`);
    if (estado) q = q.ilike('estado_uf', `%${estado}%`);
    if (daeMin) {
      const n = parseFloat(daeMin);
      if (!Number.isNaN(n)) q = q.gte('dae', n);
    }

    const { data, error } = await q;
    if (error) {
      const { data: raw, error: e2 } = await admin
        .schema('ai')
        .from('ai_agronomic_dataset')
        .select(
          'source_hash, source_module, cultura, estagio_fenologico, problema, acao, resultado, region, recorded_at, extra_json',
        )
        .order('recorded_at', { ascending: false })
        .limit(limit);
      if (e2) throw e2;
      return NextResponse.json({ rows: raw ?? [], fallback: true });
    }
    return NextResponse.json({ rows: data ?? [], fallback: false });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
