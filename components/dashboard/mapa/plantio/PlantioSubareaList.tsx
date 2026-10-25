'use client';

import type { Feature } from 'geojson';

import { manejoCostSummary, moneyDisplay, parsePlantioFeatureProperties, recordedManejoStages, subareaStatusDisplay } from '@/lib/dashboard-mapa/plantio-read-model';
import { strokeForProperties } from '@/components/mapa-talhoes/materialColor';

type Props = {
  subareas: Feature[];
  selectedSubareaId: string | null;
  onSelect: (props: Record<string, unknown>) => void;
};

export function PlantioSubareaList({ subareas, selectedSubareaId, onSelect }: Props) {
  if (subareas.length === 0) return null;

  return (
    <div className="absolute left-2 top-14 z-[1000] flex max-h-[min(420px,50vh)] w-[220px] flex-col gap-1 overflow-y-auto rounded-lg bg-white/95 p-1.5 shadow-md print:hidden">
      <p className="px-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
        Subáreas · {subareas.length} / 6
      </p>
      {subareas.map((f) => {
        const p = (f.properties ?? {}) as Record<string, unknown>;
        const model = parsePlantioFeatureProperties(p);
        const sid = String(p.subarea_id ?? '');
        const selected = sid && sid === selectedSubareaId;
        const label = model?.displayName ?? String(p.label_manejo ?? 'Subárea');
        const area = model?.areaHa;
        const mat = model?.material ?? '—';
        const operationCount = model ? recordedManejoStages(model.manejoStages).length : 0;
        const costs = model ? manejoCostSummary(model) : null;
        const stroke = strokeForProperties({ material: mat });

        return (
          <button
            key={sid || label}
            type="button"
            onClick={() => onSelect(p)}
            className={`rounded-md border bg-white p-1.5 text-left transition ${
              selected ? 'border-emerald-600 ring-2 ring-emerald-500/30' : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-start gap-2">
              <span
                className="mt-0.5 h-3 w-3 shrink-0 rounded-sm border-2"
                style={{ borderColor: stroke, background: selected ? stroke : 'transparent' }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-slate-900">{label}</p>
                <p className="text-[10px] text-slate-600">
                  {area != null ? `${area.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha` : '—'} · {mat}
                </p>
                <p className="text-[10px] text-slate-500">
                  {subareaStatusDisplay(model?.agronomic.status ?? null)} · {operationCount} operação(ões)
                </p>
                {costs?.productPerHa != null ? (
                  <p className="text-[10px] text-slate-600">Produtos: {moneyDisplay(costs.productPerHa)}/ha</p>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
