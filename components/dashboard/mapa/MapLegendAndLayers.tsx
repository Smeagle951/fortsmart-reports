'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

import { COLORS } from '@/lib/dashboard-mapa/constants';

type Props = {
  layerTalhoes: boolean;
  layerSubareas: boolean;
  layerEvents: boolean;
  onLayerTalhoes: (v: boolean) => void;
  onLayerSubareas: (v: boolean) => void;
  onLayerEvents: (v: boolean) => void;
  /** Só talhões/subáreas (GeoJSON plantio); esconde legenda de eventos e a camada «Eventos». */
  plantioGeoOnly?: boolean;
};

export function MapLegendAndLayers({
  layerTalhoes,
  layerSubareas,
  layerEvents,
  onLayerTalhoes,
  onLayerSubareas,
  onLayerEvents,
  plantioGeoOnly = false,
}: Props) {
  return (
    <div
      className={`pointer-events-none absolute z-[1000] flex flex-wrap items-end justify-between gap-2 print:hidden lg:bottom-3 ${
        plantioGeoOnly ? 'bottom-3 left-3 right-3 justify-end' : 'bottom-24 left-3 right-3 lg:bottom-3'
      }`}
    >
      {!plantioGeoOnly ? (
        <div className="pointer-events-auto rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500">Eventos (7 dias)</p>
          <ul className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-700">
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.pragaAlta }}
              />
              Praga alta
            </li>
            <li className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full border border-white shadow ring-1 ring-slate-300"
                style={{ backgroundColor: COLORS.pragaMedia }}
              />
              Praga média
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
      ) : null}
      <div className="pointer-events-auto rounded-xl border border-slate-200/90 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
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
    </div>
  );
}
