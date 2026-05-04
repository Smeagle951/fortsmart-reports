'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Layers, Maximize2, Minus, Plus } from 'lucide-react';
import { MapContainer, ScaleControl, TileLayer, useMap } from 'react-leaflet';

import { tileUrlFromEnv } from '@/lib/dashboard-mapa/constants';

import 'leaflet/dist/leaflet.css';

function FitBoundsToGeoJson({ geojson }: { geojson: FeatureCollection | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geojson?.features?.length) return;
    const g = L.geoJSON(geojson as unknown as GeoJsonObject);
    const b = g.getBounds();
    if (b.isValid()) map.fitBounds(b, { padding: [32, 32], maxZoom: 16 });
  }, [geojson, map]);
  return null;
}

function PremiumMapControls() {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-left" style={{ top: 76, left: 14 }}>
      <div className="leaflet-control flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <button type="button" className="flex h-10 w-10 items-center justify-center hover:bg-slate-50" onClick={() => map.zoomIn()} aria-label="Aproximar">
          <Plus className="h-5 w-5" />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center border-t border-slate-200 hover:bg-slate-50" onClick={() => map.zoomOut()} aria-label="Afastar">
          <Minus className="h-5 w-5" />
        </button>
      </div>
      <div className="leaflet-control mt-3 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
        <button type="button" className="flex h-10 w-10 items-center justify-center hover:bg-slate-50" aria-label="Camadas">
          <Layers className="h-5 w-5" />
        </button>
        <button type="button" className="flex h-10 w-10 items-center justify-center border-t border-slate-200 hover:bg-slate-50" aria-label="Tela cheia">
          <Maximize2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

type Props = {
  children: ReactNode;
  /** Ajusta o viewport aos limites deste GeoJSON quando existir */
  fitGeoJson: FeatureCollection | null;
  mapClassName?: string;
};

export function MapProvider({ children, fitGeoJson, mapClassName }: Props) {
  const tile = useMemo(() => tileUrlFromEnv(), []);

  const center = useMemo(() => {
    if (!fitGeoJson?.features?.length) return { lat: -15.78, lng: -47.93 } as L.LatLngExpression;
    const g0 = L.geoJSON(fitGeoJson as unknown as GeoJsonObject);
    return g0.getBounds().getCenter();
  }, [fitGeoJson]);

  return (
    <MapContainer
      center={center}
      preferCanvas
      zoom={14}
      zoomControl={false}
      className={mapClassName ?? 'h-full min-h-[360px] w-full'}
      style={{ zIndex: 0 }}
    >
      <TileLayer attribution={tile.attribution} url={tile.url} />
      <PremiumMapControls />
      <ScaleControl imperial={false} metric position="bottomleft" />
      {fitGeoJson?.features?.length ? <FitBoundsToGeoJson geojson={fitGeoJson} /> : null}
      {children}
    </MapContainer>
  );
}
