'use client';

import React from 'react';
import { formatNumber } from '@/utils/format';

type Kpis = {
  avgHeightCm?: number;
  leafCount?: number;
  finalPopulationPlHa?: number;
  estimatedYieldKgHa?: number;
  rootRating?: { label?: string; score?: number; max?: number };
  vigorRating?: { label?: string; score?: number; max?: number };
  profundidadeRaizCm?: number;
  pesoRaizG?: number;
  estandeEfetivo?: number;
  eficienciaPct?: number;
};

function formatDiff(
  valA: number,
  valB: number,
  unit: string,
  higherIsBetter: boolean
): string {
  const diff = valB - valA;
  if (diff === 0) return '—';
  const pct = valA !== 0 ? (diff / valA) * 100 : null;
  const sign = diff > 0 ? '+' : '';
  const numStr = Number.isInteger(diff) ? `${sign}${diff}` : `${sign}${diff.toFixed(1)}`;
  const pctStr = pct != null ? ` (${sign}${pct.toFixed(1)}%)` : '';
  return `${numStr} ${unit}${pctStr}`;
}

interface TabelaComparativaKPIsProps {
  sideAName: string;
  sideBName: string;
  kpisA: Kpis;
  kpisB: Kpis;
  soilCompactionA?: string;
  soilCompactionB?: string;
  compactionLabels: Record<string, string>;
}

export default function TabelaComparativaKPIs({
  sideAName,
  sideBName,
  kpisA,
  kpisB,
  soilCompactionA,
  soilCompactionB,
  compactionLabels,
}: TabelaComparativaKPIsProps) {
  const rows: Array<{ indicator: string; valueA: string; valueB: string; diff: string; highlightBetter?: boolean }> = [];

  if (kpisA.avgHeightCm != null || kpisB.avgHeightCm != null) {
    const a = kpisA.avgHeightCm ?? 0;
    const b = kpisB.avgHeightCm ?? 0;
    rows.push({
      indicator: 'Altura média (cm)',
      valueA: a > 0 ? `${a} cm` : '—',
      valueB: b > 0 ? `${b} cm` : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, 'cm', true) : '—',
    });
  }
  if (kpisA.leafCount != null || kpisB.leafCount != null) {
    const a = kpisA.leafCount ?? 0;
    const b = kpisB.leafCount ?? 0;
    const diff = b - a;
    rows.push({
      indicator: 'Número de folhas',
      valueA: a > 0 ? String(a) : '—',
      valueB: b > 0 ? String(b) : '—',
      diff: diff !== 0 ? `${diff > 0 ? '+' : ''}${diff}` : '—',
    });
  }
  if (kpisA.finalPopulationPlHa != null || kpisB.finalPopulationPlHa != null) {
    const a = kpisA.finalPopulationPlHa ?? 0;
    const b = kpisB.finalPopulationPlHa ?? 0;
    rows.push({
      indicator: 'População final (pl/ha)',
      valueA: a > 0 ? formatNumber(a, { decimals: 0 }) : '—',
      valueB: b > 0 ? formatNumber(b, { decimals: 0 }) : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, 'pl/ha', true) : '—',
    });
  }
  if (kpisA.estimatedYieldKgHa != null || kpisB.estimatedYieldKgHa != null) {
    const a = kpisA.estimatedYieldKgHa ?? 0;
    const b = kpisB.estimatedYieldKgHa ?? 0;
    rows.push({
      indicator: 'Produtividade estimada (kg/ha)',
      valueA: a > 0 ? formatNumber(a, { decimals: 0 }) : '—',
      valueB: b > 0 ? formatNumber(b, { decimals: 0 }) : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, 'kg/ha', true) : '—',
      highlightBetter: true,
    });
  }
  if (kpisA.rootRating != null || kpisB.rootRating != null) {
    const a = kpisA.rootRating?.label ?? '—';
    const b = kpisB.rootRating?.label ?? '—';
    const scoreA = kpisA.rootRating?.score;
    const scoreB = kpisB.rootRating?.score;
    const detailA = scoreA != null && kpisA.rootRating?.max != null ? ` (${scoreA}/${kpisA.rootRating!.max})` : '';
    const detailB = scoreB != null && kpisB.rootRating?.max != null ? ` (${scoreB}/${kpisB.rootRating!.max})` : '';
    rows.push({
      indicator: 'Sanidade raiz',
      valueA: a !== '—' ? `${a}${detailA}` : '—',
      valueB: b !== '—' ? `${b}${detailB}` : '—',
      diff: '—',
    });
  }
  if (kpisA.vigorRating != null || kpisB.vigorRating != null) {
    const a = kpisA.vigorRating?.label ?? '—';
    const b = kpisB.vigorRating?.label ?? '—';
    rows.push({
      indicator: 'Vigor',
      valueA: a,
      valueB: b,
      diff: '—',
    });
  }
  if (kpisA.eficienciaPct != null || kpisB.eficienciaPct != null) {
    const a = kpisA.eficienciaPct ?? 0;
    const b = kpisB.eficienciaPct ?? 0;
    rows.push({
      indicator: 'Eficiência do estande (%)',
      valueA: a > 0 ? `${formatNumber(a, { decimals: 1 })}%` : '—',
      valueB: b > 0 ? `${formatNumber(b, { decimals: 1 })}%` : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, '%', true) : '—',
    });
  }
  if (kpisA.estandeEfetivo != null || kpisB.estandeEfetivo != null) {
    const a = kpisA.estandeEfetivo ?? 0;
    const b = kpisB.estandeEfetivo ?? 0;
    rows.push({
      indicator: 'Estande efetivo',
      valueA: a > 0 ? formatNumber(a, { decimals: 1 }) : '—',
      valueB: b > 0 ? formatNumber(b, { decimals: 1 }) : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, '', true) : '—',
    });
  }
  if (kpisA.profundidadeRaizCm != null || kpisB.profundidadeRaizCm != null) {
    const a = kpisA.profundidadeRaizCm ?? 0;
    const b = kpisB.profundidadeRaizCm ?? 0;
    rows.push({
      indicator: 'Profundidade da raiz (cm)',
      valueA: a > 0 ? `${formatNumber(a, { decimals: 1 })} cm` : '—',
      valueB: b > 0 ? `${formatNumber(b, { decimals: 1 })} cm` : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, 'cm', true) : '—',
    });
  }
  if (kpisA.pesoRaizG != null || kpisB.pesoRaizG != null) {
    const a = kpisA.pesoRaizG ?? 0;
    const b = kpisB.pesoRaizG ?? 0;
    rows.push({
      indicator: 'Peso raiz (g)',
      valueA: a > 0 ? `${formatNumber(a, { decimals: 1 })} g` : '—',
      valueB: b > 0 ? `${formatNumber(b, { decimals: 1 })} g` : '—',
      diff: a > 0 || b > 0 ? formatDiff(a, b, 'g', true) : '—',
    });
  }
  if (soilCompactionA || soilCompactionB) {
    rows.push({
      indicator: 'Compactação do solo',
      valueA: compactionLabels[soilCompactionA || ''] || soilCompactionA || '—',
      valueB: compactionLabels[soilCompactionB || ''] || soilCompactionB || '—',
      diff: '—',
    });
  }

  if (rows.length === 0) {
    return (
      <section className="sbs-section">
        <h2 className="sbs-section-title">Comparativo de indicadores</h2>
        <p className="sbs-muted">Nenhum indicador preenchido para exibir na tabela comparativa.</p>
      </section>
    );
  }

  return (
    <section className="sbs-section">
      <h2 className="sbs-section-title">Comparativo de indicadores</h2>
      <p className="sbs-section-desc">
        Comparação objetiva entre <strong>{sideAName}</strong> e <strong>{sideBName}</strong>. A coluna &quot;Diferença&quot; indica (B − A); positivo indica maior valor em B.
      </p>
      <div className="sbs-table-wrap">
        <table className="sbs-table sbs-table-comparison">
          <thead>
            <tr>
              <th>Indicador</th>
              <th className="sbs-th-right">{sideAName}</th>
              <th className="sbs-th-right">{sideBName}</th>
              <th className="sbs-th-right">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.indicator}</td>
                <td className="sbs-td-right">{r.valueA}</td>
                <td className="sbs-td-right">{r.valueB}</td>
                <td className={`sbs-td-right ${r.highlightBetter && r.diff.startsWith('+') ? 'sbs-diff-positive' : ''}`}>
                  {r.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
