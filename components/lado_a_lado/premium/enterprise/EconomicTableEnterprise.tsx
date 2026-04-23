'use client';

import { motion } from 'framer-motion';
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
import { ENT } from './enterpriseTheme';

type Props = { data: SideBySideReportData };

function cell(v: number | null, fmt: (n: number) => string): string {
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
  const dq = data.decision_layer?.dataQuality;
  const roiMetaA = data.decision_layer?.roiBySide?.A;
  const roiMetaB = data.decision_layer?.roiBySide?.B;
  const roiLabel =
    roiMetaA?.yieldSource === 'harvest' && roiMetaB?.yieldSource === 'harvest'
      ? 'Real (colheita)'
      : dq?.usedEstimatedYield || roiMetaA?.yieldSource === 'estimated' || roiMetaB?.yieldSource === 'estimated'
        ? 'Estimado'
        : null;

  const rows: { key: string; desc: string; a: string; b: string; highlight?: boolean; tooltip?: string }[] = [
    {
      key: 'prod',
      desc: 'Produtividade (sc/ha)',
      a: cell(prod?.a ?? null, (n) => formatNumber(n, { decimals: 1 })),
      b: cell(prod?.b ?? null, (n) => formatNumber(n, { decimals: 1 })),
    },
    {
      key: 'preco',
      desc: 'Preço (R$/sc)',
      a: preco != null ? formatNumber(preco, { decimals: 2 }) : '—',
      b: preco != null ? formatNumber(preco, { decimals: 2 }) : '—',
      tooltip: 'Preço de referência aplicado aos dois lados quando publicado no JSON.',
    },
    {
      key: 'receita',
      desc: 'Receita bruta (R$/ha)',
      a: cell(rev?.a ?? null, (n) => formatNumber(n, { decimals: 0 })),
      b: cell(rev?.b ?? null, (n) => formatNumber(n, { decimals: 0 })),
    },
    {
      key: 'custo',
      desc: 'Custo total (R$/ha)',
      a: cell(cost?.a ?? null, (n) => formatNumber(n, { decimals: 0 })),
      b: cell(cost?.b ?? null, (n) => formatNumber(n, { decimals: 0 })),
    },
    {
      key: 'margem',
      desc: 'Margem bruta (R$/ha)',
      a: cell(margin?.a ?? null, (n) => formatNumber(n, { decimals: 0 })),
      b: cell(margin?.b ?? null, (n) => formatNumber(n, { decimals: 0 })),
    },
    {
      key: 'roi',
      desc: roiLabel ? `ROI ajustado (%) · ${roiLabel}` : 'ROI ajustado (%)',
      a: cell(roi?.a ?? null, (n) => formatNumber(n, { decimals: 0 })),
      b: cell(roi?.b ?? null, (n) => formatNumber(n, { decimals: 0 })),
      highlight: true,
      tooltip: 'ROI quando publicado em decision_layer ou FortSmart AI económico.',
    },
  ];

  const hasAny = rows.some((r) => r.a !== '—' || r.b !== '—');
  if (!hasAny) return null;

  return (
    <section id="economia-resumo-premium" className="scroll-mt-36 print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.42 }}
        className="w-full pb-8 sm:pb-10"
      >
        <h3 className="text-base font-bold text-slate-900">Análise económica</h3>
        <p className="mt-1 text-sm text-slate-500">Comparativo lado a lado a partir dos dados publicados</p>
        <div
          className="mt-4 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-md"
          style={{ boxShadow: ENT.shadowCard }}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90">
                  <th className="px-4 py-3 font-semibold text-slate-700">Descrição</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{nameA}</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{nameB}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.key}
                    className={`border-b border-slate-100 last:border-0 ${r.highlight ? 'bg-emerald-50/70' : ''}`}
                    title={r.tooltip}
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">{r.desc}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{r.a}</td>
                    <td className="px-4 py-3 tabular-nums font-semibold text-slate-900">{r.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
