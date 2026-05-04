'use client';

import { useMapEvents } from 'react-leaflet';

type Props = {
  onBackgroundClick: () => void;
};

export function MapBackgroundClick({ onBackgroundClick }: Props) {
  useMapEvents({ click: () => onBackgroundClick() });
  return null;
}
