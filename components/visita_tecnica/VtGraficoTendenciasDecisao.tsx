'use client';

import React, { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { computeInteligenciaAgronomicaFromRelatorio } from '@/lib/inteligencia-agronomica';
import { extractIndicadoresDeltaSerie } from '@/lib/visita-tecnica/extractVtChartSeries';
import dp from './decision-premium.module.css';

const GREEN = '#16a34a';
const RED = '#dc2626';
const AMBER = '#ca8a04';

export default function VtGraficoTendenciasDecisao({ relatorio }: { relatorio: Record<string, unknown> }) {
  const intel = useMemo(() => computeInteligenciaAgronomicaFromRelatorio(relatorio), [relatorio]);
  const evo = intel.evolucao;
  const pressaoPts = useMemo(() => {
    const a = evo?.anterior_pct;
    const b = evo?.atual_pct;
    if (typeof a !== 'number' || typeof b !== 'number' || Number.isNaN(a) || Number.isNaN(b)) return null;
    return [
      { label: 'Referência', pct: a },
      { label: 'Atual', pct: b },
    ];
  }, [evo?.anterior_pct, evo?.atual_pct]);

  const deltaAlvos = useMemo(() => extractIndicadoresDeltaSerie(relatorio), [relatorio]);

  if (!pressaoPts && !deltaAlvos) return null;

  return (
    <section className={dp.sectionPremium} aria-label="Tendências para decisão">
      <h2 className={dp.sectionTitle}>Tendências para decisão</h2>
      <p style={{ margin: '-0.35rem 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, fontWeight: 600 }}>
        Direção (melhora/piora) a partir do IQF e dos indicadores estratégicos — complementa o impacto em sc/ha.
      </p>

      {pressaoPts ? (
        <div style={{ marginBottom: deltaAlvos ? '1.5rem' : 0 }}>
          <h3 className={dp.chartSubtitle}>Índice de pressão fitossanitária (IQF, %)</h3>
          <div className={dp.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={pressaoPts} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} domain={['auto', 'auto']} unit="%" width={36} />
                <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
                <Line type="monotone" dataKey="pct" stroke={AMBER} strokeWidth={3} dot={{ r: 5, fill: AMBER }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {evo?.delta_pct ? (
            <p className={dp.fraseImpacto} style={{ marginTop: '0.75rem', fontSize: '0.82rem' }}>
              Variação declarada: <strong>{evo.delta_pct}</strong>
            </p>
          ) : null}
        </div>
      ) : null}

      {deltaAlvos ? (
        <div>
          <h3 className={dp.chartSubtitle}>Δ% por alvo (vs referência)</h3>
          <div className={dp.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deltaAlvos} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="alvo"
                  width={100}
                  tick={{ fontSize: 10, fill: '#334155', fontWeight: 700 }}
                />
                <Tooltip
                  formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v}%`, 'Δ']}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <ReferenceLine x={0} stroke="#94a3b8" />
                <Bar dataKey="deltaPct" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {deltaAlvos.map((entry, i) => (
                    <Cell key={i} fill={entry.deltaPct >= 0 ? RED : GREEN} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
