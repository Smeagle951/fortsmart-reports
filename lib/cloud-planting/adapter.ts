import type { Feature, FeatureCollection, Geometry } from 'geojson';

/** Resposta crua da API (`jsonOk` → `{ data: ... }`). */
export function unwrapWindowsPlantingBody(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const o = body as Record<string, unknown>;
  const data = o.data;
  if (data && typeof data === 'object' && !Array.isArray(data)) return data as Record<string, unknown>;
  return o;
}

export function safeArray<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

export function safeRecord(v: unknown): Record<string, unknown> | null {
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

export type CloudPlantingSummary = {
  total_plantings: number;
  total_stand_evaluations: number;
  total_cv_records: number;
  total_phenology_records: number;
  total_geo_exports: number;
  total_calibration_records: number;
  total_images: number;
  latest_planting_date: string | null;
};

export type CloudPlantingImageRow = {
  id?: string | null;
  local_id?: string | null;
  cloud_url?: string | null;
  local_path?: string | null;
  local_file_path?: string | null;
  cloud_expires_at?: string | null;
  caption?: string | null;
  file_name?: string | null;
  raw_payload?: Record<string, unknown> | null;
};

export type CloudPlantingGeoExportRow = {
  id?: string | null;
  type?: string | null;
  file_name?: string | null;
  geojson?: unknown;
  kml_text?: string | null;
};

export type CloudPlantingRecord = {
  planting: Record<string, unknown> | null;
  stand_evaluations: Record<string, unknown>[];
  cv_records: Record<string, unknown>[];
  calibration_records: Record<string, unknown>[];
  phenology_records: Record<string, unknown>[];
  geo_exports: CloudPlantingGeoExportRow[];
  images: CloudPlantingImageRow[];
};

export type CloudPlantingSubarea = {
  subarea_id: string | null;
  subarea_local_id: string | null;
  subarea_name: string;
  records: CloudPlantingRecord[];
};

export type CloudPlantingPlot = {
  plot_id: string | null;
  plot_local_id: string | null;
  plot_name: string;
  subareas: CloudPlantingSubarea[];
};

export type CloudPlantingNormalized = {
  farm_id: string | null;
  summary: CloudPlantingSummary;
  plots: CloudPlantingPlot[];
};

const emptySummary = (): CloudPlantingSummary => ({
  total_plantings: 0,
  total_stand_evaluations: 0,
  total_cv_records: 0,
  total_phenology_records: 0,
  total_geo_exports: 0,
  total_calibration_records: 0,
  total_images: 0,
  latest_planting_date: null,
});

function num(v: unknown, d = 0): number {
  if (v == null || v === '') return d;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function str(v: unknown, d = ''): string {
  if (v == null) return d;
  const s = String(v).trim();
  return s || d;
}

function normalizeImageRow(r: Record<string, unknown>): CloudPlantingImageRow {
  const raw = safeRecord(r.raw_payload);
  return {
    id: r.id != null ? String(r.id) : null,
    local_id: r.local_id != null ? String(r.local_id) : null,
    cloud_url: r.cloud_url != null ? String(r.cloud_url) : null,
    local_path: r.local_path != null ? String(r.local_path) : null,
    local_file_path: r.local_file_path != null ? String(r.local_file_path) : null,
    cloud_expires_at: r.cloud_expires_at != null ? String(r.cloud_expires_at) : null,
    caption: r.caption != null ? String(r.caption) : null,
    file_name: r.file_name != null ? String(r.file_name) : null,
    raw_payload: raw,
  };
}

function normalizeGeoRow(r: Record<string, unknown>): CloudPlantingGeoExportRow {
  const typeFrom =
    r.type != null && String(r.type).trim() !== ''
      ? String(r.type)
      : r.formato != null && String(r.formato).trim() !== ''
        ? String(r.formato)
        : null;
  return {
    id: r.id != null ? String(r.id) : null,
    type: typeFrom,
    file_name: r.file_name != null ? String(r.file_name) : null,
    geojson: r.geojson,
    kml_text: r.kml_text != null ? String(r.kml_text) : null,
  };
}

function normalizeRecord(raw: unknown): CloudPlantingRecord {
  const o = safeRecord(raw) ?? {};
  const plantingNested = o.planting;
  const planting =
    plantingNested && typeof plantingNested === 'object'
      ? (plantingNested as Record<string, unknown>)
      : null;

  return {
    planting,
    stand_evaluations: safeArray<Record<string, unknown>>(o.stand_evaluations).filter(
      (x) => x && typeof x === 'object',
    ) as Record<string, unknown>[],
    cv_records: safeArray<Record<string, unknown>>(o.cv_records).filter(
      (x) => x && typeof x === 'object',
    ) as Record<string, unknown>[],
    calibration_records: safeArray<Record<string, unknown>>(o.calibration_records).filter(
      (x) => x && typeof x === 'object',
    ) as Record<string, unknown>[],
    phenology_records: safeArray<Record<string, unknown>>(o.phenology_records).filter(
      (x) => x && typeof x === 'object',
    ) as Record<string, unknown>[],
    geo_exports: safeArray<Record<string, unknown>>(o.geo_exports)
      .map((r) => normalizeGeoRow(r as Record<string, unknown>))
      .filter(Boolean),
    images: safeArray<Record<string, unknown>>(o.images)
      .map((r) => normalizeImageRow(r as Record<string, unknown>))
      .filter(Boolean),
  };
}

function normalizeSubarea(raw: unknown): CloudPlantingSubarea {
  const o = safeRecord(raw) ?? {};
  return {
    subarea_id: o.subarea_id != null ? String(o.subarea_id) : null,
    subarea_local_id: o.subarea_local_id != null ? String(o.subarea_local_id) : null,
    subarea_name: str(o.subarea_name, 'Subárea'),
    records: safeArray<unknown>(o.records).map(normalizeRecord),
  };
}

function normalizePlot(raw: unknown): CloudPlantingPlot {
  const o = safeRecord(raw) ?? {};
  return {
    plot_id: o.plot_id != null ? String(o.plot_id) : null,
    plot_local_id: o.plot_local_id != null ? String(o.plot_local_id) : null,
    plot_name: str(o.plot_name, 'Talhão'),
    subareas: safeArray<unknown>(o.subareas).map(normalizeSubarea),
  };
}

/**
 * Normaliza o payload cloud (parcial ou legado) para leitura única na UI.
 * Não lança — listas inválidas viram `[]`.
 */
export function normalizePlantingWindowsPayload(body: unknown): CloudPlantingNormalized {
  const root = unwrapWindowsPlantingBody(body) ?? safeRecord(body);
  if (!root) {
    return { farm_id: null, summary: emptySummary(), plots: [] };
  }

  const sIn = safeRecord(root.summary);
  const summary: CloudPlantingSummary = {
    ...emptySummary(),
    ...(sIn ?? {}),
    total_plantings: num(sIn?.total_plantings, 0),
    total_stand_evaluations: num(sIn?.total_stand_evaluations, 0),
    total_cv_records: num(sIn?.total_cv_records, 0),
    total_phenology_records: num(sIn?.total_phenology_records, 0),
    total_geo_exports: num(sIn?.total_geo_exports, 0),
    total_calibration_records: num(sIn?.total_calibration_records, 0),
    total_images: num(sIn?.total_images, 0),
    latest_planting_date:
      sIn?.latest_planting_date == null || sIn.latest_planting_date === ''
        ? null
        : String(sIn.latest_planting_date),
  };

  const plots = safeArray<unknown>(root.plots).map(normalizePlot);

  return {
    farm_id: root.farm_id != null ? String(root.farm_id) : null,
    summary,
    plots,
  };
}

function isGeometry(g: unknown): g is Geometry {
  if (!g || typeof g !== 'object') return false;
  const t = (g as Geometry).type;
  return (
    t === 'Point' ||
    t === 'LineString' ||
    t === 'Polygon' ||
    t === 'MultiPoint' ||
    t === 'MultiLineString' ||
    t === 'MultiPolygon' ||
    t === 'GeometryCollection'
  );
}

function featureFromGeometry(geom: unknown, props: Record<string, unknown>): Feature | null {
  if (!isGeometry(geom)) return null;
  return { type: 'Feature', geometry: geom, properties: props };
}

function isFeature(value: unknown): value is Feature {
  if (!value || typeof value !== 'object') return false;
  return (value as Feature).type === 'Feature';
}

function isFeatureCollection(value: unknown): value is FeatureCollection {
  if (!value || typeof value !== 'object') return false;
  return (value as FeatureCollection).type === 'FeatureCollection' && Array.isArray((value as FeatureCollection).features);
}

function tryParseJsonString(s: string): unknown {
  const t = s.trim();
  if (!(t.startsWith('{') || t.startsWith('['))) return null;
  try {
    return JSON.parse(t) as unknown;
  } catch {
    return null;
  }
}

/**
 * GeoJSON vindo da API/SQLite pode ser string JSON, Geometry, Feature ou FeatureCollection.
 * Converte para uma lista de Features válidas para o mapa (react-leaflet GeoJSON).
 */
export function expandLooseGeoJsonToFeatures(
  input: unknown,
  baseProps: Record<string, unknown>,
): Feature[] {
  let v: unknown = input;
  if (typeof v === 'string') {
    const parsed = tryParseJsonString(v);
    if (parsed == null) return [];
    v = parsed;
  }
  if (!v || typeof v !== 'object') return [];

  if (isFeatureCollection(v)) {
    const out: Feature[] = [];
    for (const f of v.features) {
      if (!f || typeof f !== 'object') continue;
      const feat = f as Feature;
      const geom = feat.geometry;
      if (!isGeometry(geom)) continue;
      const fp = safeRecord(feat.properties) ?? {};
      out.push({
        type: 'Feature',
        geometry: geom,
        properties: { ...fp, ...baseProps },
      });
    }
    return out;
  }

  if (isFeature(v)) {
    const geom = v.geometry;
    if (!isGeometry(geom)) return [];
    const fp = safeRecord(v.properties) ?? {};
    return [{ type: 'Feature', geometry: geom, properties: { ...fp, ...baseProps } }];
  }

  const single = featureFromGeometry(v, baseProps);
  return single ? [single] : [];
}

/** GeoJSON para mapa: parcela/subárea do plantio + exports; ignora null/ inválido. */
export function selectPlantingGeoFeatureCollection(data: CloudPlantingNormalized): FeatureCollection {
  const features: Feature[] = [];
  for (const plot of data.plots) {
    for (const sub of plot.subareas) {
      for (const rec of sub.records) {
        const p = rec.planting;
        if (p) {
          const pg = p.plot_geojson ?? p.plotGeojson;
          const sg = p.subarea_geojson ?? p.subareaGeojson;
          features.push(
            ...expandLooseGeoJsonToFeatures(pg, {
              layer: 'plot_geojson',
              plot_name: plot.plot_name,
              subarea_name: sub.subarea_name,
            }),
          );
          features.push(
            ...expandLooseGeoJsonToFeatures(sg, {
              layer: 'subarea_geojson',
              plot_name: plot.plot_name,
              subarea_name: sub.subarea_name,
            }),
          );
        }
        for (const g of rec.geo_exports) {
          const gj = g.geojson;
          features.push(
            ...expandLooseGeoJsonToFeatures(gj, {
              layer: 'geo_export',
              file_name: g.file_name ?? '',
              export_type: g.type ?? '',
              plot_name: plot.plot_name,
            }),
          );
        }
      }
    }
  }
  return { type: 'FeatureCollection', features };
}

export function imageDisplayUrl(img: CloudPlantingImageRow): string | null {
  const u = img.cloud_url?.trim();
  if (u) return u;
  const lp = (img.local_file_path ?? img.local_path)?.trim();
  if (lp) {
    if (lp.startsWith('http://') || lp.startsWith('https://') || lp.startsWith('file:')) return lp;
    return null;
  }
  return null;
}

export function imageIsCloudExpired(img: CloudPlantingImageRow): boolean {
  const exp = img.cloud_expires_at;
  if (!exp) return false;
  const t = Date.parse(exp);
  if (Number.isNaN(t)) return false;
  return t < Date.now();
}

export function imageUploadPending(img: CloudPlantingImageRow): boolean {
  const raw = img.raw_payload ?? {};
  const flag =
    raw.upload_pending === true ||
    raw.pending_upload === true ||
    raw.sync_status === 'pending' ||
    raw.upload_status === 'pending';
  if (flag) return true;
  const hasLocal = !!(img.local_path?.trim() || img.local_file_path?.trim());
  const hasCloud = !!img.cloud_url?.trim();
  return hasLocal && !hasCloud;
}
