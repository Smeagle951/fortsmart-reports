'use client';

import Image from 'next/image';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import type { DashboardMonitorEvent } from '@/lib/dashboard-mapa/types';

function severityLabel(s: DashboardMonitorEvent['severity']) {
  switch (s) {
    case 'alto':
      return 'Alto';
    case 'medio':
      return 'Médio';
    default:
      return 'Baixo';
  }
}

type Props = {
  event: DashboardMonitorEvent | null;
  onClose: () => void;
};

export function RightEventPanel({ event, onClose }: Props) {
  const open = !!event;

  const typeLabel =
    event?.type === 'praga' ? 'Praga' : event?.type === 'doenca' ? 'Doença' : 'Monitoramento';

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="z-[1100] w-full overflow-y-auto border-slate-200 p-0 sm:max-w-md print:hidden"
      >
        {event ? (
          <>
            <SheetHeader className="space-y-1 border-b border-border px-4 pb-3 pt-4 text-left">
              <SheetTitle className="flex items-center gap-2 font-['Poppins',system-ui,sans-serif] text-base">
                <span className="text-xl" aria-hidden>
                  {event.type === 'praga' ? '🐛' : event.type === 'doenca' ? '🟣' : '✓'}
                </span>
                <span className="truncate">{event.title}</span>
              </SheetTitle>
              {event.subtitle ? <SheetDescription>{event.subtitle}</SheetDescription> : null}
              <p className="text-xs text-muted-foreground">
                {event.talhaoLabel}
                {event.areaLabel ? ` · ${event.areaLabel}` : ''}
              </p>
              <p className="text-[10px] text-muted-foreground">Coordenadas aproximadas · demo</p>
            </SheetHeader>

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
          <span className="sr-only">Nenhum evento</span>
        )}
      </SheetContent>
    </Sheet>
  );
}
