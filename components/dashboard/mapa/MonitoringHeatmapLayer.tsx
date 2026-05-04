'use client';

import type { Layer } from 'leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

import type { DashboardMonitorEvent } from '@/lib/dashboard-mapa/types';

function weightForSeverity(severity: DashboardMonitorEvent['severity']): number {
  if (severity === 'alto') return 1;
  if (severity === 'medio') return 0.6;
  if (severity === 'baixo') return 0.25;
  return 0.1;
}

type LeafletWithHeat = typeof L & {
  heatLayer?: (
    points: Array<[number, number, number]>,
    options: { radius: number; blur: number; maxZoom: number; minOpacity: number },
  ) => Layer;
};

type Props = {
  events: DashboardMonitorEvent[];
  show: boolean;
};

export function MonitoringHeatmapLayer({ events, show }: Props) {
  const map = useMap();

  useEffect(() => {
    if (!show || events.length === 0) return;
    let layer: Layer | null = null;
    let cancelled = false;

    void (async () => {
      await import('leaflet.heat');
      if (cancelled) return;
      const points = events
        .filter((event) => Number.isFinite(event.lat) && Number.isFinite(event.lng))
        .map((event) => [event.lat, event.lng, weightForSeverity(event.severity)] as [number, number, number]);

      const heatLayer = (L as LeafletWithHeat).heatLayer;
      if (!heatLayer || points.length === 0) return;
      layer = heatLayer(points, {
        radius: 34,
        blur: 24,
        maxZoom: 17,
        minOpacity: 0.28,
      });
      layer.addTo(map);
    })();

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
    };
  }, [events, map, show]);

  return null;
}
