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
  const patchA = rows.length > 0 ? kpisPatchFromSummaryRows(rows, 'value_a_num') : {};
  const patchB = rows.length > 0 ? kpisPatchFromSummaryRows(rows, 'value_b_num') : {};

  const phen = asRecord(out.phenology);
  const farmExisting = asRecord(out.farm) ?? {};
  const farmOut: Record<string, unknown> = { ...farmExisting };
  if (farmOut.areaHa == null) {
    const tal = asRecord(src.talhao as unknown);
    const a = tal?.area_total_ha;
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

  return out as unknown as SideBySideReportData;
}
