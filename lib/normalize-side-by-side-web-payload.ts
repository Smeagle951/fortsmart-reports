/**
 * Normaliza o JSON público de avaliação lado a lado para o viewer Next.js:
 * aliases snake_case, KPIs derivados de summary_rows / fenologia, layout premium.
 */

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}

function parseNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = v.replace(/\s/g, '').replace(',', '.');
    const m = /^-?\d+(\.\d+)?/.exec(t);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function matches(label: string, kws: string[]): boolean {
  const l = label.toLowerCase();
  return kws.some((k) => l.includes(k.toLowerCase()));
}

/** Alinhado a EvaluationSideBySideWebMapper._buildKpisFromSummaryRows + sinónimos de campo. */
function kpisPatchFromSummaryRows(rows: unknown[], valueKey: 'value_a_num' | 'value_b_num'): Record<string, unknown> {
  let height: number | null = null;
  let population: number | null = null;
  let yield_: number | null = null;
  let rootDepth: number | null = null;
  let rootWeight: number | null = null;
  let estandeEfetivo: number | null = null;
  let eficiencia: number | null = null;
  let vigorPct: number | null = null;

  for (const row of rows) {
    const m = asRecord(row);
    if (!m) continue;
    const label = String(m.criteria ?? m.criterio ?? '').toLowerCase();
    let val = parseNum(m[valueKey]);
    if (val == null) {
      val = parseNum(valueKey === 'value_a_num' ? m.value_a : m.value_b);
    }
    if (val == null) continue;

    if (matches(label, ['altura', 'height', 'alt.'])) height = val;
    else if (
      matches(label, [
        'população',
        'populacao',
        'population',
        'pop. final',
        'pop final',
        'estande',
        'pl/ha',
        'plantas',
        'densidade',
        'população efetiva',
        'pop efetiva',
        'pop. efetiva',
      ])
    ) {
      population ??= val;
    } else if (matches(label, ['produtividade', 'yield', 'produção estimada', 'prod. est', 'produtiv'])) yield_ = val;
    else if (matches(label, ['profundidade raiz', 'root depth', 'prof. raiz'])) rootDepth = val;
    else if (matches(label, ['peso raiz', 'root weight', 'peso de raiz'])) rootWeight = val;
    else if (matches(label, ['estande efetivo', 'estande ef'])) estandeEfetivo = val;
    else if (matches(label, ['eficiência', 'eficiencia', 'efficiency', 'efic.'])) eficiencia = val;
    else if (matches(label, ['vigor', 'desenvolvimento', 'uniformidade', 'aspecto'])) {
      if (val >= 0 && val <= 100) vigorPct ??= val;
    }
  }

  const out: Record<string, unknown> = {};
  if (height != null) out.avgHeightCm = height;
  if (population != null) out.finalPopulationPlHa = population;
  if (yield_ != null) out.estimatedYieldKgHa = yield_;
  if (rootDepth != null) out.profundidadeRaizCm = rootDepth;
  if (rootWeight != null) out.pesoRaizG = rootWeight;
  if (estandeEfetivo != null) out.estandeEfetivo = estandeEfetivo;
  if (eficiencia != null) out.eficienciaPct = eficiencia;
  if (vigorPct != null) out.vigorCulturaPct = vigorPct;
  return out;
}

function vigorRatingFromText(v: string | undefined | null): { label: string; score: number; max: number } | null {
  if (!v?.trim()) return null;
  const lower = v.trim().toLowerCase();
  let score = 3;
  if (lower.includes('alto') || lower.includes('excelente')) score = 4;
  else if (lower.includes('baixo') || lower.includes('fraco')) score = 2;
  else if (lower.includes('méd') || lower.includes('med') || lower.includes('moderado')) score = 3;
  return { label: v.trim(), score, max: 4 };
}

function mergeKpis(side: Record<string, unknown> | undefined, patch: Record<string, unknown>): Record<string, unknown> {
  const cur = asRecord(side?.kpis) ?? {};
  const merged = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    if (v == null) continue;
    if (merged[k] == null || merged[k] === '') merged[k] = v;
  }
  return merged;
}

function mergeVigorFromPhenology(
  side: Record<string, unknown>,
  phenology: Record<string, unknown> | null,
  sideKey: 'sideA' | 'sideB',
): void {
  const phSide = asRecord(phenology?.[sideKey]);
  const vigorText = phSide?.vigor != null ? String(phSide.vigor) : '';
  const vr = vigorRatingFromText(vigorText);
  const kpis = asRecord(side.kpis) ?? {};
  const existingVr = asRecord(kpis.vigorRating);
  if (vr && (existingVr == null || existingVr.score == null)) {
    side.kpis = { ...kpis, vigorRating: vr };
  }
}

function valuesFromFieldCollection(
  fcm: Record<string, unknown> | null,
  sideKey: 'A' | 'B',
): Record<string, unknown> {
  const points = Array.isArray(fcm?.points) ? (fcm!.points as unknown[]) : [];
  const nums: Record<string, number[]> = {};
  const texts: Record<string, string> = {};

  const addNum = (key: string, v: unknown) => {
    const n = parseNum(v);
    if (n == null) return;
    (nums[key] ??= []).push(n);
  };
  const walk = (obj: unknown, path = '') => {
    const rec = asRecord(obj);
    if (!rec) return;
    for (const [rawKey, value] of Object.entries(rec)) {
      const key = rawKey.toLowerCase();
      const full = path ? `${path}.${key}` : key;
      if (asRecord(value)) {
        walk(value, full);
        continue;
      }
      if (Array.isArray(value)) continue;
      if (matches(full, ['altura_cm', 'altura cm', 'height_cm', 'altura'])) addNum('avgHeightCm', value);
      if (matches(full, ['populacao_pl_ha', 'população_pl_ha', 'populacao pl ha', 'populacao', 'população', 'estande'])) {
        addNum('finalPopulationPlHa', value);
        addNum('estandeEfetivo', value);
      }
      if (matches(full, ['produtividade_kg_ha', 'produtividade kg ha', 'yield_kg_ha', 'produtividade'])) {
        addNum('estimatedYieldKgHa', value);
      }
      if (matches(full, ['vigor']) && !matches(full, ['observacao', 'texto'])) {
        const n = parseNum(value);
        if (n != null) {
          if (n <= 5) {
            texts.vigorRatingLabel ??= String(value);
            nums.vigorRatingScore ??= [];
            nums.vigorRatingScore.push(n);
          } else if (n <= 100) {
            addNum('vigorCulturaPct', n);
          }
        } else if (typeof value === 'string' && value.trim()) {
          texts.vigorRatingLabel ??= value.trim();
        }
      }
    }
  };

  for (const p of points) {
    const prec = asRecord(p);
    const sides = asRecord(prec?.sides);
    walk(asRecord(sides?.[sideKey]));
  }

  const avg = (arr?: number[]) => (arr?.length ? arr.reduce((a, b) => a + b, 0) / arr.length : undefined);
  const out: Record<string, unknown> = {};
  for (const key of ['avgHeightCm', 'finalPopulationPlHa', 'estimatedYieldKgHa', 'estandeEfetivo', 'vigorCulturaPct']) {
    const v = avg(nums[key]);
    if (v != null) out[key] = v;
  }
  const vigorScore = avg(nums.vigorRatingScore);
  if (vigorScore != null || texts.vigorRatingLabel) {
    out.vigorRating = {
      label: texts.vigorRatingLabel ?? String(Math.round(vigorScore ?? 0)),
      score: vigorScore != null ? Math.round(vigorScore) : undefined,
      max: 5,
    };
  }
  return out;
}

/**
 * Devolve uma cópia superficial + merges profundos onde necessário.
 */
export function normalizeSideBySideWebPayload(src: Record<string, unknown>): SideBySideReportData {
  const out: Record<string, unknown> = { ...src };

  if (out.sideA == null && src.side_a != null) out.sideA = src.side_a;
  if (out.sideB == null && src.side_b != null) out.sideB = src.side_b;
  if (out.decision_layer == null && src.decisionLayer != null) out.decision_layer = src.decisionLayer;
  if (out.criteriosEstatistica == null && src.criterios_estatistica != null) {
    out.criteriosEstatistica = src.criterios_estatistica;
  }

  const branding = asRecord(out.branding) ?? {};
  out.branding = {
    ...branding,
    reportLayout: 'premium',
  };

  const metaRec = asRecord(out.meta) ?? {};
  if (metaRec.reportId == null && src.evaluation_id != null) {
    const ev = String(src.evaluation_id).trim();
    if (ev) out.meta = { ...metaRec, reportId: ev };
  }

  const rows = Array.isArray(out.summary_rows) ? (out.summary_rows as unknown[]) : [];
  const fcm = asRecord(out.field_collection_modules ?? src.fieldCollectionModules);
  const patchA = {
    ...(rows.length > 0 ? kpisPatchFromSummaryRows(rows, 'value_a_num') : {}),
    ...valuesFromFieldCollection(fcm, 'A'),
  };
  const patchB = {
    ...(rows.length > 0 ? kpisPatchFromSummaryRows(rows, 'value_b_num') : {}),
    ...valuesFromFieldCollection(fcm, 'B'),
  };

  const phen = asRecord(out.phenology);
  const farmExisting = asRecord(out.farm) ?? {};
  const farmOut: Record<string, unknown> = { ...farmExisting };
  if (farmOut.areaHa == null) {
    const fieldMap = asRecord(out.field_map ?? src.field_map ?? src.fieldMap);
    const tal = asRecord(src.talhao as unknown) ?? asRecord(fieldMap?.talhao);
    const a = tal?.area_total_ha ?? tal?.areaHa ?? tal?.area_ha;
    if (typeof a === 'number' && Number.isFinite(a)) farmOut.areaHa = a;
    else if (a != null) {
      const n = parseNum(a);
      if (n != null) farmOut.areaHa = n;
    }
  }
  out.farm = farmOut;

  const sideA = asRecord(out.sideA) ?? {};
  const sideB = asRecord(out.sideB) ?? {};

  const sideAOut: Record<string, unknown> = { ...sideA, kpis: mergeKpis(sideA, patchA) };
  const sideBOut: Record<string, unknown> = { ...sideB, kpis: mergeKpis(sideB, patchB) };
  mergeVigorFromPhenology(sideAOut, phen, 'sideA');
  mergeVigorFromPhenology(sideBOut, phen, 'sideB');

  out.sideA = sideAOut;
  out.sideB = sideBOut;

  // Aliases / compat: payloads legados ou snake_case parcial.
  if (out.treatment_protocol == null && src.treatmentProtocol != null) {
    out.treatment_protocol = src.treatmentProtocol;
  }
  if (out.field_collection_modules == null && src.fieldCollectionModules != null) {
    out.field_collection_modules = src.fieldCollectionModules;
  }
  if (out.field_map == null && src.fieldMap != null) {
    out.field_map = src.fieldMap;
  }
  if (out.field_polygon_json == null && src.fieldPolygonJson != null) {
    out.field_polygon_json = src.fieldPolygonJson;
  }
  if (out.subareas_polygons == null && src.subareasPolygons != null) {
    out.subareas_polygons = src.subareasPolygons;
  }
  const appsRaw = out.applications;
  if (Array.isArray(appsRaw) && appsRaw.length > 0) {
    out.applications = appsRaw.map((row) => {
      const ev = asRecord(row);
      if (!ev) return row;
      const notes =
        typeof ev.notes === 'string' && ev.notes.trim()
          ? ev.notes.trim()
          : typeof ev.observacao === 'string' && ev.observacao.trim()
            ? ev.observacao.trim()
            : typeof ev.observacoes === 'string' && ev.observacoes.trim()
              ? ev.observacoes.trim()
              : undefined;
      if (notes == null) return row;
      return { ...ev, notes };
    });
  }

  const pointsRaw = Array.isArray(out.points) ? (out.points as unknown[]) : [];
  if (pointsRaw.length > 0) {
    out.points = pointsRaw.map((row, idx) => {
      const p = asRecord(row);
      if (!p) return row;
      const name = typeof p.name === 'string' && p.name.trim() ? p.name : `Ponto ${p.indexNo ?? p.index ?? idx + 1}`;
      return { ...p, name };
    });
  }

  return out as unknown as SideBySideReportData;
}
