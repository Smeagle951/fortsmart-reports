'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import PremiumSectionShell from './PremiumSectionShell';

export default function AgronomicPointsSection({ data }: { data: SideBySideReportData }) {
  const pts = data.points;
  if (!Array.isArray(pts) || pts.length === 0) return null;

  const nameA = data.sideA?.name?.trim() || 'Teste A';
  const nameB = data.sideB?.name?.trim() || 'Teste B';

  return (
    <PremiumSectionShell
      id="pontos-premium"
      eyebrow="Planeamento do ensaio"
      title="Pontos de avaliação registados"
      subtitle={`${pts.length} ponto(s) no percurso do ensaio. Os nomes dos testes são «${nameA}» e «${nameB}» — não confundir com a ordem A/B do protocolo.`}
    >
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[320px] text-left text-sm">
          <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2.5">#</th>
              <th className="px-3 py-2.5">Identificação / nota</th>
              <th className="px-3 py-2.5">Estado</th>
            </tr>
          </thead>
          <tbody>
            {pts.map((p, i) => (
              <tr key={p.indexNo ?? i} className="border-t border-slate-100">
                <td className="px-3 py-2.5 font-semibold tabular-nums text-slate-900">{p.indexNo ?? i + 1}</td>
                <td className="px-3 py-2.5 text-slate-800">{p.name?.trim() || '—'}</td>
                <td className="px-3 py-2.5">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {p.status?.trim() || 'ok'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PremiumSectionShell>
  );
}
