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
    <section className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 print:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-['Poppins',system-ui,sans-serif] text-sm font-bold text-slate-900">
          Linha do tempo de eventos
        </h2>
        <button
          type="button"
          className="text-xs font-medium text-emerald-700 hover:underline"
          onClick={() => scrollerRef.current?.scrollBy({ left: 520, behavior: 'smooth' })}
        >
          Ver todos
        </button>
      </div>
      <div ref={scrollerRef} className="flex gap-2 overflow-x-auto pb-1">
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
                  'flex w-[220px] shrink-0 flex-col overflow-hidden rounded-xl border bg-slate-50 text-left shadow-sm transition-colors',
                  selectedId === ev.sourceEventId
                    ? 'border-emerald-600 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:border-slate-300',
                  !ev.sourceEventId && 'cursor-default',
                )}
              >
                <div className="flex items-center gap-2 border-b border-slate-200/80 bg-white px-2 py-1.5">
                  <span className="text-base" aria-hidden>
                    {typeIcon(ev.type)}
                  </span>
                  <span className="truncate text-xs font-semibold text-slate-900">{ev.title}</span>
                </div>
                <div className="relative h-20 w-full bg-slate-200">
                  {ev.imageUrl?.trim() ? (
                    <Image src={ev.imageUrl} alt="" fill className="object-cover" sizes="220px" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-[10px] text-slate-500">
                      {ev.description}
                    </div>
                  )}
                </div>
                <div className="space-y-0.5 px-2 py-1.5 text-[10px] text-slate-600">
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
