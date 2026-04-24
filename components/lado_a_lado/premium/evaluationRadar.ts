import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { vigorPctFromKpis, rootPctFromKpis } from '@/components/lado_a_lado/ladoALadoHelpers';
import { scoresFromJson } from './premiumInference';

function vigorLabelToNum(v: string | undefined): number {
  if (!v) return 0;
  const t = v.trim();
  const asNum = Number(t.replace(',', '.'));
  if (Number.isFinite(asNum) && asNum > 0) {
    if (asNum <= 5) return Math.min(100, asNum * 20);
    if (asNum <= 10) return Math.min(100, asNum * 10);
    return Math.min(100, asNum);
  }
  const lower = t.toLowerCase();
  if (lower.includes('alto')) return 100;
  if (lower.includes('médio') || lower.includes('medio')) return 60;
  return 35;
}

function rowNumeric(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const m = /^-?\d+([.,]\d+)?/.exec(v.replace(/\s/g, ''));
    if (!m) return null;
    const n = Number(m[0].replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function matches(label: string, kws: string[]): boolean {
  const l = label.toLowerCase();
  return kws.some((k) => l.includes(k.toLowerCase()));
}

/** Eixos derivados de `summary_rows` quando fenologia/KPIs não preenchem o radar sozinhos. */
function buildRadarFromSummaryRows(data: SideBySideReportData): { subject: string; A: number; B: number; fullMark: number }[] {
  const rows = data.summary_rows;
  if (!Array.isArray(rows) || rows.length === 0) return [];

  let vigorA = 0;
  let vigorB = 0;
  let uniA = 0;
  let uniB = 0;
  let estA = 0;
  let estB = 0;
  let fenA = 0;
  let fenB = 0;
  let idxA = 0;
  let idxB = 0;

  for (const row of rows) {
    const r = row as Record<string, unknown>;
    const label = String(r.criteria ?? r.criterio ?? '').trim();
    if (!label) continue;
    const va = rowNumeric(r.value_a_num ?? r.value_a);
    const vb = rowNumeric(r.value_b_num ?? r.value_b);
    if (va == null || vb == null) continue;

    const scale = (x: number, y: number): [number, number] => {
      if (x <= 10 && y <= 10 && x === Math.round(x) && y === Math.round(y)) return [x * 10, y * 10];
      if (x <= 5 && y <= 5 && x === Math.round(x) && y === Math.round(y)) return [x * 20, y * 20];
      const m = Math.max(x, y, 1e-6);
      if (m > 100) return [(x / m) * 100, (y / m) * 100];
      return [Math.min(100, Math.max(0, x)), Math.min(100, Math.max(0, y))];
    };

    const [a, b] = scale(va, vb);

    if (matches(label, ['vigor'])) {
      vigorA = a;
      vigorB = b;
    } else if (matches(label, ['uniformidade', 'uniformity'])) {
      uniA = a;
      uniB = b;
    } else if (
      matches(label, [
        'população',
        'populacao',
        'estande',
        'pl/ha',
        'plantas',
        'densidade',
        'estande efet',
      ])
    ) {
      estA = a;
      estB = b;
    } else if (matches(label, ['estádio', 'estadio', 'fenologia', 'estágio', 'v'])) {
      fenA = a;
      fenB = b;
    } else if (matches(label, ['nota geral', 'índice técnico', 'indice tecnico', 'desempenho', 'score'])) {
      idxA = a;
      idxB = b;
    }
  }

  const out: { subject: string; A: number; B: number; fullMark: number }[] = [];
  if (vigorA > 0 || vigorB > 0) out.push({ subject: 'Vigor', A: vigorA, B: vigorB, fullMark: 100 });
  if (uniA > 0 || uniB > 0) out.push({ subject: 'Uniformidade', A: uniA, B: uniB, fullMark: 100 });
  if (estA > 0 || estB > 0) out.push({ subject: 'Estande / população', A: estA, B: estB, fullMark: 100 });
  if (fenA > 0 || fenB > 0) out.push({ subject: 'Fenologia', A: fenA, B: fenB, fullMark: 100 });
  if (idxA > 0 || idxB > 0) out.push({ subject: 'Índice (notas)', A: idxA, B: idxB, fullMark: 100 });

  return out;
}

/** Linhas para RadarChart Recharts (0–100), a partir de KPIs, fenologia e, em último caso, `summary_rows`. */
export function buildPremiumRadarRows(data: SideBySideReportData): {
  subject: string;
  A: number;
  B: number;
  fullMark: number;
}[] {
  const kpisA = data.sideA?.kpis;
  const kpisB = data.sideB?.kpis;
  const ph = data.phenology;

  const rows: { subject: string; A: number; B: number; fullMark: number }[] = [
    {
      subject: 'Vigor',
      A: vigorLabelToNum(ph?.sideA?.vigor) || vigorPctFromKpis(kpisA) || (kpisA?.vigorRating?.score ?? 0) * 25,
      B: vigorLabelToNum(ph?.sideB?.vigor) || vigorPctFromKpis(kpisB) || (kpisB?.vigorRating?.score ?? 0) * 25,
      fullMark: 100,
    },
    {
      subject: 'Uniformidade',
      A: vigorLabelToNum(ph?.sideA?.uniformidade),
      B: vigorLabelToNum(ph?.sideB?.uniformidade),
      fullMark: 100,
    },
    {
      subject: 'Raiz',
      A: rootPctFromKpis(kpisA),
      B: rootPctFromKpis(kpisB),
      fullMark: 100,
    },
    {
      subject: 'Estande (efic. %)',
      A: kpisA?.eficienciaPct ?? 0,
      B: kpisB?.eficienciaPct ?? 0,
      fullMark: 100,
    },
  ];

  const yieldA = kpisA?.estimatedYieldKgHa ?? 0;
  const yieldB = kpisB?.estimatedYieldKgHa ?? 0;
  if (yieldA > 0 || yieldB > 0) {
    const maxY = Math.max(yieldA, yieldB, 1);
    rows.push({
      subject: 'Produtividade',
      A: yieldA > 0 ? Math.min(100, (yieldA / maxY) * 100) : 0,
      B: yieldB > 0 ? Math.min(100, (yieldB / maxY) * 100) : 0,
      fullMark: 100,
    });
  }

  const withSignal = rows.filter((r) => r.A > 0 || r.B > 0);
  if (withSignal.length > 0) return withSignal;

  const fromSummary = buildRadarFromSummaryRows(data);
  if (fromSummary.length > 0) return fromSummary;

  const sc = scoresFromJson(data);
  if (sc.a != null && sc.b != null && Number.isFinite(sc.a) && Number.isFinite(sc.b)) {
    return [{ subject: 'Índice técnico (0–100)', A: sc.a, B: sc.b, fullMark: 100 }];
  }

  return [];
}
