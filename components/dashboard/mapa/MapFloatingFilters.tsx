'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

export function MapFloatingFilters({
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
    <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 px-2 print:hidden">
      <div className="pointer-events-auto flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
        <div className="flex flex-col gap-1">
          <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Safra</Label>
          <Select value={safra} onValueChange={onSafra}>
            <SelectTrigger className="h-8 min-w-[6.5rem] text-xs">
              <SelectValue placeholder="Safra" />
            </SelectTrigger>
            <SelectContent className="z-[1200]">
              <SelectItem value="all">Todas</SelectItem>
              {safraChoices.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Cultura</Label>
          <Select value={cultura} onValueChange={onCultura}>
            <SelectTrigger className="h-8 min-w-[6.5rem] text-xs">
              <SelectValue placeholder="Cultura" />
            </SelectTrigger>
            <SelectContent className="z-[1200]">
              <SelectItem value="all">Todas</SelectItem>
              {culturaChoices.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Camadas</Label>
          <Select value={camada} onValueChange={onCamada}>
            <SelectTrigger className="h-8 min-w-[8.5rem] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[1200]">
              <SelectItem value="satellite">Satélite + talhões</SelectItem>
              <SelectItem value="events">Eventos destacados</SelectItem>
              <SelectItem value="heat">Incidência (demo)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <Label className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Período</Label>
          <span className="flex h-8 items-center whitespace-nowrap rounded-md border border-input bg-muted/40 px-2 text-xs text-slate-700">
            {dateRangeLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
