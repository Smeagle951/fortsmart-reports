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

function int(v: unknown): string | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString('pt-BR', { maximumFractionDigits: 0 }) : null;
}

function areaText(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? `${n.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} ha` : '—';
}

function labelHtml(p: Record<string, unknown>): string {
  const tipo = String(p.tipo ?? 'talhao');
  const tal = p.talhao != null ? String(p.talhao) : 'Talhão';
  const area = areaText(p.area_ha);
  const mat = p.material != null ? String(p.material) : '';
  const cultura = p.cultura != null ? String(p.cultura) : '';
  const plantio = p.data_plantio != null ? String(p.data_plantio) : '';
  const dap = int(p.dap);
  const estande = int(p.estande_pl_ha ?? p.plantas_por_ha ?? p.populacao_estande);
  const sub = p.subtipo != null ? String(p.subtipo) : '';
  const subName = sub.replace(/\((.*?)\)/g, '').trim() || tal;
  const subKind = sub.match(/\((.*?)\)/)?.[1];

  const shadow = 'text-shadow:0 2px 8px rgba(0,0,0,.85);';
  if (tipo === 'subarea') {
    return `<div style="${shadow} color:white;text-align:center;font-weight:700;line-height:1.18;font-size:13px;min-width:110px">
      <div>${subName}</div>
      ${subKind ? `<div style="font-size:11px">(${subKind})</div>` : ''}
      <div>${area}</div>
    </div>`;
  }

  return `<div style="${shadow} color:white;text-align:center;font-weight:700;line-height:1.22;font-size:14px;min-width:140px">
    <div style="font-size:16px">${tal}</div>
    <div>${area}</div>
    ${cultura || mat ? `<div style="font-size:12px">${cultura}${mat ? ` ${mat}` : ''}</div>` : ''}
    ${plantio ? `<div style="font-size:12px">Plantio: ${plantio}</div>` : ''}
    ${dap ? `<div style="font-size:12px">DAP: ${dap} dias</div>` : ''}
    ${estande ? `<div style="font-size:12px">Estande: ${estande} pl/ha</div>` : ''}
  </div>`;
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
            color: COLORS.talhaoBorder,
            weight: 2,
            fillColor: c.stroke,
            fillOpacity: 0.34,
            dashArray: '8,8',
          };
        }
        const experimental = isExperimentalProps(p);
        return {
          color: COLORS.talhaoBorder,
          weight: 2.5,
          fillColor: experimental ? COLORS.talhaoExperimental : COLORS.talhaoNormal,
          fillOpacity: experimental ? 0.58 : 0.42,
        };
      }}
      onEachFeature={(feature, layer) => {
        const p = (feature.properties as Record<string, unknown>) || {};
        layer.bindPopup(popupProps(p), { minWidth: 200 });
        layer.bindTooltip(labelHtml(p), {
          permanent: true,
          direction: 'center',
          interactive: false,
          opacity: 0.95,
          className: 'fs-field-label',
        });
        layer.on('mouseover', () => {
          const path = layer as L.Path;
          path.setStyle?.({ fillOpacity: String(p.tipo ?? '') === 'subarea' ? 0.46 : 0.56, weight: 3 });
        });
        layer.on('mouseout', () => {
          const path = layer as L.Path;
          const tipo = String(p.tipo ?? 'talhao');
          path.setStyle?.({ fillOpacity: tipo === 'subarea' ? 0.34 : isExperimentalProps(p) ? 0.58 : 0.42, weight: tipo === 'subarea' ? 2 : 2.5 });
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
