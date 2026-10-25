'use client';

import type { ManejoStage, RecentActivity } from '@/lib/dashboard-mapa/plantio-read-model';
import { moneyDisplay, plantingDateDisplay, recordedManejoStages } from '@/lib/dashboard-mapa/plantio-read-model';

type Props = {
  stages: ManejoStage[];
  recentActivities: RecentActivity[];
  onVerTodas?: () => void;
  compact?: boolean;
};

function statusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('registr')) return 'text-emerald-700 bg-emerald-50';
  if (s.includes('pend')) return 'text-amber-800 bg-amber-50';
  if (s.includes('andamento')) return 'text-sky-800 bg-sky-50';
  return 'text-slate-600 bg-slate-100';
}

const STAGE_LABELS: Record<string, string> = {
  semeadura: 'Semeadura',
  tratamento_sementes: 'Tratamento de sementes',
  sulco: 'Sulco',
  fertilizacao: 'Fertilização',
  aplicacoes: 'Aplicações',
  avaliacoes_qualidade: 'Avaliações / Qualidade',
  colheita: 'Colheita',
};

function stageTitle(stage: string): string {
  return STAGE_LABELS[stage] ?? stage;
}

export function PlantioManejoTimeline({ stages, recentActivities, onVerTodas, compact = false }: Props) {
  const allOrdered = [...recordedManejoStages(stages)]
    .sort((a, b) => (a.date ?? '9999').localeCompare(b.date ?? '9999'));
  const ordered = compact ? allOrdered.slice(-3) : allOrdered;

  return (
    <section>
      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500">Linha do tempo do manejo</h3>
      {ordered.length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">Nenhuma operação registrada nesta subárea. Registre a operação no aplicativo FortSmart.</p>
      ) : null}
      <ol className="relative mt-3 space-y-3 border-l border-slate-200 pl-4">
        {ordered.map((item, index) => (
          <li key={`${item.operationId ?? item.stage}-${index}`} className="relative">
            <span aria-hidden="true" className="absolute -left-[24px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-emerald-600 text-[9px] text-white ring-1 ring-slate-200">
              {item.stage === 'semeadura' ? 'S' : item.stage === 'colheita' ? 'C' : item.stage === 'avaliacoes_qualidade' ? 'A' : '•'}
            </span>
            <div className="rounded-lg border border-slate-100 bg-white px-2.5 py-2 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-900">{stageTitle(item.stage)}</p>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${statusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>
              {item.date ? (
                <p className="mt-0.5 text-[11px] text-slate-600">{plantingDateDisplay(item.date)}</p>
              ) : null}
              {item.summary ? (
                <p className="mt-0.5 text-[11px] text-slate-700">{item.summary}</p>
              ) : null}
              {!compact && item.products.length > 0 ? (
                <div className="mt-1.5 overflow-x-auto border-t border-slate-100 pt-1.5">
                  <table className="w-full min-w-[500px] text-left text-[10px] text-slate-700">
                    <thead><tr className="text-slate-500">
                      <th className="py-1 pr-2">Produto</th><th className="pr-2">Classe</th>
                      <th className="pr-2">Dose</th><th className="pr-2">Finalidade</th>
                      <th className="text-right">Custo/ha</th><th className="text-right">Custo total</th>
                    </tr></thead>
                    <tbody>{item.products.map((p, i) => (
                      <tr key={`${p.name}-${i}`} className="border-t border-slate-100">
                        <td className="py-1 pr-2 font-medium">{p.name}</td>
                        <td className="pr-2">{p.class}</td>
                        <td className="pr-2">{p.dose} {p.unit}</td>
                        <td className="pr-2">{p.purpose}</td>
                        <td className="text-right">{moneyDisplay(p.costPerHa)}</td>
                        <td className="text-right">{moneyDisplay(p.costTotal)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              ) : null}
              {item.operationCostPerHa != null ? (
                <p className="mt-1 text-right text-[10px] text-slate-600">Operação: {moneyDisplay(item.operationCostPerHa)}/ha</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      {compact && allOrdered.length > 0 && onVerTodas ? (
        <button type="button" className="mt-2 text-[11px] font-semibold text-emerald-700 hover:underline" onClick={onVerTodas}>Ver timeline completa →</button>
      ) : null}

      {recentActivities.length > 0 ? (
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-[11px] font-bold uppercase text-slate-500">Últimas atividades</h4>
            {onVerTodas ? (
              <button type="button" className="text-[11px] font-semibold text-emerald-700 hover:underline" onClick={onVerTodas}>
                Ver todas
              </button>
            ) : null}
          </div>
          <ul className="space-y-1.5 text-xs">
            {recentActivities.slice(0, 3).map((a, i) => (
              <li key={`${a.type}-${i}`} className="rounded-md bg-slate-50 px-2 py-1.5">
                <span className="font-semibold text-slate-800">{a.type}</span>
                <span className="text-slate-500"> · {plantingDateDisplay(a.date)}</span>
                <p className="text-slate-600">{a.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
