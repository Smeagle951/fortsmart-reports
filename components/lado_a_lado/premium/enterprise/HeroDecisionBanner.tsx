'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
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
import {
  displayWinnerLetter,
  heroFinancialSnapshot,
  productivityDeltaKgHaFromKpis,
  scoresFromJson,
} from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function signed(n: number, decimals = 0): string {
  const s = n >= 0 ? '+' : '−';
  return `${s}${formatNumber(Math.abs(n), { decimals })}`;
}

type PillResolved = {
  label: string;
  value: string;
  prefix?: string | null;
  suffix?: string | null;
  sub?: string;
};

function buildProductivityPill(data: SideBySideReportData, winner: 'A' | 'B' | null): PillResolved {
  const prod = productivityScHaPair(data);
  const prodDeltaSc =
    winner && prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
      ? winner === 'B'
        ? prod.b - prod.a
        : prod.a - prod.b
      : null;

  if (prodDeltaSc != null) {
    return {
      label: 'Produtividade',
      value: `${signed(prodDeltaSc, 1)} sc/ha`,
      sub: 'Diferença a favor do vencedor (colheita / estimativas).',
    };
  }

  const dKg = productivityDeltaKgHaFromKpis(data);
  if (dKg != null && winner) {
    const favor = winner === 'B' ? dKg : -dKg;
    return {
      label: 'Produtividade (est.)',
      value: `${signed(favor, 0)}`,
      suffix: 'kg/ha',
      sub: 'Δ a partir de produtividade estimada nos KPIs (ambos os lados).',
    };
  }

  const { a: scA, b: scB } = scoresFromJson(data);
  if (scA != null && scB != null) {
    if (winner) {
      const favor = winner === 'B' ? scB - scA : scA - scB;
      return {
        label: 'Índice técnico',
        value: `${signed(favor, 0)}`,
        suffix: 'pts',
        sub: 'Diferença de score consolidado 0–100 (sem sc/ha publicados).',
      };
    }
    if (scA !== scB) {
      return {
        label: 'Índice (B−A)',
        value: `${signed(scB - scA, 0)}`,
        suffix: 'pts',
        sub: 'Diferença bruta; empate explícito ou indicadores apertados.',
      };
    }
  }

  return { label: 'Produtividade', value: '—', sub: 'Publique colheita ou estimativas A/B.' };
}

function buildMarginPill(
  data: SideBySideReportData,
  winner: 'A' | 'B' | null,
  prod: ReturnType<typeof productivityScHaPair>,
  cost: ReturnType<typeof costPerHaPair>,
): PillResolved {
  const rev = revenueBrlHaPair(data, prod?.a ?? null, prod?.b ?? null);
  const margin = marginBrlHaPair(rev, cost);
  const marginDelta =
    winner && margin && isFiniteNumber(margin.a) && isFiniteNumber(margin.b)
      ? winner === 'B'
        ? margin.b - margin.a
        : margin.a - margin.b
      : null;

  if (marginDelta != null) {
    return {
      label: 'Margem',
      value: `${signed(marginDelta, 0)}`,
      prefix: 'R$',
      suffix: '/ha',
      sub: 'Receita estimada − custo (ambos com preço e custos/ha).',
    };
  }

  const fin = heroFinancialSnapshot(data);
  if (fin.gainBrlHa != null && isFiniteNumber(fin.gainBrlHa) && winner) {
    const favor = winner === 'B' ? fin.gainBrlHa : -fin.gainBrlHa;
    return {
      label: 'Ganho bruto (saca)',
      value: `${signed(favor, 0)}`,
      prefix: 'R$',
      suffix: '/ha',
      sub: 'Variação de receita/ha a favor do vencedor (precisa preço e colheita).',
    };
  }

  return { label: 'Margem', value: '—', sub: 'Defina preço R$/saca e colheita ou custos/ha A/B.' };
}

function buildRoiPill(data: SideBySideReportData, winner: 'A' | 'B' | null): PillResolved {
  const roi = roiPctPair(data);
  const roiDelta =
    winner && roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)
      ? winner === 'B'
        ? roi.b - roi.a
        : roi.a - roi.b
      : null;

  if (roiDelta != null) {
    return { label: 'ROI', value: `${signed(roiDelta, 0)} p.p.`, sub: 'Pontos de ROI publicados no motor.' };
  }

  return { label: 'ROI', value: 'N/D', sub: 'Complete ROI ajustado para A e B no decision_layer.' };
}

export default function HeroDecisionBanner({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = displayWinnerLetter(data);
  const prod = productivityScHaPair(data);
  const cost = costPerHaPair(data);

  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const loserName = winner === 'A' ? nameB : winner === 'B' ? nameA : null;

  const prodPill = buildProductivityPill(data, winner);
  const marginPill = buildMarginPill(data, winner, prod, cost);
  const roiPill = buildRoiPill(data, winner);

  const prodForAnim =
    winner && prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
      ? winner === 'B'
        ? prod.b - prod.a
        : prod.a - prod.b
      : 0;
  const prodAnim = useCountUp(prodForAnim, 900, 1);

  const noData = winner == null && prodPill.value === '—' && marginPill.value === '—' && roiPill.value === 'N/D';

  const showProdLine =
    prodPill.value !== '—' && prodPill.label === 'Produtividade' && isFiniteNumber(prodForAnim);

  return (
    <section id="hero-decision" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-[1400px] px-4 pt-6 sm:px-6 sm:pt-8"
      >
        <div
          className="relative overflow-hidden rounded-[1.25rem] text-white"
          style={{
            background:
              winner === 'A'
                ? `linear-gradient(120deg, ${ENT.green} 0%, ${ENT.greenDark} 60%, ${ENT.blueDark} 100%)`
                : `linear-gradient(120deg, ${ENT.blueDark} 0%, ${ENT.blue} 55%, ${ENT.green} 100%)`,
            boxShadow: ENT.shadowStrong,
          }}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 -bottom-24 h-80 w-80 rounded-full bg-white/5 blur-3xl"
            aria-hidden
          />

          <div className="relative grid gap-6 px-6 py-8 sm:grid-cols-12 sm:gap-8 sm:px-10 sm:py-10">
            <div className="sm:col-span-7">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white backdrop-blur">
                  <Trophy className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Decisão executiva
                </span>
                {winner ? (
                  <span className="rounded-full bg-amber-400 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-md">
                    Vencedor
                  </span>
                ) : null}
              </div>
              {noData ? (
                <>
                  <h1 className="mt-4 text-2xl font-black leading-tight sm:text-[34px] md:text-[40px]">
                    Comparativo em análise
                  </h1>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
                    O relatório precisa de colheita, custos ou indicadores dos dois manejos para destacar um
                    vencedor económico.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight sm:text-[40px] md:text-[48px]">
                    {winnerName ? (
                      <>
                        <span className="block text-white/80 text-sm font-bold uppercase tracking-[0.2em] sm:text-base">
                          Recomendação
                        </span>
                        <span className="mt-1 block drop-shadow-sm">{winnerName} é superior</span>
                      </>
                    ) : (
                      <>Empate técnico entre manejos</>
                    )}
                  </h1>
                  {loserName ? (
                    <p className="mt-2 text-sm text-white/80 sm:text-base">
                      em relação a <span className="font-semibold text-white">{loserName}</span>
                      {showProdLine
                        ? ' · com vantagem mensurável de produtividade (sc/ha).'
                        : ' no comparativo publicado.'}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="sm:col-span-5">
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3 sm:gap-3">
                <MetricPill
                  label={prodPill.label}
                  value={
                    prodPill.label === 'Produtividade' && prodPill.value !== '—'
                      ? `${signed(prodAnim, 1)} sc/ha`
                      : prodPill.value
                  }
                  prefix={prodPill.prefix}
                  suffix={prodPill.suffix}
                  tone="emerald"
                  subline={prodPill.sub}
                />
                <MetricPill
                  label={marginPill.label}
                  value={marginPill.value}
                  prefix={marginPill.prefix}
                  suffix={marginPill.suffix}
                  tone="amber"
                  subline={marginPill.sub}
                />
                <MetricPill
                  label={roiPill.label}
                  value={roiPill.value}
                  tone="sky"
                  subline={roiPill.sub}
                />
              </div>
              {winner && showProdLine ? (
                <p className="mt-3 text-[11px] text-white/70">
                  Variação de produtividade a favor de <span className="font-semibold">{winnerName}</span> (
                  {winner === 'B' ? 'B − A' : 'A − B'}
                  ).
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function MetricPill({
  label,
  value,
  prefix,
  suffix,
  tone,
  subline,
}: {
  label: string;
  value: string;
  prefix?: string | null;
  suffix?: string | null;
  tone: 'emerald' | 'amber' | 'sky';
  subline?: string;
}) {
  const toneBg =
    tone === 'emerald'
      ? 'bg-emerald-500/20 text-white ring-emerald-200/50'
      : tone === 'amber'
        ? 'bg-amber-400/25 text-amber-50 ring-amber-200/50'
        : 'bg-sky-500/20 text-sky-50 ring-sky-200/50';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.12 }}
      className={`flex min-h-[5.5rem] flex-col justify-between rounded-2xl ring-1 backdrop-blur-md ${toneBg} px-3.5 py-3 text-left sm:min-h-0 sm:text-center`}
    >
      <div>
        <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/80 sm:text-[9px]">{label}</p>
        <p className="mt-1.5 text-xl font-black tabular-nums leading-tight text-white sm:text-2xl">
          {prefix ? <span className="mr-0.5 text-xs font-semibold text-white/85">{prefix}</span> : null}
          {value}
          {suffix ? <span className="ml-0.5 text-xs font-semibold text-white/85">{suffix}</span> : null}
        </p>
      </div>
      {subline ? (
        <p className="mt-1.5 line-clamp-2 text-[9px] leading-snug text-white/60 sm:mt-2">{subline}</p>
      ) : null}
    </motion.div>
  );
}
