'use client';

import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { fieldCollectionRows } from '@/lib/lado-a-lado-official/selectors';
import { formatNumber } from '@/utils/format';

export default function SideBySideFieldCollections({ data }: { data: SideBySideReportData }) {
  const rows = fieldCollectionRows(data);
  if (rows.length === 0) return null;

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Coletas de Campo</h2>
      <p className="fs-official-section-sub">Critérios avaliados e comparativo entre lados.</p>
      <div className="fs-official-card overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] text-left text-[11px] font-bold uppercase text-[#6B7280]">
              <th className="px-4 py-3">Critério</th>
              <th className="px-4 py-3">Lado A</th>
              <th className="px-4 py-3">Lado B</th>
              <th className="px-4 py-3">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const diff = r.diff;
              const Icon =
                diff != null && diff > 0 ? ArrowUp : diff != null && diff < 0 ? ArrowDown : Minus;
              const diffColor =
                diff != null && diff > 0
                  ? 'text-[#16A34A]'
                  : diff != null && diff < 0
                    ? 'text-[#DC2626]'
                    : 'text-[#6B7280]';
              return (
                <tr key={r.criterio} className="border-t border-[#EEF2F7]">
                  <td className="px-4 py-3 font-medium">
                    {r.criterio}
                    {r.unidade ? (
                      <span className="ml-1 text-xs text-[#9CA3AF]">({r.unidade})</span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.a != null ? formatNumber(r.a, { decimals: 2 }) : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {r.b != null ? formatNumber(r.b, { decimals: 2 }) : '—'}
                  </td>
                  <td className={`px-4 py-3 font-semibold ${diffColor}`}>
                    <span className="inline-flex items-center gap-1">
                      <Icon className="h-3.5 w-3.5" />
                      {diff != null ? formatNumber(diff, { decimals: 2 }) : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
