'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

import { SEVERITY_BADGE_CLASS } from '@/lib/dashboard-mapa/constants';
import type { DashboardTimelineEvent, MonitorEventSeverity, TimelineEventType } from '@/lib/dashboard-mapa/types';

function sevShort(s?: MonitorEventSeverity) {
  switch (s) {
    case 'alto':
      return 'ALTO';
    case 'medio':
      return 'MÉDIO';
    case 'normal':
      return 'NORMAL';
    case undefined:
      return null;
    default:
      return 'BAIXO';
  }
}

function typeIcon(type: TimelineEventType) {
  switch (type) {
    case 'plantio':
      return '🌱';
    case 'aplicacao':
    case 'pulverizacao':
      return '💧';
    case 'colheita':
      return '☑';
    case 'chuva':
      return '☔';
    case 'foto':
      return '▣';
    case 'ndvi':
      return '▥';
    default:
      return '●';
  }
}

type Props = {
  events: DashboardTimelineEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EventTimeline({ events, selectedId, onSelect }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  return (
    <section className="h-[180px] shrink-0 border-t border-slate-200 bg-white px-5 py-4 print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-['Poppins',system-ui,sans-serif] text-sm font-bold text-slate-900">
          Linha do tempo de eventos e atividades
        </h2>
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() => scrollerRef.current?.scrollBy({ left: 520, behavior: 'smooth' })}
        >
          Ver todos →
        </button>
      </div>
      <div ref={scrollerRef} className="relative flex gap-3 overflow-x-auto pb-4">
        <div className="absolute bottom-1 left-4 right-4 border-t border-dashed border-slate-300" />
        {events.length ? (
          events.map((ev) => {
            const badge = sevShort(ev.severity) ?? ev.status ?? ev.type.toUpperCase();
            return (
              <motion.button
                key={ev.id}
                type="button"
                onClick={() => (ev.sourceEventId ? onSelect(ev.sourceEventId) : undefined)}
                whileHover={{ y: -2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={cn(
                  'relative flex h-24 w-[260px] shrink-0 overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition-colors',
                  selectedId === ev.sourceEventId
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-300',
                  !ev.sourceEventId && 'cursor-default',
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col p-3">
                  <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs text-white" aria-hidden>
                    {typeIcon(ev.type)}
                  </span>
                  <span className="truncate text-xs font-semibold text-slate-900">{ev.title}</span>
                  </div>
                <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                  <p className="truncate font-medium text-slate-800">
                    {ev.talhaoLabel}
                    {ev.areaLabel ? ` · ${ev.areaLabel}` : ''}
                  </p>
                  <p>{new Date(ev.dateIso + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <span
                    className={cn(
                      'inline-block rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
                      ev.severity ? SEVERITY_BADGE_CLASS[ev.severity] : 'border-slate-200 bg-white text-slate-600',
                    )}
                  >
                    {badge}
                  </span>
                </div>
                <span className="absolute bottom-[-7px] left-1/2 h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-700 shadow" />
                </div>
                <div className="relative h-full w-16 shrink-0 bg-slate-100">
                  {ev.imageUrl?.trim() ? (
                    <Image src={ev.imageUrl} alt="" fill className="object-cover" sizes="64px" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-slate-500">
                      {ev.type}
                    </div>
                  )}
                </div>
              </motion.button>
            );
          })
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
            Nenhum histórico operacional encontrado para esta seleção.
          </p>
        )}
      </div>
    </section>
  );
}
