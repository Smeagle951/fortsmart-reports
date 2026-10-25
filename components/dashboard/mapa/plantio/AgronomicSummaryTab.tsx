'use client';

import {
  daeDisplay,
  dapDisplay,
  plantingDateDisplay,
  standDisplay,
  type PlantioFeatureReadModel,
} from '@/lib/dashboard-mapa/plantio-read-model';
import { PlantioManejoTimeline } from './PlantioManejoTimeline';


type Props = {
  model: PlantioFeatureReadModel;
  onVerTodasAtividades?: () => void;
};

export function AgronomicSummaryTab({ model, onVerTodasAtividades }: Props) {
  const { agronomic: ag } = model;
  const tipoLabel = model.tipoManejo ?? 'Talhão';

  const grid = [
    { label: 'Área', value: model.areaHa != null ? `${model.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha` : '—' },
    { label: 'Material', value: model.material },
    { label: 'Tipo', value: tipoLabel },
    { label: 'Plantio', value: plantingDateDisplay(ag.plantingDate) },
    { label: 'DAP', value: dapDisplay(ag.dap) },
    { label: 'DAE', value: ag.dae == null ? 'Aguardando emergência' : daeDisplay(ag.dae) },
    {
      label: 'Estande',
      value: standDisplay(ag.standMeasured, ag.standTarget),
    },
    {
      label: 'População alvo',
      value:
        ag.standTarget != null && ag.standTarget > 0
          ? `${Math.round(ag.standTarget).toLocaleString('pt-BR')} pl/ha`
          : '—',
    },
  ];

  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Resumo agronômico</h3>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
          {grid.map((row) => (
            <div key={row.label}>
              <dt className="text-slate-500">{row.label}</dt>
              <dd className="font-semibold text-slate-900">{row.value}</dd>
            </div>
          ))}
        </dl>
        {ag.phaseLabel ? (
          <p className="mt-2 text-[11px] text-slate-600">
            Desenvolvimento: <span className="font-medium text-slate-800">{ag.phaseLabel}</span>
          </p>
        ) : null}
      </section>

      <PlantioManejoTimeline
        stages={model.manejoStages}
        recentActivities={[]}
        onVerTodas={onVerTodasAtividades}
        compact
      />
    </div>
  );
}
