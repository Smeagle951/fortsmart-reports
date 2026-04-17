'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { COLOR_SIDE_A, COLOR_SIDE_B } from '@/components/lado_a_lado/ladoALadoHelpers';

type PlantMetric = {
  key?: string;
  label?: string;
  unit?: string;
  meanA?: number;
  meanB?: number;
  diffAbs?: number;
  diffPct?: number;
  winner?: string;
};

function fmt(n: number | undefined | null, dec = 1) {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(dec);
}

export default function PlantEvaluationSection({ data }: { data: SideBySideReportData }) {
  const pe = data.plant_evaluation;
  const metrics = (pe?.metrics as PlantMetric[] | undefined)?.filter(Boolean) ?? [];
  if (!pe || metrics.length === 0) return null;

  const sideAName = data.sideA?.name || 'Manejo A';
  const sideBName = data.sideB?.name || 'Manejo B';
  const nA = (pe.sampleSize as { A?: number } | undefined)?.A;
  const nB = (pe.sampleSize as { B?: number } | undefined)?.B;

  const chartRows = metrics.map((m) => ({
    name: (m.label || m.key || '—').slice(0, 28),
    A: m.meanA ?? 0,
    B: m.meanB ?? 0,
  }));

  return (
    <section id="plantas-premium" className="scroll-mt-36 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900 border-l-4 border-teal-500 pl-3">Avaliação por planta</h2>
        <p className="text-sm text-slate-600 mt-1">
          Médias por manejo a partir de amostras em campo (não confundir com KPIs macro da visita).
          {nA != null || nB != null ? (
            <span className="block mt-1 text-xs text-slate-500">
              Amostras: A {nA ?? '—'} · B {nB ?? '—'}
            </span>
          ) : null}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Métrica</th>
              <th className="px-4 py-3">{sideAName}</th>
              <th className="px-4 py-3">{sideBName}</th>
              <th className="px-4 py-3">Δ</th>
              <th className="px-4 py-3">Melhor</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const w = (m.winner || '').toUpperCase();
              const betterA = w === 'A';
              const betterB = w === 'B';
              const tie = w === 'TIE' || w === '';
              const dp = m.diffPct;
              const deltaStr =
                dp != null && Number.isFinite(dp)
                  ? `${dp > 0 ? '+' : ''}${dp.toFixed(0)}% (B vs A)`
                  : m.diffAbs != null && Number.isFinite(m.diffAbs)
                    ? `${m.diffAbs > 0 ? '+' : ''}${fmt(m.diffAbs)}`
                    : '—';
              return (
                <tr key={m.key || m.label} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    {m.label || m.key}
                    {m.unit ? <span className="text-slate-400 font-normal"> ({m.unit})</span> : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{fmt(m.meanA)}</td>
                  <td className="px-4 py-3 tabular-nums">{fmt(m.meanB)}</td>
                  <td className="px-4 py-3 tabular-nums text-slate-600">{deltaStr}</td>
                  <td className="px-4 py-3">
                    {tie ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Empate</span>
                    ) : betterA ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">A</span>
                    ) : betterB ? (
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">B</span>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="h-72 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={56} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v.toFixed(1)} />
            <Legend />
            <Bar dataKey="A" name={sideAName} fill={COLOR_SIDE_A} radius={[4, 4, 0, 0]} />
            <Bar dataKey="B" name={sideBName} fill={COLOR_SIDE_B} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
