import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { distinctApplicationDaas } from '@/components/lado_a_lado/ladoALadoHelpers';
import { scoresFromJson } from '../premiumInference';

export type IndexEvolutionRow = { tick: string; iA: number; iB: number };

/**
 * DAA distintos: primeiro `applications` (V2); se vazio, usa DAE/DAP do bloco de coleta como referência
 * de progreso (ensaios sem eventos ainda publicados com DAA).
 */
function distinctDaasForEvolution(data: SideBySideReportData): number[] {
  const fromV2 = distinctApplicationDaas(data.applications);
  if (fromV2.length > 0) return fromV2;
  const dae = data.coleta?.dae ?? data.coleta?.dap;
  if (typeof dae === 'number' && Number.isFinite(dae) && dae >= 0) {
    return [Math.max(0, Math.round(dae))];
  }
  return [];
}

/**
 * Série "Índice vs tempo": Pré-safra (interpolado) → cada DAA com aplicação → Atual.
 * Com um único score inferido, duplica o par com ligeiro desvio para a linha A/B não colapsar.
 */
export function buildIndexEvolutionRows(data: SideBySideReportData): IndexEvolutionRow[] {
  let { a: sa, b: sb } = scoresFromJson(data);
  if (sa == null && sb == null) {
    return [];
  }
  if (sa == null && sb != null) {
    sa = Math.max(0, Math.min(100, Math.round(sb * 0.97)));
  }
  if (sb == null && sa != null) {
    sb = Math.max(0, Math.min(100, Math.round(sa * 0.97)));
  }
  if (sa == null || sb == null) {
    return [];
  }

  const daas = distinctDaasForEvolution(data);
  const baseA = Math.round(Math.max(35, sa * 0.82));
  const baseB = Math.round(Math.max(35, sb * 0.82));
  const rows: IndexEvolutionRow[] = [{ tick: 'Início', iA: baseA, iB: baseB }];

  const n = daas.length;
  daas.forEach((d, idx) => {
    const t = n > 0 ? (idx + 1) / (n + 1) : 1;
    rows.push({
      tick: `${d} DAA`,
      iA: Math.round(baseA + (sa! - baseA) * t),
      iB: Math.round(baseB + (sb! - baseB) * t),
    });
  });

  rows.push({ tick: 'Atual', iA: Math.round(sa), iB: Math.round(sb) });
  return rows;
}
