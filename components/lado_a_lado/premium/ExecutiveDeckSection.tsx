'use client';

import React, { useMemo } from 'react';
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  COLOR_SIDE_A,
  COLOR_SIDE_B,
  isColheitaJson,
  pickHeroPhoto,
  pressaoFitossanitariaMedia,
} from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import { buildPremiumRadarRows } from './evaluationRadar';
import EconomicTimelineChart from './EconomicTimelineChart';
import { heroFinancialSnapshot, scoresFromJson, winnerFromJson } from './premiumInference';

type ComparableMetric = {
  key: string;
  label: string;
  sourceLabel: string;
  a: number;
  b: number;
  formatValue: (value: number) => string;
};

type EvidenceRow = {
  label: string;
  aValue: string;
  bValue: string;
  winner: 'A' | 'B' | 'tie' | null;
  note?: string | null;
};

type ExecutiveCardTone = 'emerald' | 'blue' | 'amber' | 'slate';

const TAB_TARGETS: { id: string; label: string }[] = [
  { id: 'deck-executivo-premium', label: 'Resumo' },
  { id: 'kpis-premium', label: 'KPIs' },
  { id: 'comparativo-premium', label: 'Comparativo' },
  { id: 'coleta-modulos-premium', label: 'Coleta' },
  { id: 'execucao-premium', label: 'Aplicações' },
  { id: 'avaliacao-premium', label: 'Evidências' },
  { id: 'conclusao-premium', label: 'Conclusão' },
];

function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function cardToneClasses(tone: ExecutiveCardTone): string {
  if (tone === 'emerald') {
    return 'border-emerald-200 bg-emerald-50/80 text-emerald-950';
  }
  if (tone === 'blue') {
    return 'border-blue-200 bg-blue-50/85 text-blue-950';
  }
  if (tone === 'amber') {
    return 'border-amber-200 bg-amber-50/85 text-amber-950';
  }
  return 'border-slate-200 bg-slate-50/90 text-slate-900';
}

function formatSignedDelta(value: number, decimals = 0): string {
  return `${value > 0 ? '+' : ''}${formatNumber(value, { decimals })}`;
}

function toComparableScore(
  label: string,
  sourceLabel: string,
  a: number | null | undefined,
  b: number | null | undefined,
  formatValue: (value: number) => string,
): ComparableMetric | null {
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return null;
  return { key: label.toLowerCase(), label, sourceLabel, a, b, formatValue };
}

function buildComparableMetrics(data: SideBySideReportData): ComparableMetric[] {
  const kA = data.sideA?.kpis;
  const kB = data.sideB?.kpis;
  const rows: ComparableMetric[] = [];

  const standMetric =
    toComparableScore(
      'Estande',
      'Eficiência de estande publicada',
      kA?.eficienciaPct,
      kB?.eficienciaPct,
      (value) => `${formatNumber(value, { decimals: 0 })}%`,
    ) ||
    toComparableScore(
      'Estande efetivo',
      'Estande efetivo publicado',
      kA?.estandeEfetivo,
      kB?.estandeEfetivo,
      (value) => `${formatNumber(value, { decimals: 0 })}%`,
    ) ||
    toComparableScore(
      'População final',
      'População final publicada',
      kA?.finalPopulationPlHa,
      kB?.finalPopulationPlHa,
      (value) => `${formatNumber(value, { decimals: 0 })} pl/ha`,
    );

  if (standMetric) rows.push(standMetric);

  const vigorMetric =
    toComparableScore(
      'Vigor',
      'Vigor da cultura publicado',
      kA?.vigorCulturaPct,
      kB?.vigorCulturaPct,
      (value) => `${formatNumber(value, { decimals: 0 })}%`,
    ) ||
    (() => {
      const aScore = kA?.vigorRating?.score;
      const bScore = kB?.vigorRating?.score;
      const maxA = kA?.vigorRating?.max ?? 0;
      const maxB = kB?.vigorRating?.max ?? 0;
      if (!isFiniteNumber(aScore) || !isFiniteNumber(bScore) || maxA <= 0 || maxB <= 0 || maxA !== maxB) {
        return null;
      }
      return toComparableScore(
        'Vigor',
        `Escala publicada ${maxA}`,
        aScore,
        bScore,
        (value) => `${formatNumber(value, { decimals: 1 })}/${maxA}`,
      );
    })();

  if (vigorMetric) rows.push(vigorMetric);

  const rootMetric =
    (() => {
      const aScore = kA?.rootRating?.score;
      const bScore = kB?.rootRating?.score;
      const maxA = kA?.rootRating?.max ?? 0;
      const maxB = kB?.rootRating?.max ?? 0;
      if (!isFiniteNumber(aScore) || !isFiniteNumber(bScore) || maxA <= 0 || maxB <= 0 || maxA !== maxB) {
        return null;
      }
      return toComparableScore(
        'Raiz',
        `Escala radicular ${maxA}`,
        aScore,
        bScore,
        (value) => `${formatNumber(value, { decimals: 1 })}/${maxA}`,
      );
    })() ||
    toComparableScore(
      'Profundidade de raiz',
      'Profundidade radicular publicada',
      kA?.profundidadeRaizCm,
      kB?.profundidadeRaizCm,
      (value) => `${formatNumber(value, { decimals: 0 })} cm`,
    );

  if (rootMetric) rows.push(rootMetric);

  return rows;
}

function productivitySnapshot(data: SideBySideReportData): {
  a: number | null;
  b: number | null;
  sourceLabel: string;
} | null {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kgPerSack = colheita?.kgPerSack ?? 60;
  const rowA = colheita?.sides?.find((side) => side.side === 'A');
  const rowB = colheita?.sides?.find((side) => side.side === 'B');

  if (isFiniteNumber(rowA?.yieldScHa) && isFiniteNumber(rowB?.yieldScHa)) {
    return { a: rowA.yieldScHa, b: rowB.yieldScHa, sourceLabel: 'Colheita publicada' };
  }

  if (isFiniteNumber(rowA?.yieldKgHa) && isFiniteNumber(rowB?.yieldKgHa) && kgPerSack > 0) {
    return {
      a: rowA.yieldKgHa / kgPerSack,
      b: rowB.yieldKgHa / kgPerSack,
      sourceLabel: 'Colheita convertida de kg/ha para sc/ha',
    };
  }

  const a = data.sideA?.kpis?.estimatedYieldKgHa;
  const b = data.sideB?.kpis?.estimatedYieldKgHa;
  if (isFiniteNumber(a) && isFiniteNumber(b) && kgPerSack > 0) {
    return { a: a / kgPerSack, b: b / kgPerSack, sourceLabel: 'Produtividade estimada nos KPIs' };
  }

  return null;
}

function roiSnapshot(data: SideBySideReportData): { a: number | null; b: number | null } | null {
  const a = data.decision_layer?.roiBySide?.A?.roiPct;
  const b = data.decision_layer?.roiBySide?.B?.roiPct;
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return null;
  return { a, b };
}

function buildEvidenceRows(data: SideBySideReportData): EvidenceRow[] {
  const stats =
    data.criteriosEstatistica
      ?.filter((item) => isFiniteNumber(item.mediaA) && isFiniteNumber(item.mediaB))
      .sort((left, right) => {
        const leftPriority = left.diferencaIndicativa ? 1 : 0;
        const rightPriority = right.diferencaIndicativa ? 1 : 0;
        if (leftPriority !== rightPriority) return rightPriority - leftPriority;
        const leftDiff = Math.abs((left.mediaB ?? 0) - (left.mediaA ?? 0));
        const rightDiff = Math.abs((right.mediaB ?? 0) - (right.mediaA ?? 0));
        return rightDiff - leftDiff;
      })
      .slice(0, 3)
      .map<EvidenceRow>((item) => {
        const winner =
          item.mediaA === item.mediaB ? 'tie' : (item.mediaB ?? 0) > (item.mediaA ?? 0) ? 'B' : 'A';
        return {
          label: item.unidade ? `${item.criterio || 'Critério'} (${item.unidade})` : item.criterio || 'Critério',
          aValue: formatNumber(item.mediaA ?? 0, { decimals: 1 }),
          bValue: formatNumber(item.mediaB ?? 0, { decimals: 1 }),
          winner,
          note: item.diferencaIndicativa ? item.notaRegra || 'Diferença indicativa pelo critério estatístico.' : null,
        };
      }) ?? [];

  if (stats.length > 0) return stats;

  return (
    data.plant_evaluation?.metrics
      ?.filter((item) => isFiniteNumber(item.meanA) && isFiniteNumber(item.meanB))
      .slice(0, 3)
      .map<EvidenceRow>((item) => {
        const winnerValue = `${item.winner || ''}`.toUpperCase();
        const winner =
          winnerValue === 'A' || winnerValue === 'B'
            ? winnerValue
            : item.meanA === item.meanB
              ? 'tie'
              : (item.meanB ?? 0) > (item.meanA ?? 0)
                ? 'B'
                : 'A';

        const suffix = item.unit ? ` ${item.unit}` : '';
        return {
          label: item.label || item.key || 'Métrica por planta',
          aValue: `${formatNumber(item.meanA ?? 0, { decimals: 1 })}${suffix}`,
          bValue: `${formatNumber(item.meanB ?? 0, { decimals: 1 })}${suffix}`,
          winner,
          note:
            isFiniteNumber(item.diffPct) && Math.abs(item.diffPct) >= 0.1
              ? `${formatSignedDelta(item.diffPct, 0)}% (B vs A)`
              : null,
        };
      }) ?? []
  );
}

function buildNarrativeLines(data: SideBySideReportData): string[] {
  const candidates = [
    data.comparativo_intro,
    data.conclusion?.summary,
    data.resumo?.conclusaoCurta,
    data.diagnosis?.planoAcao,
    ...(data.conclusion?.recommendations ?? []),
    ...(data.diagnostics?.recommendations ?? []),
    ...(data.decision_layer?.fortsmart_ai?.explanations ?? []),
  ];

  const unique = new Set<string>();
  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    candidate
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length >= 14)
      .forEach((line) => unique.add(line));
  }
  return [...unique].slice(0, 4);
}

function riskSummary(data: SideBySideReportData): { title: string; detail: string; tone: ExecutiveCardTone } {
  if (data.diagnosis?.problemaPrincipal?.trim()) {
    const urgency = data.diagnosis.urgencia?.trim();
    return {
      title: urgency ? `Urgência ${urgency.toLowerCase()}` : 'Diagnóstico publicado',
      detail: data.diagnosis.problemaPrincipal.trim(),
      tone: urgency?.toLowerCase().includes('alta') ? 'amber' : 'slate',
    };
  }

  const pressure = pressaoFitossanitariaMedia(data.ocorrencias);
  if (isFiniteNumber(pressure)) {
    if (pressure >= 40) {
      return {
        title: 'Risco fitossanitário elevado',
        detail: `Incidência média publicada: ${formatNumber(pressure, { decimals: 0 })}%`,
        tone: 'amber',
      };
    }
    if (pressure >= 15) {
      return {
        title: 'Risco fitossanitário moderado',
        detail: `Incidência média publicada: ${formatNumber(pressure, { decimals: 0 })}%`,
        tone: 'amber',
      };
    }
    return {
      title: 'Risco fitossanitário baixo',
      detail: `Incidência média publicada: ${formatNumber(pressure, { decimals: 0 })}%`,
      tone: 'emerald',
    };
  }

  const alert = (data.decision_layer?.fortsmart_ai?.motor_alertas ?? []).find((item) => item?.titulo?.trim());
  if (alert?.titulo) {
    return {
      title: 'Leitura do motor FortSmart',
      detail: alert.titulo,
      tone: alert.nivel === 'critico' || alert.nivel === 'atencao' ? 'amber' : 'slate',
    };
  }

  return {
    title: 'Risco não consolidado',
    detail: 'O JSON publicado não trouxe uma leitura objetiva de risco para este resumo.',
    tone: 'slate',
  };
}

function MetaChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium text-white/88 backdrop-blur-sm">
      {children}
    </span>
  );
}

function ScorePlate({
  title,
  value,
  accent,
  accentSoft,
}: {
  title: string;
  value: number | null;
  accent: string;
  accentSoft: string;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[1.6rem] border px-5 py-5 shadow-[0_18px_34px_-22px_rgba(15,23,42,0.4)]"
      style={{
        borderColor: accentSoft,
        background: `linear-gradient(160deg, ${accent} 0%, ${accentSoft} 100%)`,
      }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 40%), radial-gradient(circle at 80% 0%, rgba(255,255,255,0.22), transparent 35%)',
        }}
        aria-hidden
      />
      <p className="relative text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/70">{title}</p>
      <p className="relative mt-3 text-5xl font-black leading-none tracking-tight text-white tabular-nums">
        {value != null ? Math.round(value) : '—'}
      </p>
    </div>
  );
}

function SnapshotCard({
  eyebrow,
  title,
  detail,
  tone,
}: {
  eyebrow: string;
  title: string;
  detail: string;
  tone: ExecutiveCardTone;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${cardToneClasses(tone)}`}>
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] opacity-75">{eyebrow}</p>
      <p className="mt-2 text-base font-semibold leading-snug">{title}</p>
      <p className="mt-1.5 text-sm leading-relaxed opacity-85">{detail}</p>
    </div>
  );
}

function winnerBadgeLabel(winner: 'A' | 'B' | null, nameA: string, nameB: string): string | null {
  if (winner === 'A') return `${nameA} lidera a conclusão técnica publicada`;
  if (winner === 'B') return `${nameB} lidera a conclusão técnica publicada`;
  return null;
}

export default function ExecutiveDeckSection({
  data,
  sectionId = 'deck-executivo-premium',
}: {
  data: SideBySideReportData;
  sectionId?: string;
}) {
  const farm = data.farm || {};
  const coleta = data.coleta;
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = winnerFromJson(data);
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const winnerLabel = winnerBadgeLabel(winner, nameA, nameB);
  const engineWinner = data.decision_layer?.engineOverallWinner;
  const roiWinner = data.decision_layer?.engineRoiWinner;
  const financial = heroFinancialSnapshot(data);
  const scorePair = scoresFromJson(data);
  const productivity = productivitySnapshot(data);
  const roi = roiSnapshot(data);
  const radarRows = useMemo(() => buildPremiumRadarRows(data), [data]);
  const comparableMetrics = useMemo(() => buildComparableMetrics(data), [data]);
  const evidenceRows = useMemo(() => buildEvidenceRows(data), [data]);
  const narrativeLines = useMemo(() => buildNarrativeLines(data), [data]);
  const risk = riskSummary(data);
  const photoA = pickHeroPhoto(data.sideA?.photos);
  const photoB = pickHeroPhoto(data.sideB?.photos);

  const metaTitle =
    [farm.farmName, farm.fieldName].filter(Boolean).join(' · ') ||
    coleta?.ensaioName ||
    farm.objective ||
    'Avaliação agronômica lado a lado';

  const subTitle =
    [coleta?.ensaioName, farm.culture, farm.season]
      .filter((item) => typeof item === 'string' && item.trim().length > 0)
      .join(' · ') || 'Painel executivo para leitura rápida de campo';

  const introText =
    data.comparativo_intro?.trim() ||
    data.branding?.subtitle?.trim() ||
    'Estrutura web consolidada para leitura comparativa, usando apenas o que foi efetivamente publicado no JSON do relatório.';

  const scoreDelta =
    isFiniteNumber(scorePair.a) && isFiniteNumber(scorePair.b) ? Math.round(scorePair.b - scorePair.a) : null;

  const productivityTitle = productivity
    ? `${formatNumber(productivity.a ?? 0, { decimals: 0 })} vs ${formatNumber(productivity.b ?? 0, {
        decimals: 0,
      })} sc/ha`
    : 'Sem base objetiva publicada';

  const productivityDetail =
    productivity && isFiniteNumber(productivity.a) && isFiniteNumber(productivity.b)
      ? `Fonte: ${productivity.sourceLabel}.${productivity.b !== productivity.a ? ` Δ ${formatSignedDelta(productivity.b - productivity.a, 1)} sc/ha (B − A).` : ''}`
      : 'O painel preserva a ausência de produtividade consolidada quando colheita ou estimativa comparável não vierem no payload.';

  const roiTitle = roi
    ? `${formatNumber(roi.a ?? 0, { decimals: 0 })}% vs ${formatNumber(roi.b ?? 0, { decimals: 0 })}%`
    : 'ROI não publicado';

  const roiDetail = roi
    ? `ROI por lado publicado em decision_layer.roiBySide.${roiWinner === 'A' || roiWinner === 'B' ? ` O melhor ROI do motor está com ${roiWinner === 'A' ? nameA : nameB}.` : ''}`
    : 'Sem roiBySide completo no JSON publicado.';

  const engineTitle =
    engineWinner === 'A'
      ? `Motor favorece ${nameA}`
      : engineWinner === 'B'
        ? `Motor favorece ${nameB}`
        : 'Motor sem vencedor fechado';

  const engineDetail =
    isFiniteNumber(financial.gainBrlHa)
      ? `Receita bruta estimada: ${financial.gainBrlHa >= 0 ? '+' : '-'}R$ ${formatNumber(Math.abs(financial.gainBrlHa), {
          decimals: 0,
        })}/ha (B − A).`
      : isFiniteNumber(financial.deltaScHa)
        ? `Diferença consolidada de ${formatSignedDelta(financial.deltaScHa, 1)} sc/ha (B − A).`
        : 'Sem fechamento econômico consolidado para diferença monetária neste resumo.';

  const scoreBannerText =
    winnerLabel ||
    (scoreDelta != null
      ? `${scoreDelta > 0 ? nameB : scoreDelta < 0 ? nameA : 'Os dois manejos'} ${scoreDelta === 0 ? 'mantêm o mesmo score publicado' : `abrem ${Math.abs(scoreDelta)} ponto${Math.abs(scoreDelta) === 1 ? '' : 's'} no score publicado`}`
      : 'Score técnico disponível apenas quando performanceScore é publicado para ambos os lados.');

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id={sectionId} className="scroll-mt-36 print:break-inside-avoid">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white shadow-[0_28px_80px_-36px_rgba(15,23,42,0.28)] ring-1 ring-slate-900/[0.04]">
        <div className="relative overflow-hidden border-b border-slate-200/70 bg-[linear-gradient(135deg,#0f172a_0%,#132b44_35%,#114c3d_100%)] px-5 py-7 sm:px-8 sm:py-9 text-white">
          <div
            className="absolute inset-0 opacity-35"
            style={{
              background:
                'radial-gradient(circle at 18% 18%, rgba(59,130,246,0.28), transparent 30%), radial-gradient(circle at 82% 0%, rgba(16,185,129,0.24), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.06), transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.34em] text-emerald-200/90">Painel executivo web</p>
            <div className="mt-4 grid gap-6 xl:grid-cols-[1.35fr_0.95fr] xl:items-end">
              <div>
                <h2 className="text-2xl sm:text-[2rem] font-semibold leading-tight tracking-tight text-white">{metaTitle}</h2>
                <p className="mt-2 text-sm sm:text-base text-white/72">{subTitle}</p>
                <p className="mt-4 max-w-3xl text-sm sm:text-[15px] leading-relaxed text-white/86">{introText}</p>
              </div>
              <div className="flex flex-wrap gap-2 xl:justify-end">
                {[farm.city && farm.state ? `${farm.city}/${farm.state}` : null, coleta?.estadio, farm.areaHa != null ? `${formatNumber(farm.areaHa, { decimals: 1 })} ha` : null, coleta?.dae != null ? `${coleta.dae} DAE` : coleta?.dap != null ? `${coleta.dap} DAP` : null]
                  .filter(Boolean)
                  .map((label) => (
                    <MetaChip key={label}>{label}</MetaChip>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[linear-gradient(180deg,#f8fafc_0%,#f3f6fb_100%)] px-4 py-5 sm:px-7 sm:py-7">
          <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[1.75rem] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_44px_-30px_rgba(15,23,42,0.25)] sm:p-5">
              <div className="rounded-[1.4rem] border border-slate-200/80 bg-[linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] p-4 sm:p-5">
                <div className="flex flex-col gap-4">
                  <div className="rounded-full border border-slate-200/80 bg-slate-50 px-4 py-2 text-center text-sm font-semibold text-slate-700 shadow-sm">
                    {scoreBannerText}
                  </div>
                  <div className="grid items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <ScorePlate title={nameA} value={scorePair.a} accent={COLOR_SIDE_A} accentSoft="#1d4ed8" />
                    <div className="flex justify-center">
                      <div className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-center shadow-sm">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-slate-500">Delta</p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {scoreDelta != null ? `${scoreDelta > 0 ? 'B' : scoreDelta < 0 ? 'A' : 'A = B'}${scoreDelta === 0 ? '' : ` ${scoreDelta > 0 ? '>' : '<'} ${scoreDelta > 0 ? 'A' : 'B'}`}` : 'Sem score'}
                        </p>
                        {scoreDelta != null ? (
                          <p className="text-xs text-slate-500 mt-0.5">
                            {scoreDelta > 0 ? '+' : ''}
                            {scoreDelta} pts
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <ScorePlate title={nameB} value={scorePair.b} accent={COLOR_SIDE_B} accentSoft="#15803d" />
                  </div>
                </div>
              </div>

              {comparableMetrics.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {comparableMetrics.map((metric) => {
                    const delta = metric.b - metric.a;
                    const betterSide = delta === 0 ? null : delta > 0 ? 'B' : 'A';
                    return (
                      <div key={metric.key} className="rounded-2xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
                        <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em] text-slate-500">{metric.label}</p>
                        <div className="mt-2 flex items-baseline justify-between gap-4">
                          <div>
                            <p className="text-[11px] font-medium text-slate-500">A</p>
                            <p className="text-base font-semibold" style={{ color: COLOR_SIDE_A }}>
                              {metric.formatValue(metric.a)}
                            </p>
                          </div>
                          <span className="text-xs text-slate-300">vs</span>
                          <div className="text-right">
                            <p className="text-[11px] font-medium text-slate-500">B</p>
                            <p className="text-base font-semibold" style={{ color: COLOR_SIDE_B }}>
                              {metric.formatValue(metric.b)}
                            </p>
                          </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500">
                          {metric.sourceLabel}
                          {betterSide ? ` · vantagem ${betterSide}` : ' · empate técnico'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-3 text-sm text-slate-500">
                  Estande, vigor e raiz só entram aqui quando os dois lados trazem a mesma métrica com unidade comparável.
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <SnapshotCard eyebrow="Produtividade" title={productivityTitle} detail={productivityDetail} tone="emerald" />
              <SnapshotCard eyebrow="ROI" title={roiTitle} detail={roiDetail} tone="blue" />
              <SnapshotCard eyebrow="Risco" title={risk.title} detail={risk.detail} tone={risk.tone} />
              <SnapshotCard eyebrow="Motor" title={engineTitle} detail={engineDetail} tone="slate" />
            </div>
          </div>

          <div className="mt-5 overflow-x-auto rounded-full border border-slate-200/80 bg-white/90 px-2 py-2 shadow-sm">
            <div className="flex min-w-max gap-1">
              {TAB_TARGETS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => scrollTo(tab.id)}
                  className="shrink-0 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_0.95fr]">
            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.24)] sm:p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-slate-500">Comparativo visual</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Radar de desempenho consolidado</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      O gráfico usa apenas eixos que o front conseguiu compor a partir dos KPIs e da fenologia publicados.
                    </p>
                  </div>
                  {winnerName ? (
                    <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900">
                      Conclusão publicada: {winnerName}
                    </div>
                  ) : null}
                </div>

                {radarRows.length > 0 ? (
                  <div className="mt-4 h-[21rem] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarRows} margin={{ top: 12, right: 22, bottom: 12, left: 22 }}>
                        <PolarGrid stroke="#d7dee9" />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }} />
                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <Radar name={nameA} dataKey="A" stroke={COLOR_SIDE_A} fill={COLOR_SIDE_A} fillOpacity={0.24} strokeWidth={2.5} />
                        <Radar name={nameB} dataKey="B" stroke={COLOR_SIDE_B} fill={COLOR_SIDE_B} fillOpacity={0.18} strokeWidth={2.5} />
                        <Legend />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-10 text-center text-sm text-slate-500">
                    O JSON publicado ainda não oferece base suficiente para montar um radar comparável.
                  </div>
                )}
              </div>

              {data.economic_timeline?.sides?.length ? (
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.24)] sm:p-5">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-slate-500">Curva econômica</p>
                  <h3 className="mt-1 text-lg font-semibold text-slate-900">Custo acumulado por DAA</h3>
                  <p className="mt-1 text-sm leading-relaxed text-slate-600">
                    Quando o relatório publica `economic_timeline`, o painel mostra a evolução de custo acumulado sem simular produtividade temporal.
                  </p>
                  <EconomicTimelineChart timeline={data.economic_timeline} nameA={nameA} nameB={nameB} />
                </div>
              ) : null}
            </div>

            <div className="space-y-5">
              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.24)] sm:p-5">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-slate-500">Evidência de campo</p>
                    <h3 className="mt-1 text-lg font-semibold text-slate-900">Fotos lado a lado</h3>
                  </div>
                  <p className="text-xs text-slate-500">A azul · B verde</p>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-100">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {photoA?.url ? (
                        <img src={photoA.url} alt={photoA.caption || nameA} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-slate-400">
                          Foto não publicada para o lado A
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 bg-white px-3 py-2">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em]" style={{ color: COLOR_SIDE_A }}>
                        {nameA}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{photoA?.caption || 'Sem legenda publicada.'}</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[1.35rem] border border-slate-200 bg-slate-100">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {photoB?.url ? (
                        <img src={photoB.url} alt={photoB.caption || nameB} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-slate-400">
                          Foto não publicada para o lado B
                        </div>
                      )}
                    </div>
                    <div className="border-t border-slate-200 bg-white px-3 py-2">
                      <p className="text-[0.62rem] font-bold uppercase tracking-[0.24em]" style={{ color: COLOR_SIDE_B }}>
                        {nameB}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{photoB?.caption || 'Sem legenda publicada.'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.24)] sm:p-5">
                <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-slate-500">Resumo executivo</p>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">Leituras priorizadas</h3>
                {narrativeLines.length > 0 ? (
                  <div className="mt-4 space-y-2.5">
                    {narrativeLines.map((line) => (
                      <div key={line} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm leading-relaxed text-slate-700">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 text-sm text-slate-500">
                    O relatório ainda não trouxe texto narrativo suficiente para compor este resumo.
                  </div>
                )}
              </div>

              {evidenceRows.length > 0 ? (
                <div className="rounded-[1.75rem] border border-slate-200/80 bg-white p-4 shadow-[0_20px_42px_-32px_rgba(15,23,42,0.24)] sm:p-5">
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-slate-500">Evidência quantitativa</p>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {data.criteriosEstatistica?.length ? 'Recorte estatístico' : 'Recorte por planta'}
                      </h3>
                    </div>
                    {data.plant_evaluation?.sampleSize ? (
                      <p className="text-xs text-slate-500">
                        Amostras: A {data.plant_evaluation.sampleSize.A ?? '—'} · B {data.plant_evaluation.sampleSize.B ?? '—'}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4 space-y-2.5">
                    {evidenceRows.map((row) => (
                      <div key={`${row.label}-${row.aValue}-${row.bValue}`} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{row.label}</p>
                            {row.note ? <p className="mt-1 text-xs leading-relaxed text-slate-500">{row.note}</p> : null}
                          </div>
                          <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 border border-slate-200">
                            {row.winner === 'A' ? nameA : row.winner === 'B' ? nameB : 'Empate'}
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                          <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                            <p className="text-[11px] font-medium text-slate-500">A</p>
                            <p className="mt-1 font-semibold" style={{ color: COLOR_SIDE_A }}>
                              {row.aValue}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 shadow-sm">
                            <p className="text-[11px] font-medium text-slate-500">B</p>
                            <p className="mt-1 font-semibold" style={{ color: COLOR_SIDE_B }}>
                              {row.bValue}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {(data.conclusion?.headline?.trim() || winnerName || data.diagnosis?.planoAcao?.trim()) && (
          <div className="border-t border-slate-200/70 bg-[linear-gradient(120deg,#0f172a_0%,#0b3a68_42%,#14532d_100%)] px-5 py-4 sm:px-8 sm:py-5 text-white">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.3em] text-emerald-200/85">Fecho executivo</p>
            <p className="mt-2 max-w-4xl text-sm sm:text-base leading-relaxed text-white/90">
              {data.conclusion?.headline?.trim() ||
                data.diagnosis?.planoAcao?.trim() ||
                (winnerName ? `${winnerName} aparece como manejo favorecido na conclusão técnica publicada.` : '')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
