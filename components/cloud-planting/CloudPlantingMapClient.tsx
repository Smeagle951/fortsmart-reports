'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';

import { MapProvider } from '@/components/dashboard/mapa/MapProvider';
import type { CloudPlantingNormalized } from '@/lib/cloud-planting/adapter';
import { selectPlantingGeoFeatureCollection } from '@/lib/cloud-planting/adapter';

function kmlRows(data: CloudPlantingNormalized) {
  const rows: { plot: string; name: string; kml: string }[] = [];
  for (const plot of data.plots) {
    for (const sub of plot.subareas) {
      for (const rec of sub.records) {
        for (const g of rec.geo_exports) {
          const k = g.kml_text?.trim();
          if (k) {
            rows.push({
              plot: plot.plot_name,
              name: g.file_name?.trim() || g.type || 'export.kml',
              kml: k,
            });
          }
        }
      }
    }
  }
  return rows;
}

function tableRows(data: CloudPlantingNormalized) {
  const rows: { plot: string; sub: string; date: string; hybrid: string }[] = [];
  for (const plot of data.plots) {
    for (const sub of plot.subareas) {
      for (const rec of sub.records) {
        const p = rec.planting;
        rows.push({
          plot: plot.plot_name,
          sub: sub.subarea_name,
          date: p?.planting_date != null ? String(p.planting_date) : '—',
          hybrid: p?.hibrido != null ? String(p.hibrido) : p?.material_name != null ? String(p.material_name) : '—',
        });
      }
    }
  }
  return rows;
}

export function CloudPlantingMapClient({ data }: { data: CloudPlantingNormalized }) {
  const fc: FeatureCollection = useMemo(() => selectPlantingGeoFeatureCollection(data), [data]);
  const kmls = useMemo(() => kmlRows(data), [data]);
  const tbl = useMemo(() => tableRows(data), [data]);
  const hasGeom = fc.features.length > 0;

  return (
    <div className="space-y-4">
      {hasGeom ? (
        <MapProvider fitGeoJson={fc} mapClassName="h-[min(55vh,520px)] w-full rounded-xl border border-emerald-900/40">
          <GeoJSON
            data={fc as unknown as GeoJsonObject}
            style={() => ({
              color: '#34d399',
              weight: 2,
              fillColor: '#059669',
              fillOpacity: 0.22,
            })}
          />
        </MapProvider>
      ) : (
        <div className="rounded-xl border border-dashed border-emerald-800/50 bg-emerald-950/25 p-4 text-sm text-emerald-100/85">
          Sem geometria válida (GeoJSON nulo ou inválido). Use a tabela abaixo ou a timeline.
        </div>
      )}

      {kmls.length ? (
        <div>
          <h3 className="mb-2 text-sm font-semibold text-emerald-100">KML / exportações</h3>
          <ul className="space-y-2 text-sm">
            {kmls.map((r, i) => (
              <li key={i} className="flex flex-wrap items-center gap-2 text-emerald-50/95">
                <span className="text-emerald-300/80">{r.plot}</span>
                <span>—</span>
                <a
                  className="text-sky-300 underline hover:text-sky-200"
                  href={`data:application/vnd.google-earth.kml+xml;charset=utf-8,${encodeURIComponent(r.kml)}`}
                  download={r.name.endsWith('.kml') ? r.name : `${r.name}.kml`}
                >
                  Descarregar KML
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tbl.length ? (
        <div className="overflow-x-auto rounded-xl border border-emerald-900/35">
          <table className="min-w-full text-left text-sm text-emerald-50">
            <thead className="bg-emerald-950/60 text-xs uppercase text-emerald-300/80">
              <tr>
                <th className="px-3 py-2">Talhão</th>
                <th className="px-3 py-2">Subárea</th>
                <th className="px-3 py-2">Plantio</th>
                <th className="px-3 py-2">Material</th>
              </tr>
            </thead>
            <tbody>
              {tbl.map((r, i) => (
                <tr key={i} className="border-t border-emerald-900/25 odd:bg-black/15">
                  <td className="px-3 py-2">{r.plot}</td>
                  <td className="px-3 py-2">{r.sub}</td>
                  <td className="px-3 py-2">{r.date}</td>
                  <td className="px-3 py-2">{r.hybrid}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
