'use client';

import type { FeatureCollection } from 'geojson';

import type { MapEventMarker } from '@/components/mapa-talhoes/MapView';
import type { DashboardMonitorEvent } from '@/lib/dashboard-mapa/types';

import { EventMarkers } from './EventMarkers';
import { MapBackgroundClick } from './MapBackgroundClick';
import { MapProvider } from './MapProvider';
import { MonitoringHeatmapLayer } from './MonitoringHeatmapLayer';
import { TalhaoLayers } from './TalhaoLayers';

type Props = {
  data: FeatureCollection;
  mapClassName?: string;
  onSelectFeature?: (properties: Record<string, unknown> | null) => void;
  eventMarkers?: MapEventMarker[];
  selectedEventMarkerId?: string | null;
  onSelectEventMarker?: (id: string) => void;
  showEventMarkers?: boolean;
  heatmapEvents?: DashboardMonitorEvent[];
  showHeatmap?: boolean;
};

/**
 * Mapa de campo: `MapProvider` + `TalhaoLayers` + `EventMarkers`.
 * Importar com `next/dynamic(..., { ssr: false })` na página ou no orquestrador.
 */
export function FieldMap({
  data,
  mapClassName,
  onSelectFeature,
  eventMarkers = [],
  selectedEventMarkerId = null,
  onSelectEventMarker,
  showEventMarkers = true,
  heatmapEvents = [],
  showHeatmap = false,
}: Props) {
  return (
    <MapProvider fitGeoJson={data} mapClassName={mapClassName}>
      {onSelectFeature ? <MapBackgroundClick onBackgroundClick={() => onSelectFeature(null)} /> : null}
      <TalhaoLayers data={data} onSelectFeature={onSelectFeature} />
      <EventMarkers
        markers={eventMarkers}
        selectedId={selectedEventMarkerId}
        onSelect={onSelectEventMarker}
        show={showEventMarkers}
      />
      <MonitoringHeatmapLayer events={heatmapEvents} show={showHeatmap} />
    </MapProvider>
  );
}
