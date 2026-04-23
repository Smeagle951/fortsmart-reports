'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import PremiumSectionShell from './PremiumSectionShell';
import { COLOR_SIDE_A, COLOR_SIDE_B, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatMetricDeltaLine } from '@/lib/decisionLayer';
import { formatNumber } from '@/utils/format';
import { heroFinancialSnapshot, productivityDeltaKgHaFromKpis } from './premiumInference';
import { useCountUp } from './useCountUp';

const cardMotion = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-30px' },
  transition: { duration: 0.4 },
};

function DeltaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex mt-2 rounded-full bg-slate-900 text-white text-xs font-bold px-2.5 py-1 tabular-nums">
      {children}
    </span>
  );
}

export default function KPISection({ data }: { data: SideBySideReportData }) {
  const sideA = data.sideA;
  const sideB = data.sideB;
  const kpisA = sideA?.kpis;
  const kpisB = sideB?.kpis;
  const nameA = sideA?.name || 'Manejo A';
  const nameB = sideB?.name || 'Manejo B';
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const costA = custo?.by_side?.find((b) => b.side === 'A')?.costPerHa ?? null;
  const costB = custo?.by_side?.find((b) => b.side === 'B')?.costPerHa ?? null;
  const fin = heroFinancialSnapshot(data);
  const dKg = productivityDeltaKgHaFromKpis(data);

  const yA = kpisA?.estimatedYieldKgHa ?? null;
  const yB = kpisB?.estimatedYieldKgHa ?? null;
  const effA = kpisA?.eficienciaPct ?? null;
  const effB = kpisB?.eficienciaPct ?? null;

  const animYA = useCountUp(yA ?? 0, 900, 0);
  const animYB = useCountUp(yB ?? 0, 900, 0);
  const animCA = useCountUp(costA ?? 0, 900, 2);
  const animCB = useCountUp(costB ?? 0, 900, 2);
  const animEA = useCountUp(effA ?? 0, 900, 1);
  const animEB = useCountUp(effB ?? 0, 900, 1);

  const estadioA = data.phenology?.sideA?.estadio?.trim();
  const estadioB = data.phenology?.sideB?.estadio?.trim();
  const estadio =
    estadioA && estadioB && estadioA === estadioB
      ? estadioA
      : estadioA || estadioB || data.coleta?.estadio?.trim() || null;

  const cards: ReactNode[] = [];

  if (yA != null || yB != null) {
    cards.push(
      <motion.div
        key="prod"
        {...cardMotion}
        className="rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Produtividade estimada</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_A }}>
              {nameA}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: COLOR_SIDE_A }}>
              {yA != null ? formatNumber(animYA, { decimals: 0 }) : '—'}
              <span className="text-sm font-semibold text-slate-500 ml-1">kg/ha</span>
            </p>
          </div>
          <div className="text-center text-slate-300 text-sm pb-1">vs</div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_B }}>
              {nameB}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums" style={{ color: COLOR_SIDE_B }}>
              {yB != null ? formatNumber(animYB, { decimals: 0 }) : '—'}
              <span className="text-sm font-semibold text-slate-500 ml-1">kg/ha</span>
            </p>
          </div>
        </div>
        {dKg != null && Math.abs(dKg) >= 1 ? (
          <DeltaChip>
            Δ {dKg > 0 ? '+' : ''}
            {formatNumber(dKg, { decimals: 0 })} kg/ha (B − A)
          </DeltaChip>
        ) : null}
      </motion.div>,
    );
  }

  if (costA != null || costB != null) {
    const dCost =
      costA != null && costB != null && Number.isFinite(costA) && Number.isFinite(costB)
        ? costB - costA
        : null;
    cards.push(
      <motion.div
        key="cost"
        {...cardMotion}
        transition={{ ...cardMotion.transition, delay: 0.05 }}
        className="rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Custo / ha</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_A }}>
              {nameA}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {costA != null ? `R$ ${formatNumber(animCA, { decimals: 2 })}` : '—'}
            </p>
          </div>
          <div className="text-center text-slate-300 text-sm pb-1">vs</div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_B }}>
              {nameB}
            </p>
            <p className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900">
              {costB != null ? `R$ ${formatNumber(animCB, { decimals: 2 })}` : '—'}
            </p>
          </div>
        </div>
        {dCost != null && Math.abs(dCost) >= 0.5 ? (
          <DeltaChip>
            Δ custo (B − A) R$ {formatNumber(dCost, { decimals: 2 })}/ha
          </DeltaChip>
        ) : null}
      </motion.div>,
    );
  }

  if (fin.gainBrlHa != null && Math.abs(fin.gainBrlHa) >= 1) {
    cards.push(
      <motion.div
        key="margin"
        {...cardMotion}
        transition={{ ...cardMotion.transition, delay: 0.1 }}
        className="rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/90 to-white p-6 shadow-[0_2px_12px_-4px_rgba(6,78,59,0.08)] ring-1 ring-emerald-900/[0.04]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">
          Receita bruta estimada (variação)
        </p>
        <p className="mt-3 text-2xl sm:text-3xl font-bold tabular-nums text-emerald-900">
          {fin.gainBrlHa > 0 ? '+' : ''}R$ {formatNumber(Math.abs(fin.gainBrlHa), { decimals: 0 })}/ha
        </p>
        <p className="mt-2 text-xs text-emerald-900/80 leading-snug">
          Diferença entre manejos com base em produtividade em sacas publicada e no preço da saca informado no
          relatório.
        </p>
      </motion.div>,
    );
  }

  if (estadio) {
    cards.push(
      <motion.div
        key="pheno"
        {...cardMotion}
        transition={{ ...cardMotion.transition, delay: 0.12 }}
        className="rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Fenologia</p>
        <p className="mt-4 text-3xl font-bold text-slate-900">{estadio}</p>
        {estadioA && estadioB && estadioA !== estadioB ? (
          <p className="mt-2 text-xs text-slate-600">
            A: {estadioA} · B: {estadioB}
          </p>
        ) : null}
      </motion.div>,
    );
  }

  if ((effA != null || effB != null) && cards.length < 5) {
    cards.push(
      <motion.div
        key="eff"
        {...cardMotion}
        transition={{ ...cardMotion.transition, delay: 0.14 }}
        className="rounded-2xl border border-slate-200/60 bg-white/95 p-6 shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] ring-1 ring-slate-900/[0.04]"
      >
        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Eficiência de estande</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_A }}>
              {nameA}
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: COLOR_SIDE_A }}>
              {effA != null ? `${formatNumber(animEA, { decimals: 1 })}%` : '—'}
            </p>
          </div>
          <div className="text-slate-300 text-sm pb-1">vs</div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase" style={{ color: COLOR_SIDE_B }}>
              {nameB}
            </p>
            <p className="text-2xl font-bold tabular-nums" style={{ color: COLOR_SIDE_B }}>
              {effB != null ? `${formatNumber(animEB, { decimals: 1 })}%` : '—'}
            </p>
          </div>
        </div>
      </motion.div>,
    );
  }

  const dq = data.decision_layer?.dataQuality;
  const metricLines =
    data.decision_layer?.metrics
      ?.map((m) => formatMetricDeltaLine(m, nameA, nameB))
      .filter((s): s is string => Boolean(s && s.trim())) ?? [];

  if (cards.length === 0 && !dq?.usedEstimatedYield && metricLines.length === 0) return null;

  return (
    <PremiumSectionShell
      id="kpis-premium"
      eyebrow="Painel decisório"
      title="Indicadores para decisão"
      subtitle="Síntese quantitativa do relatório: produtividade, custos, fenologia e eficiência de estande quando disponíveis."
    >
      {dq?.usedEstimatedYield ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <span className="font-semibold">Atenção: </span>
          produtividade estimada entrou nos cálculos publicados — revisar após colheita real.
        </div>
      ) : null}
      {metricLines.length > 0 ? (
        <div className="mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Leitura do motor (lado a lado)
          </p>
          <ul className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
            {metricLines.map((line, i) => (
              <li
                key={i}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {cards.length > 0 ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">{cards.slice(0, 5)}</div>
      ) : null}
    </PremiumSectionShell>
  );
}
