'use client';

import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { tileUrlFromEnv } from '@/lib/dashboard-mapa/constants';
import { createPlotLabelIcon, createVtPointIcon } from '@/lib/technical-visit-report/vtMapMarkers';
import type { TechnicalVisitSeverity } from '@/lib/technical-visit-report/technicalVisitReport.types';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const MAPTILER_KEY = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPTILER_KEY : undefined;
const mapTilerStreetsUrl = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

type Ponto = {
  id?: string;
  latitude: number;
  longitude: number;
  titulo?: string;
  title?: string;
  descricao?: string;
  description?: string;
  type?: string;
  severity?: string;
  severityTone?: TechnicalVisitSeverity;
  estagio?: string;
  data?: string;
  imageUrl?: string;
  recommendation?: string;
};

interface Props {
  viewBox?: string;
  path?: string;
  polygon?: number[][];
  pontos?: Ponto[];
  centro?: [number, number];
  zoom?: number;
  hideSectionTitle?: boolean;
  /** Modo relatório operacional: satélite, ícones por severidade, rótulo do talhão */
  mapVariant?: 'default' | 'operational';
  plotLabel?: { name?: string; area?: string };
}

function polygonCentroid(coords: [number, number][]): [number, number] {
  if (coords.length === 0) return [0, 0];
  const lat = coords.reduce((s, c) => s + c[0], 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c[1], 0) / coords.length;
  return [lat, lng];
}

function FitMapBounds({ bounds }: { bounds: L.LatLngBoundsExpression | null }) {
  const map = useMap();
  useEffect(() => {
    if (!bounds) return;
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 17 });
  }, [map, bounds]);
  return null;
}

export default function MapaTalhao({
  polygon: polygonProp,
  pontos = [],
  centro = [-15.6, -54.3],
  zoom = 15,
  hideSectionTitle,
  mapVariant = 'default',
  plotLabel,
}: Props) {
  const operational = mapVariant === 'operational';
  const tile = operational ? tileUrlFromEnv() : { url: mapTilerStreetsUrl, attribution: MAPTILER_KEY ? '&copy; MapTiler &copy; OpenStreetMap' : '&copy; OpenStreetMap contributors' };

  const markers = pontos
    .filter((p) => Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180)
    .map((p) => ({ lat: p.latitude, lng: p.longitude, meta: p }));

  const polygonCoords = useMemo((): [number, number][] | undefined => {
    if (polygonProp && Array.isArray(polygonProp) && polygonProp.length >= 3) {
      return polygonProp.map((c) => (Array.isArray(c) ? [c[0], c[1]] : [c, c]) as [number, number]);
    }
    if (pontos.length > 2) {
      const valid = pontos.filter((p) => Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180);
      return valid.length >= 3 ? valid.map((p) => [p.latitude, p.longitude] as [number, number]) : undefined;
    }
    return undefined;
  }, [polygonProp, pontos]);

  const mapCenter = useMemo((): [number, number] => {
    if (polygonCoords && polygonCoords.length > 0) return polygonCentroid(polygonCoords);
    if (markers.length > 0) {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
    }
    return centro;
  }, [polygonCoords, markers, centro]);

  const fitBounds = useMemo((): L.LatLngBoundsExpression | null => {
    const all: [number, number][] = [...(polygonCoords ?? []), ...markers.map((m) => [m.lat, m.lng] as [number, number])];
    if (all.length === 0) return null;
    return L.latLngBounds(all);
  }, [polygonCoords, markers]);

  const polygonStyle = operational
    ? { color: '#22C55E', weight: 3, fillColor: '#22C55E', fillOpacity: 0.22 }
    : { color: '#2e7d32', weight: 3, fillColor: '#e8f5e9', fillOpacity: 0.4 };

  const mapHeight = operational ? 420 : 520;

  return (
    <section className={`section mapa-section ${operational ? 'mapa-section--operational' : ''}`}>
      {!hideSectionTitle && <h2 className="section-title">Mapa do talhão — pontos georreferenciados</h2>}
      <div className="mapa-wrap">
        {operational && (
          <div className="vt-map-north" aria-hidden>
            <span>N</span>
          </div>
        )}
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: mapHeight, width: '100%' }} scrollWheelZoom={!operational}>
          <TileLayer attribution={tile.attribution} url={tile.url} maxZoom={19} />
          {fitBounds && operational && <FitMapBounds bounds={fitBounds} />}
          {polygonCoords && <Polygon positions={polygonCoords} pathOptions={polygonStyle} />}
          {operational && polygonCoords && plotLabel?.name && (
            <Marker
              position={polygonCentroid(polygonCoords)}
              icon={createPlotLabelIcon(plotLabel.name, plotLabel.area)}
              interactive={false}
            />
          )}
          {markers.map((m, index) => {
            const title = m.meta.titulo ?? m.meta.title ?? 'Ponto de avaliação';
            const desc = m.meta.descricao ?? m.meta.description;
            const icon = operational
              ? createVtPointIcon(m.meta.severityTone ?? 'unknown', { index, type: m.meta.type })
              : undefined;
            return (
              <Marker key={m.meta.id ?? `${m.lat}-${m.lng}-${index}`} position={[m.lat, m.lng]} icon={icon}>
                <Popup>
                  <div className="mapa-popup vt-map-popup" style={{ minWidth: 220 }}>
                    {m.meta.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.meta.imageUrl} alt={title} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
                    ) : null}
                    <strong>{title}</strong>
                    {m.meta.type && <div className="mapa-popup-row">Tipo: {m.meta.type}</div>}
                    {m.meta.severity && <div className="mapa-popup-row">Severidade: {m.meta.severity}</div>}
                    {m.meta.estagio && <div className="mapa-popup-row">Estágio: {m.meta.estagio}</div>}
                    {desc && <div className="mapa-popup-desc">{desc}</div>}
                    {m.meta.recommendation && (
                      <div className="mapa-popup-desc">
                        <strong>Recomendação:</strong> {m.meta.recommendation}
                      </div>
                    )}
                    <div className="mapa-popup-row">
                      {m.lat.toFixed(6)}, {m.lng.toFixed(6)}
                    </div>
                    {m.meta.data && <div className="mapa-popup-date">{m.meta.data}</div>}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </section>
  );
}
