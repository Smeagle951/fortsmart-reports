'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { cn } from '@/lib/utils';

import type { DashboardMonitorEvent } from '@/lib/dashboard-mapa/types';

function sevShort(s: DashboardMonitorEvent['severity']) {
  switch (s) {
    case 'alto':
      return 'ALTO';
    case 'medio':
      return 'MÉDIO';
    default:
      return 'BAIXO';
  }
}

function sevBadge(s: DashboardMonitorEvent['severity']) {
  switch (s) {
    case 'alto':
      return 'bg-red-600 text-white';
    case 'medio':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-emerald-600 text-white';
  }
}

type Props = {
  events: DashboardMonitorEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EventTimeline({ events, selectedId, onSelect }: Props) {
  return (
    <section className="shrink-0 border-t border-slate-200 bg-white px-3 py-2 print:hidden">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-['Poppins',system-ui,sans-serif] text-sm font-bold text-slate-900">
          Linha do tempo de eventos
        </h2>
        <button type="button" className="text-xs font-medium text-emerald-700 hover:underline">
          Ver todos
        </button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {events.map((ev) => (
          <motion.button
            key={ev.id}
            type="button"
            onClick={() => onSelect(ev.id)}
            whileHover={{ y: -2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className={cn(
              'flex w-[200px] shrink-0 flex-col overflow-hidden rounded-xl border bg-slate-50 text-left shadow-sm transition-colors',
              selectedId === ev.id ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-300',
            )}
          >
            <div className="flex items-center gap-2 border-b border-slate-200/80 bg-white px-2 py-1.5">
              <span className="text-lg" aria-hidden>
                {ev.type === 'praga' ? '🐛' : ev.type === 'doenca' ? '🟣' : '✓'}
              </span>
              <span className="truncate text-xs font-semibold text-slate-900">{ev.title}</span>
            </div>
            <div className="relative h-20 w-full bg-slate-200">
              {ev.imageUrl?.trim() ? (
                <Image src={ev.imageUrl} alt="" fill className="object-cover" sizes="200px" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center px-1 text-center text-[9px] text-slate-500">
                  Sem imagem
                </div>
              )}
            </div>
            <div className="space-y-0.5 px-2 py-1.5 text-[10px] text-slate-600">
              <p className="truncate font-medium text-slate-800">{ev.talhaoLabel}</p>
              <p>{new Date(ev.dateIso + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
              <span className={cn('inline-block rounded px-1.5 py-0.5 text-[9px] font-bold', sevBadge(ev.severity))}>
                {sevShort(ev.severity)}
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
