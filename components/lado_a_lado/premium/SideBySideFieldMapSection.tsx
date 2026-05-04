'use client';

import { useMemo } from 'react';
import { MapContainer, Marker, Polygon, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

type LatLng = [number, number];
type MapPoint = { label: string; coord: LatLng; status?: string; side?: string };
type MapPolygon = { label: string; coords: LatLng[]; kind: 'field' | 'A' | 'B' | 'subarea' };

const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

function asRecord(v: unknown): Record<string, unknown> | null {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}

function parseNum(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.trim().replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function maybeJson(v: unknown): unknown {
  if (typeof v !== 'string') return v;
  const t = v.trim();
  if (!t.startsWith('{') && !t.startsWith('[')) return v;
  try {
    return JSON.parse(t);
  } catch {
    return v;
  }
}

function latLngFromPair(pair: unknown, geoJsonOrder = false): LatLng | null {
  if (!Array.isArray(pair) || pair.length < 2) return null;
  const a = parseNum(pair[0]);
  const b = parseNum(pair[1]);
  if (a == null || b == null) return null;
  const lat = geoJsonOrder ? b : a;
  const lng = geoJsonOrder ? a : b;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

function coordsFromUnknown(input: unknown, geoJsonOrder = false): LatLng[] {
  const v = maybeJson(input);
  const rec = asRecord(v);
  if (rec?.type === 'Feature') return coordsFromUnknown(asRecord(rec.geometry), true);
  if (rec?.type === 'FeatureCollection') {
    const features = Array.isArray(rec.features) ? rec.features : [];
    return features.flatMap((f) => coordsFromUnknown(f, true));
  }
  if (rec?.type === 'Polygon' && Array.isArray(rec.coordinates)) {
    return coordsFromUnknown(rec.coordinates[0], true);
  }
  if (rec?.type === 'MultiPolygon' && Array.isArray(rec.coordinates)) {
    return coordsFromUnknown(rec.coordinates[0]?.[0], true);
  }
  if (rec) {
    for (const key of ['polygon', 'poligono', 'coordinates', 'coords', 'vertices', 'points', 'pontos']) {
      const coords = coordsFromUnknown(rec[key], key === 'coordinates');
      if (coords.length >= 3) return coords;
    }
  }
  if (!Array.isArray(v)) return [];
  if (v.length > 0 && Array.isArray(v[0]) && typeof v[0][0] === 'number') {
    return v.map((p) => latLngFromPair(p, geoJsonOrder)).filter((p): p is LatLng => p != null);
  }
  return v.flatMap((x) => coordsFromUnknown(x, geoJsonOrder));
}

function pointCoord(v: unknown): LatLng | null {
  const rec = asRecord(v);
  if (!rec) return null;
  const direct = latLngFromPair(rec.coordinates ?? rec.coord ?? rec.gps);
  if (direct) return direct;
  const lat = parseNum(rec.lat ?? rec.latitude);
  const lng = parseNum(rec.lng ?? rec.lon ?? rec.long ?? rec.longitude);
  if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return [lat, lng];
}

function labelFrom(v: unknown, fallback: string): string {
  const rec = asRecord(v);
  if (!rec) return fallback;
  for (const key of ['name', 'nome', 'label', 'titulo', 'identificacao', 'point_id']) {
    const value = rec[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return fallback;
}

function buildMapData(data: SideBySideReportData): { polygons: MapPolygon[]; points: MapPoint[] } {
  const raw = data as unknown as Record<string, unknown>;
  const fieldMap = asRecord(raw.field_map ?? raw.fieldMap) ?? {};
  const polygons: MapPolygon[] = [];
  const points: MapPoint[] = [];

  for (const source of [
    raw.field_polygon_json,
    raw.fieldPolygonJson,
    fieldMap.field_polygon_json,
    fieldMap.fieldPolygonJson,
    fieldMap.polygon,
    fieldMap.talhao,
    raw.talhao,
    raw.mapa,
  ]) {
    const coords = coordsFromUnknown(source);
    if (coords.length >= 3) {
      polygons.push({ label: 'Limite do talhão', coords, kind: 'field' });
      break;
    }
  }

  const subareasRaw = raw.subareas_polygons ?? raw.subareasPolygons ?? fieldMap.subareas_polygons ?? fieldMap.subareasPolygons ?? fieldMap.subareas;
  const subareas = Array.isArray(subareasRaw)
    ? subareasRaw
    : asRecord(subareasRaw)
      ? Object.entries(subareasRaw as Record<string, unknown>).map(([key, value]) => ({ key, value }))
      : [];
  subareas.forEach((item, idx) => {
    const rec = asRecord(item);
    const payload = rec?.value ?? item;
    const coords = coordsFromUnknown(payload);
    if (coords.length < 3) return;
    const sideRaw = String(rec?.side ?? rec?.lado ?? rec?.key ?? rec?.tratamento ?? '').toUpperCase();
    const kind = sideRaw.includes('A') ? 'A' : sideRaw.includes('B') ? 'B' : 'subarea';
    polygons.push({
      label: labelFrom(rec ?? payload, kind === 'subarea' ? `Subárea ${idx + 1}` : `Subárea ${kind}`),
      coords,
      kind,
    });
  });

  const pushPoint = (item: unknown, idx: number, side?: string) => {
    const coord = pointCoord(item);
    if (!coord) return;
    const rec = asRecord(item);
    points.push({
      label: labelFrom(item, `Ponto ${idx + 1}`),
      coord,
      status: typeof rec?.status === 'string' ? rec.status : undefined,
      side,
    });
  };

  (Array.isArray(data.points) ? data.points : []).forEach((p, idx) => pushPoint(p, idx));
  const fcm = asRecord(data.field_collection_modules);
  (Array.isArray(fcm?.points) ? fcm.points : []).forEach((p, idx) => pushPoint(p, idx));
  const mapaPontos = asRecord(raw.mapa)?.pontos ?? asRecord(raw.mapa)?.marcadores ?? fieldMap.points ?? fieldMap.pontos;
  (Array.isArray(mapaPontos) ? mapaPontos : []).forEach((p, idx) => pushPoint(p, idx));

  return { polygons, points };
}

export default function SideBySideFieldMapSection({ data }: { data: SideBySideReportData }) {
  const mapData = useMemo(() => buildMapData(data), [data]);
  const allCoords = [...mapData.polygons.flatMap((p) => p.coords), ...mapData.points.map((p) => p.coord)];
  if (allCoords.length === 0) return null;

  const center: LatLng = [
    allCoords.reduce((sum, p) => sum + p[0], 0) / allCoords.length,
    allCoords.reduce((sum, p) => sum + p[1], 0) / allCoords.length,
  ];

  return (
    <section id="l2-mapa" className="scroll-mt-36 border-b border-slate-200/80 pb-6 pt-6 print:break-inside-avoid">
      <header className="mb-4">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-emerald-900/90">Georreferenciamento</p>
        <h2 className="fs-l2-section-title mt-1 !text-lg sm:!text-xl">Mapa do talhão, subáreas e pontos</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">
          Limite do talhão, divisões de tratamento e pontos de avaliação publicados pelo módulo lado a lado.
        </p>
      </header>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="h-[360px] w-full">
          <MapContainer center={center} zoom={16} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
            <TileLayer
              attribution="Tiles &copy; Esri"
              url={SATELLITE_URL}
            />
            {mapData.polygons.map((poly, idx) => (
              <Polygon
                key={`${poly.label}-${idx}`}
                positions={poly.coords}
                pathOptions={{
                  color: poly.kind === 'A' ? '#2563eb' : poly.kind === 'B' ? '#059669' : '#f59e0b',
                  weight: poly.kind === 'field' ? 3 : 2,
                  fillColor: poly.kind === 'A' ? '#2563eb' : poly.kind === 'B' ? '#059669' : '#f59e0b',
                  fillOpacity: poly.kind === 'field' ? 0.08 : 0.22,
                }}
              >
                <Popup>{poly.label}</Popup>
              </Polygon>
            ))}
            {mapData.points.map((pt, idx) => (
              <Marker key={`${pt.label}-${idx}`} position={pt.coord}>
                <Popup>
                  <strong>{pt.label}</strong>
                  <div>{pt.coord[0].toFixed(6)}, {pt.coord[1].toFixed(6)}</div>
                  {pt.status ? <div>Status: {pt.status}</div> : null}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-700">
          <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">Talhão</span>
          <span className="rounded bg-blue-100 px-2 py-1 text-blue-900">Subárea A</span>
          <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-900">Subárea B</span>
          <span className="rounded bg-white px-2 py-1 text-slate-700 ring-1 ring-slate-200">{mapData.points.length} ponto(s)</span>
        </div>
      </div>
    </section>
  );
}
