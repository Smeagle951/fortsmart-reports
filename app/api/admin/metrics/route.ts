import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin/supabase-admin';

export const dynamic = 'force-dynamic';

type Row = {
  cultura: string | null;
  problema: string | null;
  source_module: string | null;
  recorded_at: string | null;
  resultado: string | null;
  acao: string | null;
  causa: string | null;
  region: string | null;
  extra_json: Record<string, unknown> | null;
};

export async function GET() {
  try {
    const admin = createAdminClient();
    const { count: total, error: e1 } = await admin
      .schema('ai')
      .from('ai_agronomic_dataset')
      .select('*', { count: 'exact', head: true });
    if (e1) throw e1;

    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { count: last7, error: e2 } = await admin
      .schema('ai')
      .from('ai_agronomic_dataset')
      .select('*', { count: 'exact', head: true })
      .gte('recorded_at', since);
    if (e2) throw e2;

    const { data: rows, error: e3 } = await admin
      .schema('ai')
      .from('ai_agronomic_dataset')
      .select(
        'cultura, problema, source_module, recorded_at, resultado, acao, causa, region, extra_json',
      )
      .order('recorded_at', { ascending: false })
      .limit(8000);
    if (e3) throw e3;

    const list = (rows ?? []) as Row[];
    const byCulture = tally(list.map((r) => r.cultura ?? ''));
    const byProblem = tally(list.map((r) => r.problema ?? ''));
    const byModule = tally(list.map((r) => r.source_module ?? ''));

    const withResult = list.filter((r) => (r.resultado ?? '').trim().length > 0).length;
    const withAcao = list.filter((r) => (r.acao ?? '').trim().length > 0).length;
    const fullCycle = list.filter(
      (r) =>
        (r.problema ?? '').trim().length > 0 &&
        (r.acao ?? '').trim().length > 0 &&
        (r.resultado ?? '').trim().length > 0,
    ).length;

    const n = Math.max(list.length, 1);
    const byDay = dailySeries(list);

    const estados = tally(
      list.map((r) => {
        const g = r.extra_json?.geo as { estado?: string } | undefined;
        return g?.estado ?? r.region ?? '';
      }),
    );

    return NextResponse.json({
      total: total ?? 0,
      last7Days: last7 ?? 0,
      sampleSize: list.length,
      topCultures: topN(byCulture, 8),
      topProblems: topN(byProblem, 10),
      byModule: topN(byModule, 20),
      quality: {
        pctResult: Math.round((100 * withResult) / n),
        pctAcao: Math.round((100 * withAcao) / n),
        pctFullCycle: Math.round((100 * fullCycle) / n),
      },
      funnel: {
        withProblem: list.filter((r) => (r.problema ?? '').trim().length > 0).length,
        withAcao,
        withResult: withResult,
      },
      byDay,
      byEstado: topN(estados, 30),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function tally(keys: string[]): Record<string, number> {
  const o: Record<string, number> = {};
  for (const k of keys) {
    const key = k.trim() || '(vazio)';
    o[key] = (o[key] ?? 0) + 1;
  }
  return o;
}

function topN(m: Record<string, number>, n: number) {
  return Object.entries(m)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([name, count]) => ({ name, count }));
}

function dailySeries(rows: Row[]) {
  const day: Record<string, number> = {};
  for (const r of rows) {
    if (!r.recorded_at) continue;
    const d = r.recorded_at.slice(0, 10);
    day[d] = (day[d] ?? 0) + 1;
  }
  return Object.entries(day)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-45)
    .map(([date, count]) => ({ date, count }));
}
