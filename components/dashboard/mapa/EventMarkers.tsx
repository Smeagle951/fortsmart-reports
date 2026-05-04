'use client';

import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';

import { pinColorForKind } from '@/lib/dashboard-mapa/constants';
import type { MapEventMarker } from '@/components/mapa-talhoes/MapView';

type Props = {
  markers: MapEventMarker[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  show?: boolean;
};

export function EventMarkers({ markers, selectedId = null, onSelect, show = true }: Props) {
  const map = useMap();
  if (!show || markers.length === 0) return null;
  return (
    <>
      {markers.map((m) => {
        const selected = selectedId === m.id;
        const color = pinColorForKind(m.pinKind);
        const icon = L.divIcon({
          className: '',
          iconSize: [selected ? 40 : 34, selected ? 40 : 34],
          iconAnchor: [selected ? 20 : 17, selected ? 20 : 17],
          html: `<span style="
            width:${selected ? 40 : 34}px;height:${selected ? 40 : 34}px;border-radius:9999px;
            display:flex;align-items:center;justify-content:center;background:${color};
            border:2px solid rgba(255,255,255,.86);box-shadow:0 4px 12px rgba(0,0,0,.25);
            color:white;font-size:15px;font-weight:800;${selected ? 'outline:3px solid rgba(255,255,255,.45);' : ''}
          ">✹</span>`,
        });
        return (
        <Marker
          key={m.id}
          position={[m.lat, m.lng]}
          icon={icon}
          eventHandlers={
            onSelect
              ? {
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    map.flyTo([m.lat, m.lng], Math.max(map.getZoom(), 16), { duration: 0.55 });
                    onSelect(m.id);
                  },
                }
              : undefined
          }
        />
      );})}
    </>
  );
}
