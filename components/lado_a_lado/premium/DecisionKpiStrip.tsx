'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { DecisionLayerJson } from '@/lib/decisionLayer';
import { isColheitaJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import { heroFinancialSnapshot, productivityDeltaKgHaFromKpis } from './premiumInference';

type KpiTone = 'emerald' | 'blue' | 'amber' | 'slate';

function KpiCell({
  title,
  value,
  sub,
  tone,
  deltaPrefix,
}: {
  title: string;
  value: string;
  sub?: string | null;
  tone: KpiTone;
  deltaPrefix?: 'positive' | 'negative' | 'neutral';
}) {
  const subCls =
    deltaPrefix === 'positive'
      ? 'text-emerald-700'
      : deltaPrefix === 'negative'
        ? 'text-rose-700'
        : 'text-slate-500';
  const border =
    tone === 'emerald'
      ? 'border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 to-white'
      : tone === 'blue'
        ? 'border-blue-200/90 bg-gradient-to-b from-blue-50/90 to-white'
        : tone === 'amber'
          ? 'border-amber-200/80 bg-gradient-to-b from-amber-50/85 to-white'
          : 'border-slate-200/90 bg-gradient-to-b from-slate-50/90 to-white';

  return (
    <div className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm print:break-inside-avoid ${border}`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-lg sm:text-xl font-bold tabular-nums text-slate-900 mt-1.5 leading-tight">{value}</p>
      {sub ? <p className={`text-xs font-medium mt-1 ${subCls}`}>{sub}</p> : null}
    </div>
  );
}

function scFromSides(data: SideBySideReportData): {
  a: number | null;
  b: number | null;
  kg: number;
} {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kg = colheita?.kgPerSack ?? 60;
  if (!colheita?.sides?.length) return { a: null, b: null, kg };
  const rowA = colheita.sides.find((s) => s.side === 'A');
  const rowB = colheita.sides.find((s) => s.side === 'B');
  const toSc = (row: (typeof colheita.sides)[0] | undefined) => {
    if (!row) return null;
    if (row.yieldScHa != null && Number.isFinite(row.yieldScHa)) return row.yieldScHa;
    if (row.yieldKgHa != null && kg > 0) return row.yieldKgHa / kg;
    return null;
  };
  return { a: toSc(rowA), b: toSc(rowB), kg };
}

function estScDeltaFromKpis(data: SideBySideReportData, kg: number): { deltaSc: number | null; label: string } {
  const dKg = productivityDeltaKgHaFromKpis(data);
  if (dKg == null || !Number.isFinite(dKg) || kg <= 0) return { deltaSc: null, label: 'Estim. campo' };
  return { deltaSc: dKg / kg, label: 'Estim. campo' };
}

function riskFromPayload(dl: DecisionLayerJson | null | undefined): { label: string; tone: KpiTone } {
  const lines = (dl?.summaryLines as string[] | undefined) ?? [];
  const t = lines.join(' ').toLowerCase();
  if (t.includes('moderad')) return { label: 'Moderado', tone: 'amber' };
  if (t.includes('elevad') || t.includes('alto risco') || t.includes('crític')) {
    return { label: 'Elevado', tone: 'amber' };
  }
  if (t.includes('baix') && t.includes('risco')) return { label: 'Baixo', tone: 'emerald' };
  if (t.includes('controlad') || t.includes('favoráve')) return { label: 'Controlado', tone: 'emerald' };
  if (lines.length > 0) return { label: 'Revisar notas técnicas', tone: 'slate' };
  return { label: 'Sob análise', tone: 'slate' };
}

/**
 * Grelha 2×2 dedicada ao “painel de decisão” (referência mock enterprise).
 * Dados: colheita, motor `decision_layer`, `economic_analysis.roiAudit`, custo publicado.
 */
export default function DecisionKpiStrip({ data }: { data: SideBySideReportData }) {
  const dl = data.decision_layer as DecisionLayerJson | null | undefined;
  const fin = heroFinancialSnapshot(data);
  const { a: scA, b: scB, kg } = scFromSides(data);
  const { deltaSc, label: estLabel } = estScDeltaFromKpis(data, kg);
  const roiA = dl?.roiBySide?.A;
  const roiB = dl?.roiBySide?.B;
  const ecoSup = dl?.dataQuality?.enterpriseEconomicsSuppressed === true;
  const missCost = dl?.dataQuality?.missingCostData === true;

  const ea = data.economic_analysis as Record<string, unknown> | null | undefined;
  const roiAudit = ea?.roiAudit as
    | { A?: { roiType?: string }; B?: { roiType?: string } }
    | undefined;
  const uiL = (ea?.uiLabels as Record<string, string> | undefined) ?? {};
  const labelFor = (side: 'A' | 'B') => {
    const t = side === 'A' ? roiAudit?.A?.roiType : roiAudit?.B?.roiType;
    if (t === 'real') return uiL.real ?? 'Baseado em colheita';
    if (t === 'estimated') return uiL.estimated ?? 'Estimativa agronômica';
    return uiL.unavailable ?? 'Dados insuficientes';
  };

  const wEngine = dl?.engineRoiWinner;
  const preferSide: 'A' | 'B' = wEngine === 'A' || wEngine === 'B' ? wEngine : 'B';
  const roiRef = preferSide === 'A' ? roiA : roiB;
  const roiAlt = preferSide === 'A' ? roiB : roiA;
  const roiPct = roiRef?.roiPct;

  let prodValue = '—';
  let prodSub: string | null = null;
  let prodPos: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (scA != null && scB != null) {
    prodValue = `${formatNumber(scB, { decimals: 1 })} sc/ha (B)`;
    if (fin.deltaScHa != null) {
      prodSub = `B vs A: ${fin.deltaScHa > 0 ? '+' : ''}${formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha`;
      prodPos = fin.deltaScHa > 0 ? 'positive' : fin.deltaScHa < 0 ? 'negative' : 'neutral';
    }
  } else if (scB != null) {
    prodValue = `${formatNumber(scB, { decimals: 1 })} sc/ha (B)`;
  } else if (scA != null) {
    prodValue = `${formatNumber(scA, { decimals: 1 })} sc/ha (A)`;
  } else if (deltaSc != null) {
    prodValue = 'Produt. estimada';
    prodSub = `Δ B−A: ${deltaSc > 0 ? '+' : ''}${formatNumber(deltaSc, { decimals: 1 })} sc/ha · ${estLabel}`;
    prodPos = deltaSc > 0 ? 'positive' : deltaSc < 0 ? 'negative' : 'neutral';
  }

  const costA = roiA?.costBrlHa ?? roiA?.costPerHa;
  const costB = roiB?.costBrlHa ?? roiB?.costPerHa;
  let costValue = '—';
  let costSub: string | null = null;
  let costPos: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (costA != null && costB != null) {
    costValue = `B: R$ ${formatNumber(costB, { decimals: 0 })}/ha`;
    const d = costB - costA;
    costSub = `Δ B−A: ${d > 0 ? '+' : ''}R$ ${formatNumber(d, { decimals: 0 })}/ha`;
    costPos = d < 0 ? 'positive' : d > 0 ? 'negative' : 'neutral';
  } else if (missCost) {
    costValue = 'Custo incompleto';
    costSub = 'Fechar insumos por manejo';
  } else if (costB != null) {
    costValue = `B: R$ ${formatNumber(costB, { decimals: 0 })}/ha`;
  }

  let roiValue = '—';
  let roiSubText: string | null = null;
  if (ecoSup || roiRef?.economicsSuppressed) {
    roiValue = 'Indisponível';
    roiSubText = labelFor(preferSide);
  } else if (roiPct != null) {
    roiValue = `${formatNumber(roiPct, { decimals: 0 })}%`;
    const other =
      roiAlt?.roiPct != null ? ` · outro manejo ${formatNumber(roiAlt.roiPct, { decimals: 0 })}%` : '';
    if (fin.gainBrlHa != null && Math.abs(fin.gainBrlHa) >= 0.5) {
      roiSubText = `${labelFor(preferSide)}${other} · receita bruta est. Δ ${fin.gainBrlHa > 0 ? '+' : ''}R$ ${formatNumber(fin.gainBrlHa, { decimals: 0 })}/ha`;
    } else {
      roiSubText = `${labelFor(preferSide)}${other} · margem ÷ custo (motor)`;
    }
  } else {
    roiSubText = labelFor(preferSide);
  }
  const roiTone: KpiTone =
    ecoSup || roiRef?.economicsSuppressed
      ? 'slate'
      : (roiAudit?.B?.roiType ?? 'unavailable') === 'real' || (roiAudit?.A?.roiType ?? '') === 'real'
        ? 'emerald'
        : (roiAudit?.B?.roiType === 'estimated' || roiAudit?.A?.roiType === 'estimated')
          ? 'amber'
          : 'slate';

  const risk = riskFromPayload(dl);

  return (
    <div
      className="grid grid-cols-2 gap-3 sm:gap-4 mt-4 print:break-inside-avoid"
      aria-label="Indicadores executivos do comparativo"
    >
      <KpiCell
        title="Produtividade"
        value={prodValue}
        sub={prodSub}
        tone="emerald"
        deltaPrefix={prodPos}
      />
      <KpiCell
        title="ROI ajustado"
        value={roiValue}
        sub={roiSubText}
        tone={roiTone}
        deltaPrefix="neutral"
      />
      <KpiCell
        title="Custo / ha (motor)"
        value={costValue}
        sub={costSub}
        tone="blue"
        deltaPrefix={costPos}
      />
      <KpiCell
        title="Risco agronômico"
        value={risk.label}
        sub="Classificação a partir de notas do motor"
        tone={risk.tone}
        deltaPrefix="neutral"
      />
    </div>
  );
}
