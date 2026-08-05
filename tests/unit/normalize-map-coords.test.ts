import { describe, expect, it } from 'vitest';
import {
  normalizeLeafletRing,
  ringLooksLikeLngLat,
} from '@/lib/technical-visit-report/normalizeMapCoords';

describe('normalizeLeafletRing', () => {
  it('mantém anel [lat, lng] típico do Brasil (Flutter)', () => {
    const ring = [
      [-19.457, -48.901],
      [-19.46, -48.9],
      [-19.455, -48.905],
      [-19.457, -48.901],
    ];
    expect(ringLooksLikeLngLat(ring)).toBe(false);
    const out = normalizeLeafletRing(ring);
    expect(out[0]).toEqual([-19.457, -48.901]);
  });

  it('converte GeoJSON [lng, lat] para Leaflet [lat, lng]', () => {
    const ring = [
      [-48.901, -19.457],
      [-48.9, -19.46],
      [-48.905, -19.455],
      [-48.901, -19.457],
    ];
    expect(ringLooksLikeLngLat(ring)).toBe(true);
    const out = normalizeLeafletRing(ring);
    expect(out[0]?.[0]).toBeCloseTo(-19.457, 5);
    expect(out[0]?.[1]).toBeCloseTo(-48.901, 5);
  });

  it('aceita objetos {latitude, longitude}', () => {
    const out = normalizeLeafletRing([
      { latitude: -19.1, longitude: -48.2 },
      { latitude: -19.2, longitude: -48.1 },
      { latitude: -19.15, longitude: -48.25 },
    ]);
    expect(out).toHaveLength(3);
    expect(out[0]).toEqual([-19.1, -48.2]);
  });
});
