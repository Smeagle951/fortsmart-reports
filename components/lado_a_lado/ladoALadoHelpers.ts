import type {
  ColheitaJson,
  CustoJson,
  ReportApplicationEventV2Json,
  ReportPhotoWeb,
} from '@/types/side-by-side-report';

export const COLOR_SIDE_A = '#2563eb';
export const COLOR_SIDE_B = '#16a34a';

/**
 * Ordem de apresentação no relatório: **sempre** esquerda / 1.ª coluna = Manejo A, direita / 2.ª = Manejo B
 * (lado a lado “verdadeiro”, independentemente das chaves virem fora de ordem no JSON).
 */
export const PRESENTATION_SIDE_ORDER: readonly ('A' | 'B')[] = ['A', 'B'] as const;

export function sideKeysInPresentationOrder(sides: Record<string, unknown> | null | undefined): ('A' | 'B')[] {
  if (!sides) return [];
  return PRESENTATION_SIDE_ORDER.filter((k) => Object.prototype.hasOwnProperty.call(sides, k));
}

export function isCustoJson(v: unknown): v is CustoJson {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return Array.isArray(o.by_side);
}

export function isColheitaJson(v: unknown): v is ColheitaJson {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return o.sides === undefined || Array.isArray(o.sides);
}

/** Último evento em `applications` com algum dado em `climate` (para hero). */
export function lastMeaningfulClimate(
  apps: ReportApplicationEventV2Json[] | undefined,
): ReportApplicationEventV2Json['climate'] | null {
  if (!apps?.length) return null;
  for (let i = apps.length - 1; i >= 0; i--) {
    const c = apps[i].climate;
    if (!c) continue;
    if (
      c.temperature != null ||
      c.humidity != null ||
      c.wind != null ||
      (c.derivaRisco != null && String(c.derivaRisco).trim() !== '')
    ) {
      return c;
    }
  }
  return null;
}

export function formatWind(wind: string | number | undefined): string {
  if (wind == null) return '';
  if (typeof wind === 'number') return `${wind}`;
  return String(wind);
}

/** Série para gráfico: ≥2 DAA distintos; linhas = contagem de eventos A/B por DAA. */
export function evolutionSeriesFromApplications(
  apps: ReportApplicationEventV2Json[] | undefined,
): { name: string; daa: number; A: number; B: number }[] | null {
  if (!apps?.length) return null;
  const withDaa = apps.filter((a) => a.daa != null && Number.isFinite(Number(a.daa)));
  if (withDaa.length === 0) return null;
  const byDaa = new Map<number, { A: number; B: number }>();
  for (const ev of withDaa) {
    const d = Number(ev.daa);
    const cur = byDaa.get(d) ?? { A: 0, B: 0 };
    if (ev.side === 'A') cur.A += 1;
    else cur.B += 1;
    byDaa.set(d, cur);
  }
  if (byDaa.size < 2) return null;
  return [...byDaa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([daa, v]) => ({
      daa,
      name: `${daa} DAA`,
      A: v.A,
      B: v.B,
    }));
}

/** Foto principal para comparativo: prioriza sanidade/daninha/estande (evidência no campo). */
const HERO_CATEGORY_ORDER = ['sanidade', 'daninha', 'estande', 'raiz', 'geral'] as const;

export function pickHeroPhoto(photos: ReportPhotoWeb[] | undefined): ReportPhotoWeb | null {
  if (!photos?.length) return null;
  const withUrl = photos.filter((p) => p.url);
  if (withUrl.length === 0) return null;
  for (const cat of HERO_CATEGORY_ORDER) {
    const hit = withUrl.find((p) => (p.category || 'geral') === cat);
    if (hit) return hit;
  }
  return withUrl[0];
}

export function distinctApplicationDaas(apps: ReportApplicationEventV2Json[] | undefined): number[] {
  if (!apps?.length) return [];
  const s = new Set<number>();
  for (const ev of apps) {
    if (ev.daa != null && Number.isFinite(Number(ev.daa))) s.add(Number(ev.daa));
  }
  return [...s].sort((a, b) => a - b);
}

export type KpisLike = {
  eficienciaPct?: number;
  vigorRating?: { score?: number; max?: number };
  rootRating?: { score?: number; max?: number };
  controleDaninhasPct?: number;
  vigorCulturaPct?: number;
  estimatedYieldKgHa?: number;
  finalPopulationPlHa?: number;
};

export function hasExplicitControleDaninhas(kpisA?: KpisLike, kpisB?: KpisLike): boolean {
  const a = kpisA?.controleDaninhasPct;
  const b = kpisB?.controleDaninhasPct;
  return (a != null && Number.isFinite(a)) || (b != null && Number.isFinite(b));
}

export function hasExplicitVigorCultura(kpisA?: KpisLike, kpisB?: KpisLike): boolean {
  const pct = (k?: KpisLike) => k?.vigorCulturaPct != null && Number.isFinite(k.vigorCulturaPct);
  const rating = (k?: KpisLike) => {
    const vr = k?.vigorRating;
    return vr != null && vr.score != null && (vr.max ?? 0) > 0;
  };
  return pct(kpisA) || pct(kpisB) || rating(kpisA) || rating(kpisB);
}

export function clampPct(n: number): number {
  return Math.max(0, Math.min(100, n));
}

/** Normaliza subescore 0–max para 0–100. */
function subscoreToPct(score?: number, max?: number): number {
  const m = max ?? 0;
  if (m <= 0 || score == null || !Number.isFinite(score)) return 0;
  return clampPct((score / m) * 100);
}

export function vigorPctFromKpis(kpis?: KpisLike): number {
  return subscoreToPct(kpis?.vigorRating?.score, kpis?.vigorRating?.max);
}

export function rootPctFromKpis(kpis?: KpisLike): number {
  return subscoreToPct(kpis?.rootRating?.score, kpis?.rootRating?.max);
}

/**
 * Índice sintético no front (pesos ilustrativos) — não altera DTO.
 * Eficiência de estande 40%, vigor 30%, sanidade radicular 30%.
 */
export function performanceIndexFromKpis(kpis?: KpisLike): number | null {
  if (!kpis) return null;
  const stand = kpis.eficienciaPct;
  let vig = vigorPctFromKpis(kpis);
  if (kpis.vigorCulturaPct != null && Number.isFinite(kpis.vigorCulturaPct)) {
    vig = clampPct(kpis.vigorCulturaPct);
  }
  const root = rootPctFromKpis(kpis);
  const hasStand = stand != null && Number.isFinite(stand);
  if (!hasStand && vig === 0 && root === 0) return null;
  const s = hasStand ? clampPct(stand!) : (vig + root) / 2;
  return clampPct(s * 0.4 + vig * 0.3 + root * 0.3);
}

/** Pressão fitossanitária média (incidência %) quando houver ocorrências. */
export function pressaoFitossanitariaMedia(
  ocorrencias: Array<{ incidenciaPct?: number }> | undefined,
): number | null {
  if (!ocorrencias?.length) return null;
  const vals = ocorrencias.map((o) => o.incidenciaPct).filter((n): n is number => n != null && Number.isFinite(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function avg2(a?: number | null, b?: number | null): number | null {
  const nums = [a, b].filter((n): n is number => n != null && Number.isFinite(n));
  if (!nums.length) return null;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Primeira data (ISO) entre eventos com o mesmo DAA. */
export function earliestAppDateForDaa(
  apps: ReportApplicationEventV2Json[] | undefined,
  daa: number,
): string | undefined {
  if (!apps?.length) return undefined;
  const dates = apps.filter((e) => e.daa === daa && e.date?.trim()).map((e) => e.date!.trim());
  if (!dates.length) return undefined;
  return [...dates].sort()[0];
}

export type EvolucaoAvaliacaoRow = {
  /** Alinha com abas: 'pre' ou String(daa) */
  matchKey: string;
  chartTick: string;
  /** Data ISO opcional (formatar no UI) */
  dateIso?: string;
  controlePct: number;
  vigorPct: number;
};

/**
 * Pontos para gráfico estilo "evolução da avaliação" (controle + vigor, 0–100).
 * Sem série temporal no JSON, os valores entre pré e cada DAA usam interpolação linear
 * entre uma linha de base estimada e os KPIs consolidados do relatório.
 */
export function buildEvolucaoAvaliacaoRows(opts: {
  applications: ReportApplicationEventV2Json[];
  daaSorted: number[];
  includePre: boolean;
  kpisA?: KpisLike;
  kpisB?: KpisLike;
  pressaoFitoPct: number | null;
}): {
  rows: EvolucaoAvaliacaoRow[];
  usesInterpolation: boolean;
  labelSerieControle: string;
  labelSerieVigor: string;
} | null {
  const { applications, daaSorted, includePre, kpisA, kpisB, pressaoFitoPct } = opts;

  const weedAvg = avg2(kpisA?.controleDaninhasPct ?? null, kpisB?.controleDaninhasPct ?? null);
  const vigorPctExplicit = avg2(kpisA?.vigorCulturaPct ?? null, kpisB?.vigorCulturaPct ?? null);
  const effAvg = avg2(kpisA?.eficienciaPct ?? null, kpisB?.eficienciaPct ?? null);
  const vigFromRating = avg2(vigorPctFromKpis(kpisA), vigorPctFromKpis(kpisB));

  const explicitWeed = hasExplicitControleDaninhas(kpisA, kpisB);
  const explicitVigor = hasExplicitVigorCultura(kpisA, kpisB);

  let finalControle: number | null = weedAvg;
  if (finalControle == null) {
    finalControle = effAvg;
  }
  if (finalControle == null && pressaoFitoPct != null) {
    finalControle = clampPct(100 - pressaoFitoPct);
  }

  let finalVigor: number | null =
    vigorPctExplicit != null && vigorPctExplicit > 0 ? vigorPctExplicit : null;
  if (finalVigor == null) {
    finalVigor = vigFromRating != null && vigFromRating > 0 ? vigFromRating : null;
  }
  if (finalVigor == null) {
    finalVigor = avg2(performanceIndexFromKpis(kpisA), performanceIndexFromKpis(kpisB));
  }

  if (finalControle == null && finalVigor == null) return null;

  const fc = clampPct(finalControle ?? (finalVigor ?? 70) + 4);
  const fv = clampPct(finalVigor ?? (finalControle ?? 70) - 4);

  type M = { matchKey: string; chartTick: string; dateIso?: string };
  const meta: M[] = [];
  if (includePre) {
    meta.push({ matchKey: 'pre', chartTick: 'Pré-aplicação' });
  }
  for (const d of daaSorted) {
    meta.push({
      matchKey: String(d),
      chartTick: `${d} DAA`,
      dateIso: earliestAppDateForDaa(applications, d),
    });
  }
  if (meta.length === 0) {
    meta.push({ matchKey: 'pre', chartTick: 'Pré-aplicação' });
    meta.push({ matchKey: 'consolidado', chartTick: 'Consolidado' });
  } else if (meta.length === 1) {
    if (meta[0].matchKey === 'pre') {
      meta.push({ matchKey: 'consolidado', chartTick: 'Consolidado' });
    } else {
      meta.unshift({ matchKey: 'pre', chartTick: 'Pré-aplicação' });
    }
  }

  const n = meta.length;
  const preC = clampPct(fc - Math.max(6, fc * 0.08));
  const preV = clampPct(fv - Math.max(5, fv * 0.07));

  const rows: EvolucaoAvaliacaoRow[] = meta.map((m, i) => {
    const t = n <= 1 ? 1 : i / (n - 1);
    return {
      matchKey: m.matchKey,
      chartTick: m.chartTick,
      dateIso: m.dateIso,
      controlePct: Math.round(lerp(preC, fc, t)),
      vigorPct: Math.round(lerp(preV, fv, t)),
    };
  });

  const labelSerieControle = explicitWeed ? 'Controle de daninhas' : 'Desempenho agronômico (índice)';
  const labelSerieVigor = explicitVigor ? 'Vigor da cultura' : 'Vigor (índice)';

  return { rows, usesInterpolation: n >= 2, labelSerieControle, labelSerieVigor };
}
