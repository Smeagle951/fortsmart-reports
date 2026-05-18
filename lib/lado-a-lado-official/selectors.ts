import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  costPerHaPair,
  isFiniteNumber,
  marginBrlHaPair,
  productivityScHaPair,
  revenueBrlHaPair,
  roiPctPair,
} from '@/lib/ladoALadoEnterpriseMetrics';
import { displayWinnerLetter, heroFinancialSnapshot } from '@/components/lado_a_lado/premium/premiumInference';
import { isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';

export type ComparisonRow = {
  metric: string;
  a: string;
  b: string;
  diff: string;
  better?: 'A' | 'B' | null;
};

export type ExecutiveKpi = {
  id: string;
  label: string;
  value: string;
  hint?: string;
  tone: 'green' | 'blue' | 'purple' | 'orange' | 'slate';
};

export function reportStatus(data: SideBySideReportData): 'concluido' | 'andamento' {
  if (data.resumo?.statusConcluida === true) return 'concluido';
  if (data.conclusion?.summary?.trim()) return 'concluido';
  return 'andamento';
}

export function sideLabel(data: SideBySideReportData, side: 'A' | 'B'): string {
  const s = side === 'A' ? data.sideA : data.sideB;
  return s?.name?.trim() || s?.label?.trim() || `Lado ${side}`;
}

export function isControlSide(data: SideBySideReportData, side: 'A' | 'B'): boolean {
  const tp = data.treatment_protocol?.sides?.find((x) => x.side === side);
  if (tp?.is_control_side) return true;
  return false;
}

export function executiveKpis(data: SideBySideReportData): ExecutiveKpi[] {
  const winner = displayWinnerLetter(data);
  const prod = productivityScHaPair(data);
  const fin = heroFinancialSnapshot(data);
  const roi = roiPctPair(data);
  const conf =
    data.meta?.confidenceScore ??
    (data.decision_layer?.fortsmart_ai as { confidencePct?: number } | undefined)?.confidencePct;

  const winnerLabel = winner
    ? `${sideLabel(data, winner)} (Lado ${winner})`
    : 'dados insuficientes';

  let prodDiff = 'dados insuficientes';
  if (prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)) {
    const d = prod.b - prod.a;
    const pct = prod.a !== 0 ? (d / prod.a) * 100 : null;
    prodDiff =
      pct != null
        ? `${d >= 0 ? '+' : ''}${formatNumber(d, { decimals: 1 })} sc/ha (${pct >= 0 ? '+' : ''}${formatNumber(pct, { decimals: 1 })}%)`
        : `${d >= 0 ? '+' : ''}${formatNumber(d, { decimals: 1 })} sc/ha`;
  }

  const gainBrl = fin?.gainBrlHa;
  const gain =
    gainBrl != null && Number.isFinite(gainBrl)
      ? `R$ ${formatNumber(gainBrl, { decimals: 2 })}/ha`
      : 'dados insuficientes';

  let roiText = 'dados insuficientes';
  if (roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)) {
    const best = Math.max(roi.a, roi.b);
    roiText = `${formatNumber(best / 100, { decimals: 1 })}x`;
  }

  let confText = 'dados insuficientes';
  if (conf != null && Number.isFinite(conf)) {
    const level = conf >= 75 ? 'Alta' : conf >= 50 ? 'Média' : 'Baixa';
    confText = `${level} (${Math.round(conf)}%)`;
  }

  return [
    { id: 'winner', label: 'Melhor Tratamento', value: winnerLabel, tone: 'green' },
    { id: 'prod', label: 'Diferença Produtividade', value: prodDiff, tone: 'blue' },
    { id: 'margin', label: 'Ganho Líquido', value: gain, tone: 'purple' },
    { id: 'roi', label: 'ROI Estimado', value: roiText, tone: 'orange' },
    { id: 'ai', label: 'Confiança da Análise IA', value: confText, tone: 'green' },
  ];
}

export function comparisonRows(data: SideBySideReportData): ComparisonRow[] {
  const prod = productivityScHaPair(data);
  const cost = costPerHaPair(data);
  const rev = revenueBrlHaPair(data, prod?.a ?? null, prod?.b ?? null);
  const margin = marginBrlHaPair(rev, cost);
  const roi = roiPctPair(data);
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const areaA = colheita?.sides?.find((s) => s.side === 'A')?.areaHa;
  const areaB = colheita?.sides?.find((s) => s.side === 'B')?.areaHa;
  const farmHa = data.farm?.areaHa;

  const fmt = (n: number | null | undefined, suffix = '') =>
    n != null && Number.isFinite(n) ? `${formatNumber(n, { decimals: 2 })}${suffix}` : '—';

  const rows: ComparisonRow[] = [
    {
      metric: 'Área (ha)',
      a: fmt(areaA ?? farmHa),
      b: fmt(areaB ?? farmHa),
      diff: '—',
    },
    {
      metric: 'Produtividade (sc/ha)',
      a: fmt(prod?.a),
      b: fmt(prod?.b),
      diff:
        prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
          ? `${prod.b - prod.a >= 0 ? '+' : ''}${formatNumber(prod.b - prod.a, { decimals: 1 })}`
          : '—',
      better:
        prod && isFiniteNumber(prod.a) && isFiniteNumber(prod.b)
          ? prod.b > prod.a
            ? 'B'
            : prod.b < prod.a
              ? 'A'
              : null
          : null,
    },
    {
      metric: 'Custo total (R$/ha)',
      a: fmt(cost?.a, ''),
      b: fmt(cost?.b, ''),
      diff:
        cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b)
          ? formatNumber(cost.b - cost.a, { decimals: 2 })
          : '—',
      better:
        cost && isFiniteNumber(cost.a) && isFiniteNumber(cost.b)
          ? cost.b < cost.a
            ? 'B'
            : cost.a < cost.b
              ? 'A'
              : null
          : null,
    },
    {
      metric: 'Receita bruta (R$/ha)',
      a: fmt(rev?.a),
      b: fmt(rev?.b),
      diff:
        rev && isFiniteNumber(rev.a) && isFiniteNumber(rev.b)
          ? formatNumber(rev.b - rev.a, { decimals: 2 })
          : '—',
      better:
        rev && isFiniteNumber(rev.a) && isFiniteNumber(rev.b)
          ? rev.b > rev.a
            ? 'B'
            : rev.a > rev.b
              ? 'A'
              : null
          : null,
    },
    {
      metric: 'Margem líquida (R$/ha)',
      a: fmt(margin?.a),
      b: fmt(margin?.b),
      diff:
        margin && isFiniteNumber(margin.a) && isFiniteNumber(margin.b)
          ? formatNumber(margin.b - margin.a, { decimals: 2 })
          : '—',
      better:
        margin && isFiniteNumber(margin.a) && isFiniteNumber(margin.b)
          ? margin.b > margin.a
            ? 'B'
            : margin.a > margin.b
              ? 'A'
              : null
          : null,
    },
    {
      metric: 'ROI (%)',
      a: roi?.a != null ? `${formatNumber(roi.a, { decimals: 1 })}%` : '—',
      b: roi?.b != null ? `${formatNumber(roi.b, { decimals: 1 })}%` : '—',
      diff:
        roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)
          ? `${formatNumber(roi.b - roi.a, { decimals: 1 })} pp`
          : '—',
      better:
        roi && isFiniteNumber(roi.a) && isFiniteNumber(roi.b)
          ? roi.b > roi.a
            ? 'B'
            : roi.a > roi.b
              ? 'A'
              : null
          : null,
    },
  ];

  return rows;
}

export function collectPhotos(data: SideBySideReportData) {
  const out: Array<{
    url?: string;
    base64?: string;
    caption?: string;
    side?: 'A' | 'B';
    category?: string;
  }> = [];
  for (const p of data.sideA?.photos ?? []) {
    out.push({ url: p.url, base64: p.imageBase64Jpg, caption: p.caption, side: 'A', category: p.category });
  }
  for (const p of data.sideB?.photos ?? []) {
    out.push({ url: p.url, base64: p.imageBase64Jpg, caption: p.caption, side: 'B', category: p.category });
  }
  return out;
}

export function fieldCollectionRows(data: SideBySideReportData) {
  const rows = data.criteriosEstatistica ?? [];
  return rows.map((r) => ({
    criterio: r.criterio ?? '—',
    unidade: r.unidade ?? '',
    a: r.mediaA,
    b: r.mediaB,
    diff:
      r.mediaA != null && r.mediaB != null && Number.isFinite(r.mediaA) && Number.isFinite(r.mediaB)
        ? r.mediaB - r.mediaA
        : null,
  }));
}
