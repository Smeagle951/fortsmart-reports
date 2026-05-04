'use client';

import type { FeatureCollection, GeoJsonObject } from 'geojson';
import L from 'leaflet';
import { useEffect, useMemo, type ReactNode } from 'react';
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
      className={mapClassName ?? 'h-full min-h-[360px] w-full'}
      style={{ zIndex: 0 }}
    >
      <TileLayer attribution={tile.attribution} url={tile.url} />
      <ScaleControl imperial={false} metric position="bottomleft" />
      {fitGeoJson?.features?.length ? <FitBoundsToGeoJson geojson={fitGeoJson} /> : null}
      {children}
    </MapContainer>
  );
}
