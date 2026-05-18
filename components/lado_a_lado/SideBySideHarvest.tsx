'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { productivityScHaPair } from '@/lib/ladoALadoEnterpriseMetrics';
import { formatNumber } from '@/utils/format';

export default function SideBySideHarvest({ data }: { data: SideBySideReportData }) {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  if (!colheita?.sides?.length) return null;

  const prod = productivityScHaPair(data);
  const sideA = colheita.sides.find((s) => s.side === 'A');
  const sideB = colheita.sides.find((s) => s.side === 'B');

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Colheita</h2>
      <p className="fs-official-section-sub">Produtividade e área colhida por tratamento.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[sideA, sideB].map((s, i) => {
          if (!s) return null;
          const label = s.side === 'A' ? 'Lado A' : 'Lado B';
          return (
            <div key={label} className="fs-official-card p-5">
              <p className="text-xs font-bold uppercase text-[#6B7280]">{label}</p>
              <p className="mt-1 text-lg font-bold text-[#111827]">{s.sideName || label}</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <span className="text-[#6B7280]">Produtividade: </span>
                  <strong>
                    {s.yieldScHa != null
                      ? `${formatNumber(s.yieldScHa, { decimals: 1 })} sc/ha`
                      : s.yieldKgHa != null
                        ? `${formatNumber(s.yieldKgHa, { decimals: 0 })} kg/ha`
                        : '—'}
                  </strong>
                </li>
                <li>
                  <span className="text-[#6B7280]">Área colhida: </span>
                  <strong>
                    {s.areaHa != null ? `${formatNumber(s.areaHa, { decimals: 2 })} ha` : '—'}
                  </strong>
                </li>
              </ul>
            </div>
          );
        })}
      </div>
      {prod && prod.a != null && prod.b != null ? (
        <p className="mt-3 text-sm font-semibold text-[#16A34A]">
          Diferença B−A: {formatNumber(prod.b - prod.a, { decimals: 1 })} sc/ha (
          {prod.a !== 0 ? formatNumber(((prod.b - prod.a) / prod.a) * 100, { decimals: 1 }) : '—'}%)
        </p>
      ) : null}
    </section>
  );
}
