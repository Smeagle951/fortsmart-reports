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

function cumulativeAtDaa(
  points: Array<{ daa?: number; costAccumulatedBrlHa?: number }>,
  daa: number,
): number {
  let v = 0;
  for (const p of points) {
    const d = p.daa ?? 0;
    const c = p.costAccumulatedBrlHa;
    if (d <= daa && c != null && Number.isFinite(c)) v = c;
  }
  return v;
}

function buildRows(timeline: EconomicTimelineJson): Array<{ daa: number; costA: number; costB: number }> {
  const sides = timeline.sides ?? [];
  const pa = sides.find((s) => s.side === 'A')?.points ?? [];
  const pb = sides.find((s) => s.side === 'B')?.points ?? [];
  const daas = new Set<number>();
  for (const p of pa) {
    if (p.daa != null && Number.isFinite(p.daa)) daas.add(p.daa);
  }
  for (const p of pb) {
    if (p.daa != null && Number.isFinite(p.daa)) daas.add(p.daa);
  }
  const sorted = [...daas].sort((a, b) => a - b);
  if (sorted.length < 2) return [];
  return sorted.map((daa) => ({
    daa,
    costA: cumulativeAtDaa(pa, daa),
    costB: cumulativeAtDaa(pb, daa),
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
  if (data.length < 2) return null;

  return (
    <div className="mt-2 h-[min(50vh,22rem)] min-h-[220px] w-full max-w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="daa" tick={{ fontSize: 11 }} label={{ value: 'DAA', position: 'insideBottom', offset: -2, fontSize: 10 }} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => (typeof v === 'number' ? `${v}` : v)}
            label={{ value: 'R$/ha acum.', angle: -90, position: 'insideLeft', fontSize: 10 }}
          />
          <Tooltip
            formatter={(value: number | string) =>
              typeof value === 'number' ? [`R$ ${value.toFixed(0)}/ha`, ''] : [value, '']
            }
            labelFormatter={(daa) => `DAA ${daa}`}
          />
          <Legend />
          <Line type="stepAfter" dataKey="costA" name={nameA} stroke={strokeA} strokeWidth={2} dot />
          <Line type="stepAfter" dataKey="costB" name={nameB} stroke={strokeB} strokeWidth={2} dot />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
