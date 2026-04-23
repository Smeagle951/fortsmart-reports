'use client';

import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import {
  costPerHaPair,
  isFiniteNumber,
  marginBrlHaPair,
  productivityScHaPair,
  revenueBrlHaPair,
  roiPctPair,
} from '@/lib/ladoALadoEnterpriseMetrics';
import { displayWinnerLetter } from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function txt(v: number | null, fmt: (n: number) => string): string {
  return v != null && Number.isFinite(v) ? fmt(v) : '—';
}

export default function EconomicTableEnterprise({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const prod = productivityScHaPair(data);
  const preco = data.economia?.preco_saca_brl ?? data.market_reference?.price_sack_brl ?? null;
  const cost = costPerHaPair(data);
  const rev = revenueBrlHaPair(data, prod?.a ?? null, prod?.b ?? null);
  const margin = marginBrlHaPair(rev, cost);
  const roi = roiPctPair(data);
  const winner = displayWinnerLetter(data);

  const dq = data.decision_layer?.dataQuality;
  const roiMetaA = data.decision_layer?.roiBySide?.A;
  const roiMetaB = data.decision_layer?.roiBySide?.B;
  const roiStatus: 'real' | 'estimado' | 'parcial' | null =
    roiMetaA?.yieldSource === 'harvest' && roiMetaB?.yieldSource === 'harvest'
      ? 'real'
      : dq?.usedEstimatedYield ||
          roiMetaA?.yieldSource === 'estimated' ||
          roiMetaB?.yieldSource === 'estimated'
        ? 'estimado'
        : roi && (isFiniteNumber(roi.a) || isFiniteNumber(roi.b))
          ? 'parcial'
          : null;

  const rows: {
    key: string;
    desc: string;
    a: number | null;
    b: number | null;
    decimals: number;
    prefix?: string;
    suffix?: string;
    goodWhen?: 'higher' | 'lower';
  }[] = [
    { key: 'prod', desc: 'Produtividade', a: prod?.a ?? null, b: prod?.b ?? null, decimals: 1, suffix: ' sc/ha', goodWhen: 'higher' },
    { key: 'preco', desc: 'Preço de referência', a: preco, b: preco, decimals: 2, prefix: 'R$ ', suffix: '/sc' },
    { key: 'receita', desc: 'Receita bruta', a: rev?.a ?? null, b: rev?.b ?? null, decimals: 0, prefix: 'R$ ', suffix: '/ha', goodWhen: 'higher' },
    { key: 'custo', desc: 'Custo total', a: cost?.a ?? null, b: cost?.b ?? null, decimals: 0, prefix: 'R$ ', suffix: '/ha', goodWhen: 'lower' },
    { key: 'margem', desc: 'Margem bruta', a: margin?.a ?? null, b: margin?.b ?? null, decimals: 0, prefix: 'R$ ', suffix: '/ha', goodWhen: 'higher' },
  ];

  const hasAny =
    rows.some((r) => r.a != null || r.b != null) ||
    (roi != null && (isFiniteNumber(roi.a) || isFiniteNumber(roi.b)));
  if (!hasAny) return null;

  // Protagonista: ROI
  const roiA = roi?.a ?? null;
  const roiB = roi?.b ?? null;
  const roiDelta =
    isFiniteNumber(roiA) && isFiniteNumber(roiB) ? roiB - roiA : null;
  const roiAnimA = useCountUp(roiA ?? 0, 1000, 0);
  const roiAnimB = useCountUp(roiB ?? 0, 1000, 0);

  const statusChip =
    roiStatus === 'real'
      ? { text: 'ROI REAL', className: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200' }
      : roiStatus === 'estimado'
        ? { text: 'ROI ESTIMADO', className: 'bg-amber-100 text-amber-800 ring-1 ring-amber-200' }
        : roiStatus === 'parcial'
          ? { text: 'ROI PARCIAL', className: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200' }
          : null;

  return (
    <section id="economia-resumo-premium" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.42 }}
        className="w-full pb-8 sm:pb-10"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">Resultado económico</h3>
            <p className="mt-1 text-sm text-slate-500">Receita, custo, margem e retorno por hectare</p>
          </div>
          {statusChip ? (
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${statusChip.className}`}>
              {statusChip.text}
            </span>
          ) : null}
        </div>

        {/* ▸ Card-herói do ROI */}
        {roi ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="relative mt-4 overflow-hidden rounded-2xl p-5 text-white"
            style={{
              background: `linear-gradient(120deg, ${ENT.green} 0%, ${ENT.blue} 100%)`,
              boxShadow: ENT.shadowStrong,
            }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" strokeWidth={2.5} />
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/90">
                Retorno sobre o investimento
              </p>
            </div>
            <div className="mt-3 grid grid-cols-2 items-end gap-4 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{nameA}</p>
                <p className="mt-1 text-3xl font-black tabular-nums sm:text-4xl">
                  {isFiniteNumber(roiA) ? `${roiAnimA}%` : '—'}
                </p>
              </div>
              <div className="sm:border-l sm:border-white/20 sm:pl-4">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">{nameB}</p>
                <p className="mt-1 text-3xl font-black tabular-nums sm:text-4xl">
                  {isFiniteNumber(roiB) ? `${roiAnimB}%` : '—'}
                </p>
              </div>
              {roiDelta != null ? (
                <div className="col-span-2 sm:col-span-1 sm:border-l sm:border-white/20 sm:pl-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">
                    Diferença (B − A)
                  </p>
                  <p
                    className={`mt-1 inline-flex items-center gap-1 text-2xl font-black tabular-nums sm:text-3xl ${
                      roiDelta >= 0 ? 'text-emerald-100' : 'text-rose-100'
                    }`}
                  >
                    <ArrowRight
                      className={`h-5 w-5 ${roiDelta >= 0 ? '-rotate-45' : 'rotate-45'}`}
                      strokeWidth={2.5}
                    />
                    {roiDelta >= 0 ? '+' : '−'}
                    {formatNumber(Math.abs(roiDelta), { decimals: 0 })} p.p.
                  </p>
                </div>
              ) : null}
            </div>
          </motion.div>
        ) : null}

        {/* ▸ Linhas visuais comparativas */}
        <div className="mt-4 space-y-2">
          {rows.map((r, idx) => (
            <EconRow
              key={r.key}
              delay={0.15 + idx * 0.04}
              desc={r.desc}
              a={r.a}
              b={r.b}
              nameA={nameA}
              nameB={nameB}
              decimals={r.decimals}
              prefix={r.prefix}
              suffix={r.suffix}
              goodWhen={r.goodWhen}
              winner={winner}
            />
          ))}
        </div>
      </motion.div>
    </section>
  );
}

function EconRow({
  delay,
  desc,
  a,
  b,
  nameA,
  nameB,
  decimals,
  prefix = '',
  suffix = '',
  goodWhen,
  winner,
}: {
  delay: number;
  desc: string;
  a: number | null;
  b: number | null;
  nameA: string;
  nameB: string;
  decimals: number;
  prefix?: string;
  suffix?: string;
  goodWhen?: 'higher' | 'lower';
  winner: 'A' | 'B' | null;
}) {
  const show = (v: number | null) =>
    txt(v, (n) => `${prefix}${formatNumber(n, { decimals })}${suffix}`);
  const max = Math.max(isFiniteNumber(a) ? a : 0, isFiniteNumber(b) ? b : 0);
  const barA = isFiniteNumber(a) && max > 0 ? (a / max) * 100 : 0;
  const barB = isFiniteNumber(b) && max > 0 ? (b / max) * 100 : 0;

  // Quem é melhor nesta linha
  let betterSide: 'A' | 'B' | null = null;
  if (goodWhen && isFiniteNumber(a) && isFiniteNumber(b) && a !== b) {
    betterSide =
      goodWhen === 'higher' ? (a > b ? 'A' : 'B') : a < b ? 'A' : 'B';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm"
      style={{ boxShadow: ENT.shadowSoft }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{desc}</p>
        {betterSide && winner ? (
          <span
            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
              betterSide === winner
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {betterSide === 'A' ? nameA : nameB} lidera
          </span>
        ) : null}
      </div>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <BarLine
          label={nameA}
          value={show(a)}
          pct={barA}
          color={ENT.green}
          highlight={betterSide === 'A'}
        />
        <BarLine
          label={nameB}
          value={show(b)}
          pct={barB}
          color={ENT.blue}
          highlight={betterSide === 'B'}
        />
      </div>
    </motion.div>
  );
}

function BarLine({
  label,
  value,
  pct,
  color,
  highlight,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  highlight: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className={`truncate font-semibold ${highlight ? 'text-slate-900' : 'text-slate-600'}`}>{label}</span>
        <span className="tabular-nums font-bold text-slate-900">{value}</span>
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.span
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.max(4, pct)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="block h-full rounded-full"
          style={{
            backgroundColor: color,
            boxShadow: highlight ? `0 0 0 2px ${color}40` : 'none',
          }}
        />
      </div>
    </div>
  );
}
