'use client';

import React, { useRef } from 'react';
import { useInView } from 'framer-motion';
import CountUp from 'react-countup';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { deriveWinner } from '@/lib/lado-a-lado-premium';
import {
  colheitaScHaDiff,
  readColheitaPayload,
  readCustoPayload,
  readEconomiaPayload,
  REFERENCE_SACK_PRICE_BRL_DEFAULT,
} from '@/lib/lado-a-lado-economic';
import { formatNumber } from '@/utils/format';
import { useReducedMotionClient } from './useReducedMotionClient';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

function kgHaToScHa(kgHa: number, kgPerSc: number) {
  if (kgHa <= 0 || kgPerSc <= 0) return null;
  return kgHa / kgPerSc;
}

function labelFontePreco(fonte: string): string {
  if (fonte === 'padrao_sistema') return 'referência do sistema';
  if (fonte === 'cliente') return 'informado pelo cliente';
  return fonte;
}

export default function PremiumResumoVenda({ data, sideAName, sideBName }: Props) {
  const reduced = useReducedMotionClient();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const animate = inView && !reduced;

  const ka = data.sideA?.kpis;
  const kb = data.sideB?.kpis;
  const ya = ka?.estimatedYieldKgHa ?? 0;
  const yb = kb?.estimatedYieldKgHa ?? 0;
  const diffYield = ya > 0 ? ((yb - ya) / ya) * 100 : yb > ya ? 100 : 0;

  const colheitaP = readColheitaPayload(data.colheita);
  const custoP = readCustoPayload(data.custo);
  const economiaP = readEconomiaPayload(data.economia);
  const pricePerSc = economiaP?.precoSacaBrl ?? REFERENCE_SACK_PRICE_BRL_DEFAULT;
  const fontePrecoLabel = economiaP ? labelFontePreco(economiaP.fontePreco) : labelFontePreco('padrao_sistema');
  const kgPerSc = colheitaP?.kgPerSack ?? 60;

  const scFromHarvest = colheitaScHaDiff(colheitaP);
  const scAest = ya > 0 ? kgHaToScHa(ya, kgPerSc) : null;
  const scBest = yb > 0 ? kgHaToScHa(yb, kgPerSc) : null;
  const scFromKpi = scAest != null && scBest != null && scAest > 0 ? scBest - scAest : null;

  const gainScHa = scFromHarvest != null ? scFromHarvest : scFromKpi;
  const harvestIsReal = scFromHarvest != null;

  const revExtraHa = gainScHa != null && gainScHa > 0.001 ? gainScHa * pricePerSc : null;

  const deltaCostHa = custoP?.deltaCostPerHa_B_vs_A;
  const marginApproxHa =
    revExtraHa != null && deltaCostHa != null ? revExtraHa - deltaCostHa : null;

  const winner = deriveWinner(sideAName, sideBName, data);
  const winnerName = winner === 'B' ? sideBName : winner === 'A' ? sideAName : null;

  return (
    <section
      ref={ref}
      id="premium-resumo"
      className="rounded-2xl border-2 border-emerald-300/80 bg-gradient-to-br from-white via-emerald-50/50 to-sky-50/40 p-5 sm:p-6 shadow-md"
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Resumo executivo</h2>
      <ul className="space-y-3 text-sm text-slate-800">
        <li className="flex flex-wrap items-baseline gap-2">
          <span className="text-emerald-700 font-bold">✔</span>
          <span>
            Diferença de produtividade estimada (KPIs):{' '}
            <strong className="tabular-nums">
              {animate ? <CountUp end={diffYield} decimals={1} duration={1.1} preserveValue /> : diffYield.toFixed(1)}%
            </strong>{' '}
            ({sideBName} vs {sideAName}, kg/ha)
          </span>
        </li>
        {gainScHa != null && Math.abs(gainScHa) >= 0.01 && (
          <li className="flex flex-wrap items-baseline gap-2">
            <span className="text-emerald-700 font-bold">✔</span>
            <span>
              {harvestIsReal ? 'Diferença na colheita registrada' : 'Ganho indicativo (KPIs)'} ({kgPerSc} kg/sc):{' '}
              <strong className="tabular-nums">
                {animate ? (
                  <CountUp end={gainScHa} decimals={2} duration={1.2} preserveValue />
                ) : (
                  formatNumber(gainScHa, { decimals: 2 })
                )}
              </strong>{' '}
              sc/ha
            </span>
          </li>
        )}
        {revExtraHa != null && gainScHa != null && gainScHa > 0.001 && (
          <li className="flex flex-wrap items-baseline gap-2">
            <span className="text-emerald-700 font-bold">✔</span>
            <span>
              Receita adicional estimada (R$ {formatNumber(pricePerSc, { decimals: 2 })}/sc,{' '}
              {fontePrecoLabel}):{' '}
              <strong className="tabular-nums text-emerald-800">
                R${' '}
                {animate ? (
                  <CountUp end={revExtraHa} decimals={0} duration={1.3} preserveValue />
                ) : (
                  formatNumber(revExtraHa, { decimals: 0 })
                )}
                /ha
              </strong>
            </span>
          </li>
        )}
        {marginApproxHa != null && (
          <li className="flex flex-wrap items-baseline gap-2">
            <span className="text-sky-800 font-bold">✔</span>
            <span>
              Margem bruta aproximada (receita estimada − Δ custo B vs A):{' '}
              <strong className="tabular-nums">
                R${' '}
                {animate ? (
                  <CountUp end={marginApproxHa} decimals={0} duration={1.25} preserveValue />
                ) : (
                  formatNumber(marginApproxHa, { decimals: 0 })
                )}
                /ha
              </strong>
            </span>
          </li>
        )}
        {winnerName && (
          <li className="flex flex-wrap items-baseline gap-2">
            <span className="text-amber-600 font-bold">🏆</span>
            <span>
              Manejo com melhor síntese dos indicadores: <strong>{winnerName}</strong>
            </span>
          </li>
        )}
      </ul>
      <p className="text-[11px] text-slate-500 mt-4 leading-snug">
        {harvestIsReal
          ? `A linha em sacas/ha usa dados de colheita gravados na avaliação. Preço da saca: R$ ${formatNumber(pricePerSc, { decimals: 2 })} (${fontePrecoLabel}).`
          : `Sem colheita registrada: sacas/ha derivam dos KPIs do relatório. Inclua colheita no app para números oficiais. Preço da saca usado: R$ ${formatNumber(pricePerSc, { decimals: 2 })} (${fontePrecoLabel}).`}{' '}
        Δ custo aparece quando existir snapshot por tratamento. Valores de receita/margem são indicativos (preço e custos podem variar na comercialização).
      </p>
    </section>
  );
}
