'use client';

import type { CloudPlantingNormalized } from '@/lib/cloud-planting/adapter';

type Props = {
  data: CloudPlantingNormalized;
};

function shortObj(label: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return <span className="text-emerald-200/50">nenhum</span>;
  return (
    <ul className="mt-1 list-inside list-disc text-sm text-emerald-100/90">
      {rows.slice(0, 8).map((r, i) => (
        <li key={i}>
          {label} #{i + 1}
          {r.local_id != null ? ` — local_id: ${String(r.local_id)}` : ''}
        </li>
      ))}
      {rows.length > 8 ? <li>… +{rows.length - 8}</li> : null}
    </ul>
  );
}

export function CloudPlantingTimeline({ data }: Props) {
  if (!data.plots.length) {
    return (
      <div className="rounded-lg border border-dashed border-emerald-800/50 bg-emerald-950/20 p-6 text-center text-emerald-200/80">
        Sem talhões na janela cloud (payload vazio ou ainda não carregado).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.plots.map((plot, pi) => (
        <details
          key={`${plot.plot_id ?? plot.plot_local_id ?? pi}`}
          className="group rounded-xl border border-emerald-900/35 bg-emerald-950/30 open:bg-emerald-950/45"
          open={pi === 0}
        >
          <summary className="cursor-pointer select-none px-4 py-3 font-semibold text-emerald-50">
            Talhão: {plot.plot_name}
            <span className="ml-2 text-xs font-normal text-emerald-300/70">
              {plot.subareas.length} subárea(s)
            </span>
          </summary>
          <div className="space-y-2 border-t border-emerald-900/30 px-4 pb-4 pt-2">
            {plot.subareas.map((sub, si) => (
              <details
                key={`${sub.subarea_id ?? sub.subarea_local_id ?? si}`}
                className="rounded-lg border border-emerald-900/25 bg-black/20"
                open={si === 0}
              >
                <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-emerald-100">
                  Subárea: {sub.subarea_name}
                  <span className="ml-2 text-xs text-emerald-300/60">{sub.records.length} plantio(s)</span>
                </summary>
                <div className="space-y-2 border-t border-emerald-900/20 px-3 pb-3 pt-2">
                  {sub.records.map((rec, ri) => {
                    const p = rec.planting;
                    const plantingLabel =
                      p?.planting_date != null
                        ? `Plantio ${String(p.planting_date)}`
                        : `Plantio #${ri + 1}`;
                    return (
                      <div key={ri} className="rounded-md bg-emerald-950/40 p-3 text-sm text-emerald-50/95">
                        <div className="font-medium text-white">{plantingLabel}</div>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          <div>
                            <div className="text-xs uppercase text-emerald-300/70">Estande</div>
                            {shortObj('Estande', rec.stand_evaluations)}
                          </div>
                          <div>
                            <div className="text-xs uppercase text-emerald-300/70">CV</div>
                            {shortObj('CV', rec.cv_records)}
                          </div>
                          <div>
                            <div className="text-xs uppercase text-emerald-300/70">Fenologia</div>
                            {shortObj('Fenologia', rec.phenology_records)}
                          </div>
                          <div>
                            <div className="text-xs uppercase text-emerald-300/70">Calibração</div>
                            {shortObj('Calibração', rec.calibration_records)}
                          </div>
                          <div className="sm:col-span-2">
                            <div className="text-xs uppercase text-emerald-300/70">Geo / KML</div>
                            {!rec.geo_exports.length ? (
                              <span className="text-emerald-200/50">nenhum export</span>
                            ) : (
                              <ul className="mt-1 list-inside list-disc text-emerald-100/90">
                                {rec.geo_exports.map((g, gi) => (
                                  <li key={gi}>
                                    {(g.type ?? 'geo').toString()}
                                    {g.file_name ? ` — ${g.file_name}` : ''}
                                    {g.kml_text ? ' — KML' : ''}
                                    {g.geojson ? ' — GeoJSON' : ''}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </details>
      ))}
    </div>
  );
}
