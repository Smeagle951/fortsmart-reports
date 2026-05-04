'use client';

import Image from 'next/image';
import { X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { DashboardMonitorEvent } from '@/lib/dashboard-mapa/types';

function severityLabel(s: DashboardMonitorEvent['severity']) {
  switch (s) {
    case 'alto':
      return 'Alto';
    case 'medio':
      return 'Médio';
    case 'normal':
      return 'Normal';
    default:
      return 'Baixo';
  }
}

type Props = {
  event: DashboardMonitorEvent | null;
  onClose: () => void;
};

export function RightEventPanel({ event, onClose }: Props) {
  const [tab, setTab] = useState<'detail' | 'calc'>('detail');

  const typeLabel =
    event?.type === 'praga' ? 'Praga' : event?.type === 'doenca' ? 'Doença' : 'Monitoramento';

  if (!event) return null;

  return (
    <aside
      className="absolute bottom-3 right-3 top-3 z-[1060] flex w-[min(320px,calc(100%-1.5rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/20 print:hidden max-lg:left-3 max-lg:top-20"
      aria-label="Detalhe do evento selecionado"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex gap-5 text-sm">
          <button type="button" onClick={() => setTab('detail')} className={cn('border-b-2 pb-2 font-semibold', tab === 'detail' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500')}>Detalhe</button>
          <button type="button" onClick={() => setTab('calc')} className={cn('border-b-2 pb-2 font-semibold', tab === 'calc' ? 'border-emerald-700 text-emerald-800' : 'border-transparent text-slate-500')}>Calculadora</button>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fechar painel">
          <X className="h-5 w-5" />
        </button>
      </div>

      {tab === 'detail' ? (
        <>
            <div className="space-y-1 border-b border-border px-4 pb-3 pt-4 text-left">
              <h2 className="flex items-center gap-3 font-['Poppins',system-ui,sans-serif] text-base font-bold text-slate-950">
                <span className="text-xl" aria-hidden>
                  {event.type === 'praga' ? '🐛' : event.type === 'doenca' ? '🟣' : '✓'}
                </span>
                <span className="truncate">{event.title}</span>
              </h2>
              {event.subtitle ? <p className="text-sm text-red-600">{event.subtitle}</p> : null}
              <p className="text-xs text-muted-foreground">
                {event.talhaoLabel}
                {event.areaLabel ? ` · ${event.areaLabel}` : ''}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {event.lat.toFixed(6)}, {event.lng.toFixed(6)}
              </p>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-md bg-muted px-2 py-0.5">
                  {new Date(event.dateIso + 'T12:00:00').toLocaleDateString('pt-BR')}
                </span>
                <span className="text-muted-foreground">{event.evaluator}</span>
                <Badge variant="outline">{typeLabel}</Badge>
                <Badge
                  variant={event.severity === 'alto' ? 'destructive' : 'outline'}
                  className={cn(
                    'text-[10px] uppercase',
                    event.severity === 'medio' && 'border-amber-500 bg-amber-500 text-white hover:bg-amber-500',
                    event.severity === 'baixo' && 'border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600',
                  )}
                >
                  {severityLabel(event.severity)}
                </Badge>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-foreground">{event.observation}</p>

              {event.shortDescription || event.damageCause ? (
                <div className="mt-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-950">
                  {event.shortDescription ? <p className="font-semibold">{event.shortDescription}</p> : null}
                  {event.damageCause ? <p className="mt-1 text-emerald-900">Dano/causa: {event.damageCause}</p> : null}
                </div>
              ) : null}

              {event.imageUrl?.trim() ? (
                <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={event.imageUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 400px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="mt-3 flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-muted-foreground/30 bg-muted/50 text-center text-xs text-muted-foreground">
                  Sem imagem no registro (dados do app / relatório web).
                </div>
              )}

              <Separator className="my-4" />

              <ul className="space-y-1.5 rounded-xl border bg-muted/40 px-3 py-2 text-xs">
                {event.specs.map((s) => (
                  <li
                    key={s.label}
                    className="flex justify-between gap-2 border-b border-border/80 py-1 last:border-0"
                  >
                    <span className="text-muted-foreground">{s.label}</span>
                    <span className="font-medium text-foreground">{s.value}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-4 w-full" type="button">
                Ver histórico deste ponto
              </Button>
            </ScrollArea>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-center p-5 text-center text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Calculadora preservada</p>
          <p className="mt-2 text-xs leading-relaxed">
            A calculadora completa continua disponível no fluxo de plantio/GeoJSON em “Detalhe | Calculadora”.
          </p>
        </div>
      )}
    </aside>
  );
}
