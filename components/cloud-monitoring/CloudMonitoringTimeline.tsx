'use client';

import { monitoringImageDisplayHint, selectMonitoringTimelineGroups } from '@/lib/cloud-monitoring/adapter';
import type { CloudMonitoringNormalized } from '@/lib/cloud-monitoring/types';

type Props = {
  data: CloudMonitoringNormalized;
};

export function CloudMonitoringTimeline({ data }: Props) {
  const groups = selectMonitoringTimelineGroups(data);
  if (!groups.length) {
    return (
      <div className="rounded-lg border border-dashed border-sky-800/50 bg-slate-950/30 p-6 text-center text-sky-200/80">
        Sem dados de timeline (nenhum relatório após normalização).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <details
          key={`${g.plot.plot_id ?? g.plot.plot_local_id ?? gi}`}
          className="rounded-xl border border-sky-900/35 bg-slate-950/40 open:bg-slate-950/55"
          open={gi === 0}
        >
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-white">
            Talhão: {g.plot.plot_name}
            <span className="ml-2 text-xs font-normal text-sky-300/70">{g.reports.length} relatório(s)</span>
          </summary>
          <div className="space-y-2 border-t border-sky-900/30 px-4 pb-4 pt-2">
            {g.reports.map((rep, ri) => (
              <details
                key={String(rep.report_id ?? ri)}
                className="rounded-lg border border-sky-900/25 bg-black/25"
                open={ri === 0}
              >
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-sky-100">
                  Relatório: {rep.monitoring_date ?? 'sem data'}
                  {rep.crop_name ? ` · ${rep.crop_name}` : ''}
                  <span className="ml-2 text-xs text-sky-400/70">{rep.points.length} ponto(s)</span>
                </summary>
                <div className="space-y-2 border-t border-sky-900/20 px-3 pb-3 pt-2">
                  {rep.points.map((pt, pi) => (
                    <div
                      key={String(pt.point_id ?? pi)}
                      className="rounded-md bg-slate-900/50 p-3 text-sm text-slate-100/95"
                    >
                      <div className="font-medium text-white">
                        Ponto {pt.point_code ?? pt.point_local_id ?? `#${pi + 1}`}
                        {pt.latitude != null && pt.longitude != null
                          ? ` · GPS ${pt.latitude.toFixed(5)}, ${pt.longitude.toFixed(5)}`
                          : ' · sem coordenada GPS'}
                      </div>
                      {!pt.occurrences.length ? (
                        <p className="mt-1 text-xs text-slate-400">Sem ocorrências.</p>
                      ) : (
                        <ul className="mt-2 space-y-2">
                          {pt.occurrences.map((oc, oi) => (
                            <li key={String(oc.occurrence_id ?? oi)} className="border-l-2 border-sky-600/50 pl-2">
                              <div>
                                <span className="text-sky-200/90">Ocorrência:</span>{' '}
                                {oc.name ?? oc.type ?? '—'}
                                {oc.risk_level ? (
                                  <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-amber-200">
                                    risco {oc.risk_level}
                                  </span>
                                ) : null}
                              </div>
                              {oc.recommendation?.simple_text ? (
                                <div className="mt-1 text-xs text-emerald-200/90">
                                  <span className="font-medium text-emerald-300/90">Recomendação:</span>{' '}
                                  {oc.recommendation.simple_text}
                                </div>
                              ) : null}
                              {oc.images.length ? (
                                <ul className="mt-2 space-y-1 text-xs text-slate-300">
                                  {oc.images.map((img, ii) => {
                                    const hint = monitoringImageDisplayHint(img);
                                    return (
                                      <li key={String(img.image_id ?? img.local_id ?? ii)}>
                                        Imagem: {img.file_name ?? img.caption ?? 'sem nome'}
                                        {hint.mode === 'cloud_url' && hint.src ? (
                                          <span className="ml-1 text-sky-300">(URL cloud)</span>
                                        ) : null}
                                        {hint.message ? (
                                          <span className="ml-1 text-amber-200/90"> — {hint.message}</span>
                                        ) : null}
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
