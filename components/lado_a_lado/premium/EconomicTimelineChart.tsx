'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { COLOR_SIDE_A, COLOR_SIDE_B } from '@/components/lado_a_lado/ladoALadoHelpers';
import type { EconomicTimelineJson } from '@/components/SideBySideReportContent';

type EconPoint = {
  daa?: number;
  eventCostBrlHa?: number | null;
  costAccumulatedBrlHa?: number;
};

/**
 * Série (DAA, custo acum. R$/ha). Ordena por DAA; se `costAccumulatedBrlHa` existir, usa o valor
 * publicado; senão acumula `eventCostBrlHa` (muitas publicações só enviam o custo do evento).
 */
function buildCumulativeSeries(points: EconPoint[] | undefined): Array<{ daa: number; cumulative: number }> {
  if (!points?.length) return [];
  const sorted = [...points]
    .filter((p) => p.daa != null && Number.isFinite(Number(p.daa)))
    .sort((a, b) => Number(a.daa) - Number(b.daa));
  let run = 0;
  const out: Array<{ daa: number; cumulative: number }> = [];
  for (const p of sorted) {
    const d = Number(p.daa);
    if (p.costAccumulatedBrlHa != null && Number.isFinite(p.costAccumulatedBrlHa)) {
      run = p.costAccumulatedBrlHa;
    } else {
      const ev = p.eventCostBrlHa;
      if (ev != null && Number.isFinite(ev)) run += ev;
    }
    out.push({ daa: d, cumulative: run });
  }
  return out;
}

function cumulativeAtOrBeforeDaa(
  series: Array<{ daa: number; cumulative: number }>,
  daa: number,
): number {
  let v = 0;
  for (const s of series) {
    if (s.daa <= daa) v = s.cumulative;
  }
  return v;
}

function buildRows(timeline: EconomicTimelineJson): Array<{ daa: number; costA: number; costB: number }> {
  const sides = timeline.sides ?? [];
  const pa = sides.find((s) => s.side === 'A')?.points as EconPoint[] | undefined;
  const pb = sides.find((s) => s.side === 'B')?.points as EconPoint[] | undefined;
  const sa = buildCumulativeSeries(pa);
  const sb = buildCumulativeSeries(pb);
  const daaSet = new Set<number>();
  for (const s of sa) daaSet.add(s.daa);
  for (const s of sb) daaSet.add(s.daa);
  const daas = [...daaSet].sort((a, b) => a - b);
  if (daas.length === 0) return [];
  return daas.map((daa) => ({
    daa,
    costA: cumulativeAtOrBeforeDaa(sa, daa),
    costB: cumulativeAtOrBeforeDaa(sb, daa),
  }));
}

export default function EconomicTimelineChart({
  timeline,
  nameA,
  nameB,
  strokeA = COLOR_SIDE_A,
  strokeB = COLOR_SIDE_B,
}: {
  timeline: EconomicTimelineJson;
  nameA: string;
  nameB: string;
  /** Sobrescreve cor da série A (ex.: legenda local do painel executivo). */
  strokeA?: string;
  strokeB?: string;
}) {
  const data = buildRows(timeline);
  if (data.length === 0) return null;

  const allCosts = data.flatMap((d) => [d.costA, d.costB]);
  const maxC = Math.max(0, ...allCosts, 1);

  return (
    <div className="h-64 w-full mt-2 [&_svg.recharts-surface]:relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="daa"
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={{ stroke: '#e2e8f0' }}
            label={{ value: 'DAA (dias após emergência)', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#94a3b8' }}
          />
          <YAxis
            domain={[0, Math.max(maxC * 1.12, 10)]}
            tick={{ fontSize: 11, fill: '#64748b' }}
            tickLine={false}
            axisLine={false}
            width={48}
            tickFormatter={(v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${Math.round(v)}`)}
            label={{ value: 'R$/ha acumulado', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
          />
          <Tooltip
            formatter={(value: number | string) =>
              typeof value === 'number' ? [`R$ ${value.toFixed(2)}/ha`, ''] : [String(value), '']
            }
            labelFormatter={(daa) => `DAA ${daa}`}
            contentStyle={{ borderRadius: 10, fontSize: 12, border: '1px solid #e2e8f0' }}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Line
            type="stepAfter"
            dataKey="costA"
            name={nameA}
            stroke={strokeA}
            strokeWidth={2.5}
            dot={{ r: 3, fill: strokeA, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
            connectNulls
          />
          <Line
            type="stepAfter"
            dataKey="costB"
            name={nameB}
            stroke={strokeB}
            strokeWidth={2.5}
            dot={{ r: 3, fill: strokeB, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-1 text-center text-[10px] text-slate-500">
        Curva em degrau: custo acumulado (R$/ha) por DAA. Se o total acumulado não vier publicado, somam-se os custos
        por evento.
      </p>
    </div>
  );
}
