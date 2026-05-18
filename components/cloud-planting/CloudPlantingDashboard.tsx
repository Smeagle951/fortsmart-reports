'use client';

import type { CloudPlantingNormalized } from '@/lib/cloud-planting/adapter';

type Props = {
  data: CloudPlantingNormalized;
};

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/40 p-4 text-emerald-50 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-emerald-200/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-emerald-200/60">{hint}</div> : null}
    </div>
  );
}

export function CloudPlantingDashboard({ data }: Props) {
  const s = data.summary;
  const latest = s.latest_planting_date
    ? new Date(s.latest_planting_date).toLocaleDateString('pt-BR')
    : '—';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Total de plantios" value={s.total_plantings} />
      <Card label="Estandes (avaliações)" value={s.total_stand_evaluations} />
      <Card label="CV / plantabilidade" value={s.total_cv_records} />
      <Card label="Fenologia" value={s.total_phenology_records} />
      <Card label="Calibrações" value={s.total_calibration_records} />
      <Card label="Geo exports" value={s.total_geo_exports} />
      <Card label="Imagens" value={s.total_images} />
      <Card label="Última data de plantio" value={latest} hint="Maior planting_date recebida na janela" />
    </div>
  );
}
