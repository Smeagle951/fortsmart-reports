import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import {
  clampPct,
  isColheitaJson,
  performanceIndexFromKpis,
  type KpisLike,
} from '@/components/lado_a_lado/ladoALadoHelpers';

/** Só retorna se `conclusion.winner` existir no JSON — sem heurística no front. */
export function winnerFromJson(data: SideBySideReportData): 'A' | 'B' | null {
  const w = data.conclusion?.winner;
  if (w === 'A' || w === 'B') return w;
  return null;
}

type SideKpis = NonNullable<SideBySideReportData['sideA']>['kpis'];

function asKpisLike(k?: SideKpis): KpisLike | undefined {
  if (!k) return undefined;
  return k as unknown as KpisLike;
}

/**
 * Scores no herói / painel: `performanceScore` do app; se ausente, índice sintético a partir dos KPIs;
 * por último posição relativa B↔A em produtividade estimada ou população (0–100).
 */
function inferScoreOneSide(mine?: SideKpis, peer?: SideKpis): number | null {
  const explicit = mine?.performanceScore;
  if (explicit != null && Number.isFinite(explicit)) return Math.round(clampPct(explicit));
  const idx = performanceIndexFromKpis(asKpisLike(mine));
  if (idx != null) return Math.round(idx);
  const y1 = mine?.estimatedYieldKgHa;
  const y2 = peer?.estimatedYieldKgHa;
  if (y1 != null && y2 != null && Number.isFinite(y1) && Number.isFinite(y2)) {
    const maxY = Math.max(y1, y2, 1);
    return Math.round(clampPct((y1 / maxY) * 78 + 22));
  }
  const p1 = mine?.finalPopulationPlHa;
  const p2 = peer?.finalPopulationPlHa;
  if (p1 != null && p2 != null && Number.isFinite(p1) && Number.isFinite(p2)) {
    const maxP = Math.max(p1, p2, 1);
    return Math.round(clampPct((p1 / maxP) * 78 + 22));
  }
  if (y1 != null && Number.isFinite(y1) && y1 > 0) return 62;
  if (p1 != null && Number.isFinite(p1) && p1 > 0) return 58;
  return null;
}

export function scoresFromJson(data: SideBySideReportData): { a: number | null; b: number | null } {
  return {
    a: inferScoreOneSide(data.sideA?.kpis, data.sideB?.kpis),
    b: inferScoreOneSide(data.sideB?.kpis, data.sideA?.kpis),
  };
}

/**
 * Letra A/B para destaque na UI enterprise: `conclusion.winner`, depois motor (`decision_layer`),
 * depois maior índice técnico derivado (`scoresFromJson`). Empate → null.
 */
export function displayWinnerLetter(data: SideBySideReportData): 'A' | 'B' | null {
  const fromConclusion = winnerFromJson(data);
  if (fromConclusion === 'A' || fromConclusion === 'B') return fromConclusion;

  const dl = data.decision_layer;
  const overall = dl?.engineOverallWinner;
  if (overall === 'A' || overall === 'B') return overall;
  const roiWin = dl?.engineRoiWinner;
  if (roiWin === 'A' || roiWin === 'B') return roiWin;

  const { a, b } = scoresFromJson(data);
  if (a != null && b != null && Number.isFinite(a) && Number.isFinite(b)) {
    if (a === b) return null;
    return a > b ? 'A' : 'B';
  }
  return null;
}

/**
 * Diferença B−A em sc/ha e receita (B−A)×preço quando colheita+economia existem no JSON.
 * Não define “vencedor”; só números factuais do payload.
 */
export function heroFinancialSnapshot(data: SideBySideReportData): {
  deltaScHa: number | null;
  gainBrlHa: number | null;
  precoSaca: number | null;
} {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const preco = data.economia?.preco_saca_brl ?? null;
  const sides = colheita?.sides ?? [];
  const rowA = sides.find((s) => s.side === 'A');
  const rowB = sides.find((s) => s.side === 'B');
  const kg = colheita?.kgPerSack ?? 60;
  const sc = (row: typeof rowA) => {
    if (!row) return null;
    if (row.yieldScHa != null) return row.yieldScHa;
    if (row.yieldKgHa != null && kg > 0) return row.yieldKgHa / kg;
    return null;
  };
  const scA = sc(rowA);
  const scB = sc(rowB);
  if (scA == null || scB == null) {
    return { deltaScHa: null, gainBrlHa: null, precoSaca: preco };
  }
  const delta = scB - scA;
  const gain = preco != null && preco > 0 ? delta * preco : null;
  return { deltaScHa: delta, gainBrlHa: gain, precoSaca: preco };
}

/** Δ produtividade estimada (B − A) em kg/ha a partir dos KPIs publicados. */
export function productivityDeltaKgHaFromKpis(data: SideBySideReportData): number | null {
  const a = data.sideA?.kpis?.estimatedYieldKgHa;
  const b = data.sideB?.kpis?.estimatedYieldKgHa;
  if (a == null || b == null || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return b - a;
}

/**
 * Score único no herói: performanceScore do manejo indicado em `conclusion.winner`,
 * senão o maior entre A e B, senão o único disponível.
 */
export function heroGaugeScore(data: SideBySideReportData): { value: number; label: string } | null {
  const { a, b } = scoresFromJson(data);
  const w = winnerFromJson(data);
  if (w === 'A' && a != null) return { value: a, label: 'Score do manejo indicado' };
  if (w === 'B' && b != null) return { value: b, label: 'Score do manejo indicado' };
  if (a != null && b != null) return { value: Math.max(a, b), label: 'Maior score entre os manejos' };
  if (a != null) return { value: a, label: 'Score publicado (manejo A)' };
  if (b != null) return { value: b, label: 'Score publicado (manejo B)' };
  return null;
}

/** Clima do evento de aplicação com maior DAA (quando existir). */
export function climateFromLatestApplication(data: SideBySideReportData): {
  temperature?: number;
  humidity?: number;
  wind?: string | number;
} | null {
  const apps = data.applications ?? [];
  if (apps.length === 0) return null;
  const withDaa = apps.filter((e) => e.daa != null && Number.isFinite(e.daa));
  const pool: ReportApplicationEventV2Json[] = withDaa.length > 0 ? withDaa : apps;
  let best: ReportApplicationEventV2Json | null = null;
  let bestDaa = -Infinity;
  for (const ev of pool) {
    const d = ev.daa ?? 0;
    if (!best || d > bestDaa) {
      best = ev;
      bestDaa = d;
    }
  }
  const c = best?.climate;
  if (!c) return null;
  if (c.temperature == null && c.humidity == null && c.wind == null) return null;
  return { temperature: c.temperature, humidity: c.humidity, wind: c.wind };
}

export type RevenueHaPair = { side: 'A' | 'B'; revenueBrlHa: number };

/** Receita bruta estimada (sc/ha ou kg/ha × preço saca) por lado — só com colheita + preço. */
export function estimatedRevenueBrlPerHa(data: SideBySideReportData): {
  rows: RevenueHaPair[];
  higherSide: 'A' | 'B' | null;
} {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const preco = data.economia?.preco_saca_brl;
  const kg = colheita?.kgPerSack ?? 60;
  if (!colheita?.sides?.length || preco == null || preco <= 0) {
    return { rows: [], higherSide: null };
  }
  const rows: RevenueHaPair[] = [];
  for (const s of colheita.sides) {
    if (s.side !== 'A' && s.side !== 'B') continue;
    let sc: number | null = null;
    if (s.yieldScHa != null && Number.isFinite(s.yieldScHa)) sc = s.yieldScHa;
    else if (s.yieldKgHa != null && kg > 0) sc = s.yieldKgHa / kg;
    if (sc == null) continue;
    rows.push({ side: s.side, revenueBrlHa: sc * preco });
  }
  if (rows.length < 2) return { rows, higherSide: null };
  const ra = rows.find((r) => r.side === 'A')?.revenueBrlHa;
  const rb = rows.find((r) => r.side === 'B')?.revenueBrlHa;
  if (ra == null || rb == null) return { rows, higherSide: null };
  if (Math.abs(ra - rb) < 0.01) return { rows, higherSide: null };
  return { rows, higherSide: rb > ra ? 'B' : 'A' };
}
