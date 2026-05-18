'use client';

import type { FeatureCollection } from 'geojson';
import { useMemo } from 'react';

type Stats = { areaHa: number; talhaoCount: number; estandeMedioPph: number | null; subCount: number };

function compute(data: FeatureCollection | null): Stats {
  if (!data?.features?.length) {
    return { areaHa: 0, talhaoCount: 0, estandeMedioPph: null, subCount: 0 };
  }
  let area = 0;
  let sumPphArea = 0;
  let areaComEstande = 0;
  let talhaoCount = 0;
  let subCount = 0;
  for (const f of data.features) {
    const p = f.properties as Record<string, unknown> | null | undefined;
    if (!p) continue;
    const tipo = String(p.tipo ?? '');
    if (tipo === 'subarea') {
      subCount += 1;
      continue;
    }
    if (tipo !== 'talhao') continue;
    talhaoCount += 1;
    const a = p.area_ha;
    const ah = typeof a === 'number' && !Number.isNaN(a) ? a : 0;
    area += ah;
    const e = p.estande_pl_ha ?? p.plantas_por_ha;
    const pph = typeof e === 'number' && e > 0 && !Number.isNaN(e) ? e : null;
    if (pph != null && ah > 0) {
      sumPphArea += pph * ah;
      areaComEstande += ah;
    }
  }
  const estandeMedioPph = areaComEstande > 0 ? Math.round(sumPphArea / areaComEstande) : null;
  return { areaHa: area, talhaoCount, estandeMedioPph, subCount };
}

const dec = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const int = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 0, minimumFractionDigits: 0 });

export function MapSummaryBar({ data }: { data: FeatureCollection | null }) {
  const s = useMemo(() => compute(data), [data]);
  if (!data || data.features.length === 0) return null;
  return (
    <div className="pointer-events-none absolute left-2 right-2 top-2 z-[1000] flex flex-wrap items-stretch justify-end gap-2 sm:left-auto sm:right-2 sm:top-2 sm:max-w-lg">
      <div
        className="rounded-lg border border-slate-600/80 bg-slate-950/92 px-3 py-2 text-left text-[11px] text-slate-200 shadow-md backdrop-blur sm:text-xs"
        style={{ pointerEvents: 'auto' }}
      >
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Resumo (selecção no mapa)</p>
        <ul className="space-y-0.5">
          <li>
            <span className="text-slate-500">Área total (talhões):</span>{' '}
            <span className="font-semibold text-white">{dec(s.areaHa)} ha</span>
          </li>
          <li>
            <span className="text-slate-500">Estande médio (área-ponderado):</span>{' '}
            <span className="font-semibold text-white">
              {s.estandeMedioPph != null ? `${int(s.estandeMedioPph)} pl/ha` : '—'}
            </span>
          </li>
          <li>
            <span className="text-slate-500">Talhões / subáreas visíveis:</span>{' '}
            <span className="font-semibold text-white">
              {s.talhaoCount} / {s.subCount}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}
