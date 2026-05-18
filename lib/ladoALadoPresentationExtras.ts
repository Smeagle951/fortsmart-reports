/**
 * Derivações de apresentação para relatório lado a lado quando o payload
 * não preenche todos os campos “canónicos” (`farm.areaHa`, `side*.kpis`).
 */

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { PlantEvaluationMetricJson } from '@/types/side-by-side-report';
import { formatNumber } from '@/utils/format';

function stripDiacritics(s: string): string {
  return s.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Critério/nome de linha normalizado para matching flexível. */
function rowLabelNorm(row: Record<string, unknown>): string {
  const c = row.criteria ?? row.criterio ?? row.label ?? row.metric;
  const t = typeof c === 'string' ? c.trim() : '';
  return stripDiacritics(t).toLowerCase();
}

function fmtNumericLike(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) {
    const dec = Math.abs(v - Math.round(v)) < 1e-9 ? 0 : 2;
    return formatNumber(v, { decimals: dec });
  }
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return null;
    const n = Number(t.replace(/\s/g, '').replace(',', '.'));
    if (Number.isFinite(n) && /^-?\d/.test(t)) {
      const dec = Math.abs(n - Math.round(n)) < 1e-9 ? 0 : 2;
      return formatNumber(n, { decimals: dec });
    }
    return t;
  }
  return null;
}

/** Extrai par A/B da primeira linha de summary_rows cujo critério case os matchers. */
export function summaryRowPairForMatchers(
  data: SideBySideReportData,
  matchers: RegExp[],
): { va: string | null; vb: string | null } | null {
  const rows = data.summary_rows;
  if (!Array.isArray(rows)) return null;
  for (const raw of rows) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const row = raw as Record<string, unknown>;
    const n = rowLabelNorm(row);
    if (!n || !matchers.some((re) => re.test(n))) continue;
    const va = fmtNumericLike(row.value_a_num ?? row.value_a);
    const vb = fmtNumericLike(row.value_b_num ?? row.value_b);
    if (va != null || vb != null) return { va, vb };
  }
  return null;
}

function plantMetricMeans(
  metrics: PlantEvaluationMetricJson[] | undefined,
  matchers: RegExp[],
): { meanA?: number; meanB?: number } | null {
  if (!metrics?.length) return null;
  for (const m of metrics) {
    const blob = `${m.key ?? ''} ${m.label ?? ''}`;
    const n = stripDiacritics(blob).toLowerCase();
    if (!matchers.some((re) => re.test(n))) continue;
    const a = m.meanA;
    const b = m.meanB;
    if ((typeof a === 'number' && Number.isFinite(a)) || (typeof b === 'number' && Number.isFinite(b))) {
      return { meanA: a, meanB: b };
    }
  }
  return null;
}

export type HeroKpiRow = { label: string; va: string; vb: string };

function pickDual(
  primaryA: string | null | undefined,
  primaryB: string | null | undefined,
  fallback: { va: string | null; vb: string | null } | null,
  fmtMean: (n: number) => string,
  means: { meanA?: number; meanB?: number } | null,
): { va: string; vb: string } {
  let va = primaryA ?? fallback?.va ?? null;
  let vb = primaryB ?? fallback?.vb ?? null;
  if ((va == null || va === '—') && means?.meanA != null && Number.isFinite(means.meanA)) va = fmtMean(means.meanA);
  if ((vb == null || vb === '—') && means?.meanB != null && Number.isFinite(means.meanB)) vb = fmtMean(means.meanB);
  return { va: va ?? '—', vb: vb ?? '—' };
}

/** KPIs do hero A/B: prioriza `side*.kpis`, depois `summary_rows`, depois `plant_evaluation`. */
export function buildHeroKpiRows(data: SideBySideReportData): HeroKpiRow[] {
  const kpA = data.sideA?.kpis;
  const kpB = data.sideB?.kpis;
  const pe = data.plant_evaluation?.metrics;

  const popSum = summaryRowPairForMatchers(data, [/populacao/, /popula/, /\bpl\/ha/, /plantas.*ha/, /densidade/]);
  const prodSum = summaryRowPairForMatchers(data, [/produtiv/, /\bkg\/ha/, /\bsc\/ha/, /\byield/]);
  const altSum = summaryRowPairForMatchers(data, [/altura/, /\bcm\b/, /height/]);
  const vigSum = summaryRowPairForMatchers(data, [/vigor/, /sanidade/, /fitossanidade/]);

  const popPe = plantMetricMeans(pe, [/populacao/, /popula/, /estande/, /planta/]);
  const prodPe = plantMetricMeans(pe, [/produtiv/, /massa/, /graos/, /yield/]);
  const altPe = plantMetricMeans(pe, [/altura/, /height/]);
  const vigPe = plantMetricMeans(pe, [/vigor/]);

  const pop = pickDual(
    kpA?.finalPopulationPlHa != null ? formatNumber(kpA.finalPopulationPlHa, { decimals: 0 }) : null,
    kpB?.finalPopulationPlHa != null ? formatNumber(kpB.finalPopulationPlHa, { decimals: 0 }) : null,
    popSum,
    (n) => formatNumber(n, { decimals: 0 }),
    popPe,
  );

  const prod = pickDual(
    kpA?.estimatedYieldKgHa != null ? formatNumber(kpA.estimatedYieldKgHa, { decimals: 0 }) : null,
    kpB?.estimatedYieldKgHa != null ? formatNumber(kpB.estimatedYieldKgHa, { decimals: 0 }) : null,
    prodSum,
    (n) => formatNumber(n, { decimals: n % 1 === 0 ? 0 : 1 }),
    prodPe,
  );

  const alt = pickDual(
    kpA?.avgHeightCm != null ? formatNumber(kpA.avgHeightCm, { decimals: 1 }) : null,
    kpB?.avgHeightCm != null ? formatNumber(kpB.avgHeightCm, { decimals: 1 }) : null,
    altSum,
    (n) => formatNumber(n, { decimals: 1 }),
    altPe,
  );

  const vigA =
    kpA?.vigorCulturaPct != null
      ? `${formatNumber(kpA.vigorCulturaPct, { decimals: 0 })}%`
      : kpA?.vigorRating?.label?.trim() || null;
  const vigB =
    kpB?.vigorCulturaPct != null
      ? `${formatNumber(kpB.vigorCulturaPct, { decimals: 0 })}%`
      : kpB?.vigorRating?.label?.trim() || null;
  const vigMeanFmt = (n: number) => formatNumber(n, { decimals: n % 1 === 0 ? 0 : 1 });
  const vig = pickDual(vigA, vigB, vigSum, vigMeanFmt, vigPe);

  return [
    { label: 'População (pl/ha)', va: pop.va, vb: pop.vb },
    { label: 'Produtividade (kg/ha)', va: prod.va, vb: prod.vb },
    { label: 'Altura (cm)', va: alt.va, vb: alt.vb },
    { label: 'Vigor', va: vig.va, vb: vig.vb },
  ];
}

/** Área do talhão do experimento: `farm.areaHa` ou metadados do desenho experimental. */
export function resolveExperimentAreaHa(data: SideBySideReportData): number | null {
  const fa = data.farm?.areaHa;
  if (typeof fa === 'number' && Number.isFinite(fa) && fa > 0) return fa;

  const exp = data.experiment_design;
  if (exp?.talhao_area_ha != null) {
    const raw = exp.talhao_area_ha as number | string;
    const v = Number(String(raw).replace(',', '.'));
    if (Number.isFinite(v) && v > 0) return v;
  }
  if (exp?.area_util_m2 != null) {
    const raw = exp.area_util_m2 as number | string;
    const m2 = Number(String(raw).replace(',', '.'));
    if (Number.isFinite(m2) && m2 > 0) return m2 / 10000;
  }

  const r = data as Record<string, unknown>;
  const altKeys = ['talhao_area_ha', 'area_ha', 'areaHa', 'farm_area_ha'];
  for (const k of altKeys) {
    const x = r[k];
    if (typeof x === 'number' && Number.isFinite(x) && x > 0) return x;
  }

  return null;
}

export type DisplayPointRow = { indexNo: number; name: string; status: string };

/**
 * Linhas da tabela “Pontos”: combina `points[]` com `field_collection_modules.points`
 * quando o nome não veio preenchido no export principal.
 */
export function buildPointsTableRows(data: SideBySideReportData): DisplayPointRow[] {
  const base = data.points ?? [];
  const fcmPts =
    (
      data.field_collection_modules as {
        points?: Array<{ index?: number; point_id?: string; status?: string }>;
      } | null
    )?.points ?? [];

  const byIndex = new Map<number, { point_id?: string; status?: string }>();
  for (const fp of fcmPts) {
    if (typeof fp.index === 'number') byIndex.set(fp.index, fp);
  }

  if (base.length > 0) {
    return base.map((p, i) => {
      const idx = p.indexNo ?? i + 1;
      const fx = byIndex.get(idx);
      const name = (p.name?.trim() || fx?.point_id?.trim() || `Ponto ${idx}`).trim();
      const status = p.status?.trim() || fx?.status?.trim() || '—';
      return { indexNo: idx, name, status };
    });
  }

  if (fcmPts.length > 0) {
    return fcmPts.map((fp, i) => {
      const idx = typeof fp.index === 'number' ? fp.index : i + 1;
      return {
        indexNo: idx,
        name: fp.point_id?.trim() || `Ponto ${idx}`,
        status: fp.status?.trim() || '—',
      };
    });
  }

  return [];
}
