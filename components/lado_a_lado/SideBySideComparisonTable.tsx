'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { comparisonRows, sideLabel } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideComparisonTable({ data }: { data: SideBySideReportData }) {
  const rows = comparisonRows(data);

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Comparativo Geral</h2>
      <p className="fs-official-section-sub">Métricas consolidadas por lado do ensaio.</p>
      <div className="fs-official-card overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] text-left text-[11px] font-bold uppercase tracking-wide text-[#6B7280]">
              <th className="border-b border-[#E5E7EB] px-4 py-3">Métrica</th>
              <th className="border-b border-[#E5E7EB] px-4 py-3" style={{ color: FS.sideA }}>
                Lado A — {sideLabel(data, 'A')}
              </th>
              <th className="border-b border-[#E5E7EB] px-4 py-3" style={{ color: FS.sideB }}>
                Lado B — {sideLabel(data, 'B')}
              </th>
              <th className="border-b border-[#E5E7EB] px-4 py-3">Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.metric} className="border-b border-[#EEF2F7] hover:bg-[#F9FAFB]">
                <td className="px-4 py-3 font-medium text-[#111827]">{r.metric}</td>
                <td
                  className={`px-4 py-3 tabular-nums ${r.better === 'A' ? 'font-bold text-[#16A34A]' : ''}`}
                >
                  {r.a}
                </td>
                <td
                  className={`px-4 py-3 tabular-nums ${r.better === 'B' ? 'font-bold text-[#16A34A]' : ''}`}
                >
                  {r.b}
                </td>
                <td
                  className={`px-4 py-3 tabular-nums font-semibold ${
                    r.diff.startsWith('+') ? 'text-[#16A34A]' : r.diff.startsWith('-') ? 'text-[#DC2626]' : ''
                  }`}
                >
                  {r.diff}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
