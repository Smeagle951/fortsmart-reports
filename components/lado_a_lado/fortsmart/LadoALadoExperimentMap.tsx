'use client';

import { useMemo } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup } from 'react-leaflet';
import type { GeoJSONProps } from 'react-leaflet';
import type { EvaluationPointGeoJson } from '@/lib/ladoALadoPayloadExtras';

type Props = {
  talhaoGeo: unknown | null;
  subareasGeo: unknown | null;
  points: EvaluationPointGeoJson[];
  /** Altura fixa para evitar layout shift */
  height?: number;
};

function centroidFromPoints(pts: EvaluationPointGeoJson[]): [number, number] | null {
  const valid = pts.filter((p) => typeof p.lat === 'number' && typeof p.lon === 'number' && p.lat !== 0 && p.lon !== 0);
  if (valid.length === 0) return null;
  const lat = valid.reduce((s, p) => s + (p.lat as number), 0) / valid.length;
  const lon = valid.reduce((s, p) => s + (p.lon as number), 0) / valid.length;
  return [lat, lon];
}

export default function LadoALadoExperimentMap({
  talhaoGeo,
  subareasGeo,
  points,
  height = 280,
}: Props) {
  const center = useMemo(() => {
    const c = centroidFromPoints(points);
    if (c) return c as [number, number];
    return [-15.5, -54.5] as [number, number];
  }, [points]);

  const hasGeo = Boolean(talhaoGeo || subareasGeo || points.some((p) => p.lat && p.lon));

  if (!hasGeo) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600"
        style={{ minHeight: height }}
      >
        <div className="max-w-md px-4 py-8">
          <p className="font-semibold text-slate-800">Mapa do ensaio</p>
          <p className="mt-2 text-xs leading-relaxed">
            Publique novamente pelo FortSmart: serão incluídos polígono do talhão, subáreas A/B e pontos com GPS quando
            registrados na avaliação.
          </p>
        </div>
      </div>
    );
  }

  const geoJsonPropsTalhao: GeoJSONProps['style'] = () => ({
    color: '#14532d',
    weight: 2,
    fillColor: '#22c55e',
    fillOpacity: 0.12,
  });

  const geoJsonPropsSub: GeoJSONProps['style'] = () => ({
    color: '#2563EB',
    weight: 2.5,
    fillColor: '#43A047',
    fillOpacity: 0.28,
  });

  const mapKey = process.env.NEXT_PUBLIC_MAPTILER_KEY?.trim() || 'TiQt1yLZoL6EmShd1flj';
  const satelliteUrl = `https://api.maptiler.com/maps/satellite/{z}/{x}/{y}.jpg?key=${mapKey}`;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm" style={{ height }}>
      <MapContainer
        center={center}
        zoom={14}
        className="h-full w-full"
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a>'
          url={satelliteUrl}
          maxZoom={20}
        />
        {talhaoGeo ? (
          <GeoJSON key={JSON.stringify(talhaoGeo).slice(0, 80)} data={talhaoGeo as never} style={geoJsonPropsTalhao} />
        ) : null}
        {subareasGeo ? (
          <GeoJSON key={`sub-${JSON.stringify(subareasGeo).slice(0, 60)}`} data={subareasGeo as never} style={geoJsonPropsSub} />
        ) : null}
        {points.map((p, i) => {
          const lat = p.lat;
          const lon = p.lon;
          if (typeof lat !== 'number' || typeof lon !== 'number' || (lat === 0 && lon === 0)) return null;
          return (
            <CircleMarker key={i} center={[lat, lon]} radius={8} pathOptions={{ color: '#1e3a2a', fillColor: '#fbbf24', fillOpacity: 0.9 }}>
              <Popup>
                <div className="max-w-[220px] text-xs leading-snug">
                  <strong>Ponto {p.index ?? i + 1}</strong>
                  {p.daa_label ? (
                    <>
                      {' '}
                      · <span className="text-emerald-800">{p.daa_label}</span>
                    </>
                  ) : null}
                  <br />
                  Lat {lat.toFixed(5)}, Lon {lon.toFixed(5)}
                  {p.captured_at ? (
                    <>
                      <br />
                      <span className="text-slate-600">{p.captured_at}</span>
                    </>
                  ) : null}
                  {p.responsible ? (
                    <>
                      <br />
                      Resp.: {p.responsible}
                    </>
                  ) : null}
                  {p.note ? (
                    <>
                      <br />
                      <span className="mt-1 block italic text-slate-700">{p.note}</span>
                    </>
                  ) : null}
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
