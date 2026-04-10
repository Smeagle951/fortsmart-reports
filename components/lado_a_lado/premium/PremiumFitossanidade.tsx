'use client';

import React from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { severityTone } from '@/lib/lado-a-lado-premium';
import { formatPercent } from '@/utils/format';

type Props = {
  data: SideBySideReportData;
};

const badgeCls: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  amber: 'bg-amber-100 text-amber-900 border-amber-200',
  red: 'bg-red-100 text-red-900 border-red-200',
  slate: 'bg-slate-100 text-slate-800 border-slate-200',
};

export default function PremiumFitossanidade({ data }: Props) {
  const ocorrencias = data.ocorrencias || [];

  return (
    <section id="premium-fito" className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900 mb-1">Ocorrências fitossanitárias</h2>
      <p className="text-xs text-slate-500 mb-4">Resumo visual; a tabela detalhada segue abaixo no relatório.</p>
      {ocorrencias.length === 0 ? (
        <p className="text-sm text-slate-500">Nenhuma ocorrência registrada neste relatório.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ocorrencias.map((o, i) => {
            const tone = severityTone(o.severidade);
            return (
              <li key={i} className={`rounded-xl border p-4 ${badgeCls[tone]}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm">{o.nomeAlvo || o.tipo || `Ocorrência ${i + 1}`}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wide opacity-80">{o.tipo || '—'}</span>
                </div>
                {o.incidenciaPct != null && (
                  <p className="text-sm mt-2">Incidência: {formatPercent(o.incidenciaPct)}</p>
                )}
                {o.severidade && (
                  <p className="text-sm">
                    Severidade: <span className="font-medium">{o.severidade}</span>
                  </p>
                )}
                {o.recomendacao && <p className="text-xs mt-2 opacity-90">{o.recomendacao}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
