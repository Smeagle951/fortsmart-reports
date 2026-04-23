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

/** Linhas para RadarChart Recharts (0–100), só a partir de KPIs / fenologia / produtividade publicados — sem eixos sintéticos. */
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

  const withSignal = rows.filter((r) => r.A > 0 || r.B > 0);
  if (withSignal.length > 0) return withSignal;

  const sc = scoresFromJson(data);
  if (sc.a != null && sc.b != null && Number.isFinite(sc.a) && Number.isFinite(sc.b)) {
    return [{ subject: 'Índice técnico (0–100)', A: sc.a, B: sc.b, fullMark: 100 }];
  }

  return [];
}
