'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { LucideIcon } from 'lucide-react';
import { Activity, Calendar, LandPlot, Leaf, MapPin, Sprout } from 'lucide-react';
type StripDef = {
  key: string;
  icon: LucideIcon;
  label: string;
  value: (data: SideBySideReportData) => string;
};

const SIX_SLOTS: StripDef[] = [
  {
    key: 'cultura',
    icon: Sprout,
    label: 'Cultura',
    value: (data) => {
      const farm = data.farm ?? {};
      const ed = data.experiment_design;
      return (farm.culture || ed?.culture || '').trim();
    },
  },
  {
    key: 'safra',
    icon: Calendar,
    label: 'Safra',
    value: (data) => (data.farm?.season || data.experiment_design?.season || '').trim(),
  },
  {
    key: 'estadio',
    icon: Leaf,
    label: 'Estádio',
    value: (data) => (data.coleta?.estadio || '').trim(),
  },
  {
    key: 'area',
    icon: LandPlot,
    label: 'Área do ensaio',
    value: (data) => {
      const farm = data.farm ?? {};
      const ed = data.experiment_design;
      if (farm.areaHa != null && Number.isFinite(farm.areaHa)) return `${farm.areaHa} ha`;
      if (ed?.talhao_area_ha != null && Number.isFinite(ed.talhao_area_ha)) return `${ed.talhao_area_ha} ha`;
      return '';
    },
  },
  {
    key: 'avaliacao',
    icon: Activity,
    label: 'Avaliação',
    value: (data) => {
      const coleta = data.coleta;
      if (coleta?.dae != null && Number.isFinite(coleta.dae)) return `${coleta.dae} DAE`;
      if (coleta?.dap != null && Number.isFinite(coleta.dap)) return `${coleta.dap} DAP`;
      return '';
    },
  },
  {
    key: 'local',
    icon: MapPin,
    label: 'Localização',
    value: (data) => {
      const farm = data.farm ?? {};
      const ed = data.experiment_design;
      const fromCityState = [farm.city, farm.state].filter((x) => x && String(x).trim()).join(', ');
      if (fromCityState) return fromCityState;
      if (ed?.municipality_uf != null && String(ed.municipality_uf).trim()) return String(ed.municipality_uf);
      const fromFarm = [farm.farmName, farm.fieldName].filter(Boolean).join(' · ');
      return fromFarm || '';
    },
  },
];

export default function FieldContextStrip({ data }: { data: SideBySideReportData }) {
  return (
    <div
      id="ficha-ensaio-premium"
      className="scroll-mt-28 border-b border-slate-200/90 print:border-slate-200"
      style={{ backgroundColor: '#F1F3F5' }}
    >
      <div className="mx-auto max-w-[1400px] px-2 py-3 sm:px-4 sm:py-4">
        <div className="grid grid-cols-2 gap-0 divide-y divide-slate-200/80 border border-slate-200/60 bg-white/90 shadow-sm sm:grid-cols-3 md:grid-cols-6 md:divide-x md:divide-y-0 print:border-slate-300 rounded-xl overflow-hidden">
          {SIX_SLOTS.map((def) => {
            const v = def.value(data).trim();
            const show = v || '—';
            return (
              <div
                key={def.key}
                className="flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 px-2 py-3 text-center sm:min-h-[5rem] sm:px-3"
              >
                <def.icon className="h-4 w-4 text-slate-400" strokeWidth={1.75} aria-hidden />
                <p className="text-xs font-bold leading-tight text-slate-900 sm:text-sm" title={show}>
                  {show}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-500">{def.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
