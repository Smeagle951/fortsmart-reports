'use client';

import { useEffect, useState } from 'react';
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

const CLIP_A = 'polygon(0 0, calc(100% - 22px) 0, 100% 50%, calc(100% - 22px) 100%, 0 100%)';
const CLIP_B = 'polygon(22px 0, 100% 0, 100% 100%, 22px 100%, 0 50%)';

type Props = { data: SideBySideReportData };

type SideMetric = { label: string; value: string };

function useIsLg() {
  const [lg, setLg] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = window.matchMedia('(min-width: 1024px)');
    setLg(m.matches);
    const h = () => setLg(m.matches);
    m.addEventListener('change', h);
    return () => m.removeEventListener('change', h);
  }, []);
  return lg;
}

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
  const isLg = useIsLg();
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
          return `+${d} ponto${d === 1 ? '' : 's'} de vantagem no índice final`;
        })()
      : 'Comparativo de índice final';

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
        className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-7"
      >
        {/* Referência: faixa única “vs” com chevrons no desktop; empilhado no mobile */}
        <div
          className="flex flex-col gap-0 overflow-visible rounded-2xl shadow-2xl ring-1 ring-slate-200/30 lg:flex-row lg:items-stretch"
          dir="ltr"
          style={{ boxShadow: ENT.shadowStrong }}
        >
          <SideCard
            side="A"
            name={nameA}
            score={scoreA != null ? animA : null}
            metrics={metricsA}
            isWinner={winner === 'A'}
            gradient={`linear-gradient(160deg, ${ENT.green} 0%, ${ENT.greenDark} 92%)`}
            entrance={{ x: -16 }}
            align="left"
            clipId="a"
            applyClip={isLg}
          />

          <div className="relative z-20 flex w-full max-w-md flex-col items-center justify-center gap-2 self-center border-y border-slate-200/70 bg-gradient-to-b from-amber-50 via-white to-white px-5 py-7 text-center lg:-mx-3 lg:min-w-[10.5rem] lg:max-w-[10.5rem] lg:border-x lg:border-y-0 lg:border-amber-200/50 lg:py-8 lg:shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)]">
            <motion.div
              initial={{ rotate: -10, scale: 0.9 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 14, delay: 0.12 }}
              className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-amber-200 bg-amber-100 shadow-inner"
              style={{ color: ENT.gold }}
            >
              <Trophy className="h-6 w-6" strokeWidth={2} />
            </motion.div>
            <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-amber-900/80">Melhor desempenho</p>
            <p className="text-base font-black leading-tight text-slate-900 sm:text-lg">
              {winnerName ?? <span className="text-slate-500">Empate</span>}
            </p>
            <p className="max-w-[12rem] text-xs leading-snug text-slate-600">{ptsText}</p>
            {winner && scoreA != null && scoreB != null ? (
              <div className="mt-0.5 flex items-center gap-2.5 text-[10px] font-bold tabular-nums text-slate-500 sm:text-[11px]">
                <span>
                  A <span className="text-emerald-700">{formatNumber(scoreA, { decimals: 0 })}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  B <span className="text-blue-800">{formatNumber(scoreB, { decimals: 0 })}</span>
                </span>
              </div>
            ) : null}
          </div>

          <SideCard
            side="B"
            name={nameB}
            score={scoreB != null ? animB : null}
            metrics={metricsB}
            isWinner={winner === 'B'}
            gradient={`linear-gradient(200deg, ${ENT.blue} 0%, ${ENT.blueDark} 100%)`}
            entrance={{ x: 16 }}
            align="right"
            clipId="b"
            applyClip={isLg}
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
  gradient,
  entrance,
  align = 'left',
  clipId,
  applyClip,
}: {
  side: 'A' | 'B';
  name: string;
  score: number | null;
  metrics: SideMetric[];
  isWinner: boolean;
  gradient: string;
  entrance: { x: number };
  align?: 'left' | 'right';
  clipId: 'a' | 'b';
  applyClip: boolean;
}) {
  const clip = applyClip ? (clipId === 'a' ? CLIP_A : CLIP_B) : undefined;
  const cornerCl =
    applyClip
      ? side === 'A'
        ? 'lg:rounded-tl-2xl lg:rounded-bl-2xl'
        : 'lg:rounded-tr-2xl lg:rounded-br-2xl'
      : side === 'A'
        ? 'rounded-t-2xl'
        : 'rounded-b-2xl';
  return (
    <motion.div
      initial={{ opacity: 0, x: entrance.x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: applyClip ? 0 : -2, boxShadow: applyClip ? ENT.shadowStrong : ENT.shadowHover }}
      transition={{ type: 'spring', stiffness: 240, damping: 24 }}
      className={`relative min-h-0 flex-1 overflow-hidden text-white ${cornerCl}`}
      style={{
        background: gradient,
        clipPath: clip,
        boxShadow: ENT.shadowCard,
      }}
    >
      {isWinner ? (
        <div
          className={`absolute top-3 z-10 ${align === 'right' ? 'left-3' : 'right-3'} flex items-center gap-1 rounded-full bg-amber-400 px-2 py-1 text-[8px] font-black uppercase tracking-widest text-slate-900 shadow-md sm:text-[9px]`}
        >
          <Trophy className="h-3 w-3" strokeWidth={2.5} />
          Vencedor
        </div>
      ) : null}

      <div className={`px-5 py-6 sm:px-7 sm:py-8 ${align === 'right' ? 'text-right' : 'text-left'}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80">Manejo {side}</p>
        <p className="mt-0.5 truncate text-sm font-bold text-white/95 sm:text-base">{name}</p>

        <p className="mt-4 text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60">Índice final</p>
        <p className="mt-0.5 text-5xl font-black tabular-nums tracking-tight sm:text-6xl">
          {score != null ? Math.round(score) : '—'}
        </p>
      </div>

      <div
        className={`grid grid-cols-3 gap-1 border-t border-white/10 bg-black/10 px-4 py-2.5 sm:px-5 ${
          align === 'right' ? 'text-right' : 'text-left'
        }`}
      >
        {metrics.map((m) => (
          <div key={m.label} className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wider text-white/60 sm:text-[9px]">{m.label}</p>
            <p className="mt-0.5 truncate text-xs font-bold tabular-nums text-white sm:text-sm">{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
