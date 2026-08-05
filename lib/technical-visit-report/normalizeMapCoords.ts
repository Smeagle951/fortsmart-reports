/**
 * Normaliza anéis de polígono para Leaflet `[lat, lng]`.
 * Aceita `[lat,lng]`, GeoJSON `[lng,lat]` e objetos `{latitude,longitude}`.
 */

export type LatLngTuple = [number, number];

function toFinite(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** Extrai um par numérico de array `[a,b]` ou objeto com lat/lng. */
export function extractCoordPair(raw: unknown): [number, number] | null {
  if (Array.isArray(raw) && raw.length >= 2) {
    const a = toFinite(raw[0]);
    const b = toFinite(raw[1]);
    if (a == null || b == null) return null;
    return [a, b];
  }
  if (raw != null && typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const lat = toFinite(o.latitude ?? o.lat);
    const lng = toFinite(o.longitude ?? o.lng ?? o.lon);
    if (lat != null && lng != null) return [lat, lng];
  }
  return null;
}

/**
 * Decide se a maioria dos pares está em ordem GeoJSON `[lng, lat]`.
 * Heurística BR/LatAm: `|lng|` costuma ser maior que `|lat|` no campo.
 */
export function ringLooksLikeLngLat(pairs: [number, number][]): boolean {
  if (pairs.length === 0) return false;
  let lngLatVotes = 0;
  let latLngVotes = 0;

  for (const [a, b] of pairs) {
    if (Math.abs(a) > 90 && Math.abs(b) <= 90) {
      lngLatVotes += 2;
      continue;
    }
    if (Math.abs(b) > 90 && Math.abs(a) <= 90) {
      latLngVotes += 2;
      continue;
    }
    if (Math.abs(a) <= 90 && Math.abs(b) <= 180) {
      if (Math.abs(a) > Math.abs(b)) lngLatVotes += 1;
      else if (Math.abs(b) > Math.abs(a)) latLngVotes += 1;
    }
  }

  return lngLatVotes > latLngVotes;
}

/** Converte qualquer anel bruto para Leaflet `[lat, lng]`. */
export function normalizeLeafletRing(raw: unknown): LatLngTuple[] {
  if (!Array.isArray(raw)) return [];

  const pairs: [number, number][] = [];
  for (const item of raw) {
    const pair = extractCoordPair(item);
    if (!pair) continue;
    pairs.push(pair);
  }
  if (pairs.length < 3) return [];

  // Se já veio como objetos {lat,lng}, extractCoordPair já devolveu [lat,lng].
  const fromObjects = pairs.every((_, i) => {
    const item = raw[i];
    return item != null && typeof item === 'object' && !Array.isArray(item);
  });

  const ordered = fromObjects
    ? pairs
    : ringLooksLikeLngLat(pairs)
      ? pairs.map(([lng, lat]) => [lat, lng] as [number, number])
      : pairs;

  const out: LatLngTuple[] = [];
  for (const [lat, lng] of ordered) {
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) continue;
    if (lat === 0 && lng === 0) continue;
    out.push([lat, lng]);
  }
  return out.length >= 3 ? out : [];
}
