import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin/supabase-admin';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 20000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'json';

  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .schema('ai')
      .from('ai_agronomic_dataset')
      .select(
        'source_module, cultura, estagio_fenologico, problema, acao, resultado, region, recorded_at, extra_json',
      )
      .order('recorded_at', { ascending: false })
      .limit(MAX_ROWS);
    if (error) throw error;
    const rows = data ?? [];

    if (format === 'json') {
      const body = JSON.stringify(
        rows.map((r) => ({
          ...r,
          extra_json: stripExtraPii(r.extra_json as Record<string, unknown>),
        })),
        null,
        2,
      );
      return new NextResponse(body, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Content-Disposition': `attachment; filename="ai_agronomic_dataset_sample.json"`,
        },
      });
    }

    const cols = [
      'source_module',
      'cultura',
      'estagio_fenologico',
      'problema',
      'acao',
      'resultado',
      'region',
      'recorded_at',
    ];
    const lines = [cols.join(',')];
    for (const r of rows) {
      const row = r as Record<string, unknown>;
      lines.push(
        cols
          .map((c) => {
            const v = row[c];
            const s = v == null ? '' : String(v).replace(/"/g, '""');
            return `"${s}"`;
          })
          .join(','),
      );
    }
    return new NextResponse(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ai_agronomic_dataset_sample.csv"`,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function stripExtraPii(extra: Record<string, unknown> | null | undefined) {
  if (!extra || typeof extra !== 'object') return extra;
  const o = { ...extra };
  for (const k of Object.keys(o)) {
    if (/email|nome|phone|cpf|user_id/i.test(k)) delete o[k];
  }
  return o;
}
