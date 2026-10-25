'use client';

type Props = {
  breadcrumbParent?: string;
  talhaoName: string;
  cultura: string;
  safra: string;
  areaHa: number | null;
  material?: string | null;
  viewMode: 'map' | 'list';
  onViewMode: (mode: 'map' | 'list') => void;
};

const fmtHa = (n: number | null) =>
  n != null && !Number.isNaN(n)
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '—';

export function PlantioTalhaoHeader({
  breadcrumbParent = 'Talhões',
  talhaoName,
  cultura,
  safra,
  areaHa,
  material,
  viewMode,
  onViewMode,
}: Props) {
  return (
    <div className="shrink-0 border-b border-slate-200 bg-white px-3 py-2.5">
      <p className="text-[11px] text-slate-500">
        {breadcrumbParent} <span className="text-slate-400">›</span>{' '}
        <span className="font-semibold text-slate-800">{talhaoName}</span>
      </p>
      <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-slate-900">{talhaoName}</h1>
          <p className="text-xs text-slate-600">
            {cultura} · Safra {safra} · {fmtHa(areaHa)} ha
            {material && material !== '—' ? ` · ${material}` : ''}
          </p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs font-semibold">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 ${
              viewMode === 'map' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => onViewMode('map')}
          >
            Mapa e subáreas
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 ${
              viewMode === 'list' ? 'bg-emerald-700 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            onClick={() => onViewMode('list')}
          >
            Lista de subáreas
          </button>
        </div>
      </div>
    </div>
  );
}
