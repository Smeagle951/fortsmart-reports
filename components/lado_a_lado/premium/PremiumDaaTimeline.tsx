'use client';

import React from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  buildDaaTimelineItems,
  type DaaTimelineItem,
} from '@/lib/lado-a-lado-premium';
import { formatDate } from '@/utils/format';

const variantStyles: Record<
  DaaTimelineItem['variant'],
  { ring: string; dot: string; badge: string }
> = {
  slate: {
    ring: 'border-slate-200 bg-white',
    dot: 'bg-slate-500',
    badge: 'bg-slate-100 text-slate-800 border-slate-200',
  },
  sky: {
    ring: 'border-sky-200 bg-sky-50/80',
    dot: 'bg-sky-600',
    badge: 'bg-sky-100 text-sky-900 border-sky-200',
  },
  amber: {
    ring: 'border-amber-200 bg-amber-50/80',
    dot: 'bg-amber-600',
    badge: 'bg-amber-100 text-amber-950 border-amber-200',
  },
  emerald: {
    ring: 'border-emerald-200 bg-emerald-50/80',
    dot: 'bg-emerald-600',
    badge: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
};

type Props = {
  data: SideBySideReportData;
};

function formatSubtitle(raw?: string): string | undefined {
  if (!raw) return undefined;
  const first = raw.split(' · ')[0];
  if (/^\d{4}-\d{2}-\d{2}/.test(first) || first.includes('T')) {
    const iso = first.length >= 10 ? first.slice(0, 10) : first;
    const rest = raw.includes(' · ') ? raw.split(' · ').slice(1).join(' · ') : '';
    const d = formatDate(iso);
    return rest ? `${d} · ${rest}` : d;
  }
  return raw;
}

export default function PremiumDaaTimeline({ data }: Props) {
  const rawItems = buildDaaTimelineItems(data);
  const items = rawItems.map((it) => ({
    ...it,
    subtitle: formatSubtitle(it.subtitle),
  }));

  if (items.length === 0) {
    return (
      <section
        id="premium-timeline"
        className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-5 sm:p-6 text-center print:hidden"
      >
        <h2 className="text-sm font-semibold text-slate-700">Linha do tempo (DAE)</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
          Quando o app enviar data de plantio, DAE/DAP ou aplicações (`applications` / `aplicacoes`), os marcos aparecem aqui em formato de apresentação.
        </p>
      </section>
    );
  }

  return (
    <section
      id="premium-timeline"
      className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/40 to-emerald-50/30 p-5 sm:p-7 shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)] print:shadow-none"
    >
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 tracking-tight">Linha do tempo da lavoura</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
            Visão tipo apresentação: plantio, aplicações registradas e o momento da coleta (DAE/DAP), alinhado ao fluxo descrito no relatório executivo.
          </p>
        </div>
      </div>

      <div className="relative">
        <div
          className="hidden sm:block absolute top-[22px] left-0 right-0 h-0.5 bg-gradient-to-r from-slate-200 via-sky-200 to-emerald-200 pointer-events-none"
          aria-hidden
        />
        <ul className="flex flex-col sm:flex-row sm:items-stretch gap-4 sm:gap-0 sm:overflow-x-auto sm:pb-2 sm:pt-1 scrollbar-thin print:flex-col">
          {items.map((it, i) => {
            const vs = variantStyles[it.variant];
            return (
              <li
                key={it.key + i}
                className="flex sm:flex-1 sm:min-w-[140px] sm:max-w-[200px] flex-row sm:flex-col items-start sm:items-center text-left sm:text-center gap-3 sm:gap-2 relative"
              >
                <div
                  className={`relative z-[1] flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm ${vs.ring}`}
                >
                  <span className={`h-3 w-3 rounded-full ${vs.dot}`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1 sm:px-1">
                  <span
                    className={`inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${vs.badge}`}
                  >
                    {it.badge}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 mt-2 leading-snug">{it.title}</p>
                  {it.subtitle && (
                    <p className="text-[11px] text-slate-600 mt-1 leading-snug line-clamp-3">{it.subtitle}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
