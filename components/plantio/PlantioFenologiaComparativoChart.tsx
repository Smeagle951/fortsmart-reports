'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type SerieFeno = { key: string; name: string; color: string; points: { dae: number; y: number; label: string }[] };

function mergeSerieRows(series: SerieFeno[]): Record<string, string | number | null>[] {
  const daeSet = new Set<number>();
  for (const s of series) {
    for (const p of s.points) daeSet.add(p.dae);
  }
  const daes = [...daeSet].sort((a, b) => a - b);
  if (daes.length === 0) return [];

  return daes.map((dae) => {
    const row: Record<string, string | number | null> = { dae };
    for (const s of series) {
      let last: { dae: number; y: number; label: string } | undefined;
      for (const p of s.points) {
        if (p.dae <= dae) last = p;
        else break;
      }
      row[s.key] = last != null ? last.y : null;
      row[`${s.key}_label`] = last?.label ?? null;
    }
    return row;
  });
}

function yAxisTick(v: number): string {
  if (Number.isInteger(v) && v >= 1 && v <= 9) return `V${v}`;
  return String(v);
}

export default function PlantioFenologiaComparativoChart({ series }: { series: SerieFeno[] }) {
  const active = series.filter((s) => s.points.length > 0);
  const data = mergeSerieRows(active);

  if (data.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', textAlign: 'center', padding: '2rem' }}>
        Sem registros fenológicos com estádio e DAE suficientes para o gráfico comparativo.
      </p>
    );
  }

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis
            dataKey="dae"
            tick={{ fontSize: 12, fill: '#64748b' }}
            label={{ value: 'Dias após emergência (DAE)', position: 'insideBottom', offset: -4, fill: '#64748b', fontSize: 11 }}
          />
          <YAxis
            tickFormatter={yAxisTick}
            tick={{ fontSize: 12, fill: '#64748b' }}
            label={{ value: 'Estágio', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
          />
          <Tooltip
            content={({ active, payload, label: daeLabel }) => {
              if (!active || !payload?.length) return null;
              return (
                <div
                  style={{
                    fontSize: 13,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                    padding: '10px 12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>DAE {daeLabel}</div>
                  {payload.map((item) => {
                    const key = String(item.dataKey ?? '');
                    const pl = item.payload as Record<string, unknown> | undefined;
                    const lbl = pl?.[`${key}_label`];
                    const nome = series.find((s) => s.key === key)?.name ?? key;
                    return (
                      <div key={key} style={{ color: item.color, marginTop: 4 }}>
                        {nome}: {lbl != null && String(lbl) !== '' ? String(lbl) : String(item.value ?? '—')}
                      </div>
                    );
                  })}
                </div>
              );
            }}
          />
          {active.map((s) => (
            <Line
              key={s.key}
              type="stepAfter"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 4, fill: s.color, strokeWidth: 0 }}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
