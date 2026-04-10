/**
 * Métricas executivas 0–100 e textos de destaque — sempre derivados do JSON publicado.
 */

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

const vigorToPct = (v: string | undefined) =>
  v === 'Alto' || v === 'alto' ? 100 : v === 'Médio' || v === 'medio' ? 60 : v ? 35 : 0;

/** Coleta indicadores normalizados 0–100 por lado (média dos disponíveis). */
export function collectSideMetrics(
  data: SideBySideReportData,
  side: 'A' | 'B'
): number[] {
  const k = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  const ph = side === 'A' ? data.phenology?.sideA : data.phenology?.sideB;
  const out: number[] = [];
  if (k?.eficienciaPct != null && Number.isFinite(k.eficienciaPct)) {
    out.push(clamp(k.eficienciaPct, 0, 100));
  }
  const maxR = k?.rootRating?.max && k.rootRating.max > 0 ? k.rootRating.max : 5;
  if (k?.rootRating?.score != null) {
    out.push(clamp((k.rootRating.score / maxR) * 100, 0, 100));
  }
  if (k?.avgHeightCm != null) {
    out.push(clamp(Math.min(100, k.avgHeightCm * 1.2), 0, 100));
  }
  if (k?.finalPopulationPlHa != null && k.finalPopulationPlHa > 0) {
    out.push(clamp(Math.min(100, k.finalPopulationPlHa / 800), 0, 100));
  }
  if (k?.estimatedYieldKgHa != null && k.estimatedYieldKgHa > 0) {
    out.push(clamp(Math.min(100, k.estimatedYieldKgHa / 200), 0, 100));
  }
  const vg = vigorToPct(ph?.vigor);
  if (vg > 0) out.push(vg);
  const un = vigorToPct(ph?.uniformidade);
  if (un > 0) out.push(un);
  const mxV = k?.vigorRating?.max && k.vigorRating.max > 0 ? k.vigorRating.max : 5;
  if (k?.vigorRating?.score != null) {
    out.push(clamp((k.vigorRating.score / mxV) * 100, 0, 100));
  }
  return out;
}

export type ExecutiveScores = {
  scoreA: number;
  scoreB: number;
  /** (B−A)/A*100 quando A>0; senão diferença absoluta aproximada */
  relativeDiffPct: number | null;
  sampleSizeA: number;
  sampleSizeB: number;
};

export function computeExecutiveScores(data: SideBySideReportData): ExecutiveScores | null {
  const mA = collectSideMetrics(data, 'A');
  const mB = collectSideMetrics(data, 'B');
  if (mA.length === 0 && mB.length === 0) return null;
  const scoreA = mA.length ? mA.reduce((a, b) => a + b, 0) / mA.length : 0;
  const scoreB = mB.length ? mB.reduce((a, b) => a + b, 0) / mB.length : 0;
  let relativeDiffPct: number | null = null;
  if (scoreA > 1) {
    relativeDiffPct = ((scoreB - scoreA) / scoreA) * 100;
  } else if (scoreB > 1) {
    relativeDiffPct = 100;
  }
  return {
    scoreA: Math.round(clamp(scoreA, 0, 100)),
    scoreB: Math.round(clamp(scoreB, 0, 100)),
    relativeDiffPct,
    sampleSizeA: mA.length,
    sampleSizeB: mB.length,
  };
}
