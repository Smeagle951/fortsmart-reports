'use client';

import { motion } from 'framer-motion';
import { Calculator, LineChart, ShieldCheck, Sprout } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { heroFinancialSnapshot } from '../premiumInference';
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

function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  deltaTone,
  delay,
}: {
  icon: typeof Sprout;
  label: string;
  value: string;
  delta?: string | null;
  deltaTone?: 'up' | 'down' | 'neutral';
  delay: number;
}) {
  const deltaCls =
    deltaTone === 'up'
      ? 'text-emerald-700'
      : deltaTone === 'down'
        ? 'text-emerald-700'
        : 'text-slate-500';
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ scale: 1.02, boxShadow: ENT.shadowHover }}
      className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-md sm:p-5"
      style={{ boxShadow: ENT.shadowCard }}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-700 ring-1 ring-slate-100">
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-slate-900 sm:text-[28px]">{value}</p>
          {delta ? <p className={`mt-1 text-sm font-semibold ${deltaCls}`}>{delta}</p> : null}
        </div>
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
    prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
      ? `${prod.b >= prod.a ? '+' : ''}${formatNumber(prod.b - prod.a, { decimals: 1 })} sc/ha`
      : null;

  const roiDelta =
    roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)
      ? `${roi.b >= roi.a ? '+' : ''}${formatNumber(roi.b - roi.a, { decimals: 0 })} p.p.`
      : null;

  const costDelta =
    cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b)
      ? `${cost.b <= cost.a ? '' : '+'}R$ ${formatNumber(Math.abs(cost.b - cost.a), { decimals: 0 })}/ha`
      : null;

  const riskLabel = risk ? `${risk}` : '—';
  const riskSub = risk === 'Moderado' || risk === 'Baixo' ? 'Controlado' : risk === 'Alto' ? 'Requer atenção' : '';

  return (
    <section id="enterprise-kpis" className="scroll-mt-36 print:break-inside-avoid">
      <div className="mx-auto max-w-[1400px] px-4 pb-8 sm:px-6 sm:pb-10">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:gap-3">
          <div className="lg:col-span-3">
            <KpiCard
              icon={Sprout}
              label="Produtividade estimada"
              value={prod && isFiniteNumber(prod.b) ? `${formatNumber(prod.b, { decimals: 0 })} sc/ha` : '—'}
              delta={prodDelta ? `${prodDelta} (B − A)` : null}
              deltaTone="up"
              delay={0}
            />
          </div>
          <div className="lg:col-span-3">
            <KpiCard
              icon={LineChart}
              label="ROI ajustado"
              value={roi && isFiniteNumber(roi.b) ? `${formatNumber(roi.b, { decimals: 0 })}%` : '—'}
              delta={roiDelta ? `${roiDelta} (B − A)` : null}
              deltaTone="up"
              delay={0.06}
            />
          </div>
          <div className="lg:col-span-3">
            <KpiCard
              icon={Calculator}
              label="Custo total"
              value={cost && isFiniteNumber(cost.b) ? `R$ ${formatNumber(cost.b, { decimals: 0 })}/ha` : '—'}
              delta={
                costDelta && cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b)
                  ? `${cost.b <= cost.a ? '−' : '+'} R$ ${formatNumber(Math.abs(cost.b - cost.a), { decimals: 0 })}/ha (B vs A)`
                  : fin.deltaScHa != null
                    ? `Receita sacas: ${fin.deltaScHa > 0 ? '+' : ''}${formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha`
                    : null
              }
              deltaTone={cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b) && cost.b <= cost.a ? 'down' : 'neutral'}
              delay={0.12}
            />
          </div>
          <div className="lg:col-span-3">
            <KpiCard
              icon={ShieldCheck}
              label="Risco agronómico"
              value={riskLabel}
              delta={riskSub || null}
              deltaTone={risk === 'Alto' ? 'neutral' : 'up'}
              delay={0.18}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
