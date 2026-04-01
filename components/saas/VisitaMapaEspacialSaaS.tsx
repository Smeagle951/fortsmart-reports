'use client';

import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

export type VisitaMapaPonto = {
  index?: number;
  lat?: number;
  lng?: number;
  latitude?: number;
  longitude?: number;
  tipo?: string;
  severidade?: string;
  titulo?: string;
  descricao?: string;
  data?: string;
};

export type VisitaMapaCluster = {
  id: number;
  centroid_lat: number;
  centroid_lng: number;
  raio_m: number;
  n: number;
  tipos?: Record<string, number>;
  severidade_max?: string;
  indices?: number[];
};

export type VisitaEvolucaoQuadro = {
  data: string;
  n_pontos: number;
  indices: number[];
  clusters: VisitaMapaCluster[];
};

export type VisitaMapaEspacialPayload = {
  polygon?: number[][];
  pontos?: VisitaMapaPonto[];
  clusters?: VisitaMapaCluster[];
  evolucao_espacial?: {
    descricao?: string;
    eps_m?: number;
    quadros?: VisitaEvolucaoQuadro[];
  };
};

function normCoord(p: VisitaMapaPonto): { lat: number; lng: number; idx: number } | null {
  const lat = p.lat ?? p.latitude;
  const lng = p.lng ?? p.longitude;
  if (lat == null || lng == null) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const idx = typeof p.index === 'number' ? p.index : -1;
  return { lat, lng, idx };
}

function clusterColor(sev?: string): { stroke: string; fill: string } {
  const s = (sev ?? '').toLowerCase();
  if (s.includes('crit')) return { stroke: '#b71c1c', fill: 'rgba(183, 28, 28, 0.18)' };
  if (s.includes('alt')) return { stroke: '#e65100', fill: 'rgba(230, 81, 0, 0.16)' };
  if (s.includes('med')) return { stroke: '#f9a825', fill: 'rgba(249, 168, 37, 0.14)' };
  return { stroke: '#1565c0', fill: 'rgba(21, 101, 192, 0.12)' };
}

export default function VisitaMapaEspacialSaaS({ mapa }: { mapa: VisitaMapaEspacialPayload }) {
  const pontosRaw = mapa.pontos ?? [];
  const polygonProp = mapa.polygon;
  const quadros = mapa.evolucao_espacial?.quadros ?? [];
  const descEvolucao = mapa.evolucao_espacial?.descricao;
  const epsM = mapa.evolucao_espacial?.eps_m;

  const qLen = quadros.length;
  const [quadroIx, setQuadroIx] = useState(() => (qLen > 1 ? qLen - 1 : 0));

  const allNormalized = useMemo(() => {
    const out: Array<VisitaMapaPonto & { _lat: number; _lng: number; _idx: number }> = [];
    pontosRaw.forEach((p, i) => {
      const c = normCoord(p);
      if (!c) return;
      out.push({
        ...p,
        _lat: c.lat,
        _lng: c.lng,
        _idx: c.idx >= 0 ? c.idx : i + 1,
      });
    });
    return out;
  }, [pontosRaw]);

  const useTimeline = quadros.length > 1;
  const activeQuadro = useTimeline ? quadros[Math.min(quadroIx, quadros.length - 1)] : null;

  const activeIndices = useMemo(() => {
    if (useTimeline && activeQuadro?.indices?.length) {
      return new Set(activeQuadro.indices.map((n) => Number(n)));
    }
    return new Set(allNormalized.map((p) => p._idx));
  }, [useTimeline, activeQuadro, allNormalized]);

  const visiblePontos = useMemo(
    () => allNormalized.filter((p) => activeIndices.has(p._idx)),
    [allNormalized, activeIndices],
  );

  const activeClusters = useMemo(() => {
    if (useTimeline && activeQuadro?.clusters?.length) {
      return activeQuadro.clusters;
    }
    return mapa.clusters ?? [];
  }, [useTimeline, activeQuadro, mapa.clusters]);

  const polygonCoords = useMemo((): [number, number][] | undefined => {
    if (polygonProp && Array.isArray(polygonProp) && polygonProp.length >= 3) {
      return polygonProp.map((c) => (Array.isArray(c) ? [c[0], c[1]] : [c, c]) as [number, number]);
    }
    return undefined;
  }, [polygonProp]);

  const mapCenter = useMemo((): [number, number] => {
    if (polygonCoords && polygonCoords.length > 0) {
      const lats = polygonCoords.map((c) => c[0]);
      const lngs = polygonCoords.map((c) => c[1]);
      return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
    }
    if (visiblePontos.length > 0) {
      const lats = visiblePontos.map((p) => p._lat);
      const lngs = visiblePontos.map((p) => p._lng);
      return [(Math.min(...lats) + Math.max(...lats)) / 2, (Math.min(...lngs) + Math.max(...lngs)) / 2];
    }
    return [-15.6, -54.3];
  }, [polygonCoords, visiblePontos]);

  const hasPoly = Boolean(polygonCoords && polygonCoords.length >= 3);
  if (allNormalized.length === 0 && !hasPoly) {
    return null;
  }

  return (
    <section className="saas-section print:break-inside-avoid">
      <div className="mx-auto max-w-7xl">
        <h2 className="saas-section-title">Mapa espacial, clusters e evolução</h2>
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          {useTimeline && (
            <div className="px-4 pt-4 pb-2 border-b border-slate-100 bg-slate-50/80">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 shrink-0">
                  Time-lapse (cumulativo até a data)
                </label>
                <input
                  type="range"
                  min={0}
                  max={quadros.length - 1}
                  value={Math.min(quadroIx, quadros.length - 1)}
                  onChange={(e) => setQuadroIx(Number(e.target.value))}
                  className="flex-1 accent-emerald-700 h-2"
                />
                <span className="text-sm font-medium text-slate-800 tabular-nums shrink-0 min-w-28 text-right">
                  {activeQuadro?.data ?? '—'}
                </span>
              </div>
              {descEvolucao && <p className="text-xs text-slate-500 mt-2 leading-relaxed">{descEvolucao}</p>}
              {epsM != null && (
                <p className="text-xs text-slate-400 mt-1">
                  Agrupamento aproximado: ≤ {epsM} m entre pontos vizinhos (componente conectado).
                </p>
              )}
            </div>
          )}
          {!useTimeline && descEvolucao && quadros.length === 0 && (
            <p className="text-xs text-slate-500 px-4 pt-3">{descEvolucao}</p>
          )}
          {!useTimeline && epsM != null && (mapa.clusters?.length ?? 0) > 0 && (
            <p className="text-xs text-slate-400 px-4 pt-1">
              Círculos: focos geográficos (≤ {epsM} m). Clique nos marcadores para detalhes.
            </p>
          )}

          <div className="mapa-wrap" style={{ minHeight: 380 }}>
            <MapContainer center={mapCenter} zoom={15} style={{ height: 380, width: '100%' }} scrollWheelZoom>
              <TileLayer
                attribution={
                  MAPTILER_KEY
                    ? '&copy; MapTiler &copy; OpenStreetMap'
                    : '&copy; OpenStreetMap contributors'
                }
                url={mapTilerUrl}
              />
              {polygonCoords && (
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{ color: '#2e7d32', weight: 3, fillColor: '#e8f5e9', fillOpacity: 0.35 }}
                />
              )}
              {activeClusters.map((cl) => {
                const { stroke, fill } = clusterColor(cl.severidade_max);
                const r = Math.max(12, cl.raio_m || 15);
                return (
                  <Circle
                    key={`cl-${cl.id}-${useTimeline ? activeQuadro?.data : 'all'}`}
                    center={[cl.centroid_lat, cl.centroid_lng]}
                    radius={r}
                    pathOptions={{ color: stroke, fillColor: fill, weight: 2, fillOpacity: 0.35 }}
                  />
                );
              })}
              {visiblePontos.map((m) => (
                <Marker key={`m-${m._idx}-${m._lat}-${m._lng}`} position={[m._lat, m._lng]}>
                  <Popup>
                    <div className="mapa-popup text-sm">
                      <strong>{m.titulo || m.tipo || 'Ponto'}</strong>
                      {m.severidade && <div className="text-slate-600">Severidade: {m.severidade}</div>}
                      {m.descricao && <div className="text-slate-600 mt-1">{m.descricao}</div>}
                      {m.data && <div className="text-xs text-slate-400 mt-1">{m.data}</div>}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {(activeClusters.length > 0 || useTimeline) && (
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Clusters ativos</p>
              <ul className="text-sm text-slate-700 space-y-1.5 max-h-36 overflow-y-auto">
                {activeClusters.map((c) => (
                  <li key={`leg-${c.id}`} className="flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className="font-medium text-slate-800">#{c.id}</span>
                    <span>
                      {c.n} ponto(s)
                      {c.severidade_max ? ` · máx. ${c.severidade_max}` : ''}
                    </span>
                    {c.tipos && (
                      <span className="text-slate-500">
                        (
                        {Object.entries(c.tipos)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(', ')}
                        )
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {useTimeline && activeQuadro && (
                <p className="text-xs text-slate-500 mt-2">
                  Quadro: {activeQuadro.n_pontos} ponto(s) visíveis (acumulado até {activeQuadro.data}).
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
