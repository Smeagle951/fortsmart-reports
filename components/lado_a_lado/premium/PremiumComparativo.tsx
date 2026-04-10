'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import CountUp from 'react-countup';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  buildComparativeKpis,
  deriveWinner,
} from '@/lib/lado-a-lado-premium';
import { formatNumber } from '@/utils/format';
import PhotoWithHotspots from './PhotoWithHotspots';
import { useReducedMotionClient } from './useReducedMotionClient';

function pickPhoto(photos: NonNullable<SideBySideReportData['sideA']>['photos']) {
  const list = photos || [];
  const est = list.find((p) => (p?.category || '').toLowerCase() === 'estande' && p?.url);
  return est || list.find((p) => p?.url) || null;
}

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumComparativo({ data, sideAName, sideBName }: Props) {
  const reduced = useReducedMotionClient();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-12%' });

  const kpis = buildComparativeKpis(data);
  const winner = deriveWinner(sideAName, sideBName, data);
  const photoA = pickPhoto(data.sideA?.photos);
  const photoB = pickPhoto(data.sideB?.photos);

  const top = kpis[0];
  let headlineDiff: string | null = null;
  if (top && top.valueA !== 0) {
    const d = ((top.valueB - top.valueA) / Math.abs(top.valueA)) * 100;
    if (Number.isFinite(d) && Math.abs(d) >= 0.5) {
      headlineDiff = `${d > 0 ? '+' : ''}${d.toFixed(1)}% no critério “${top.label}”`;
    }
  }

  return (
    <motion.section
      ref={ref}
      id="premium-comparativo"
      className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm overflow-hidden"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Comparativo de desempenho</h2>
          <p className="text-xs text-slate-500 mt-0.5">Evidência visual e indicadores numéricos por manejo.</p>
        </div>
        {headlineDiff && (
          <span className="text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full">
            {headlineDiff}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl overflow-hidden border border-emerald-200/80 bg-gradient-to-b from-emerald-700 to-emerald-800 text-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base tracking-wide">Manejo padrão</h3>
            {winner === 'A' && <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">Destaque</span>}
          </div>
          <p className="text-emerald-100/90 text-xs mt-1 mb-3">{sideAName}</p>
          <PhotoWithHotspots photo={photoA} alt={`Evidência ${sideAName}`} accentClass="bg-amber-400" />
          <KpiBars
            rows={kpis}
            side="A"
            animate={inView && !reduced}
            delayBase={0}
            variant="emerald"
          />
        </div>

        <div className="rounded-xl overflow-hidden border border-sky-200/80 bg-gradient-to-b from-sky-700 to-sky-900 text-white p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-sm sm:text-base tracking-wide">Manejo comparado</h3>
            {winner === 'B' && (
              <span className="text-xs bg-amber-400/90 text-amber-950 px-2 py-0.5 rounded-full font-semibold">
                🏆 Destaque
              </span>
            )}
          </div>
          <p className="text-sky-100/90 text-xs mt-1 mb-3">{sideBName}</p>
          <PhotoWithHotspots photo={photoB} alt={`Evidência ${sideBName}`} accentClass="bg-amber-300" />
          <KpiBars
            rows={kpis}
            side="B"
            animate={inView && !reduced}
            delayBase={kpis.length * 0.08}
            variant="sky"
          />
        </div>
      </div>
    </motion.section>
  );
}

function KpiBars({
  rows,
  side,
  animate,
  delayBase,
  variant,
}: {
  rows: ReturnType<typeof buildComparativeKpis>;
  side: 'A' | 'B';
  animate: boolean;
  delayBase: number;
  variant: 'emerald' | 'sky';
}) {
  const labelCls = variant === 'emerald' ? 'text-emerald-50/95' : 'text-sky-50/95';
  return (
    <ul className="mt-4 space-y-3">
      {rows.map((row, i) => {
        const pct = side === 'A' ? row.pctA : row.pctB;
        const val = side === 'A' ? row.valueA : row.valueB;
        const delay = delayBase + i * 0.15;
        const dec = Math.abs(val) < 10 && val % 1 !== 0 ? 1 : 0;
        return (
          <li key={row.label + i} className="text-xs">
            <div className={`flex justify-between ${labelCls} mb-1 gap-2`}>
              <span className="truncate font-medium">{row.label}</span>
              <span className="shrink-0 tabular-nums">
                {animate ? (
                  <>
                    <CountUp end={val} decimals={dec} duration={1} delay={delay} preserveValue />
                    {row.unit ? ` ${row.unit}` : ''}
                  </>
                ) : (
                  <>
                    {formatNumber(val, { decimals: dec })}
                    {row.unit ? ` ${row.unit}` : ''}
                  </>
                )}
              </span>
            </div>
            <div className="h-2 rounded-full bg-black/25 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-white/90"
                initial={{ width: animate ? 0 : `${pct}%` }}
                animate={{ width: `${pct}%` }}
                transition={{
                  duration: animate ? 0.9 : 0,
                  delay: animate ? delay : 0,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            </div>
          </li>
        );
      })}
      {rows.length === 0 && <li className="text-white/70 text-xs">Sem critérios numéricos no JSON — preencha KPIs ou criteriosEstatistica.</li>}
    </ul>
  );
}
