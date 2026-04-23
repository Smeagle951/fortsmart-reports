import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { vigorPctFromKpis, rootPctFromKpis } from '@/components/lado_a_lado/ladoALadoHelpers';
import { scoresFromJson } from './premiumInference';

function vigorLabelToNum(v: string | undefined): number {
  if (!v) return 0;
  const x = v.toLowerCase();
  if (x.includes('alto')) return 100;
  if (x.includes('médio') || x.includes('medio')) return 60;
  return 35;
}

/** Linhas para RadarChart Recharts (0–100). */
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
      subject: 'Estande',
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

  const bothSidesKpi = kpisA != null && kpisB != null;
  const withSignal = rows.filter((r) => r.A > 0 || r.B > 0);
  if (withSignal.length >= 3) return withSignal;

  const sc = scoresFromJson(data);
  const scorePad =
    sc.a != null && sc.b != null && Number.isFinite(sc.a) && Number.isFinite(sc.b)
      ? ([
          { subject: 'Índice técnico', A: sc.a, B: sc.b, fullMark: 100 },
          {
            subject: 'Referência A',
            A: Math.max(12, Math.round(sc.a * 0.88)),
            B: Math.max(12, Math.round(sc.b * 0.92)),
            fullMark: 100,
          },
          {
            subject: 'Referência B',
            A: Math.max(12, Math.round(sc.a * 0.92)),
            B: Math.max(12, Math.round(sc.b * 0.88)),
            fullMark: 100,
          },
        ] as const)
      : null;

  if (withSignal.length >= 2) return withSignal;
  if (withSignal.length === 1 && scorePad) {
    const merged = [withSignal[0], ...scorePad.filter((p) => p.subject !== withSignal[0].subject)];
    return merged.slice(0, 6);
  }
  if (scorePad) return [...scorePad];

  return bothSidesKpi ? rows : withSignal;
}
