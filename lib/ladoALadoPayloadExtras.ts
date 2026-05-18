import type { SideBySideReportData } from '@/components/SideBySideReportContent';

/** Campos extras gravados pelo app na publicação (geo, timeline, etc.). */
export function payloadRoot(data: SideBySideReportData): Record<string, unknown> {
  return data as unknown as Record<string, unknown>;
}

export type EvaluationPointGeoJson = {
  index?: number;
  lat?: number;
  lon?: number;
  note?: string;
  status?: string;
  photos_a?: string[];
  photos_b?: string[];
  /** Responsável técnico no ponto (campo FortSmart). */
  responsible?: string;
  captured_at?: string;
  daa_label?: string;
};

export function getEvaluationPointsGeo(data: SideBySideReportData): EvaluationPointGeoJson[] {
  const raw = payloadRoot(data).evaluation_points_geo;
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is EvaluationPointGeoJson => x != null && typeof x === 'object');
}

export function getTimelineEvents(data: SideBySideReportData): Array<{ date?: string; description?: string }> {
  const raw = payloadRoot(data).timeline_events;
  if (!Array.isArray(raw)) return [];
  return raw.map((e) => {
    if (!e || typeof e !== 'object') return {};
    const m = e as Record<string, unknown>;
    return {
      date: typeof m.date === 'string' ? m.date : undefined,
      description: typeof m.description === 'string' ? m.description : undefined,
    };
  });
}

/** GeoJSON string ou objeto para talhão / mapa. */
export function getTalhaoPolygonFeatureCollection(data: SideBySideReportData): unknown | null {
  const root = payloadRoot(data);
  const mapa = root.mapa as Record<string, unknown> | undefined;
  const fromMapa = mapa?.talhao;
  if (typeof fromMapa === 'string' && fromMapa.trim()) return tryParseGeo(fromMapa);
  const tg = root.talhao_geo as Record<string, unknown> | undefined;
  const poly = tg?.poligono_geojson ?? tg?.poligono_geo_json;
  if (typeof poly === 'string' && poly.trim()) return tryParseGeo(poly);
  const fp = root.field_polygon_json;
  if (typeof fp === 'string' && fp.trim()) return tryParseGeo(fp);
  return null;
}

export function getSubareasGeo(data: SideBySideReportData): unknown | null {
  const root = payloadRoot(data);
  const mapa = root.mapa as Record<string, unknown> | undefined;
  const sub = mapa?.subareas ?? root.subareas_polygons;
  if (typeof sub === 'string' && sub.trim()) return tryParseGeo(sub);
  if (sub && typeof sub === 'object') return sub;
  return null;
}

function tryParseGeo(s: string): unknown | null {
  try {
    return JSON.parse(s) as unknown;
  } catch {
    return null;
  }
}
