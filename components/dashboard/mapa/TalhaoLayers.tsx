'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { useMemo } from 'react';
import { GeoJSON } from 'react-leaflet';

import { COLORS } from '@/lib/dashboard-mapa/constants';
import { colorPairForProperties } from '@/components/mapa-talhoes/materialColor';

function isExperimentalProps(p: Record<string, unknown>): boolean {
  const mat = String(p.material ?? '').toLowerCase();
  const sub = String(p.subtipo ?? '').toLowerCase();
  return mat.includes('experimento') || sub.includes('experimento') || mat.includes('ensaio');
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

type Props = {
  data: FeatureCollection;
  onSelectFeature?: (properties: Record<string, unknown> | null) => void;
};

export function TalhaoLayers({ data, onSelectFeature }: Props) {
  const dataKey = useMemo(
    () => data.features.map((f) => (f.id != null ? String(f.id) : JSON.stringify(f.geometry))).join('|'),
    [data],
  );

  return (
    <GeoJSON
      key={dataKey}
      data={data as unknown as GeoJsonObject}
      style={(feat) => {
        const p = (feat as { properties: Record<string, unknown> | null }).properties ?? {};
        const tipo = String(p.tipo ?? 'talhao');
        if (tipo === 'subarea') {
          const c = colorPairForProperties({ material: p.material as string, kml_style_key: p.kml_style_key as string });
          return {
            color: COLORS.strokeMap,
            weight: 2,
            fillColor: c.stroke,
            fillOpacity: 0.28,
            dashArray: '6,4',
          };
        }
        const experimental = isExperimentalProps(p);
        return {
          color: COLORS.strokeMap,
          weight: 2.5,
          fillColor: experimental ? COLORS.experimental : COLORS.talhao,
          fillOpacity: experimental ? 0.42 : 0.38,
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
        if (onSelectFeature) {
          layer.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            onSelectFeature(p);
          });
        }
      }}
    />
  );
}
