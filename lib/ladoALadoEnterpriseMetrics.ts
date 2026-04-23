/**
 * Métricas puras para o layout enterprise (evita duplicar lógica em vários componentes).
 */
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';

export function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

export function productivityScHaPair(data: SideBySideReportData): {
  a: number | null;
  b: number | null;
} | null {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kgPerSack = colheita?.kgPerSack ?? 60;
  const rowA = colheita?.sides?.find((side) => side.side === 'A');
  const rowB = colheita?.sides?.find((side) => side.side === 'B');

  if (isFiniteNumber(rowA?.yieldScHa) && isFiniteNumber(rowB?.yieldScHa)) {
    return { a: rowA!.yieldScHa!, b: rowB!.yieldScHa! };
  }
  if (isFiniteNumber(rowA?.yieldKgHa) && isFiniteNumber(rowB?.yieldKgHa) && kgPerSack > 0) {
    return { a: rowA!.yieldKgHa! / kgPerSack, b: rowB!.yieldKgHa! / kgPerSack };
  }
  const a = data.sideA?.kpis?.estimatedYieldKgHa;
  const b = data.sideB?.kpis?.estimatedYieldKgHa;
  if (isFiniteNumber(a) && isFiniteNumber(b) && kgPerSack > 0) {
    return { a: a / kgPerSack, b: b / kgPerSack };
  }
  return null;
}

export function roiPctPair(data: SideBySideReportData): { a: number | null; b: number | null } | null {
  const rb = data.decision_layer?.roiBySide;
  const a = rb?.A?.roiPct ?? (rb as Record<string, { roiPct?: number }> | undefined)?.a?.roiPct;
  const b = rb?.B?.roiPct ?? (rb as Record<string, { roiPct?: number }> | undefined)?.b?.roiPct;
  if (isFiniteNumber(a) && isFiniteNumber(b)) return { a, b };
  const sides = data.decision_layer?.fortsmart_ai?.economic?.sides as Record<string, { roiPct?: number }> | undefined;
  if (!sides) return null;
  const a2 = sides.A?.roiPct ?? sides.a?.roiPct;
  const b2 = sides.B?.roiPct ?? sides.b?.roiPct;
  if (isFiniteNumber(a2) && isFiniteNumber(b2)) return { a: a2, b: b2 };
  return null;
}

export function costPerHaPair(data: SideBySideReportData): { a: number | null; b: number | null } | null {
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const rows = custo?.by_side;
  if (!rows?.length) return null;
  const mapA = rows.find((r) => r.side === 'A');
  const mapB = rows.find((r) => r.side === 'B');
  const a = mapA?.costPerHa ?? (mapA?.totalCost != null ? Number(mapA.totalCost) : null);
  const b = mapB?.costPerHa ?? (mapB?.totalCost != null ? Number(mapB.totalCost) : null);
  if (!isFiniteNumber(a) && !isFiniteNumber(b)) return null;
  return { a: isFiniteNumber(a) ? a : null, b: isFiniteNumber(b) ? b : null };
}

export type RiskLevel = 'Alto' | 'Moderado' | 'Baixo';

export function riskFromOcorrencias(data: SideBySideReportData): RiskLevel | null {
  const ocorrencias = data.ocorrencias;
  if (!Array.isArray(ocorrencias) || ocorrencias.length === 0) return null;
  const max = Math.max(
    ...ocorrencias.map((o) =>
      typeof o.incidenciaPct === 'number' && Number.isFinite(o.incidenciaPct) ? o.incidenciaPct : 0,
    ),
  );
  const sevHigh = ocorrencias.some((o) => {
    const s = `${o.severidade || ''}`.toLowerCase();
    return s.includes('alta') || s.includes('muito');
  });
  if (sevHigh || max > 30) return 'Alto';
  if (max > 15) return 'Moderado';
  return 'Baixo';
}

export function revenueBrlHaPair(
  data: SideBySideReportData,
  scA: number | null,
  scB: number | null,
): { a: number | null; b: number | null } | null {
  const preco = data.economia?.preco_saca_brl;
  if (preco == null || preco <= 0) return null;
  if (!isFiniteNumber(scA) || !isFiniteNumber(scB)) return null;
  return { a: scA * preco, b: scB * preco };
}

export function marginBrlHaPair(
  rev: { a: number | null; b: number | null } | null,
  cost: { a: number | null; b: number | null } | null,
): { a: number | null; b: number | null } | null {
  if (!rev || !cost) return null;
  if (!isFiniteNumber(rev.a) || !isFiniteNumber(rev.b)) return null;
  if (!isFiniteNumber(cost.a) || !isFiniteNumber(cost.b)) return null;
  return { a: rev.a - cost.a, b: rev.b - cost.b };
}
