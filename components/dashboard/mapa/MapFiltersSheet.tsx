'use client';

import { SlidersHorizontal } from 'lucide-react';

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
    <div className="pointer-events-none absolute right-3 top-3 z-[1100] print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="pointer-events-auto h-9 gap-2 shadow-md"
            aria-label="Abrir filtros do mapa"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
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
