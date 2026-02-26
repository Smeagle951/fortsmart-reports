'use client';

import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type Ponto = {
  id?: string;
  latitude: number;
  longitude: number;
  titulo?: string;
  descricao?: string;
  estagio?: string;
  data?: string;
};

interface Props {
  viewBox?: string;
  path?: string;
  polygon?: number[][]; // [[lat, lng], ...] do talhão
  pontos?: Ponto[];
  centro?: [number, number];
  zoom?: number;
}

export default function MapaTalhao({ polygon: polygonProp, pontos = [], centro = [-15.6, -54.3], zoom = 15 }: Props) {
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
      <h2 className="section-title">Mapa do talhão — pontos georreferenciados</h2>
      <div className="mapa-wrap">
        <MapContainer center={mapCenter} zoom={zoom} style={{ height: 360, width: '100%' }} scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {polygonCoords && <Polygon positions={polygonCoords} pathOptions={{ color: '#2e7d32', weight: 3, fillColor: '#e8f5e9', fillOpacity: 0.4 }} />}
          {markers.map((m) => (
            <Marker key={m.meta.id ?? `${m.lat}-${m.lng}`} position={[m.lat, m.lng]}>
              <Popup>
                <div className="mapa-popup">
                  <strong>{m.meta.titulo || 'Ponto'}</strong>
                  {m.meta.estagio && <div className="mapa-popup-row">Estágio: {m.meta.estagio}</div>}
                  {m.meta.descricao && <div className="mapa-popup-desc">{m.meta.descricao}</div>}
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

