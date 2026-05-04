'use client';

import { cn } from '@/lib/utils';

import type { PropertyAlert, PropertySummary } from '@/lib/dashboard-mapa/types';

type Props = {
  summary: PropertySummary;
  alerts: PropertyAlert[];
};

function formatHa(n: number) {
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 0 });
}

export function PropertySummaryCard({ summary, alerts }: Props) {
  return (
    <>
      <div className="rounded-xl bg-white p-3 text-slate-800 shadow-md">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Resumo da propriedade</p>
        <p className="mt-2 font-['Poppins',system-ui,sans-serif] text-2xl font-bold text-[#1B4332]">
          {formatHa(summary.totalHa)} ha
        </p>
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          <li>
            <span className="font-semibold text-slate-800">{summary.talhaoCount}</span> talhões
          </li>
          <li>
            <span className="font-semibold text-slate-800">{summary.subareaCount}</span> subáreas
          </li>
          <li>
            <span className="font-semibold text-slate-800">{summary.eventsLast7Days}</span> eventos (7 dias)
          </li>
        </ul>
      </div>

      {alerts.length > 0 ? (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">Alertas ativos</p>
          <ul className="mt-2 space-y-2 text-xs">
            {alerts.map((a) => (
              <li
                key={a.id}
                className={cn(
                  'rounded-lg px-2 py-1.5',
                  a.tone === 'danger' && 'bg-red-950/50 text-red-100',
                  a.tone === 'warning' && 'bg-amber-900/40 text-amber-50',
                  a.tone === 'info' && 'bg-sky-900/40 text-sky-50',
                )}
              >
                {a.message}
                <span className="block text-[10px] opacity-80">{a.talhaoLabel}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}
