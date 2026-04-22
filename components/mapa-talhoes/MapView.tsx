'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { colorPairForProperties, strokeForProperties } from './materialColor';

import 'leaflet/dist/leaflet.css';

type Props = {
  data: FeatureCollection;
};

function FitBounds({ geojson }: { geojson: FeatureCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson?.features?.length) return;
    const g = L.geoJSON(geojson as unknown as GeoJsonObject);
    const b = g.getBounds();
    if (b.isValid()) {
      map.fitBounds(b, { padding: [32, 32], maxZoom: 16 });
    }
  }, [geojson, map]);
  return null;
}

function popupProps(p: Record<string, unknown>): string {
  const tal = p.talhao != null ? String(p.talhao) : '—';
  const cul = p.cultura != null ? String(p.cultura) : '—';
  const mat = p.material != null ? String(p.material) : '—';
  const est = p.estande_pl_ha ?? p.plantas_por_ha;
  const plHa = typeof est === 'number' && !Number.isNaN(est) ? est : null;
  const areaH = p.area_ha;
  const area = typeof areaH === 'number' && !Number.isNaN(areaH) ? areaH.toFixed(1).replace('.', ',') : '—';
  const dp = p.data_plantio != null ? String(p.data_plantio) : '—';
  const sa = p.safra != null ? String(p.safra) : '—';
  const tipo = String(p.tipo ?? '');
  const st = p.subtipo != null ? String(p.subtipo) : '';
  const subLine = tipo === 'subarea' && st ? `<br/><b>Subárea</b> (${st})<br/>` : '<br/>';
  const plHaStr =
    plHa != null
      ? plHa.toLocaleString('pt-BR', { maximumFractionDigits: 0, minimumFractionDigits: 0 })
      : '—';
  return `
    <div style="min-width:200px">
      <b>${tal}</b><br/>
      ${subLine}
      ${cul} — ${mat}<br/><br/>
      Estande: ${plHaStr} pl/ha<br/>
      Área: ${area} ha<br/>
      Plantio: ${dp}<br/>
      Safra: ${sa}
    </div>`.replace(/\s*\n\s*/g, ' ');
}

function tooltipText(p: Record<string, unknown>): string {
  const tal = p.talhao != null ? String(p.talhao) : '—';
  const mat = p.material != null ? String(p.material) : '—';
  return `${tal} — ${mat}`;
}

export function MapView({ data }: Props) {
  const dataKey = useMemo(
    () => data.features.map((f) => (f.id != null ? String(f.id) : JSON.stringify(f.geometry))).join('|'),
    [data]
  );

  const center = useMemo(() => {
    if (!data.features[0]) return { lat: -15.78, lng: -47.93 } as L.LatLngExpression;
    const g0 = L.geoJSON(data as unknown as GeoJsonObject);
    const c = g0.getBounds().getCenter();
    return c;
  }, [data]);

  return (
    <MapContainer
      center={center}
      preferCanvas
      zoom={14}
      className="h-full min-h-[360px] w-full rounded-md"
      style={{ zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
      />
      <FitBounds geojson={data} />
      <GeoJSON
        key={dataKey}
        data={data as unknown as GeoJsonObject}
        style={(feat) => {
          const p = (feat as { properties: Record<string, unknown> | null }).properties ?? {};
          const tipo = String(p.tipo ?? 'talhao');
          const c = colorPairForProperties({ material: p.material as string, kml_style_key: p.kml_style_key as string });
          if (tipo === 'subarea') {
            return {
              color: c.stroke,
              weight: 2,
              fillColor: c.stroke,
              fillOpacity: 0.25,
              dashArray: '4,4',
            };
          }
          return {
            color: strokeForProperties({ material: p.material as string, kml_style_key: p.kml_style_key as string }),
            weight: 2.5,
            fillColor: 'transparent',
            fillOpacity: 0,
          };
        }}
        onEachFeature={(feature, layer) => {
          const p = (feature.properties as Record<string, unknown>) || {};
          layer.bindPopup(popupProps(p), { minWidth: 200 });
          layer.bindTooltip(tooltipText(p), {
            sticky: true,
            direction: 'top',
            opacity: 0.95,
            className: 'fs-map-tooltip',
          });
        }}
      />
    </MapContainer>
  );
}
