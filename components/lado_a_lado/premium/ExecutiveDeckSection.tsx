'use client';

import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Bell, Printer, UserRound } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import {
  evolutionSeriesFromApplications,
  isColheitaJson,
  pickHeroPhoto,
  pressaoFitossanitariaMedia,
} from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import { buildPremiumRadarRows } from './evaluationRadar';
import EconomicTimelineChart from './EconomicTimelineChart';
import { heroFinancialSnapshot, scoresFromJson, winnerFromJson } from './premiumInference';

const SHOW_DATA_DEBUG = process.env.NODE_ENV === 'development';

/** Legenda local do painel executivo (mock): A verde material, B azul escuro. Resto do relatório premium mantém A azul / B verde em `ladoALadoHelpers`. */
const DECK_SIDE_A = '#2E7D32';
const DECK_SIDE_B = '#1565C0';
const DECK_SIDE_A_SOFT = '#e8f5e9';
const DECK_SIDE_B_SOFT = '#e3f2fd';

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

const LEFT_TABS = ['Geral', 'Estatística', 'Aplicações', 'Fitossanidade', 'Diagnóstico'] as const;
const RIGHT_TABS = ['KPI', 'Estatística', 'Plantas', 'Fotos', 'Conclusão'] as const;
type LeftTab = (typeof LEFT_TABS)[number];
type RightTab = (typeof RIGHT_TABS)[number];

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
  return { key: `${label}-${sourceLabel}`.toLowerCase(), label, sourceLabel, a, b, formatValue };
}

/**
 * Cada par A/B na sua própria linha — não mistura pl/ha com % na mesma linha.
 */
function buildAllComparableMetrics(data: SideBySideReportData): ComparableMetric[] {
  const kA = data.sideA?.kpis;
  const kB = data.sideB?.kpis;
  const rows: ComparableMetric[] = [];
  const push = (m: ComparableMetric | null) => {
    if (m) rows.push(m);
  };

  push(
    toComparableScore(
      'População final',
      'kpis.finalPopulationPlHa',
      kA?.finalPopulationPlHa,
      kB?.finalPopulationPlHa,
      (value) => `${formatNumber(value, { decimals: 0 })} pl/ha`,
    ),
  );
  push(
    toComparableScore(
      'Eficiência de estande',
      'kpis.eficienciaPct',
      kA?.eficienciaPct,
      kB?.eficienciaPct,
      (value) => `${formatNumber(value, { decimals: 0 })}%`,
    ),
  );

  const vigorMetric =
    toComparableScore(
      'Vigor da cultura',
      'kpis.vigorCulturaPct',
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
        'Vigor (escala)',
        `kpis.vigorRating.score (max ${maxA})`,
        aScore,
        bScore,
        (value) => `${formatNumber(value, { decimals: 1 })}/${maxA}`,
      );
    })();
  push(vigorMetric);

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
        'Raiz (escala)',
        `kpis.rootRating.score (max ${maxA})`,
        aScore,
        bScore,
        (value) => `${formatNumber(value, { decimals: 1 })}/${maxA}`,
      );
    })() ||
    toComparableScore(
      'Profundidade de raiz',
      'kpis.profundidadeRaizCm',
      kA?.profundidadeRaizCm,
      kB?.profundidadeRaizCm,
      (value) => `${formatNumber(value, { decimals: 0 })} cm`,
    );
  push(rootMetric);

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
    return { a: rowA.yieldScHa, b: rowB.yieldScHa, sourceLabel: 'Colheita publicada (sc/ha)' };
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
    return { a: a / kgPerSack, b: b / kgPerSack, sourceLabel: 'kpis.estimatedYieldKgHa → sc/ha' };
  }

  return null;
}

function roiPctFromFortsmartAiEconomic(data: SideBySideReportData): { a: number | null; b: number | null } | null {
  const sides = data.decision_layer?.fortsmart_ai?.economic?.sides as
    | Record<string, { roiPct?: number }>
    | undefined;
  if (!sides || typeof sides !== 'object') return null;
  const a = sides.A?.roiPct ?? sides.a?.roiPct;
  const b = sides.B?.roiPct ?? sides.b?.roiPct;
  if (!isFiniteNumber(a) || !isFiniteNumber(b)) return null;
  return { a, b };
}

function roiSnapshot(data: SideBySideReportData): { a: number | null; b: number | null } | null {
  const rb = data.decision_layer?.roiBySide;
  const a = rb?.A?.roiPct ?? (rb as Record<string, { roiPct?: number }> | undefined)?.a?.roiPct;
  const b = rb?.B?.roiPct ?? (rb as Record<string, { roiPct?: number }> | undefined)?.b?.roiPct;
  if (isFiniteNumber(a) && isFiniteNumber(b)) return { a, b };
  return roiPctFromFortsmartAiEconomic(data);
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

/** Risco para badge de KPI — só a partir de ocorrências (incidência + severidade). */
function deriveRiskFromOcorrencias(
  ocorrencias: SideBySideReportData['ocorrencias'],
): 'Alto' | 'Moderado' | 'Baixo' | null {
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
    detail: 'O JSON publicado não trouxe ocorrências nem leitura objetiva de risco para este resumo.',
    tone: 'slate',
  };
}

/** Série de barras: contagem de aplicações por DAA (lado A/B). Inclui 1 DAA se necessário. */
function daaApplicationBarRows(
  applications: ReportApplicationEventV2Json[] | undefined,
): { daa: number; name: string; A: number; B: number }[] | null {
  const fromLib = evolutionSeriesFromApplications(applications);
  if (fromLib) return fromLib;
  const apps = applications ?? [];
  if (!apps.length) return null;
  const byDaa = new Map<number, { A: number; B: number }>();
  for (const ev of apps) {
    if (ev.daa == null || !Number.isFinite(Number(ev.daa))) continue;
    const d = Number(ev.daa);
    const cur = byDaa.get(d) ?? { A: 0, B: 0 };
    if (ev.side === 'A') cur.A += 1;
    else if (ev.side === 'B') cur.B += 1;
    byDaa.set(d, cur);
  }
  if (byDaa.size === 0) return null;
  return [...byDaa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([daa, v]) => ({ daa, name: `${daa} DAA`, A: v.A, B: v.B }));
}

function NullChip({ label }: { label: string }) {
  if (SHOW_DATA_DEBUG) {
    return (
      <span className="inline-flex items-center rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-amber-900">
        {label}
      </span>
    );
  }
  return <span className="text-slate-400">—</span>;
}

function DeckCardHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string | null;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200/90 pb-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base shadow-sm ring-2 ring-white"
        style={{
          background: 'linear-gradient(135deg,#166534,#15803d)',
        }}
        aria-hidden
      >
        🌿
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base">{title}</h2>
        {subtitle ? <p className="mt-0.5 truncate text-xs text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-slate-400">
        <button
          type="button"
          className="rounded-lg p-2 transition-colors hover:bg-slate-100 hover:text-slate-700 print:hidden"
          aria-label="Imprimir"
          onClick={() => window.print()}
        >
          <Printer className="h-4 w-4" />
        </button>
        <span className="rounded-lg p-2 opacity-50" aria-hidden title="Notificações">
          <Bell className="h-4 w-4" />
        </span>
        <span className="rounded-lg p-2 opacity-50" aria-hidden title="Perfil">
          <UserRound className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function TabBar<T extends string = string>({
  tabs,
  active,
  onSelect,
  accentClass,
}: {
  tabs: readonly T[];
  active: T;
  onSelect: (t: T) => void;
  accentClass: string;
}): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onSelect(t)}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide transition-colors ${
            active === t ? `${accentClass} text-white shadow-sm` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function winnerBadgeLabel(winner: 'A' | 'B' | null, nameA: string, nameB: string): string | null {
  if (winner === 'A') return nameA;
  if (winner === 'B') return nameB;
  return null;
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
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${cardToneClasses(tone)}`}>
      <p className="text-[0.62rem] font-bold uppercase tracking-[0.22em] opacity-75">{eyebrow}</p>
      <p className="mt-1.5 text-sm font-semibold leading-snug">{title}</p>
      <p className="mt-1 text-xs leading-relaxed opacity-85">{detail}</p>
    </div>
  );
}

function StatsTableBlock({ rows }: { rows: NonNullable<SideBySideReportData['criteriosEstatistica']> | undefined }) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
        <p>Nenhuma tabela estatística foi incluída nesta publicação.</p>
        {SHOW_DATA_DEBUG ? (
          <p className="mt-2">
            <NullChip label="criteriosEstatistica vazio" />
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-3 py-2 font-semibold">Critério</th>
            <th className="px-3 py-2 font-semibold">A</th>
            <th className="px-3 py-2 font-semibold">B</th>
            <th className="px-3 py-2 font-semibold">CV A</th>
            <th className="px-3 py-2 font-semibold">CV B</th>
            <th className="px-3 py-2 font-semibold">Indicativo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.criterio}-${index}`} className="border-t border-slate-100 text-slate-700">
              <td className="px-3 py-2 font-medium">
                {row.criterio || 'Critério'}
                {row.unidade ? <span className="text-slate-400"> ({row.unidade})</span> : null}
              </td>
              <td className="px-3 py-2 font-semibold" style={{ color: DECK_SIDE_A }}>
                {isFiniteNumber(row.mediaA) ? formatNumber(row.mediaA, { decimals: 1 }) : <NullChip label="null" />}
              </td>
              <td className="px-3 py-2 font-semibold" style={{ color: DECK_SIDE_B }}>
                {isFiniteNumber(row.mediaB) ? formatNumber(row.mediaB, { decimals: 1 }) : <NullChip label="null" />}
              </td>
              <td className="px-3 py-2">
                {isFiniteNumber(row.cvPctA) ? `${formatNumber(row.cvPctA, { decimals: 1 })}%` : <NullChip label="null" />}
              </td>
              <td className="px-3 py-2">
                {isFiniteNumber(row.cvPctB) ? `${formatNumber(row.cvPctB, { decimals: 1 })}%` : <NullChip label="null" />}
              </td>
              <td className="px-3 py-2">
                {row.diferencaIndicativa != null ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-800">
                    {row.diferencaIndicativa ? 'Sim' : 'Não'}
                  </span>
                ) : (
                  <NullChip label="null" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function productLine(products: ReportApplicationEventV2Json['products']): string {
  if (!products?.length) return '—';
  return products
    .map((p) => p.nomeComercial?.trim() || p.nomeAtivo?.trim() || 'produto')
    .filter(Boolean)
    .join(', ');
}

export default function ExecutiveDeckSection({
  data,
  sectionId = 'deck-executivo-premium',
}: {
  data: SideBySideReportData;
  sectionId?: string;
}) {
  const [leftTab, setLeftTab] = useState<LeftTab>('Geral');
  const [rightTab, setRightTab] = useState<RightTab>('KPI');

  const farm = data.farm || {};
  const coleta = data.coleta;
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = winnerFromJson(data);
  const winnerName = winnerBadgeLabel(winner, nameA, nameB);
  const financial = heroFinancialSnapshot(data);
  const scorePair = scoresFromJson(data);
  const productivity = productivitySnapshot(data);
  const roi = roiSnapshot(data);
  const radarRows = useMemo(() => buildPremiumRadarRows(data), [data]);
  const comparableMetrics = useMemo(() => buildAllComparableMetrics(data), [data]);
  const evidenceRows = useMemo(() => buildEvidenceRows(data), [data]);
  const narrativeLines = useMemo(() => buildNarrativeLines(data), [data]);
  const riskContext = riskSummary(data);
  const photoA = pickHeroPhoto(data.sideA?.photos);
  const photoB = pickHeroPhoto(data.sideB?.photos);
  const bannerPhoto = photoB?.url ? photoB : photoA;
  const daaBarData = useMemo(() => daaApplicationBarRows(data.applications), [data.applications]);
  const riskFromOcc = deriveRiskFromOcorrencias(data.ocorrencias);

  const subTitle = data.branding?.subtitle?.trim() || null;

  const cultureLine = [
    farm.culture ? `Cultura: ${farm.culture}` : null,
    coleta?.estadio ? `Estádio: ${coleta.estadio}` : null,
    coleta?.dae != null ? `${coleta.dae} DAE` : coleta?.dap != null ? `${coleta.dap} DAP` : null,
  ]
    .filter(Boolean)
    .join(' · ');

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
      : 'Quando colheita ou estimativa comparável não existir no payload, o painel exibe ausência explícita.';

  const roiTitle = roi
    ? `${formatNumber(roi.a ?? 0, { decimals: 0 })}% vs ${formatNumber(roi.b ?? 0, { decimals: 0 })}%`
    : 'ROI não publicado';

  const roiDetail = roi
    ? 'Valores exclusivamente de decision_layer.roiBySide.A/B.roiPct.'
    : 'Sem roiBySide completo no JSON publicado.';

  const melhorDesempenhoTexto =
    winnerName != null
      ? `Melhor desempenho (conclusão): ${winnerName}`
      : 'Sem conclusion.winner no JSON — não exibimos vencedor inferido.';

  const motorAlerts = data.decision_layer?.fortsmart_ai?.motor_alertas ?? [];

  return (
    <section id={sectionId} className="scroll-mt-36 print:break-inside-avoid">
      <div className="mx-auto max-w-[1400px] space-y-3">
        <p className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-center text-[11px] leading-snug text-slate-600 shadow-sm print:hidden">
          Legenda local deste painel:{' '}
          <strong style={{ color: DECK_SIDE_A }}>Manejo A</strong> verde ·{' '}
          <strong style={{ color: DECK_SIDE_B }}>Manejo B</strong> azul escuro. Nas demais secções do relatório, os gráficos usam{' '}
          <span className="font-mono text-[10px] text-slate-500">A = azul · B = verde</span>.
        </p>
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Painel esquerdo */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md print:border print:shadow-none">
          <DeckCardHeader title="Avaliação de campo" subtitle={subTitle} />

          <p className="text-xs text-slate-500">
            {cultureLine || <span className="text-slate-400">Metadados de cultura / estádio não preenchidos.</span>}
          </p>

          {data.comparativo_intro?.trim() ? (
            <blockquote className="border-l-4 border-emerald-600 bg-emerald-50/40 py-2 pl-3 text-xs italic leading-relaxed text-slate-600">
              {data.comparativo_intro.trim()}
            </blockquote>
          ) : null}

          <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: DECK_SIDE_A_SOFT, color: DECK_SIDE_A }}>
              {nameA}
            </span>
            <span className="rounded-full px-2 py-0.5" style={{ backgroundColor: DECK_SIDE_B_SOFT, color: DECK_SIDE_B }}>
              {nameB}
            </span>
          </div>

          <div
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-white"
            style={{
              background: 'linear-gradient(90deg, #1e3a8a 0%, #14532d 100%)',
            }}
          >
            <div
              className="min-w-[3.25rem] rounded-xl px-3 py-2 text-center text-2xl font-black tabular-nums"
              style={{ backgroundColor: DECK_SIDE_A }}
            >
              {scorePair.a != null ? Math.round(scorePair.a) : '—'}
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-sky-200/90">Melhor desempenho</p>
              <p className="mt-1 text-sm font-bold leading-tight">{melhorDesempenhoTexto}</p>
              <p className="mt-1 text-[9px] text-emerald-200/85">
                Com base na conclusão do técnico e nos indicadores publicados (índice 0–100).
              </p>
            </div>
            <div
              className="min-w-[3.25rem] rounded-xl px-3 py-2 text-center text-2xl font-black tabular-nums"
              style={{ backgroundColor: DECK_SIDE_B }}
            >
              {scorePair.b != null ? Math.round(scorePair.b) : '—'}
            </div>
          </div>
          {scorePair.a == null || scorePair.b == null ? (
            <p className="text-center text-[10px] text-slate-500">
              Pontuação comparativa indisponível — publique mais indicadores ou reenvie o relatório a partir do app.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {comparableMetrics.length > 0 ? (
              comparableMetrics.map((metric) => {
                const delta = metric.b - metric.a;
                const betterSide = delta === 0 ? null : delta > 0 ? 'B' : 'A';
                return (
                  <div
                    key={metric.key}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/90 px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700">{metric.label}</p>
                      {SHOW_DATA_DEBUG ? (
                        <p className="font-mono text-[9px] text-amber-900/80">{metric.sourceLabel}</p>
                      ) : null}
                    </div>
                    <div className="flex items-baseline gap-2 text-sm font-bold tabular-nums">
                      <span style={{ color: DECK_SIDE_A }}>{metric.formatValue(metric.a)}</span>
                      <span className="text-xs font-normal text-slate-300">vs</span>
                      <span style={{ color: DECK_SIDE_B }}>{metric.formatValue(metric.b)}</span>
                    </div>
                    <p className="w-full text-[10px] text-slate-500">
                      {betterSide ? `Vantagem numérica lado ${betterSide} neste critério.` : 'Empate numérico.'}
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-500">
                Sem pares A/B comparáveis com a mesma unidade no JSON.
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <SnapshotCard eyebrow="Produtividade" title={productivityTitle} detail={productivityDetail} tone="emerald" />
            <SnapshotCard eyebrow="ROI ajustado" title={roiTitle} detail={roiDetail} tone="blue" />
          </div>

          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs">
            <span className="font-semibold text-slate-500">Risco (ocorrências):</span>
            {riskFromOcc != null ? (
              <span
                className={`rounded-full px-2 py-0.5 font-bold ${
                  riskFromOcc === 'Alto'
                    ? 'bg-red-100 text-red-800'
                    : riskFromOcc === 'Moderado'
                      ? 'bg-orange-100 text-orange-900'
                      : 'bg-emerald-100 text-emerald-900'
                }`}
              >
                {riskFromOcc}
              </span>
            ) : (
              <span className="text-sm text-slate-500">Sem ocorrências fitossanitárias registadas.</span>
            )}
            <span className="text-[10px] text-slate-400">Derivado de incidência % e severidade publicadas.</span>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold text-slate-800">Insights e alertas</p>
            {SHOW_DATA_DEBUG ? (
              <p className="mb-2 font-mono text-[9px] text-slate-500">decision_layer.fortsmart_ai.motor_alertas</p>
            ) : null}
            {motorAlerts.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {motorAlerts.map((a, i) => {
                  const crit = a.nivel === 'critico';
                  const att = a.nivel === 'atencao';
                  return (
                    <li
                      key={`${a.id ?? i}`}
                      className={`rounded-xl border px-3 py-2 text-sm leading-relaxed ${
                        crit
                          ? 'border-red-200 bg-red-50 text-red-950'
                          : att
                            ? 'border-amber-200 bg-amber-50 text-amber-950'
                            : 'border-slate-200 bg-slate-50 text-slate-800'
                      }`}
                    >
                      {a.titulo ? <span className="font-bold">{a.titulo}</span> : <span className="font-bold text-slate-600">Alerta</span>}
                      {a.mensagem ? <span className="mt-1 block text-xs opacity-90">{a.mensagem}</span> : null}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Nenhum alerta automático adicional para este relatório.</p>
            )}
          </div>

          <TabBar<LeftTab> tabs={LEFT_TABS} active={leftTab} onSelect={setLeftTab} accentClass="bg-slate-800" />

          {leftTab === 'Geral' ? (
            <div>
              <p className="text-xs font-bold text-slate-800">Eventos de aplicação por DAA</p>
              <p className="mt-1 text-[10px] font-medium text-amber-800">
                Série real: contagem de eventos em applications por DAA — não é evolução de score por data.
              </p>
              {daaBarData && daaBarData.length > 0 ? (
                <div className="mt-2 h-40 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={daaBarData} margin={{ top: 4, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} width={28} />
                      <Tooltip
                        formatter={(val: number, name: string) => [val ?? '—', `Aplicações ${name}`]}
                        contentStyle={{ borderRadius: 8, fontSize: 11 }}
                      />
                      <Bar dataKey="A" name="A" fill={DECK_SIDE_A} radius={[4, 4, 0, 0]} maxBarSize={22} />
                      <Bar dataKey="B" name="B" fill={DECK_SIDE_B} radius={[4, 4, 0, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="mt-2 flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 text-center text-sm text-slate-500">
                  Sem eventos de aplicação com DAA no JSON publicado. Confirme no app se as aplicações foram registadas.
                </div>
              )}
            </div>
          ) : null}

          {leftTab === 'Estatística' ? <StatsTableBlock rows={data.criteriosEstatistica} /> : null}

          {leftTab === 'Aplicações' ? (
            <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto text-xs">
              {(data.applications ?? []).length ? (
                data.applications!.map((ev, i) => (
                  <li
                    key={ev.id ?? i}
                    className="rounded-lg border border-slate-200 px-3 py-2"
                    style={{ borderLeftWidth: 4, borderLeftColor: ev.side === 'A' ? DECK_SIDE_A : DECK_SIDE_B }}
                  >
                    <span className="font-bold">Lado {ev.side}</span>
                    {ev.daa != null ? <span className="text-slate-500"> · DAA {ev.daa}</span> : null}
                    {ev.type ? <span> · {ev.type}</span> : null}
                    <p className="mt-1 text-slate-600">{productLine(ev.products)}</p>
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-500">Nenhuma aplicação publicada neste relatório.</p>
              )}
            </ul>
          ) : null}

          {leftTab === 'Fitossanidade' ? (
            <ul className="flex flex-col gap-2 text-xs">
              {(data.ocorrencias ?? []).length ? (
                data.ocorrencias!.map((o, i) => (
                  <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <span className="font-semibold">{o.tipo ?? '—'}</span> · {o.nomeAlvo ?? '—'}
                    <span className="text-slate-500">
                      {' '}
                      · incidência{' '}
                      {isFiniteNumber(o.incidenciaPct) ? `${formatNumber(o.incidenciaPct, { decimals: 0 })}%` : <NullChip label="null" />}
                    </span>
                    {o.severidade ? <span className="block text-slate-600">Severidade: {o.severidade}</span> : null}
                  </li>
                ))
              ) : (
                <p className="text-sm text-slate-500">Sem ocorrências publicadas.</p>
              )}
            </ul>
          ) : null}

          {leftTab === 'Diagnóstico' ? (
            <div className="space-y-2 text-sm text-slate-800">
              <p>
                <span className="font-semibold">Problema:</span>{' '}
                {data.diagnosis?.problemaPrincipal?.trim() || <NullChip label="diagnosis.problemaPrincipal: null" />}
              </p>
              <p>
                <span className="font-semibold">Secundários:</span>{' '}
                {data.diagnosis?.problemasSecundarios?.length
                  ? data.diagnosis.problemasSecundarios.join(', ')
                  : <NullChip label="null" />}
              </p>
              <p>
                <span className="font-semibold">Urgência:</span>{' '}
                {data.diagnosis?.urgencia?.trim() || <NullChip label="null" />}
              </p>
              <p>
                <span className="font-semibold">Plano:</span>{' '}
                {data.diagnosis?.planoAcao?.trim() || <NullChip label="diagnosis.planoAcao: null" />}
              </p>
            </div>
          ) : null}
        </div>

        {/* Painel direito */}
        <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md print:border print:shadow-none">
          <div className="space-y-4 p-5">
            <DeckCardHeader title="Relatório de avaliação" subtitle={subTitle} />
          </div>

          <div className="relative min-h-[140px] w-full overflow-hidden">
            {bannerPhoto?.url ? (
              <img
                src={bannerPhoto.url}
                alt={bannerPhoto.caption || 'Campo'}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900"
                aria-hidden
              />
            )}
            <div className="absolute inset-0 bg-slate-900/45" />
            <div className="relative z-10 flex min-h-[140px] flex-col justify-end p-5">
              <p className="text-lg font-bold leading-snug text-white drop-shadow-sm">
                {data.conclusion?.headline?.trim() || (
                  <span className="text-white/80">Resumo executivo disponível na secção de conclusão.</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <div
                className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-white"
                style={{ backgroundColor: DECK_SIDE_A }}
              >
                <span className="text-xl font-black tabular-nums">{scorePair.a != null ? Math.round(scorePair.a) : '—'}</span>
                <span className="text-[10px] font-bold uppercase text-white/90">Manejo A</span>
              </div>
              <div className="shrink-0 text-center text-[11px] text-slate-600">
                <span className="tabular-nums">«</span>
                {scoreDelta != null ? (
                  <span className="mx-1 font-bold text-slate-800">
                    {scoreDelta > 0 ? 'B' : scoreDelta < 0 ? 'A' : '='} · {scoreDelta > 0 ? '+' : ''}
                    {scoreDelta} pts
                  </span>
                ) : (
                  <span className="mx-1 text-xs text-slate-500">—</span>
                )}
                <span className="tabular-nums">»</span>
              </div>
              <div
                className="flex min-w-0 flex-1 items-center justify-end gap-2 rounded-lg px-2 py-1.5 text-white"
                style={{ backgroundColor: DECK_SIDE_B }}
              >
                <span className="text-[10px] font-bold uppercase text-white/90">Manejo B</span>
                <span className="text-xl font-black tabular-nums">{scorePair.b != null ? Math.round(scorePair.b) : '—'}</span>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden>🌱</span>
                <span className="text-slate-500">Previsão / colheita (sc/ha):</span>
                <span className="font-bold" style={{ color: DECK_SIDE_A }}>
                  {productivity && isFiniteNumber(productivity.a)
                    ? `${formatNumber(productivity.a, { decimals: 0 })} sc/ha`
                    : '—'}
                </span>
                <span className="text-slate-300">vs</span>
                <span className="font-bold" style={{ color: DECK_SIDE_B }}>
                  {productivity && isFiniteNumber(productivity.b)
                    ? `${formatNumber(productivity.b, { decimals: 0 })} sc/ha`
                    : '—'}
                </span>
                {isFiniteNumber(financial.deltaScHa) ? (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
                    {formatSignedDelta(financial.deltaScHa, 0)} sc/ha
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Δ sc/ha indisponível</span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span aria-hidden>✅</span>
                <span className="text-slate-500">ROI ajustado:</span>
                <span className="font-bold" style={{ color: DECK_SIDE_A }}>
                  {roi && isFiniteNumber(roi.a) ? `${formatNumber(roi.a, { decimals: 0 })}%` : '—'}
                </span>
                <span className="text-slate-300">vs</span>
                <span className="font-bold" style={{ color: DECK_SIDE_B }}>
                  {roi && isFiniteNumber(roi.b) ? `${formatNumber(roi.b, { decimals: 0 })}%` : '—'}
                </span>
                {SHOW_DATA_DEBUG ? (
                  <span className="font-mono text-[9px] text-amber-900">decision_layer.roiBySide</span>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-600">
                <span aria-hidden>❓</span>
                <span>Contexto de risco (diagnóstico / fito):</span>
                <span className="font-medium">{riskContext.title}</span>
                <span className="text-xs opacity-80">— {riskContext.detail}</span>
              </div>
            </div>

            <TabBar<RightTab> tabs={RIGHT_TABS} active={rightTab} onSelect={setRightTab} accentClass="bg-emerald-800" />

            {rightTab === 'KPI' ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <p className="text-xs font-bold text-slate-800">Radar comparativo</p>
                  <p className="mt-1 text-[10px] text-slate-500">
                    Eixos normalizados (0–100) a partir dos KPIs e da fenologia publicados no relatório.
                  </p>
                  {radarRows.length > 0 ? (
                    <div className="mt-2 h-56 w-full min-w-0 sm:h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarRows} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#64748b' }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                          <Radar name={nameA} dataKey="A" stroke={DECK_SIDE_A} fill={DECK_SIDE_A} fillOpacity={0.22} strokeWidth={2} />
                          <Radar name={nameB} dataKey="B" stroke={DECK_SIDE_B} fill={DECK_SIDE_B} fillOpacity={0.2} strokeWidth={2} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 py-8 text-center text-sm text-slate-500">
                      Dados insuficientes para radar.
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Fotos de campo</p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {[photoA, photoB].map((ph, idx) => {
                      const side = idx === 0 ? 'A' : 'B';
                      const nm = idx === 0 ? nameA : nameB;
                      const col = idx === 0 ? DECK_SIDE_A : DECK_SIDE_B;
                      return (
                        <div key={side} className="overflow-hidden rounded-lg border border-slate-200">
                          <div className="aspect-square bg-slate-100">
                            {ph?.url ? (
                              <img src={ph.url} alt={ph.caption || nm} className="h-full w-full object-cover" loading="lazy" />
                            ) : (
                              <div className="flex h-full items-center justify-center p-2 text-center text-[10px] text-slate-400">
                                <NullChip label={`foto lado ${side}: null`} />
                              </div>
                            )}
                          </div>
                          <p className="bg-slate-50 py-1 text-center text-[10px] font-bold text-white" style={{ backgroundColor: col }}>
                            {nm}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}

            {rightTab === 'Estatística' ? <StatsTableBlock rows={data.criteriosEstatistica} /> : null}

            {rightTab === 'Plantas' ? (
              <div>
                <p className="mb-2 text-xs text-slate-500">
                  Amostras: A {data.plant_evaluation?.sampleSize?.A ?? '—'} · B {data.plant_evaluation?.sampleSize?.B ?? '—'}
                </p>
                <div className="flex flex-col gap-2">
                  {(data.plant_evaluation?.metrics ?? []).length ? (
                    data.plant_evaluation!.metrics!.map((m, i) => {
                      const label = m.label || m.key || 'Métrica';
                      const unit = m.unit ? ` (${m.unit})` : '';
                      const a = m.meanA;
                      const b = m.meanB;
                      const ok = isFiniteNumber(a) && isFiniteNumber(b);
                      return (
                        <div key={`${label}-${i}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                          <p className="text-[11px] font-semibold text-slate-600">
                            {label}
                            {unit}
                          </p>
                          {SHOW_DATA_DEBUG ? (
                            <p className="mt-1 font-mono text-[9px] text-slate-400">plant_evaluation.metrics[{i}]</p>
                          ) : null}
                          {ok ? (
                            <p className="mt-1 font-bold">
                              <span style={{ color: DECK_SIDE_A }}>{formatNumber(a, { decimals: 1 })}</span>
                              <span className="mx-2 text-slate-300">vs</span>
                              <span style={{ color: DECK_SIDE_B }}>{formatNumber(b, { decimals: 1 })}</span>
                            </p>
                          ) : (
                            <NullChip label="meanA/meanB: null" />
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-slate-500">Sem métricas por planta publicadas.</p>
                  )}
                </div>
              </div>
            ) : null}

            {rightTab === 'Fotos' ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(['A', 'B'] as const).flatMap((side) => {
                  const s = side === 'A' ? data.sideA : data.sideB;
                  const list = s?.photos ?? [];
                  return list.map((p, i) => (
                    <div key={`${side}-${i}`} className="overflow-hidden rounded-lg border border-slate-200">
                      <div className="aspect-square bg-slate-100">
                        {p.url ? (
                          <img src={p.url} alt={p.caption || ''} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full items-center justify-center p-1">
                            <NullChip label="url: null" />
                          </div>
                        )}
                      </div>
                      <p className="truncate px-1 py-0.5 text-center text-[9px] text-slate-500">{p.caption || '—'}</p>
                    </div>
                  ));
                })}
              </div>
            ) : null}

            {rightTab === 'Conclusão' ? (
              <div className="space-y-3 text-sm">
                <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-slate-800">
                  {data.conclusion?.summary?.trim() || <NullChip label="conclusion.summary: null" />}
                </p>
                <p className="text-xs font-bold text-slate-700">Recomendações</p>
                <ul className="list-inside list-decimal space-y-1 text-slate-700">
                  {(data.conclusion?.recommendations ?? []).length ? (
                    data.conclusion!.recommendations!.map((r, i) => <li key={i}>{r}</li>)
                  ) : (
                    <NullChip label="conclusion.recommendations: null" />
                  )}
                </ul>
              </div>
            ) : null}

            {data.economic_timeline?.sides?.length ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                <p className="text-xs font-bold text-slate-800">Custo acumulado por DAA</p>
                <p className="text-[10px] text-slate-500">Fonte: economic_timeline no JSON.</p>
                <EconomicTimelineChart
                  timeline={data.economic_timeline}
                  nameA={nameA}
                  nameB={nameB}
                  strokeA={DECK_SIDE_A}
                  strokeB={DECK_SIDE_B}
                />
              </div>
            ) : null}

            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm font-bold text-slate-900">Resumo executivo</p>
              {narrativeLines.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {narrativeLines.map((line) => (
                    <li key={line} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-700">
                      {line}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-slate-500">Sem texto narrativo adicional gerado para este bloco.</p>
              )}
              {evidenceRows.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-700">Evidência quantitativa</p>
                  <div className="mt-2 space-y-2">
                    {evidenceRows.map((row) => (
                      <div key={`${row.label}-${row.aValue}`} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                        <p className="font-semibold text-slate-800">{row.label}</p>
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <span style={{ color: DECK_SIDE_A }}>{row.aValue}</span>
                          <span className="text-right" style={{ color: DECK_SIDE_B }}>
                            {row.bValue}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        </div>
      </div>
    </section>
  );
}
