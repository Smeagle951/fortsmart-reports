'use client';

import React from 'react';
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
  path?: string; // optional svg path - not used by leaflet
  pontos?: Ponto[];
  centro?: [number, number];
  zoom?: number;
}

export default function MapaTalhao({ pontos = [], centro = [-15.6, -54.3], zoom = 15 }: Props) {
  // Convert pontos to leaflet latlng and polygon if needed
  const markers = pontos.map((p) => ({ lat: p.latitude, lng: p.longitude, meta: p }));

  // If polygon coordinates provided via pontos polygon sequence, draw polygon
  const polygonCoords = pontos.length > 2 ? pontos.map((p) => [p.latitude, p.longitude] as [number, number]) : undefined;

  return (
    <section className="section mapa-section">
      <h2 className="section-title">Mapa do talhão — pontos georreferenciados</h2>
      <div className="mapa-wrap">
        <MapContainer center={centro} zoom={zoom} style={{ height: 320, width: '100%' }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {polygonCoords && <Polygon positions={polygonCoords} pathOptions={{ color: '#2e7d32', fillColor: '#e8f5e9' }} />}
          {markers.map((m) => (
            <Marker key={m.meta.id ?? `${m.lat}-${m.lng}`} position={[m.lat, m.lng]}>
              <Popup>
                <div style={{ minWidth: 180 }}>
                  <strong>{m.meta.titulo || 'Ponto'}</strong>
                  {m.meta.estagio && <div>Estágio: {m.meta.estagio}</div>}
                  {m.meta.descricao && <div style={{ marginTop: 6 }}>{m.meta.descricao}</div>}
                  {m.meta.data && <div style={{ color: '#6b7280', marginTop: 6 }}>{m.meta.data}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </section>
  );
}

