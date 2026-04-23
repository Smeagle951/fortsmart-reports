'use client';

import { motion } from 'framer-motion';
import {
  Calculator,
  LineChart,
  ShieldCheck,
  Sprout,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { ElementType } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { heroFinancialSnapshot } from '../premiumInference';
import { useCountUp } from '../useCountUp';
import { formatNumber } from '@/utils/format';
import {
  costPerHaPair,
  isFiniteNumber,
  productivityScHaPair,
  riskFromOcorrencias,
  roiPctPair,
} from '@/lib/ladoALadoEnterpriseMetrics';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

type Tone = 'emerald' | 'blue' | 'amber' | 'slate';
type DeltaDirection = 'up' | 'down' | 'flat';

function KpiCard({
  icon: Icon,
  label,
  numericValue,
  textValue,
  decimals = 0,
  suffix = '',
  prefix = '',
  delta,
  deltaDir,
  deltaGood,
  tone,
  delay,
  hint,
}: {
  icon: ElementType;
  label: string;
  numericValue?: number | null;
  textValue?: string | null;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  delta?: string | null;
  deltaDir?: DeltaDirection;
  deltaGood?: boolean;
  tone: Tone;
  delay: number;
  hint?: string | null;
}) {
  const accent =
    tone === 'emerald' ? ENT.green : tone === 'blue' ? ENT.blue : tone === 'amber' ? ENT.gold : ENT.textMuted;
  const softBg =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-700'
        : tone === 'amber'
          ? 'bg-amber-50 text-amber-700'
          : 'bg-slate-50 text-slate-700';
  const deltaColor = deltaGood
    ? 'text-emerald-700 bg-emerald-50'
    : deltaGood === false
      ? 'text-rose-700 bg-rose-50'
      : 'text-slate-600 bg-slate-100';
  const DeltaIcon = deltaDir === 'up' ? TrendingUp : deltaDir === 'down' ? TrendingDown : Minus;

  const anim = useCountUp(numericValue ?? 0, 950, decimals);
  const valueText = textValue
    ? textValue
    : numericValue == null
      ? '—'
      : `${prefix}${formatNumber(anim, { decimals })}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -3, boxShadow: ENT.shadowHover }}
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
      style={{ boxShadow: ENT.shadowCard }}
    >
      {/* Borda colorida à esquerda */}
      <span
        className="absolute inset-y-4 left-0 w-1 rounded-r-full"
        style={{ backgroundColor: accent }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${softBg}`}>
          <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
        </div>
        {delta ? (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${deltaColor}`}
          >
            <DeltaIcon className="h-3 w-3" strokeWidth={2.5} />
            {delta}
          </span>
        ) : null}
      </div>
      <div className="mt-3 pl-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className="mt-1 text-[28px] font-black tabular-nums leading-none tracking-tight text-slate-900 sm:text-[32px]">
          {valueText}
        </p>
        {hint ? <p className="mt-1.5 text-[11px] font-medium text-slate-500">{hint}</p> : null}
      </div>
    </motion.div>
  );
}

export default function EnterpriseKPIStrip({ data }: Props) {
  const prod = productivityScHaPair(data);
  const roi = roiPctPair(data);
  const cost = costPerHaPair(data);
  const fin = heroFinancialSnapshot(data);
  const risk = riskFromOcorrencias(data);

  const prodDelta =
    prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b) ? prod.b - prod.a : null;
  const roiDelta =
    roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b) ? roi.b - roi.a : null;
  const costDelta =
    cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b) ? cost.b - cost.a : null;

  const prodDeltaText = prodDelta != null ? `${prodDelta >= 0 ? '+' : '−'}${formatNumber(Math.abs(prodDelta), { decimals: 1 })} sc/ha` : null;
  const roiDeltaText = roiDelta != null ? `${roiDelta >= 0 ? '+' : '−'}${formatNumber(Math.abs(roiDelta), { decimals: 0 })} p.p.` : null;
  const costDeltaText = costDelta != null ? `${costDelta <= 0 ? '−' : '+'} R$ ${formatNumber(Math.abs(costDelta), { decimals: 0 })}/ha` : null;

  const riskTone: Tone =
    risk === 'Alto' ? 'amber' : risk === 'Moderado' ? 'amber' : risk === 'Baixo' ? 'emerald' : 'slate';
  const riskHint =
    risk === 'Alto'
      ? 'Requer atenção imediata'
      : risk === 'Moderado'
        ? 'Controlo reforçado recomendado'
        : risk === 'Baixo'
          ? 'Cenário controlado'
          : 'Sem ocorrências publicadas';

  const costHint =
    costDelta == null && fin.deltaScHa != null
      ? `Receita sacas: ${fin.deltaScHa > 0 ? '+' : ''}${formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha`
      : costDelta != null
        ? costDelta <= 0
          ? 'Mais barato que A'
          : 'Mais caro que A'
        : null;

  return (
    <section id="enterprise-kpis" className="scroll-mt-36 print:break-inside-avoid">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={Sprout}
            label="Produtividade"
            numericValue={prod && isFiniteNumber(prod.b) ? prod.b : null}
            decimals={0}
            suffix=" sc/ha"
            delta={prodDeltaText}
            deltaDir={prodDelta == null ? 'flat' : prodDelta > 0 ? 'up' : prodDelta < 0 ? 'down' : 'flat'}
            deltaGood={prodDelta == null ? undefined : prodDelta >= 0}
            tone="emerald"
            delay={0}
            hint="Manejo B (comparado com A)"
          />
          <KpiCard
            icon={LineChart}
            label="ROI ajustado"
            numericValue={roi && isFiniteNumber(roi.b) ? roi.b : null}
            decimals={0}
            suffix="%"
            delta={roiDeltaText}
            deltaDir={roiDelta == null ? 'flat' : roiDelta > 0 ? 'up' : roiDelta < 0 ? 'down' : 'flat'}
            deltaGood={roiDelta == null ? undefined : roiDelta >= 0}
            tone="blue"
            delay={0.06}
            hint="Retorno sobre o investimento"
          />
          <KpiCard
            icon={Calculator}
            label="Custo total"
            numericValue={cost && isFiniteNumber(cost.b) ? cost.b : null}
            decimals={0}
            prefix="R$ "
            suffix="/ha"
            delta={costDeltaText}
            deltaDir={costDelta == null ? 'flat' : costDelta > 0 ? 'up' : costDelta < 0 ? 'down' : 'flat'}
            deltaGood={costDelta == null ? undefined : costDelta <= 0}
            tone="amber"
            delay={0.12}
            hint={costHint}
          />
          <KpiCard
            icon={ShieldCheck}
            label="Risco agronómico"
            textValue={risk ?? 'Sem leitura'}
            tone={riskTone}
            delay={0.18}
            hint={riskHint}
          />
        </div>
      </div>
    </section>
  );
}
