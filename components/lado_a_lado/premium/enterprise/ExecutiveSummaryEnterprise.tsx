'use client';

import { motion } from 'framer-motion';
import { ArrowUpRight, BadgeCheck, DollarSign, Shield } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';
import { productivityScHaPair, riskFromOcorrencias, roiPctPair } from '@/lib/ladoALadoEnterpriseMetrics';
import { displayWinnerLetter, scoresFromJson } from '../premiumInference';
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function Bullet({
  icon: Icon,
  tone,
  children,
  delay,
}: {
  icon: typeof ArrowUpRight;
  tone: 'green' | 'blue' | 'amber';
  children: React.ReactNode;
  delay: number;
}) {
  const ring =
    tone === 'green'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-100'
      : tone === 'blue'
        ? 'bg-blue-50 text-blue-800 ring-blue-100'
        : 'bg-amber-50 text-amber-900 ring-amber-100';
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.35 }}
      className="flex gap-3"
    >
      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${ring}`}>
        <Icon className="h-4 w-4" strokeWidth={2} />
      </span>
      <p className="text-sm leading-relaxed text-slate-700">{children}</p>
    </motion.li>
  );
}

export default function ExecutiveSummaryEnterprise({ data }: Props) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = displayWinnerLetter(data);
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const prod = productivityScHaPair(data);
  const roi = roiPctPair(data);
  const risk = riskFromOcorrencias(data);
  const lines = data.decision_layer?.summaryLines?.filter(Boolean) ?? [];
  const { a: sa, b: sb } = scoresFromJson(data);

  const prodLeadFixed =
    prod && prod.a != null && prod.b != null && prod.b !== prod.a ? (prod.b > prod.a ? nameB : nameA) : null;

  const roiLead =
    roi && roi.a != null && roi.b != null && roi.b !== roi.a ? (roi.b > roi.a ? nameB : nameA) : null;

  return (
    <section id="enterprise-resumo" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.42 }}
        className="w-full pb-8 sm:pb-10"
      >
        <h3 className="text-base font-bold text-slate-900">Resumo executivo</h3>
        <p className="mt-1 text-sm text-slate-500">Leitura rápida para decisão em campo</p>
        <div
          className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-md sm:p-6"
          style={{ boxShadow: ENT.shadowCard }}
        >
          <ul className="space-y-4">
            {prodLeadFixed ? (
              <Bullet icon={ArrowUpRight} tone="green" delay={0}>
                <span className="font-semibold text-slate-900">{prodLeadFixed}</span> apresenta maior produtividade publicada
                {prod ? ` (${formatNumber(Math.max(prod.a!, prod.b!), { decimals: 1 })} sc/ha vs ${formatNumber(Math.min(prod.a!, prod.b!), { decimals: 1 })} sc/ha).` : '.'}
              </Bullet>
            ) : null}
            {roiLead ? (
              <Bullet icon={DollarSign} tone="blue" delay={0.06}>
                <span className="font-semibold text-slate-900">{roiLead}</span> concentra o melhor ROI ajustado entre os manejos quando o motor económico está completo no JSON.
              </Bullet>
            ) : null}
            <Bullet icon={Shield} tone="amber" delay={0.1}>
              Risco fitossanitário agregado: <span className="font-semibold text-slate-900">{risk ?? 'não classificado'}</span>
              {risk === 'Moderado' || risk === 'Baixo' ? ' — cenário controlável com monitoramento padrão.' : risk === 'Alto' ? ' — priorizar correções no próximo ciclo.' : '.'}
            </Bullet>
            {lines.slice(0, 2).map((line, i) => (
              <Bullet key={i} icon={BadgeCheck} tone="green" delay={0.14 + i * 0.04}>
                {line}
              </Bullet>
            ))}
            <Bullet icon={BadgeCheck} tone="green" delay={0.22}>
              Recomendação:{' '}
              <span className="font-semibold text-slate-900">
                {winnerName
                  ? `reforçar o manejo vencedor (${winnerName}) com base no índice ${sa != null && sb != null ? `(${Math.max(sa, sb)} vs ${Math.min(sa, sb)})` : 'publicado'}.`
                  : 'manter ambos os manejos em observação até fechar colheita e custos no app.'}
              </span>
            </Bullet>
          </ul>
        </div>
      </motion.div>
    </section>
  );
}
