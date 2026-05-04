'use client';

import { CalendarDays, Filter } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

type Props = {
  safra: string;
  cultura: string;
  camada: string;
  dateRangeLabel: string;
  safraChoices: string[];
  culturaChoices: string[];
  onSafra: (v: string) => void;
  onCultura: (v: string) => void;
  onCamada: (v: string) => void;
};

/** Filtros do mapa em painel lateral — evita sobrepor o mapa e popups. */
export function MapFiltersSheet({
  safra,
  cultura,
  camada,
  dateRangeLabel,
  safraChoices,
  culturaChoices,
  onSafra,
  onCultura,
  onCamada,
}: Props) {
  return (
    <div className="pointer-events-none absolute left-4 right-4 top-4 z-[1100] flex flex-wrap items-start gap-3 print:hidden">
      <div className="pointer-events-auto grid max-w-[calc(100%-5rem)] grid-cols-2 gap-3 md:flex md:max-w-none">
        <div className="h-14 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-black/10">
          <p className="text-[11px] font-medium text-slate-500">Safra</p>
          <Select value={safra} onValueChange={onSafra}>
            <SelectTrigger className="h-7 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0">
              <SelectValue placeholder="Safra" />
            </SelectTrigger>
            <SelectContent className="z-[1300]">
              <SelectItem value="all">Todas</SelectItem>
              {safraChoices.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-14 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-black/10">
          <p className="text-[11px] font-medium text-slate-500">Cultura</p>
          <Select value={cultura} onValueChange={onCultura}>
            <SelectTrigger className="h-7 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0">
              <SelectValue placeholder="Cultura" />
            </SelectTrigger>
            <SelectContent className="z-[1300]">
              <SelectItem value="all">Todas</SelectItem>
              {culturaChoices.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="h-14 min-w-[150px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-black/10">
          <p className="text-[11px] font-medium text-slate-500">Camadas</p>
          <Select value={camada} onValueChange={onCamada}>
            <SelectTrigger className="h-7 border-0 p-0 text-sm font-semibold shadow-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1300]">
              <SelectItem value="satellite">Talhões</SelectItem>
              <SelectItem value="events">Eventos</SelectItem>
              <SelectItem value="heat">Mapa térmico</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="hidden h-14 min-w-[220px] rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg shadow-black/10 lg:block">
          <p className="text-[11px] font-medium text-slate-500">Período</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span>{dateRangeLabel}</span>
            <CalendarDays className="ml-auto h-4 w-4 text-slate-500" />
          </div>
        </div>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-12 gap-2 rounded-xl bg-white px-4 shadow-lg shadow-black/10"
            aria-label="Abrir filtros do mapa"
          >
            <Filter className="h-4 w-4" />
            Filtros
            <span className="rounded-full bg-emerald-700 px-1.5 py-0.5 text-[10px] font-bold text-white">3</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[min(100%,320px)] sm:max-w-sm">
          <SheetHeader>
            <SheetTitle>Filtros do mapa</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Safra</Label>
              <Select value={safra} onValueChange={onSafra}>
                <SelectTrigger>
                  <SelectValue placeholder="Safra" />
                </SelectTrigger>
                <SelectContent className="z-[1300]">
                  <SelectItem value="all">Todas</SelectItem>
                  {safraChoices.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Cultura</Label>
              <Select value={cultura} onValueChange={onCultura}>
                <SelectTrigger>
                  <SelectValue placeholder="Cultura" />
                </SelectTrigger>
                <SelectContent className="z-[1300]">
                  <SelectItem value="all">Todas</SelectItem>
                  {culturaChoices.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Visualização</Label>
              <Select value={camada} onValueChange={onCamada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[1300]">
                  <SelectItem value="satellite">Satélite + talhões (padrão)</SelectItem>
                  <SelectItem value="events">Destacar eventos de monitoramento</SelectItem>
                  <SelectItem value="heat">Mapa térmico de incidência</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                «Destacar eventos» liga pins. «Mapa térmico» concentra incidência por severidade quando há dados de
                monitoramento.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">Período (relatório)</Label>
              <span className="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm text-slate-800">
                {dateRangeLabel}
              </span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
