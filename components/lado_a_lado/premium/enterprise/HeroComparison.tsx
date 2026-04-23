'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import {
  costPerHaPair,
  isFiniteNumber,
  productivityScHaPair,
  roiPctPair,
} from '@/lib/ladoALadoEnterpriseMetrics';
import { displayWinnerLetter, scoresFromJson } from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

type SideMetric = { label: string; value: string };

function sideMetrics(
  idx: 'a' | 'b',
  prod: ReturnType<typeof productivityScHaPair>,
  cost: ReturnType<typeof costPerHaPair>,
  roi: ReturnType<typeof roiPctPair>,
): SideMetric[] {
  const p = prod && isFiniteNumber(prod[idx]) ? `${formatNumber(prod[idx] as number, { decimals: 0 })} sc/ha` : '—';
  const c = cost && isFiniteNumber(cost[idx]) ? `R$ ${formatNumber(cost[idx] as number, { decimals: 0 })}/ha` : '—';
  const r = roi && isFiniteNumber(roi[idx]) ? `${formatNumber(roi[idx] as number, { decimals: 0 })}%` : '—';
  return [
    { label: 'Produtividade', value: p },
    { label: 'Custo', value: c },
    { label: 'ROI', value: r },
  ];
}

export default function HeroComparison({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const { a: scoreA, b: scoreB } = scoresFromJson(data);
  const winner = displayWinnerLetter(data);
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;

  const prod = productivityScHaPair(data);
  const cost = costPerHaPair(data);
  const roi = roiPctPair(data);

  const ptsText =
    winner != null && scoreA != null && scoreB != null
      ? (() => {
          const lead = winner === 'B' ? scoreB - scoreA : scoreA - scoreB;
          const d = Math.round(Math.abs(lead));
          return `+${d} ponto${d === 1 ? '' : 's'} de vantagem técnica`;
        })()
      : 'Comparativo de índice técnico';

  const animA = useCountUp(scoreA ?? 0, 1100, 0);
  const animB = useCountUp(scoreB ?? 0, 1100, 0);

  const metricsA = sideMetrics('a', prod, cost, roi);
  const metricsB = sideMetrics('b', prod, cost, roi);

  return (
    <section id="enterprise-hero-compare" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-12 lg:gap-3">
          {/* Manejo A */}
          <SideCard
            side="A"
            name={nameA}
            score={scoreA != null ? animA : null}
            metrics={metricsA}
            isWinner={winner === 'A'}
            colSpan="lg:col-span-4"
            gradient={`linear-gradient(145deg, ${ENT.green} 0%, ${ENT.greenDark} 100%)`}
            entrance={{ x: -20 }}
          />

          {/* Centro — troféu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50 via-white to-white px-4 py-8 text-center lg:col-span-4"
            style={{ boxShadow: ENT.shadowCard }}
          >
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.2 }}
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-100 shadow-inner"
              style={{ color: ENT.gold }}
            >
              <Trophy className="h-7 w-7" strokeWidth={2} />
            </motion.div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-900/90">Melhor desempenho</p>
            <p className="text-lg font-black leading-tight text-slate-900">{winnerName ?? 'Empate técnico'}</p>
            <p className="text-sm text-slate-600">{ptsText}</p>
            {winner && scoreA != null && scoreB != null ? (
              <div className="mt-1 flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                <span className="tabular-nums">A {formatNumber(scoreA, { decimals: 0 })}</span>
                <span className="text-slate-400">vs</span>
                <span className="tabular-nums">B {formatNumber(scoreB, { decimals: 0 })}</span>
              </div>
            ) : null}
          </motion.div>

          {/* Manejo B */}
          <SideCard
            side="B"
            name={nameB}
            score={scoreB != null ? animB : null}
            metrics={metricsB}
            isWinner={winner === 'B'}
            colSpan="lg:col-span-4"
            gradient={`linear-gradient(145deg, ${ENT.blue} 0%, ${ENT.blueDark} 100%)`}
            entrance={{ x: 20 }}
            align="right"
          />
        </div>
      </motion.div>
    </section>
  );
}

function SideCard({
  side,
  name,
  score,
  metrics,
  isWinner,
  colSpan,
  gradient,
  entrance,
  align = 'left',
}: {
  side: 'A' | 'B';
  name: string;
  score: number | null;
  metrics: SideMetric[];
  isWinner: boolean;
  colSpan: string;
  gradient: string;
  entrance: { x: number };
  align?: 'left' | 'right';
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: entrance.x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -2, boxShadow: ENT.shadowStrong }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={`relative overflow-hidden rounded-2xl text-white shadow-lg ${colSpan}`}
      style={{ background: gradient, boxShadow: ENT.shadowCard }}
    >
      {isWinner ? (
        <div
          className={`absolute top-3 ${align === 'right' ? 'left-3' : 'right-3'} flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-900 shadow-md`}
        >
          <Trophy className="h-3 w-3" strokeWidth={2.5} />
          Vencedor
        </div>
      ) : null}

      <div className={`px-6 py-7 sm:px-8 sm:py-8 ${align === 'right' ? 'text-right' : ''}`}>
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/80">Manejo {side}</p>
        <p className="mt-1 truncate text-sm font-semibold text-white/95">{name}</p>

        <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white/60">Índice técnico</p>
        <p className="mt-1 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
          {score != null ? score : '—'}
        </p>
      </div>

      <div
        className={`grid grid-cols-3 gap-2 border-t border-white/15 bg-black/10 px-5 py-3 ${
          align === 'right' ? 'text-right' : ''
        }`}
      >
        {metrics.map((m) => (
          <div key={m.label}>
            <p className="text-[9px] font-bold uppercase tracking-wider text-white/65">{m.label}</p>
            <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
