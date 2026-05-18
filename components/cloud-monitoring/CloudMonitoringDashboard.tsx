'use client';

import { selectMonitoringExecutiveStats } from '@/lib/cloud-monitoring/adapter';
import type { CloudMonitoringNormalized } from '@/lib/cloud-monitoring/types';

type Props = {
  data: CloudMonitoringNormalized;
};

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-sky-900/40 bg-slate-950/60 p-4 text-slate-50 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-sky-200/70">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-white">{value}</div>
      {hint ? <div className="mt-1 text-xs text-sky-200/60">{hint}</div> : null}
    </div>
  );
}

export function CloudMonitoringDashboard({ data }: Props) {
  const s = selectMonitoringExecutiveStats(data);
  const last = s.last_update
    ? new Date(s.last_update).toLocaleString('pt-BR')
    : '—';

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Card label="Relatórios" value={s.total_reports} />
      <Card label="Pontos" value={s.total_points} />
      <Card label="Ocorrências" value={s.total_occurrences} />
      <Card label="Imagens" value={s.total_images} />
      <Card label="Talhões com ocorrência" value={s.plots_with_occurrence} />
      <Card label="Risco crítico" value={s.critical_occurrences} />
      <Card label="Risco alto" value={s.high_risk_occurrences} />
      <Card label="Última atualização" value={last} hint="Campo diagnostics.last_update quando existir" />
    </div>
  );
}
