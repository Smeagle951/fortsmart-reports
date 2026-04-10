'use client';

import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { buildCriteriaLineData } from '@/lib/lado-a-lado-premium';
import { situacaoLabel } from '@/utils/format';

type Tab = 'criterios' | 'pontos' | 'fenologia';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumEvolucao({ data, sideAName, sideBName }: Props) {
  const [tab, setTab] = useState<Tab>('criterios');
  const lineData = useMemo(() => buildCriteriaLineData(data), [data]);
  const points = data.points || [];
  const phenology = data.phenology;

  const tabs: { id: Tab; label: string }[] = [
    { id: 'criterios', label: 'Critérios' },
    { id: 'pontos', label: 'Pontos' },
    { id: 'fenologia', label: 'Fenologia' },
  ];

  return (
    <section id="premium-evolucao" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Evolução da avaliação</h2>
      <p className="text-xs text-slate-500 mb-4">
        Cada marca no eixo horizontal é um critério da mesma coleta (comparativo A × B). Séries temporais (várias visitas) entram quando o app enviar pontos no tempo.
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-sky-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'criterios' && (
        <div className="h-72 w-full min-h-[260px]">
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-25} textAnchor="end" height={70} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const a = payload.find((p) => p.dataKey === 'A')?.value as number;
                    const b = payload.find((p) => p.dataKey === 'B')?.value as number;
                    const diff =
                      a != null && b != null && a !== 0 ? (((b - a) / Math.abs(a)) * 100).toFixed(1) : null;
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                        <p className="font-semibold text-slate-800 mb-1">{label}</p>
                        <p className="text-emerald-800">
                          {sideAName}: {a ?? '—'}
                        </p>
                        <p className="text-sky-800">
                          {sideBName}: {b ?? '—'}
                        </p>
                        {diff != null && <p className="text-slate-600 mt-1">Diferença: {diff}%</p>}
                      </div>
                    );
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="A"
                  name={sideAName}
                  stroke="#047857"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={900}
                />
                <Line
                  type="monotone"
                  dataKey="B"
                  name={sideBName}
                  stroke="#0369a1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  isAnimationActive
                  animationDuration={900}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-slate-500 py-12 text-center">Sem dados de critérios para o gráfico.</p>
          )}
        </div>
      )}

      {tab === 'pontos' && (
        <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-slate-100">
          {points.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-600">#</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Nome</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {points.map((p, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 px-3">{p.indexNo ?? i + 1}</td>
                    <td className="py-2 px-3">{p.name || '—'}</td>
                    <td className="py-2 px-3">{situacaoLabel(p.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-slate-500 p-6 text-center">Nenhum ponto listado no relatório.</p>
          )}
        </div>
      )}

      {tab === 'fenologia' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4">
            <p className="font-semibold text-emerald-900 mb-2">{sideAName}</p>
            <ul className="space-y-1 text-slate-700">
              <li>Estádio: {phenology?.sideA?.estadio || '—'}</li>
              <li>Vigor: {phenology?.sideA?.vigor || '—'}</li>
              <li>Uniformidade: {phenology?.sideA?.uniformidade || '—'}</li>
              {phenology?.sideA?.observacao && <li className="text-xs text-slate-600">Obs.: {phenology.sideA.observacao}</li>}
            </ul>
          </div>
          <div className="rounded-xl border border-sky-100 bg-sky-50/40 p-4">
            <p className="font-semibold text-sky-900 mb-2">{sideBName}</p>
            <ul className="space-y-1 text-slate-700">
              <li>Estádio: {phenology?.sideB?.estadio || '—'}</li>
              <li>Vigor: {phenology?.sideB?.vigor || '—'}</li>
              <li>Uniformidade: {phenology?.sideB?.uniformidade || '—'}</li>
              {phenology?.sideB?.observacao && <li className="text-xs text-slate-600">Obs.: {phenology.sideB.observacao}</li>}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
