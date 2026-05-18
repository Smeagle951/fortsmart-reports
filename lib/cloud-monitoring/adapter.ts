import type { Feature, FeatureCollection, Point } from 'geojson';

import { expandLooseGeoJsonToFeatures } from '@/lib/cloud-planting/adapter';
import {
  getMonitoringImageDisplayHint,
  type MonitoringWindowsImage,
} from '@/lib/monitoring-cloud-image-display';

import type {
  CloudMonitoringDiagnostics,
  CloudMonitoringImage,
  CloudMonitoringNormalized,
  CloudMonitoringOccurrence,
  CloudMonitoringPlot,
  CloudMonitoringPoint,
  CloudMonitoringReport,
  CloudMonitoringSummary,
  CloudMonitoringTimelineGroup,
} from './types';

export function unwrapMonitoringWindowsBody(body: unknown): Record<string, unknown> | null {
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

function str(v: unknown, d = ''): string {
  if (v == null) return d;
  const s = String(v).trim();
  return s || d;
}

function num(v: unknown, d = 0): number {
  if (v == null || v === '') return d;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

/** latitude/longitude vindos como string (vírgula decimal) → number | null */
export function coordNum(v: unknown): number | null {
  if (v == null || v === '') return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const s = String(v).trim().replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

type LatLng = { lat: number; lng: number };

const COORD_EPS = 1e-5;

function nearSameCoord(a: number, b: number): boolean {
  return Math.abs(a - b) < COORD_EPS;
}

function coordsFromGeoJsonPointLike(obj: unknown): LatLng | null {
  const o = safeRecord(obj);
  if (!o || o.type !== 'Point') return null;
  const c = o.coordinates;
  if (!Array.isArray(c) || c.length < 2) return null;
  const lng = coordNum(c[0]);
  const lat = coordNum(c[1]);
  if (lat == null || lng == null) return null;
  return { lat, lng };
}

/**
 * Extrai par lat/lng de registos heterogéneos (mobile, API, Postgres JSON).
 */
export function coordsPairFromRecord(r: Record<string, unknown>): LatLng | null {
  const lat =
    coordNum(r.latitude) ??
    coordNum(r.lat) ??
    coordNum(r.Latitude) ??
    coordNum(r.Lat);
  const lng =
    coordNum(r.longitude) ??
    coordNum(r.lng) ??
    coordNum(r.lon) ??
    coordNum(r.Longitude) ??
    coordNum(r.Lng);
  if (lat != null && lng != null) return { lat, lng };

  const fromLoc = coordsFromGeoJsonPointLike(r.location);
  if (fromLoc) return fromLoc;
  const fromGeom = coordsFromGeoJsonPointLike(r.geometry);
  if (fromGeom) return fromGeom;

  const gps = safeRecord(r.gps);
  if (gps) {
    const la = coordNum(gps.latitude) ?? coordNum(gps.lat);
    const ln = coordNum(gps.longitude) ?? coordNum(gps.lng) ?? coordNum(gps.lon);
    if (la != null && ln != null) return { lat: la, lng: ln };
  }
  return null;
}

function nonEmptyObject(value: unknown): boolean {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value as object).length > 0;
}

function normalizeImage(r: Record<string, unknown>): CloudMonitoringImage {
  return {
    image_id: r.image_id != null ? String(r.image_id) : null,
    occurrence_id: r.occurrence_id != null ? String(r.occurrence_id) : null,
    monitoring_point_id: r.monitoring_point_id != null ? String(r.monitoring_point_id) : null,
    local_id: r.local_id != null ? String(r.local_id) : null,
    file_name: r.file_name != null ? String(r.file_name) : null,
    local_path: r.local_path != null ? String(r.local_path) : null,
    cloud_url: r.cloud_url != null ? String(r.cloud_url) : null,
    cloud_storage_key: r.cloud_storage_key != null ? String(r.cloud_storage_key) : null,
    cloud_expires_at: r.cloud_expires_at != null ? String(r.cloud_expires_at) : null,
    local_file_path: r.local_file_path != null ? String(r.local_file_path) : null,
    caption: r.caption != null ? String(r.caption) : null,
    taken_at: r.taken_at != null ? String(r.taken_at) : null,
    latitude: coordNum(r.latitude),
    longitude: coordNum(r.longitude),
  };
}

function normalizeRecommendation(r: unknown): CloudMonitoringOccurrence['recommendation'] {
  const o = safeRecord(r);
  if (!o) return null;
  const t = str(o.simple_text, '');
  if (!t && !o.priority && !o.action_type) return null;
  return {
    simple_text: t || null,
    priority: o.priority != null ? String(o.priority) : null,
    action_type: o.action_type != null ? String(o.action_type) : null,
  };
}

function normalizeOccurrence(r: Record<string, unknown>): CloudMonitoringOccurrence {
  const imgs = safeArray<unknown>(r.images)
    .filter((x) => x && typeof x === 'object')
    .map((x) => normalizeImage(x as Record<string, unknown>));
  const direct = coordsPairFromRecord(r);
  return {
    occurrence_id:
      r.occurrence_id != null
        ? String(r.occurrence_id)
        : r.cloud_id != null
          ? String(r.cloud_id)
          : null,
    occurrence_local_id:
      r.occurrence_local_id != null
        ? String(r.occurrence_local_id)
        : r.local_id != null
          ? String(r.local_id)
          : null,
    type: r.type != null ? String(r.type) : null,
    name: r.name != null ? String(r.name) : null,
    infestation_level: r.infestation_level != null ? String(r.infestation_level) : null,
    risk_level: r.risk_level != null ? String(r.risk_level) : null,
    observations: r.observations != null ? String(r.observations) : null,
    latitude: direct?.lat ?? null,
    longitude: direct?.lng ?? null,
    images: imgs,
    recommendation: normalizeRecommendation(r.recommendation),
  };
}

function normalizePoint(r: Record<string, unknown>): CloudMonitoringPoint {
  const loc = coordsPairFromRecord(r);
  return {
    point_id:
      r.point_id != null
        ? String(r.point_id)
        : r.cloud_id != null
          ? String(r.cloud_id)
          : r.local_id != null
            ? String(r.local_id)
            : null,
    point_local_id:
      r.point_local_id != null
        ? String(r.point_local_id)
        : r.local_id != null
          ? String(r.local_id)
          : null,
    point_code:
      r.point_code != null
        ? String(r.point_code)
        : r.code != null
          ? String(r.code)
          : null,
    latitude: loc?.lat ?? null,
    longitude: loc?.lng ?? null,
    occurrences: safeArray<unknown>(r.occurrences)
      .filter((x) => x && typeof x === 'object')
      .map((x) => normalizeOccurrence(x as Record<string, unknown>)),
  };
}

function normalizeReport(r: Record<string, unknown>): CloudMonitoringReport {
  const summaryRaw = r.summary;
  const summary =
    summaryRaw && typeof summaryRaw === 'object' && !Array.isArray(summaryRaw)
      ? (summaryRaw as Record<string, unknown>)
      : {};
  return {
    report_id:
      r.report_id != null
        ? String(r.report_id)
        : r.cloud_id != null
          ? String(r.cloud_id)
          : null,
    report_local_id:
      r.report_local_id != null
        ? String(r.report_local_id)
        : r.local_id != null
          ? String(r.local_id)
          : null,
    monitoring_date: r.monitoring_date != null ? String(r.monitoring_date) : null,
    phenological_stage: r.phenological_stage != null ? String(r.phenological_stage) : null,
    crop_name: r.crop_name != null ? String(r.crop_name) : null,
    subarea_local_id: r.subarea_local_id != null ? String(r.subarea_local_id) : null,
    subarea_name: r.subarea_name != null ? String(r.subarea_name) : null,
    summary,
    points: safeArray<unknown>(r.points)
      .filter((x) => x && typeof x === 'object')
      .map((x) => normalizePoint(x as Record<string, unknown>)),
  };
}

function normalizePlot(r: Record<string, unknown>): CloudMonitoringPlot {
  const rawTimelineArr = safeArray<unknown>(r.timeline).filter((x) => x && typeof x === 'object');
  const rawTimeline = rawTimelineArr.map((x) => normalizeReport(x as Record<string, unknown>));

  const timeline = rawTimeline.filter((rep) => {
    if (rep.points.length > 0) return true;
    return nonEmptyObject(rep.summary);
  });

  let plotGeo: unknown = r.plot_geojson ?? r.plotGeojson ?? null;
  if (plotGeo == null) {
    for (const raw of rawTimelineArr) {
      const rr = raw as Record<string, unknown>;
      plotGeo = rr.plot_geojson ?? rr.plotGeojson ?? null;
      if (plotGeo != null) break;
    }
  }

  return {
    plot_id: r.plot_id != null ? String(r.plot_id) : null,
    plot_local_id: r.plot_local_id != null ? String(r.plot_local_id) : null,
    plot_name: str(r.plot_name, 'Talhão'),
    plot_geojson: plotGeo,
    timeline,
  };
}

function riskIsCritical(level: string | null): boolean {
  if (!level) return false;
  const x = level.toLowerCase();
  return x.includes('crit') || x === 'critic' || x.includes('sever');
}

function riskIsHigh(level: string | null): boolean {
  if (!level) return false;
  const x = level.toLowerCase();
  if (riskIsCritical(level)) return false;
  return x.includes('alto') || x.includes('high') || x.includes('elev');
}

function countRisks(plots: CloudMonitoringPlot[]) {
  let critical = 0;
  let high = 0;
  for (const plot of plots) {
    for (const rep of plot.timeline) {
      for (const pt of rep.points) {
        for (const oc of pt.occurrences) {
          if (riskIsCritical(oc.risk_level)) critical += 1;
          else if (riskIsHigh(oc.risk_level)) high += 1;
        }
      }
    }
  }
  return { critical, high };
}

function flattenNormalized(plots: CloudMonitoringPlot[]): Pick<
  CloudMonitoringNormalized,
  'timeline' | 'points' | 'occurrences' | 'images'
> {
  const timeline: CloudMonitoringNormalized['timeline'] = [];
  const points: CloudMonitoringNormalized['points'] = [];
  const occurrences: CloudMonitoringNormalized['occurrences'] = [];
  const images: CloudMonitoringNormalized['images'] = [];

  for (const plot of plots) {
    for (const report of plot.timeline) {
      timeline.push({ ...report, plot });
      for (const point of report.points) {
        points.push({ ...point, report, plot });
        for (const occurrence of point.occurrences) {
          occurrences.push({ ...occurrence, point, report, plot });
          for (const image of occurrence.images) {
            images.push({ ...image, occurrence, point, report, plot });
          }
        }
      }
    }
  }
  return { timeline, points, occurrences, images };
}

function buildSummary(
  farmId: string | null,
  root: Record<string, unknown>,
  plots: CloudMonitoringPlot[],
): CloudMonitoringSummary {
  const sIn = safeRecord(root.summary) ?? {};
  const diagIn = sIn.diagnostics != null ? safeRecord(sIn.diagnostics) : null;
  const diagnostics: CloudMonitoringDiagnostics | null =
    diagIn ??
    (() => {
      const d = safeRecord(root.diagnostics);
      return d;
    })();

  const total_reports = num(
    sIn.total_reports ?? sIn.reports ?? (diagnostics?.reports_loaded as number) ?? root.total_reports,
    0,
  );
  const total_points = num(
    sIn.total_points ?? sIn.points ?? (diagnostics?.points_loaded as number) ?? root.total_points,
    0,
  );
  const total_occurrences = num(
    sIn.total_occurrences ?? sIn.occurrences ?? (diagnostics?.occurrences_loaded as number) ?? root.total_occurrences,
    0,
  );
  const total_images = num(
    sIn.total_images ?? sIn.images ?? (diagnostics?.images_loaded as number) ?? root.total_images,
    0,
  );
  const critical_occurrences = num(sIn.critical_occurrences, 0);
  const counted = countRisks(plots);
  const plots_with_occurrence = num(
    sIn.plots_with_occurrence ?? (diagnostics?.plots_with_occurrence as number),
    plots.filter((p) =>
      p.timeline.some((r) => r.points.some((pt) => pt.occurrences.length > 0)),
    ).length,
  );

  const last_update =
    (diagnostics?.last_update != null ? String(diagnostics.last_update) : null) ||
    (sIn.last_update != null ? String(sIn.last_update) : null) ||
    null;

  return {
    farm_id: farmId,
    total_reports: total_reports || plots.reduce((a, p) => a + p.timeline.length, 0),
    total_points:
      total_points ||
      plots.reduce((a, p) => a + p.timeline.reduce((b, r) => b + r.points.length, 0), 0),
    total_occurrences:
      total_occurrences ||
      plots.reduce(
        (a, p) =>
          a +
          p.timeline.reduce(
            (b, r) => b + r.points.reduce((c, pt) => c + pt.occurrences.length, 0),
            0,
          ),
        0,
      ),
    total_images:
      total_images ||
      plots.reduce(
        (a, p) =>
          a +
          p.timeline.reduce(
            (b, r) =>
              b +
              r.points.reduce(
                (c, pt) => c + pt.occurrences.reduce((d, o) => d + o.images.length, 0),
                0,
              ),
            0,
          ),
        0,
      ),
    critical_occurrences: critical_occurrences || counted.critical,
    high_risk_occurrences: counted.high,
    plots_with_occurrence,
    last_update,
    diagnostics,
  };
}

/**
 * Normaliza o payload cloud (parcial ou completo). Listas nulas → `[]`.
 */
export function normalizeMonitoringWindowsPayload(body: unknown): CloudMonitoringNormalized {
  const root = unwrapMonitoringWindowsBody(body) ?? safeRecord(body);
  if (!root) {
    const emptyPlots: CloudMonitoringPlot[] = [];
    const summary = buildSummary(null, {}, emptyPlots);
    return {
      farm_id: null,
      summary,
      plots: emptyPlots,
      timeline: [],
      points: [],
      occurrences: [],
      images: [],
    };
  }

  const plots = safeArray<unknown>(root.plots)
    .filter((x) => x && typeof x === 'object')
    .map((x) => normalizePlot(x as Record<string, unknown>))
    .filter((p) => p.timeline.length > 0);

  const farm_id = root.farm_id != null ? String(root.farm_id) : null;
  const summary = buildSummary(farm_id, root, plots);
  const flat = flattenNormalized(plots);

  return {
    farm_id,
    summary,
    plots,
    ...flat,
  };
}

function riskRank(level: string | null | undefined): number {
  const x = (level ?? '').toLowerCase();
  if (x.includes('crit')) return 4;
  if (x.includes('alto') || x.includes('high') || x.includes('elev')) return 3;
  if (x.includes('médio') || x.includes('medio') || x.includes('medium')) return 2;
  if (x.includes('baix') || x.includes('low')) return 1;
  return 0;
}

function worstRiskLevel(levels: (string | null | undefined)[]): string {
  let best = '';
  let rank = -1;
  for (const l of levels) {
    const r = riskRank(l);
    if (r > rank) {
      rank = r;
      best = (l ?? '').trim();
    }
  }
  return best;
}

function coordsFromOccurrenceForMap(
  occ: CloudMonitoringOccurrence,
  pointLat: number | null,
  pointLng: number | null,
): LatLng | null {
  if (occ.latitude != null && occ.longitude != null) {
    return { lat: occ.latitude, lng: occ.longitude };
  }
  const direct = coordsPairFromRecord(occ as unknown as Record<string, unknown>);
  if (direct) return direct;
  for (const img of occ.images) {
    const ilat = coordNum(img.latitude);
    const ilng = coordNum(img.longitude);
    if (ilat != null && ilng != null) return { lat: ilat, lng: ilng };
  }
  if (pointLat != null && pointLng != null) return { lat: pointLat, lng: pointLng };
  return null;
}

function coordKey(loc: LatLng): string {
  return `${loc.lat.toFixed(5)}|${loc.lng.toFixed(5)}`;
}

/** Contorno do talhão (quando existir) + pontos por GPS do ponto ou por ocorrência. */
export function selectMonitoringPointFeatures(data: CloudMonitoringNormalized): FeatureCollection {
  const features: Feature[] = [];

  for (const plot of data.plots) {
    if (plot.plot_geojson != null) {
      features.push(
        ...expandLooseGeoJsonToFeatures(plot.plot_geojson, {
          layer: 'monitoring_plot_outline',
          plot_name: plot.plot_name,
        }),
      );
    }
  }

  for (const row of data.points) {
    const ptLat = row.latitude;
    const ptLng = row.longitude;
    const occs = row.occurrences ?? [];
    const rec = row.report;

    const pushPointMarker = (lat: number, lng: number, props: Record<string, unknown>) => {
      const geom: Point = { type: 'Point', coordinates: [lng, lat] };
      features.push({ type: 'Feature', geometry: geom, properties: props });
    };

    if (occs.length === 0) {
      if (ptLat != null && ptLng != null) {
        pushPointMarker(ptLat, ptLng, {
          kind: 'point',
          plot_name: row.plot.plot_name,
          monitoring_date: rec.monitoring_date,
          point_code: row.point_code,
          occurrence_name: '',
          risk_level: '',
          recommendation: '',
          point_id: row.point_id,
        });
      }
      continue;
    }

    const resolved = occs
      .map((occ) => ({ occ, loc: coordsFromOccurrenceForMap(occ, ptLat, ptLng) }))
      .filter((x): x is { occ: CloudMonitoringOccurrence; loc: LatLng } => x.loc != null);

    if (resolved.length === 0) continue;

    const anyDistinctFromPoint = resolved.some(
      ({ loc }) =>
        ptLat == null ||
        ptLng == null ||
        !nearSameCoord(loc.lat, ptLat) ||
        !nearSameCoord(loc.lng, ptLng),
    );

    if (!anyDistinctFromPoint && ptLat != null && ptLng != null) {
      const names = resolved.map(({ occ }) => occ.name ?? occ.type ?? '—').join(' · ');
      const risks = worstRiskLevel(resolved.map(({ occ }) => occ.risk_level));
      const firstRec = resolved[0]?.occ.recommendation?.simple_text ?? '';
      pushPointMarker(ptLat, ptLng, {
        kind: 'aggregate',
        plot_name: row.plot.plot_name,
        monitoring_date: rec.monitoring_date,
        point_code: row.point_code,
        occurrence_name: names,
        risk_level: risks,
        recommendation: firstRec,
        point_id: row.point_id,
      });
      continue;
    }

    const grouped = new Map<string, { loc: LatLng; entries: typeof resolved }>();
    for (const item of resolved) {
      const k = coordKey(item.loc);
      const g = grouped.get(k);
      if (g) g.entries.push(item);
      else grouped.set(k, { loc: item.loc, entries: [item] });
    }

    for (const { loc, entries } of grouped.values()) {
      const names = entries.map(({ occ }) => occ.name ?? occ.type ?? '—').join(' · ');
      const risks = worstRiskLevel(entries.map(({ occ }) => occ.risk_level));
      const recs = entries
        .map(({ occ }) => occ.recommendation?.simple_text)
        .filter((t): t is string => !!t && t.trim() !== '');
      pushPointMarker(loc.lat, loc.lng, {
        kind: entries.length > 1 ? 'occurrence_group' : 'occurrence',
        plot_name: row.plot.plot_name,
        monitoring_date: rec.monitoring_date,
        point_code: row.point_code,
        occurrence_name: names,
        risk_level: risks,
        recommendation: recs[0] ?? '',
        point_id: row.point_id,
        occurrence_local_id: entries
          .map((e) => e.occ.occurrence_local_id)
          .filter((x): x is string => !!x)
          .join(','),
      });
    }
  }

  return { type: 'FeatureCollection', features };
}

export type CloudMonitoringExecutiveStats = {
  total_reports: number;
  total_points: number;
  total_occurrences: number;
  total_images: number;
  plots_with_occurrence: number;
  critical_occurrences: number;
  high_risk_occurrences: number;
  last_update: string | null;
};

export function selectMonitoringExecutiveStats(data: CloudMonitoringNormalized): CloudMonitoringExecutiveStats {
  const s = data.summary;
  return {
    total_reports: s.total_reports,
    total_points: s.total_points,
    total_occurrences: s.total_occurrences,
    total_images: s.total_images,
    plots_with_occurrence: s.plots_with_occurrence,
    critical_occurrences: s.critical_occurrences,
    high_risk_occurrences: s.high_risk_occurrences,
    last_update: s.last_update,
  };
}

export function selectMonitoringTimelineGroups(data: CloudMonitoringNormalized): CloudMonitoringTimelineGroup[] {
  return data.plots.map((plot) => ({
    plot,
    reports: plot.timeline,
  }));
}

/** Delegação para `monitoring-cloud-image-display.ts` (tipos compatíveis). */
export function monitoringImageAsWindowsImage(img: CloudMonitoringImage): MonitoringWindowsImage {
  return img;
}

export function monitoringImageDisplayHint(img: CloudMonitoringImage, nowMs = Date.now()) {
  return getMonitoringImageDisplayHint(monitoringImageAsWindowsImage(img), nowMs);
}
