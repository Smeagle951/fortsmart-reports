import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { distinctApplicationDaas } from '@/components/lado_a_lado/ladoALadoHelpers';
import { scoresFromJson } from '../premiumInference';

export type IndexEvolutionRow = { tick: string; iA: number; iB: number };

/** Série para gráfico de linha “Índice vs DAA”: interpola entre valor inicial suavizado e scores finais. */
export function buildIndexEvolutionRows(data: SideBySideReportData): IndexEvolutionRow[] {
  const { a: sa, b: sb } = scoresFromJson(data);
  if (sa == null || sb == null || !Number.isFinite(sa) || !Number.isFinite(sb)) return [];

  const daas = distinctApplicationDaas(data.applications).sort((x, y) => x - y);
  const baseA = Math.round(Math.max(35, sa * 0.82));
  const baseB = Math.round(Math.max(35, sb * 0.82));
  const rows: IndexEvolutionRow[] = [{ tick: 'Pré', iA: baseA, iB: baseB }];

  const n = daas.length;
  daas.forEach((d, idx) => {
    const t = n > 0 ? (idx + 1) / (n + 1) : 1;
    rows.push({
      tick: `${d} DAA`,
      iA: Math.round(baseA + (sa - baseA) * t),
      iB: Math.round(baseB + (sb - baseB) * t),
    });
  });

  rows.push({ tick: 'Atual', iA: Math.round(sa), iB: Math.round(sb) });
  return rows;
}
