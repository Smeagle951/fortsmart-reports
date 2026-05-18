'use client';

import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import { CircleMarker, GeoJSON, Popup } from 'react-leaflet';

import { MapProvider } from '@/components/dashboard/mapa/MapProvider';
import { selectMonitoringPointFeatures } from '@/lib/cloud-monitoring/adapter';
import type { CloudMonitoringNormalized } from '@/lib/cloud-monitoring/types';

function riskColor(risk: string | undefined | null): string {
  const x = (risk ?? '').toLowerCase();
  if (x.includes('crit')) return '#ef4444';
  if (x.includes('alto') || x.includes('high') || x.includes('elev')) return '#f97316';
  if (x.includes('médio') || x.includes('medio') || x.includes('medium')) return '#eab308';
  return '#38bdf8';
}

type Props = {
  data: CloudMonitoringNormalized;
};

function isOutlineGeometry(t: string | undefined): boolean {
  return t === 'Polygon' || t === 'MultiPolygon' || t === 'LineString' || t === 'MultiLineString';
}

export function CloudMonitoringMapClient({ data }: Props) {
  const fc = selectMonitoringPointFeatures(data);
  const outlineFeatures = fc.features.filter((f) => isOutlineGeometry(f.geometry?.type));
  const pointFeatures = fc.features.filter((f) => f.geometry?.type === 'Point');
  const hasAnything = fc.features.length > 0;

  return (
    <div className="space-y-3">
      {!hasAnything ? (
        <div className="rounded-xl border border-dashed border-sky-800/50 bg-slate-950/30 p-4 text-sm text-sky-100/85">
          Nenhuma geometria GPS ou contorno de talhão — o mapa está vazio. Consulte a timeline.
        </div>
      ) : !pointFeatures.length && !outlineFeatures.length ? (
        <div className="rounded-xl border border-dashed border-sky-800/50 bg-slate-950/30 p-4 text-sm text-sky-100/85">
          Geometria não suportada para marcadores. Consulte a timeline.
        </div>
      ) : (
        <MapProvider
          fitGeoJson={fc.features.length ? fc : null}
          mapClassName="h-[min(55vh,520px)] w-full rounded-xl border border-sky-900/40"
        >
          {outlineFeatures.length > 0 ? (
            <GeoJSON
              data={{ type: 'FeatureCollection', features: outlineFeatures } as unknown as GeoJsonObject}
              style={(feat) => {
                if (!feat) {
                  return { color: '#38bdf8', weight: 2, fillColor: '#0ea5e9', fillOpacity: 0.14 };
                }
                const t = feat.geometry?.type;
                if (t === 'LineString' || t === 'MultiLineString') {
                  return { color: '#7dd3fc', weight: 3, opacity: 0.9 };
                }
                return {
                  color: '#38bdf8',
                  weight: 2,
                  fillColor: '#0ea5e9',
                  fillOpacity: 0.14,
                };
              }}
            />
          ) : null}
          {pointFeatures.map((f, i) => {
            const g = f.geometry;
            if (!g || g.type !== 'Point' || !Array.isArray(g.coordinates)) return null;
            const [lng, lat] = g.coordinates as [number, number];
            if (typeof lat !== 'number' || typeof lng !== 'number') return null;
            const props = (f.properties ?? {}) as Record<string, unknown>;
            const risk = (props.risk_level as string | undefined) ?? '';
            const key = `${i}-${String(props.point_id ?? '')}-${lat}-${lng}-${String(props.occurrence_local_id ?? '')}`;
            return (
              <CircleMarker
                key={key}
                center={[lat, lng]}
                radius={9}
                pathOptions={{
                  color: '#e2e8f0',
                  weight: 2,
                  fillColor: riskColor(risk),
                  fillOpacity: 0.92,
                }}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                  },
                }}
              >
                <Popup>
                  <div className="max-w-xs space-y-1 text-sm text-slate-900">
                    <div>
                      <strong>Talhão</strong>: {String(props.plot_name ?? '—')}
                    </div>
                    <div>
                      <strong>Data</strong>: {String(props.monitoring_date ?? '—')}
                    </div>
                    <div>
                      <strong>Ponto</strong>: {String(props.point_code ?? props.point_id ?? '—')}
                    </div>
                    <div>
                      <strong>Ocorrência(s)</strong>: {String(props.occurrence_name ?? '—')}
                    </div>
                    <div>
                      <strong>Risco</strong>: {String(props.risk_level ?? '—')}
                    </div>
                    <div>
                      <strong>Recomendação</strong>: {String(props.recommendation ?? '—')}
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}
        </MapProvider>
      )}
    </div>
  );
}
