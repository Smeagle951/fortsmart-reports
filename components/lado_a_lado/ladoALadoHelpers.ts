import type {
  ColheitaJson,
  CustoJson,
  ReportApplicationEventV2Json,
  ReportPhotoWeb,
} from '@/types/side-by-side-report';

export const COLOR_SIDE_A = '#2563eb';
export const COLOR_SIDE_B = '#16a34a';

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
};

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
  const vig = vigorPctFromKpis(kpis);
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
