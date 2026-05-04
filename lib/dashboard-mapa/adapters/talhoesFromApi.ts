import type { Feature, FeatureCollection, GeoJsonObject, Polygon, Position } from 'geojson';

import { isFeatureCollectionGj } from '@/components/mapa-talhoes/geojsonUtils';

/**
 * Converte a resposta de `GET /api/talhoes` (proxy FortSmart) em `FeatureCollection`, quando possível.
 * Suporta: GeoJSON direto, `{ talhoes: [...] }` com anéis `[[lat,lng],...]` ou coordenadas GeoJSON.
 */
export function talhoesFromApi(json: unknown): FeatureCollection | null {
  if (json == null) return null;
  if (isFeatureCollectionGj(json as GeoJsonObject)) return json as FeatureCollection;

  const o = json as Record<string, unknown>;
  if (o.type === 'FeatureCollection' && Array.isArray(o.features) && isFeatureCollectionGj(json as GeoJsonObject)) {
    return json as FeatureCollection;
  }

  const list = (o.talhoes ?? o.data ?? o.items) as unknown;
  if (!Array.isArray(list)) return null;

  const features: Feature[] = [];
  for (let i = 0; i < list.length; i++) {
    const raw = list[i];
    if (!raw || typeof raw !== 'object') continue;
    const t = raw as Record<string, unknown>;
    const id = String(t.id ?? t.talhao_id ?? i);
    const nome = String(t.nome ?? t.nome_talhao ?? t.label ?? `Talhão ${id}`);

    const pol = t.poligono ?? t.poligono_geojson ?? t.polygon ?? t.geometry ?? t.coords ?? t.geojson;
    let geometry: Polygon | null = null;

    if (pol && typeof pol === 'object') {
      const g = pol as Record<string, unknown>;
      if (g.type === 'Polygon' && Array.isArray(g.coordinates)) {
        geometry = pol as Polygon;
      } else if (g.type === 'Feature' && (g.geometry as Polygon | undefined)?.type === 'Polygon') {
        geometry = (g.geometry as Polygon) ?? null;
      }
    }

    if (!geometry && Array.isArray(pol) && pol.length > 0) {
      const ring = pol as [number, number][];
      const first = ring[0];
      /** Heurística BR: anel `[[lat,lng],…]` costuma ter |lat| < |lng|; GeoJSON é [lng,lat]. */
      const looksLatLng =
        first != null && Math.abs(first[0]) < Math.abs(first[1]) && Math.abs(first[0]) <= 35;
      const coords: Position[] = looksLatLng ? ring.map(([lat, lng]) => [lng, lat] as Position) : (ring as Position[]);
      if (coords.length >= 3) geometry = { type: 'Polygon', coordinates: [coords] };
    }

    if (!geometry) continue;

    const areaRaw = t.area_ha ?? t.area ?? t.areaHa ?? t.hectares ?? t.superficie_ha;
    const areaHa = typeof areaRaw === 'number' && !Number.isNaN(areaRaw) ? areaRaw : null;

    features.push({
      type: 'Feature',
      properties: {
        talhao_id: id,
        talhao: nome,
        cultura: t.cultura != null ? String(t.cultura) : '—',
        material:
          t.material != null
            ? String(t.material)
            : t.variedade != null
              ? String(t.variedade)
              : t.hibrido != null
                ? String(t.hibrido)
                : '—',
        area_ha: areaHa,
        safra: t.safra != null ? String(t.safra) : undefined,
        data_plantio: t.data_plantio != null ? String(t.data_plantio) : undefined,
        tipo: 'talhao',
      },
      geometry,
    });
  }

  if (features.length === 0) return null;
  return { type: 'FeatureCollection', features };
}
