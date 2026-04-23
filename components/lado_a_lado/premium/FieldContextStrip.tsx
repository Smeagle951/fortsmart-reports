'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { LucideIcon } from 'lucide-react';
import { Activity, Calendar, LandPlot, Leaf, MapPin, Sprout, Wheat } from 'lucide-react';

type StripItem = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: string;
};

export default function FieldContextStrip({ data }: { data: SideBySideReportData }) {
  const farm = data.farm ?? {};
  const coleta = data.coleta;
  const ed = data.experiment_design;

  const local =
    [farm.city, farm.state].filter((x) => x && String(x).trim()).join(', ') ||
    (ed?.municipality_uf != null && String(ed.municipality_uf).trim() ? String(ed.municipality_uf) : null);

  const areaHa =
    farm.areaHa != null && Number.isFinite(farm.areaHa)
      ? `${farm.areaHa} ha`
      : ed?.talhao_area_ha != null && Number.isFinite(ed.talhao_area_ha)
        ? `${ed.talhao_area_ha} ha`
        : null;

  const aval =
    coleta?.dae != null && Number.isFinite(coleta.dae)
      ? `${coleta.dae} DAE`
      : coleta?.dap != null && Number.isFinite(coleta.dap)
        ? `${coleta.dap} DAP`
        : null;

  const raw: StripItem[] = [
    {
      key: 'cultura',
      icon: Sprout,
      label: 'Cultura',
      value: (farm.culture || ed?.culture || '').trim(),
    },
    {
      key: 'safra',
      icon: Calendar,
      label: 'Safra',
      value: (farm.season || ed?.season || '').trim(),
    },
    {
      key: 'estadio',
      icon: Leaf,
      label: 'Estádio',
      value: (coleta?.estadio || '').trim(),
    },
    {
      key: 'area',
      icon: LandPlot,
      label: 'Área do ensaio',
      value: areaHa || '',
    },
    {
      key: 'avaliacao',
      icon: Activity,
      label: 'Avaliação',
      value: aval || '',
    },
    {
      key: 'local',
      icon: MapPin,
      label: 'Localização',
      value: (local || [farm.farmName, farm.fieldName].filter(Boolean).join(' · ')).trim(),
    },
    {
      key: 'hibrido',
      icon: Wheat,
      label: 'Híbrido / cultivar',
      value: (ed?.cultivar_hibrido || '').trim(),
    },
  ];

  const items = raw.filter((x) => x.value.length > 0);
  if (items.length === 0) return null;

  return (
    <div
      id="ficha-ensaio-premium"
      className="scroll-mt-36 border-b border-slate-200/90 bg-white shadow-sm print:border-slate-200"
    >
      <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 sm:py-5">
        <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 print:text-slate-600">
          Ficha do ensaio
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
          {items.map((it) => (
            <div
              key={it.key}
              className="flex min-w-0 gap-2 rounded-xl border border-slate-100 bg-slate-50/90 px-2.5 py-2 sm:px-3"
            >
              <it.icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
              <div className="min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-wide text-slate-500">{it.label}</p>
                <p className="truncate text-xs font-semibold leading-snug text-slate-900">{it.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
