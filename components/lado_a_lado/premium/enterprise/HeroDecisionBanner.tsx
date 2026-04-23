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
import { displayWinnerLetter } from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function signed(n: number, decimals = 0): string {
  const s = n >= 0 ? '+' : '−';
  return `${s}${formatNumber(Math.abs(n), { decimals })}`;
}

export default function HeroDecisionBanner({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = displayWinnerLetter(data);
  const prod = productivityScHaPair(data);
  const roi = roiPctPair(data);
  const cost = costPerHaPair(data);
  const rev = revenueBrlHaPair(data, prod?.a ?? null, prod?.b ?? null);
  const margin = marginBrlHaPair(rev, cost);

  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const loserName = winner === 'A' ? nameB : winner === 'B' ? nameA : null;

  const prodDelta =
    winner && prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
      ? winner === 'B'
        ? prod.b - prod.a
        : prod.a - prod.b
      : null;

  const marginDelta =
    winner && margin && isFiniteNumber(margin.a) && isFiniteNumber(margin.b)
      ? winner === 'B'
        ? margin.b - margin.a
        : margin.a - margin.b
      : null;

  const roiDelta =
    winner && roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)
      ? winner === 'B'
        ? roi.b - roi.a
        : roi.a - roi.b
      : null;

  const prodAnim = useCountUp(prodDelta ?? 0, 900, 1);
  const marginAnim = useCountUp(marginDelta ?? 0, 1000, 0);
  const roiAnim = useCountUp(roiDelta ?? 0, 900, 0);

  const noData = winner == null && prodDelta == null && marginDelta == null && roiDelta == null;

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
          {/* Halo decorativo */}
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
              <div className="flex items-center gap-2">
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
                    O relatório precisa de colheita, custos ou indicadores dos dois manejos para destacar um vencedor económico.
                  </p>
                </>
              ) : (
                <>
                  <h1 className="mt-4 text-3xl font-black leading-[1.05] tracking-tight sm:text-[40px] md:text-[48px]">
                    {winnerName ? (
                      <>
                        <span className="block text-white/80 text-base font-bold uppercase tracking-[0.22em]">
                          Recomendação
                        </span>
                        <span className="mt-1 block">{winnerName} é superior</span>
                      </>
                    ) : (
                      <>Empate técnico entre manejos</>
                    )}
                  </h1>
                  {loserName ? (
                    <p className="mt-2 text-sm text-white/80 sm:text-base">
                      em relação a <span className="font-semibold text-white">{loserName}</span>
                      {prodDelta != null && isFiniteNumber(prodDelta) && prodDelta > 0
                        ? ' · com ganho de produtividade, rentabilidade e retorno.'
                        : ' no comparativo publicado.'}
                    </p>
                  ) : null}
                </>
              )}
            </div>

            <div className="sm:col-span-5">
              <div className="grid grid-cols-3 gap-3">
                <MetricPill
                  label="Produtividade"
                  value={prodDelta != null ? `${signed(prodAnim, 1)} sc/ha` : '—'}
                  tone="emerald"
                />
                <MetricPill
                  label="Margem"
                  value={marginDelta != null ? `${signed(marginAnim, 0)}` : '—'}
                  prefix={marginDelta != null ? 'R$' : null}
                  suffix={marginDelta != null ? '/ha' : null}
                  tone="amber"
                />
                <MetricPill
                  label="ROI"
                  value={roiDelta != null ? `${signed(roiAnim, 0)} p.p.` : '—'}
                  tone="sky"
                />
              </div>
              {winner && prodDelta != null && isFiniteNumber(prodDelta) ? (
                <p className="mt-3 text-[11px] text-white/70">
                  Variação calculada em favor de <span className="font-semibold">{winnerName}</span> ({winner === 'B' ? 'B − A' : 'A − B'}).
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
}: {
  label: string;
  value: string;
  prefix?: string | null;
  suffix?: string | null;
  tone: 'emerald' | 'amber' | 'sky';
}) {
  const toneBg =
    tone === 'emerald'
      ? 'bg-emerald-400/20 text-emerald-50 ring-emerald-200/40'
      : tone === 'amber'
        ? 'bg-amber-300/25 text-amber-50 ring-amber-200/40'
        : 'bg-sky-400/20 text-sky-50 ring-sky-200/40';
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15 }}
      className={`rounded-xl ring-1 backdrop-blur ${toneBg} px-3 py-3 text-center`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-black tabular-nums leading-tight text-white sm:text-xl">
        {prefix ? <span className="mr-0.5 text-xs font-semibold opacity-80">{prefix}</span> : null}
        {value}
        {suffix ? <span className="ml-0.5 text-xs font-semibold opacity-80">{suffix}</span> : null}
      </p>
    </motion.div>
  );
}
