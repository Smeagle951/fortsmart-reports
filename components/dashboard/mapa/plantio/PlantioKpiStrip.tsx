'use client';

type Props = {
  areaTotalHa: number | null;
  subareaCount: number;
  selectedAreaHa: number | null;
  estandePlHa: number | null;
  materialFallback: string | null;
  hasSubareas: boolean;
};

const fmtHa = (n: number | null) =>
  n != null
    ? n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    : '—';

const fmtInt = (n: number | null) =>
  n != null ? n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : '—';

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-[120px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

export function PlantioKpiStrip({
  areaTotalHa,
  subareaCount,
  selectedAreaHa,
  estandePlHa,
  materialFallback,
  hasSubareas,
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 px-2 pb-2">
      <Kpi label="Área total" value={`${fmtHa(areaTotalHa)} ha`} />
      {hasSubareas ? (
        <Kpi label="Subáreas" value={String(subareaCount)} />
      ) : (
        <Kpi label="Material" value={materialFallback && materialFallback !== '—' ? materialFallback : '—'} />
      )}
      <Kpi label="Área da seleção" value={`${fmtHa(selectedAreaHa)} ha`} />
      <Kpi
        label="Estande"
        value={estandePlHa != null ? `${fmtInt(estandePlHa)} pl/ha` : 'Sem avaliação'}
      />
    </div>
  );
}
