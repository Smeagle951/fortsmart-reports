'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { costPerHaPair, marginBrlHaPair, revenueBrlHaPair, roiPctPair } from '@/lib/ladoALadoEnterpriseMetrics';
import { productivityScHaPair } from '@/lib/ladoALadoEnterpriseMetrics';
import { formatNumber } from '@/utils/format';

export default function SideBySideCostsROI({ data }: { data: SideBySideReportData }) {
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const prod = productivityScHaPair(data);
  const cost = costPerHaPair(data);
  const rev = revenueBrlHaPair(data, prod?.a ?? null, prod?.b ?? null);
  const margin = marginBrlHaPair(rev, cost);
  const roi = roiPctPair(data);

  const lines = [
    { label: 'Custo total (R$/ha)', a: cost?.a, b: cost?.b },
    { label: 'Receita bruta (R$/ha)', a: rev?.a, b: rev?.b },
    { label: 'Margem líquida (R$/ha)', a: margin?.a, b: margin?.b },
    { label: 'ROI (%)', a: roi?.a, b: roi?.b },
  ];

  const subCosts = data.custos ?? [];

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Custos e ROI</h2>
      <p className="fs-official-section-sub">
        Comparativo econômico com área real das subáreas quando vinculadas no app.
      </p>
      <div className="fs-official-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] text-left text-[11px] font-bold uppercase text-[#6B7280]">
              <th className="px-4 py-3">Item</th>
              <th className="px-4 py-3">Lado A</th>
              <th className="px-4 py-3">Lado B</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className="border-t border-[#EEF2F7]">
                <td className="px-4 py-3 font-medium">{l.label}</td>
                <td className="px-4 py-3 tabular-nums">
                  {l.a != null ? formatNumber(l.a, { decimals: 2 }) : '—'}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {l.b != null ? formatNumber(l.b, { decimals: 2 }) : '—'}
                </td>
              </tr>
            ))}
            {custo?.by_side?.flatMap((row) =>
              (row.items ?? []).slice(0, 6).map((it, i) => (
                <tr key={`${row.side}-${i}`} className="border-t border-[#EEF2F7] bg-[#FAFBFC] text-xs">
                  <td className="px-4 py-2 pl-8 text-[#6B7280]">
                    {(it as { descricao?: string }).descricao || 'Item custo'} (Lado {row.side})
                  </td>
                  <td colSpan={2} className="px-4 py-2 tabular-nums">
                    {(it as { valor_por_ha?: number }).valor_por_ha != null
                      ? `R$ ${formatNumber((it as { valor_por_ha?: number }).valor_por_ha!, { decimals: 2 })}/ha`
                      : '—'}
                  </td>
                </tr>
              )),
            )}
          </tbody>
        </table>
      </div>
      {subCosts.length > 0 ? (
        <p className="mt-2 text-xs text-[#6B7280]">
          {subCosts.length} linha(s) de custo por subárea publicadas no payload.
        </p>
      ) : null}
    </section>
  );
}
