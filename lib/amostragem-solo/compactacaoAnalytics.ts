import area from '@turf/area';
import type { Feature, FeatureCollection } from 'geojson';

import { classifyMpaForWeb } from './mpa';
import type { AmostragemObservacao } from './payload';

/** Chave de camada/profundidade estável para agregação. */
export function depthKey(o: AmostragemObservacao): string {
  if (o.profundidade && String(o.profundidade).trim()) {
    return String(o.profundidade).trim();
  }
  if (o.depth_top_cm != null && o.depth_bottom_cm != null) {
    return `${o.depth_top_cm}-${o.depth_bottom_cm} cm`;
  }
  return 'Profundidade não informada';
}

/**
 * Pontos de campo distintos: prioriza `point_id` do app; senão agrupa por (lat,lng) com 5 casas;
 * último fallback: números de ordem únicos.
 */
export function countDistinctFieldPoints(obs: AmostragemObservacao[]): number {
  const byPointId = new Set<number>();
  let anyId = false;
  for (const o of obs) {
    if (o.point_id != null && Number.isFinite(Number(o.point_id))) {
      byPointId.add(Number(o.point_id));
      anyId = true;
    }
  }
  if (anyId) return byPointId.size;

  const byLoc = new Set<string>();
  for (const o of obs) {
    if (o.lat != null && o.lng != null && Number.isFinite(o.lat) && Number.isFinite(o.lng)) {
      byLoc.add(`${o.lat.toFixed(5)},${o.lng.toFixed(5)}`);
    }
  }
  if (byLoc.size > 0) return byLoc.size;

  const nums = new Set(obs.map((o) => o.numero).filter((n): n is number => n != null && Number.isFinite(n)));
  return nums.size > 0 ? nums.size : obs.length;
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) return sorted[mid]!;
  return (sorted[mid - 1]! + sorted[mid]!) / 2;
}

function percentile(sorted: number[], p: number): number | null {
  if (sorted.length === 0) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]!;
}

/** Interpretação agronômica automática do IC médio de uma camada (Embrapa). */
export function interpretIcForDepth(icMedio: number): string {
  if (icMedio <= 1.0) return 'Sem restrição — solo com boa estrutura para crescimento radicular.';
  if (icMedio <= 1.5) return 'Baixa restrição — monitorar em próximas safras.';
  if (icMedio <= 2.0) return 'Restrição moderada — atenção ao manejo e tráfego de máquinas.';
  if (icMedio <= 2.5) return 'Restrição alta — avaliar escarificação ou subsolagem localizada.';
  if (icMedio <= 3.0) return 'Restrição alta — subsolagem recomendada nesta profundidade.';
  return 'Restrição crítica — intervenção mecânica urgente (subsolagem profunda).';
}

export type ClasseIc = 'Crítica' | 'Alta' | 'Moderada' | 'Baixa' | 'Indefinido';

export type DistribuicaoClasse = {
  classe: ClasseIc;
  count: number;
  pct: number;
};

export type ProfundidadeAgg = {
  profundidade: string;
  n: number;
  icMedio: number;
  icMin: number;
  icMax: number;
  classePredominante: string;
  interpretacao: string;
};

export type CompactacaoAnalytics = {
  nObservacoesComIc: number;
  nObservacoesTotal: number;
  icMin: number | null;
  icMax: number | null;
  icMedia: number | null;
  icMediana: number | null;
  distribuicao: DistribuicaoClasse[];
  pctCamadasAltaCritica: number;
  icDesvioPadrao: number | null;
  coefVariacao: number | null;
  icP90: number | null;
  porProfundidade: ProfundidadeAgg[];
  profundidadeMaiorIcMedio: { profundidade: string; icMedio: number } | null;
  pontosDistintos: number;
};

export function computeCompactacaoAnalytics(obs: AmostragemObservacao[]): CompactacaoAnalytics {
  const nObservacoesTotal = obs.length;
  const comIc = obs.filter((o) => o.compactacao != null && Number.isFinite(Number(o.compactacao)));
  const values = comIc.map((o) => Number(o.compactacao)).sort((a, b) => a - b);
  const n = values.length;

  const icMin = n ? values[0]! : null;
  const icMax = n ? values[n - 1]! : null;
  const icMedia = n ? values.reduce((a, b) => a + b, 0) / n : null;
  const icMediana = median(values);
  const icP90 = percentile(values, 90);

  // Desvio padrão e CV%
  let icDesvioPadrao: number | null = null;
  let coefVariacao: number | null = null;
  if (n > 1 && icMedia != null && icMedia > 0) {
    const sumSqDiff = values.reduce((acc, v) => acc + (v - icMedia) ** 2, 0);
    icDesvioPadrao = Math.sqrt(sumSqDiff / (n - 1));
    coefVariacao = (icDesvioPadrao / icMedia) * 100;
  }

  const counts: Record<string, number> = {};
  for (const v of comIc.map((o) => Number(o.compactacao))) {
    const c = classifyMpaForWeb(v);
    counts[c] = (counts[c] ?? 0) + 1;
  }

  const ordem: ClasseIc[] = ['Crítica', 'Alta', 'Moderada', 'Baixa', 'Indefinido'];
  const distribuicao: DistribuicaoClasse[] = [];
  for (const classe of ordem) {
    const count = counts[classe] ?? 0;
    if (count === 0) continue;
    distribuicao.push({
      classe,
      count,
      pct: n ? Math.round((count / n) * 1000) / 10 : 0,
    });
  }

  const alta = counts['Alta'] ?? 0;
  const crit = counts['Crítica'] ?? 0;
  const pctCamadasAltaCritica = n ? Math.round(((alta + crit) / n) * 1000) / 10 : 0;

  const porProfMap = new Map<string, { n: number; soma: number; min: number; max: number; classes: Record<string, number> }>();
  for (const o of comIc) {
    const key = depthKey(o);
    const v = Number(o.compactacao);
    const cls = classifyMpaForWeb(v);
    const cur = porProfMap.get(key) ?? { n: 0, soma: 0, min: Infinity, max: -Infinity, classes: {} };
    cur.n += 1;
    cur.soma += v;
    cur.min = Math.min(cur.min, v);
    cur.max = Math.max(cur.max, v);
    cur.classes[cls] = (cur.classes[cls] ?? 0) + 1;
    porProfMap.set(key, cur);
  }

  const porProfundidade: ProfundidadeAgg[] = [];
  let profundidadeMaiorIcMedio: { profundidade: string; icMedio: number } | null = null;
  let maxMedia = -1;

  for (const [profundidade, { n: nn, soma, min, max, classes }] of porProfMap.entries()) {
    const icMedio = soma / nn;
    let bestC = '';
    let bestN = -1;
    for (const [c, cn] of Object.entries(classes)) {
      if (cn > bestN) {
        bestN = cn;
        bestC = c;
      }
    }
    porProfundidade.push({
      profundidade,
      n: nn,
      icMedio,
      icMin: min,
      icMax: max,
      classePredominante: bestC || 'Indefinido',
      interpretacao: interpretIcForDepth(icMedio),
    });
    if (icMedio > maxMedia) {
      maxMedia = icMedio;
      profundidadeMaiorIcMedio = { profundidade, icMedio };
    }
  }
  porProfundidade.sort((a, b) => a.profundidade.localeCompare(b.profundidade, 'pt-BR'));

  return {
    nObservacoesComIc: n,
    nObservacoesTotal,
    icMin,
    icMax,
    icMedia,
    icMediana,
    icDesvioPadrao,
    coefVariacao,
    icP90,
    distribuicao,
    pctCamadasAltaCritica,
    porProfundidade,
    profundidadeMaiorIcMedio,
    pontosDistintos: countDistinctFieldPoints(obs),
  };
}

export type SamplingQuality = {
  areaHa: number | null;
  densidadePontosPorHa: number | null;
  fatorPlanejado: number | null;
  comparacaoPlanejado: 'abaixo' | 'proximo' | 'acima' | null;
  layoutLabel: string | null;
};

function featureAreaM2(f: Feature): number {
  try {
    return area(f as Feature);
  } catch {
    return 0;
  }
}

/** Soma área de polígonos em talhões (m² → ha). MultiPolygon/Polygon nos features. */
export function approximateAreaHaFromTalhoesGeoJson(fc: FeatureCollection | null | undefined): number | null {
  if (!fc || fc.type !== 'FeatureCollection' || !Array.isArray(fc.features)) return null;
  let m2 = 0;
  for (const f of fc.features) {
    const g = f.geometry;
    if (!g) continue;
    if (g.type === 'Polygon' || g.type === 'MultiPolygon') {
      m2 += featureAreaM2(f as Feature);
    }
  }
  return m2 > 0 ? Math.round((m2 / 10000) * 1000) / 1000 : null;
}

export function computeSamplingQuality(
  obs: AmostragemObservacao[],
  talhoesFc: FeatureCollection | null | undefined,
  meta: Record<string, unknown>,
): SamplingQuality {
  const areaHa = approximateAreaHaFromTalhoesGeoJson(talhoesFc ?? null);
  const pontos = countDistinctFieldPoints(obs);
  const densidadePontosPorHa =
    areaHa != null && areaHa > 0 ? Math.round((pontos / areaHa) * 100) / 100 : null;

  const rawFator = meta.fator_pontos_ha;
  const fatorPlanejado =
    rawFator != null && Number.isFinite(Number(rawFator)) ? Number(rawFator) : null;

  let comparacaoPlanejado: SamplingQuality['comparacaoPlanejado'] = null;
  if (densidadePontosPorHa != null && fatorPlanejado != null && fatorPlanejado > 0) {
    const ratio = densidadePontosPorHa / fatorPlanejado;
    if (ratio < 0.75) comparacaoPlanejado = 'abaixo';
    else if (ratio > 1.25) comparacaoPlanejado = 'acima';
    else comparacaoPlanejado = 'proximo';
  }

  const tl = meta.tipo_layout != null ? String(meta.tipo_layout) : null;
  const layoutLabel =
    tl === 'pontosPorHa'
      ? 'Malha por pontos/ha'
      : tl === 'livre'
        ? 'Pontos livres'
        : tl;

  return {
    areaHa,
    densidadePontosPorHa,
    fatorPlanejado,
    comparacaoPlanejado,
    layoutLabel,
  };
}
