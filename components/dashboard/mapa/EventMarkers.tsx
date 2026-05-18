'use client';

import L from 'leaflet';
import { CircleMarker } from 'react-leaflet';

import { pinColorForKind } from '@/lib/dashboard-mapa/constants';
import type { MapEventMarker } from '@/components/mapa-talhoes/MapView';

type Props = {
  markers: MapEventMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  show?: boolean;
};

export function EventMarkers({ markers, selectedId = null, onSelect, show = true }: Props) {
  if (!show || markers.length === 0) return null;
  return (
    <>
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.lat, m.lng]}
          radius={selectedId === m.id ? 11 : 8}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            fillColor: pinColorForKind(m.pinKind),
            fillOpacity: 0.95,
          }}
          eventHandlers={
            onSelect
              ? {
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    onSelect(m.id);
                  },
                }
              : undefined
          }
        />
      ))}
    </>
  );
}
