'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { displayWinnerLetter, scoresFromJson } from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

export default function HeroComparison({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const { a: scoreA, b: scoreB } = scoresFromJson(data);
  const winner = displayWinnerLetter(data);
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const ptsText =
    winner != null && scoreA != null && scoreB != null
      ? (() => {
          const lead = winner === 'B' ? scoreB - scoreA : scoreA - scoreB;
          const d = Math.round(Math.abs(lead));
          return `+${d} ponto${d === 1 ? '' : 's'} de vantagem`;
        })()
      : 'Comparativo de índice técnico';

  const animA = useCountUp(scoreA ?? 0, 1100, 0);
  const animB = useCountUp(scoreB ?? 0, 1100, 0);

  return (
    <section id="enterprise-hero-compare" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10"
      >
        <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-12 lg:gap-2">
          {/* Manejo A */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative overflow-hidden rounded-2xl text-white shadow-lg lg:col-span-4"
            style={{
              background: `linear-gradient(145deg, ${ENT.green} 0%, ${ENT.greenDark} 100%)`,
              boxShadow: ENT.shadowCard,
            }}
          >
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Manejo A</p>
              <p className="mt-1 truncate text-sm font-semibold text-white/95">{nameA}</p>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-white/70">Índice final</p>
              <p className="mt-1 text-5xl font-black tabular-nums tracking-tight sm:text-6xl md:text-7xl">
                {scoreA != null ? animA : '—'}
              </p>
            </div>
            {winner === 'A' ? (
              <div className="absolute right-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Destaque
              </div>
            ) : null}
          </motion.div>

          {/* Centro — troféu */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-amber-200/80 bg-gradient-to-b from-amber-50 via-white to-white px-4 py-8 shadow-md lg:col-span-4"
            style={{ boxShadow: ENT.shadowCard }}
          >
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-300/80 bg-amber-100 shadow-inner"
              style={{ color: ENT.gold }}
            >
              <Trophy className="h-7 w-7" strokeWidth={2} />
            </div>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-900/90">Melhor desempenho</p>
            <p className="mt-2 text-center text-lg font-bold text-slate-900">{winnerName ?? 'Empate técnico'}</p>
            <p className="mt-1 text-center text-sm text-slate-600">{ptsText}</p>
          </motion.div>

          {/* Manejo B */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            className="relative overflow-hidden rounded-2xl text-white shadow-lg lg:col-span-4"
            style={{
              background: `linear-gradient(145deg, ${ENT.blue} 0%, #0f2a5c 100%)`,
              boxShadow: ENT.shadowCard,
            }}
          >
            <div className="px-6 py-8 text-right sm:px-8 sm:py-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/90">Manejo B</p>
              <p className="mt-1 truncate text-sm font-semibold text-white/95">{nameB}</p>
              <p className="mt-6 text-[10px] font-semibold uppercase tracking-widest text-white/70">Índice final</p>
              <p className="mt-1 text-5xl font-black tabular-nums tracking-tight sm:text-6xl md:text-7xl">
                {scoreB != null ? animB : '—'}
              </p>
            </div>
            {winner === 'B' ? (
              <div className="absolute left-3 top-3 rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                Destaque
              </div>
            ) : null}
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
