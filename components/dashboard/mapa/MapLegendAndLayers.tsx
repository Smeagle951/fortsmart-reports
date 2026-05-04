'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { COLORS } from '@/lib/dashboard-mapa/constants';

type Props = {
  layerTalhoes: boolean;
  layerSubareas: boolean;
  layerEvents: boolean;
  layerHeatmap?: boolean;
  onLayerTalhoes: (v: boolean) => void;
  onLayerSubareas: (v: boolean) => void;
  onLayerEvents: (v: boolean) => void;
  onLayerHeatmap?: (v: boolean) => void;
  /** Só talhões/subáreas (GeoJSON plantio); esconde legenda de eventos e a camada «Eventos». */
  plantioGeoOnly?: boolean;
};

export function MapLegendAndLayers({
  layerTalhoes,
  layerSubareas,
  layerEvents,
  layerHeatmap = false,
  onLayerTalhoes,
  onLayerSubareas,
  onLayerEvents,
  onLayerHeatmap,
  plantioGeoOnly = false,
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute z-[850] flex flex-wrap items-end justify-between gap-2 print:hidden ${
        plantioGeoOnly ? 'bottom-5 left-5 right-5 justify-end' : 'bottom-5 left-5 right-auto max-w-[min(52rem,calc(100%-2.5rem))]'
      }`}
    >
      {!plantioGeoOnly ? (
        <div className="pointer-events-auto rounded-2xl border border-slate-200/90 bg-white/95 px-5 py-4 shadow-xl shadow-black/15 backdrop-blur-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div>
          <p className="text-sm font-bold text-slate-900">Eventos (últimos 7 dias)</p>
          <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-700">
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.pragaAlta }}
              />
              Praga - Alto
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.pragaMedia }}
              />
              Praga - Médio
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.doenca }}
              />
              Doença
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.normal }}
              />
              Normal
            </li>
          </ul>
            </div>
            <div className="border-slate-200 md:border-l md:pl-5">
              <p className="text-sm font-bold text-slate-900">Camadas</p>
              <ul className="mt-3 flex flex-wrap gap-4 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <Checkbox id="layer-talhoes" checked={layerTalhoes} onCheckedChange={(c) => onLayerTalhoes(c === true)} />
                  <Label htmlFor="layer-talhoes" className="cursor-pointer font-normal">Talhões</Label>
                </li>
                <li className="flex items-center gap-2">
                  <Checkbox id="layer-subareas" checked={layerSubareas} onCheckedChange={(c) => onLayerSubareas(c === true)} />
                  <Label htmlFor="layer-subareas" className="cursor-pointer font-normal">Subáreas</Label>
                </li>
                <li className={cn('flex items-center gap-2', !layerEvents && 'opacity-60')}>
                  <Checkbox id="layer-events" checked={layerEvents} onCheckedChange={(c) => onLayerEvents(c === true)} />
                  <Label htmlFor="layer-events" className="cursor-pointer font-normal">Eventos</Label>
                </li>
                <li className="flex items-center gap-2">
                  <Checkbox id="layer-heatmap" checked={layerHeatmap} onCheckedChange={(c) => onLayerHeatmap?.(c === true)} />
                  <Label htmlFor="layer-heatmap" className="cursor-pointer font-normal">Mapa térmico</Label>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : null}
      {plantioGeoOnly ? <div className="pointer-events-auto rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Camadas</p>
        <ul className="mt-2 flex flex-col gap-2 text-xs text-slate-700">
          <li className="flex items-center gap-2">
            <Checkbox id="layer-talhoes" checked={layerTalhoes} onCheckedChange={(c) => onLayerTalhoes(c === true)} />
            <Label htmlFor="layer-talhoes" className="cursor-pointer font-normal">
              Talhões
            </Label>
          </li>
          <li className="flex items-center gap-2">
            <Checkbox
              id="layer-subareas"
              checked={layerSubareas}
              onCheckedChange={(c) => onLayerSubareas(c === true)}
            />
            <Label htmlFor="layer-subareas" className="cursor-pointer font-normal">
              Subáreas
            </Label>
          </li>
          {!plantioGeoOnly ? (
            <li className={cn('flex items-center gap-2', !layerEvents && 'opacity-60')}>
              <Checkbox id="layer-events" checked={layerEvents} onCheckedChange={(c) => onLayerEvents(c === true)} />
              <Label htmlFor="layer-events" className="cursor-pointer font-normal">
                Eventos
              </Label>
            </li>
          ) : null}
        </ul>
      </div>
      : null}
    </div>
  );
}
