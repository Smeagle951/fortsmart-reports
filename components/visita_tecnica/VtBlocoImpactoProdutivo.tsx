'use client';

import React, { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ProdutividadePontoSerie } from '@/lib/visita-tecnica/extractVtChartSeries';
import dp from './decision-premium.module.css';

function parseN(v: string | undefined): number | null {
  if (v == null || !String(v).trim()) return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function VtBlocoImpactoProdutivo({
  potencial,
  estimativa,
  frase,
  notaMetodo,
  seriePontos,
}: {
  potencial?: string;
  estimativa?: string;
  frase?: string | null;
  notaMetodo?: string | null;
  /** ≥2 pontos: gráfico de linha (potencial × estimativa no tempo). */
  seriePontos?: ProdutividadePontoSerie[] | null;
}) {
  const barData = useMemo(() => {
    const p = parseN(potencial);
    const e = parseN(estimativa);
    if (p == null || e == null) return null;
    return [
      { nome: 'Potencial', valor: p, fill: '#16a34a' },
      { nome: 'Estimativa atual', valor: e, fill: '#dc2626' },
    ];
  }, [potencial, estimativa]);

  const lineData = useMemo(() => {
    if (!seriePontos || seriePontos.length < 2) return null;
    return seriePontos.map((pt) => ({
      label: pt.label,
      potencial: pt.potencial ?? undefined,
      estimativa: pt.estimativa ?? undefined,
    }));
  }, [seriePontos]);

  const showLine = lineData != null;
  const showBar = !showLine && barData != null;

  if (!showLine && !showBar) return null;

  return (
    <section className={dp.sectionPremium} aria-label="Produtividade comparada">
      <h2 className={dp.sectionTitle}>Impacto produtivo</h2>
      {showLine ? (
        <>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, fontWeight: 600 }}>
            Evolução no tempo a partir da série enviada no relatório (potencial e estimativa por ponto).
          </p>
          <div className={dp.chartWrap}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 600 }} interval={0} angle={-25} textAnchor="end" height={56} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} width={40} unit=" sc/ha" />
                <Tooltip
                  formatter={(value, name) => {
                    const n = Number(value);
                    const unit = Number.isFinite(n) ? `${n} sc/ha` : '—';
                    const label = name === 'potencial' ? 'Potencial' : name === 'estimativa' ? 'Estimativa atual' : String(name);
                    return [unit, label];
                  }}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Line type="monotone" dataKey="potencial" name="potencial" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                <Line type="monotone" dataKey="estimativa" name="estimativa" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : null}

      {showBar ? (
        <div className={dp.chartWrap}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData!} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#64748b' }} unit=" sc/ha" />
              <YAxis type="category" dataKey="nome" width={120} tick={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
              <Tooltip
                formatter={(v: number) => [`${v} sc/ha`, '']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }}
              />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} maxBarSize={28}>
                {barData!.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      {frase ? <p className={dp.fraseImpacto}>{frase}</p> : null}
      {notaMetodo?.trim() ? (
        <p className={dp.fraseImpacto} style={{ marginTop: frase ? '0.65rem' : '1rem', fontSize: '0.82rem', fontWeight: 600 }}>
          <strong style={{ color: 'var(--dp-green)' }}>Método / observação:</strong> {notaMetodo.trim()}
        </p>
      ) : null}
    </section>
  );
}
