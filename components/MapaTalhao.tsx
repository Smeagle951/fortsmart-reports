'use client';

import React, { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Corrige ícone do marcador quebrado no Next.js (webpack não resolve imagens do Leaflet)
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

const MAPTILER_KEY = typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_MAPTILER_KEY : undefined;
const mapTilerUrl = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`
  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

type Ponto = {
  id?: string;
  latitude: number;
  longitude: number;
  titulo?: string;
  descricao?: string;
  type?: string;
  severity?: string;
  estagio?: string;
  data?: string;
  imageUrl?: string;
  recommendation?: string;
};

interface Props {
  viewBox?: string;
  path?: string;
  polygon?: number[][]; // [[lat, lng], ...] do talhão
  pontos?: Ponto[];
  centro?: [number, number];
  zoom?: number;
  /** Quando true, não renderiza o título da seção (para uso embutido no relatório) */
  hideSectionTitle?: boolean;
}

export default function MapaTalhao({ polygon: polygonProp, pontos = [], centro = [-15.6, -54.3], zoom = 15, hideSectionTitle }: Props) {
  const markers = pontos.filter((p) => Math.abs(p.latitude) <= 90 && Math.abs(p.longitude) <= 180).map((p) => ({ lat: p.latitude, lng: p.longitude, meta: p }));

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
    if (polygonCoords && polygonCoords.length > 0) {
      const lats = polygonCoords.map((c) => c[0]);
      const lngs = polygonCoords.map((c) => c[1]);
      return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
    }
    if (markers.length > 0) {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
    }
    return centro;
  }, [polygonCoords, markers, centro]);

  return (
    <section className="section mapa-section">
      {!hideSectionTitle && (
        <h2 className="section-title">Mapa do talhão — pontos georreferenciados</h2>
      )}
      <div className="mapa-wrap">
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: 520, width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution={MAPTILER_KEY ? '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' : '&copy; OpenStreetMap contributors'}
            url={mapTilerUrl}
          />
          {polygonCoords && <Polygon positions={polygonCoords} pathOptions={{ color: '#2e7d32', weight: 3, fillColor: '#e8f5e9', fillOpacity: 0.4 }} />}
          {markers.map((m) => (
            <Marker key={m.meta.id ?? `${m.lat}-${m.lng}`} position={[m.lat, m.lng]}>
              <Popup>
                <div className="mapa-popup" style={{ minWidth: 220 }}>
                  {m.meta.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.meta.imageUrl} alt={m.meta.titulo || 'Ponto'} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }} />
                  ) : null}
                  <strong>{m.meta.titulo || 'Ponto'}</strong>
                  {m.meta.type && <div className="mapa-popup-row">Tipo: {m.meta.type}</div>}
                  {m.meta.severity && <div className="mapa-popup-row">Severidade: {m.meta.severity}</div>}
                  {m.meta.estagio && <div className="mapa-popup-row">Estágio: {m.meta.estagio}</div>}
                  {m.meta.descricao && <div className="mapa-popup-desc">{m.meta.descricao}</div>}
                  {m.meta.recommendation && <div className="mapa-popup-desc"><strong>Recomendação:</strong> {m.meta.recommendation}</div>}
                  <div className="mapa-popup-row">{m.lat.toFixed(6)}, {m.lng.toFixed(6)}</div>
                  {m.meta.data && <div className="mapa-popup-date">{m.meta.data}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

