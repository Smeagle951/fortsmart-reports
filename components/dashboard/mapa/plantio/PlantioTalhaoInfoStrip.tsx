'use client';

import { plantingDateDisplay } from '@/lib/dashboard-mapa/plantio-read-model';

type Props = {
  nome: string;
  areaHa: number | null;
  cultura: string;
  safra: string;
  plantingDate: string | null;
  material: string;
};

const fmtHa = (n: number | null) =>
  n != null
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

export function PlantioTalhaoInfoStrip({ nome, areaHa, cultura, safra, plantingDate, material }: Props) {
  const cells = [
    { l: 'Nome', v: nome },
    { l: 'Área', v: `${fmtHa(areaHa)} ha` },
    { l: 'Cultura', v: cultura },
    { l: 'Safra', v: safra },
    { l: 'Plantio', v: plantingDateDisplay(plantingDate) },
    { l: 'Material', v: material !== '—' ? material : '—' },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-700">
      {cells.map((c) => (
        <span key={c.l}>
          <span className="text-slate-500">{c.l}:</span>{' '}
          <span className="font-semibold text-slate-900">{c.v}</span>
        </span>
      ))}
    </div>
  );
}
