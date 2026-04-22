'use client';

import React, { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
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
import {
  Bell,
  Camera,
  ClipboardList,
  Printer,
  ShieldAlert,
  Sprout,
  TriangleAlert,
  UserCircle2,
} from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import FortSmartLogo from '@/components/FortSmartLogo';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import { formatDate, formatNumber } from '@/utils/format';
import {
  COLOR_SIDE_A,
  COLOR_SIDE_B,
  isColheitaJson,
  pickHeroPhoto,
} from '@/components/lado_a_lado/ladoALadoHelpers';

type SideKey = 'A' | 'B';

type MetricCard = {
  label: string;
  unit: string;
  a: number | null;
  b: number | null;
  digits?: number;
};

type AlertRow = {
  level: 'warning' | 'error' | 'info';
  text: string;
};

type StatsRow = NonNullable<SideBySideReportData['criteriosEstatistica']>[number];

type PlantRow = NonNullable<NonNullable<SideBySideReportData['plant_evaluation']>['metrics']>[number];

const COLORS = {
  bg: '#F0F2F5',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  amber: '#D97706',
  amberBg: '#FFF7ED',
  red: '#DC2626',
  redBg: '#FEF2F2',
  green: '#15803D',
  greenBg: '#F0FDF4',
  blueBg: '#EFF6FF',
  slateBg: '#F8FAFC',
  nullBg: '#FEF3C7',
  nullText: '#92400E',
  yellow: '#EAB308',
};

const LEFT_TABS = ['Geral', 'Estatística', 'Aplicações', 'Fitossanidade', 'Diagnóstico', 'Fotos'] as const;
const RIGHT_TABS = ['KPI', 'Estatística', 'Plantas', 'Fotos', 'Conclusão'] as const;

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

function isFiniteNumber(value: number | null | undefined): value is number {
  return value != null && Number.isFinite(value);
}

function NullBadge({ label = 'null' }: { label?: string }) {
  return (
    <span
      className="inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold"
      style={{ backgroundColor: COLORS.nullBg, color: COLORS.nullText, borderColor: '#FDE68A' }}
    >
      {label}
    </span>
  );
}

function ValueOrNull({
  value,
  suffix = '',
  digits = 0,
  nullLabel = 'null',
}: {
  value: number | string | null | undefined;
  suffix?: string;
  digits?: number;
  nullLabel?: string;
}) {
  if (value == null || value === '') {
    return <NullBadge label={nullLabel} />;
  }
  if (typeof value === 'number') {
    return <>{`${formatNumber(value, { decimals: digits })}${suffix}`}</>;
  }
  return <>{`${value}${suffix}`}</>;
}

function firstText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function earliestDateByDaa(applications: SideBySideReportData['applications'], daa: number): string | null {
  const hits = (applications ?? [])
    .filter((item) => item.daa === daa && item.date?.trim())
    .map((item) => item.date!.trim())
    .sort();
  return hits[0] ?? null;
}

function buildApplicationsSeries(applications: SideBySideReportData['applications']) {
  if (!applications?.length) return null;
  const daas = [...new Set(applications.map((item) => item.daa).filter(isFiniteNumber))].sort((a, b) => a - b);
  if (daas.length === 0) return null;
  return daas.map((daa) => {
    const dateIso = earliestDateByDaa(applications, daa);
    const dateLabel = dateIso ? formatDate(dateIso).slice(0, 5) : `${daa} DAA`;
    return {
      daa,
      dateLabel,
      sideA: applications.filter((item) => item.side === 'A' && item.daa === daa).length,
      sideB: applications.filter((item) => item.side === 'B' && item.daa === daa).length,
    };
  });
}

function deriveRisk(ocorrencias: SideBySideReportData['ocorrencias']): string | null {
  if (!ocorrencias?.length) return null;
  const maxIncidencia = Math.max(...ocorrencias.map((item) => item.incidenciaPct ?? 0));
  const highSeverity = ocorrencias.some((item) => {
    const severity = (item.severidade || '').toLowerCase();
    return severity.includes('alta') || severity.includes('muito alta');
  });
  if (highSeverity || maxIncidencia > 30) return 'Alto';
  if (maxIncidencia > 15) return 'Moderado';
  return 'Baixo';
}

function deriveEconomics(data: SideBySideReportData) {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const rowA = colheita?.sides?.find((item) => item.side === 'A');
  const rowB = colheita?.sides?.find((item) => item.side === 'B');
  const pricePerSack = data.economia?.preco_saca_brl ?? null;
  const scA =
    rowA?.yieldScHa ??
    (isFiniteNumber(rowA?.yieldKgHa) && (colheita?.kgPerSack ?? 60) > 0 ? rowA!.yieldKgHa! / (colheita?.kgPerSack ?? 60) : null) ??
    null;
  const scB =
    rowB?.yieldScHa ??
    (isFiniteNumber(rowB?.yieldKgHa) && (colheita?.kgPerSack ?? 60) > 0 ? rowB!.yieldKgHa! / (colheita?.kgPerSack ?? 60) : null) ??
    null;
  const deltaScHa = isFiniteNumber(scA) && isFiniteNumber(scB) ? scB - scA : null;
  const deltaReais = isFiniteNumber(deltaScHa) && isFiniteNumber(pricePerSack) ? Math.round(deltaScHa * pricePerSack) : null;
  const roiA = data.decision_layer?.roiBySide?.A?.roiPct ?? null;
  const roiB = data.decision_layer?.roiBySide?.B?.roiPct ?? null;
  return { scA, scB, deltaScHa, deltaReais, roiA, roiB, pricePerSack };
}

function ratingValue(score?: number, max?: number): number | null {
  if (!isFiniteNumber(score) || !isFiniteNumber(max) || max <= 0) return null;
  return (score / max) * 100;
}

function metricCards(data: SideBySideReportData): MetricCard[] {
  const kA = data.sideA?.kpis;
  const kB = data.sideB?.kpis;

  const estande: MetricCard =
    isFiniteNumber(kA?.eficienciaPct) && isFiniteNumber(kB?.eficienciaPct)
      ? { label: 'Estande', unit: '%', a: kA.eficienciaPct, b: kB.eficienciaPct }
      : { label: 'Estande', unit: 'pl/ha', a: kA?.finalPopulationPlHa ?? null, b: kB?.finalPopulationPlHa ?? null };

  const vigor: MetricCard =
    isFiniteNumber(kA?.vigorCulturaPct) && isFiniteNumber(kB?.vigorCulturaPct)
      ? { label: 'Vigor', unit: '%', a: kA.vigorCulturaPct, b: kB.vigorCulturaPct }
      : {
          label: 'Vigor',
          unit: 'escala',
          a: isFiniteNumber(kA?.vigorRating?.score) ? kA!.vigorRating!.score! : null,
          b: isFiniteNumber(kB?.vigorRating?.score) ? kB!.vigorRating!.score! : null,
          digits: 1,
        };

  const raiz: MetricCard =
    isFiniteNumber(kA?.profundidadeRaizCm) && isFiniteNumber(kB?.profundidadeRaizCm)
      ? { label: 'Raiz', unit: 'cm', a: kA.profundidadeRaizCm, b: kB.profundidadeRaizCm }
      : {
          label: 'Raiz',
          unit: 'escala',
          a: isFiniteNumber(kA?.rootRating?.score) ? kA!.rootRating!.score! : null,
          b: isFiniteNumber(kB?.rootRating?.score) ? kB!.rootRating!.score! : null,
          digits: 1,
        };

  return [estande, vigor, raiz];
}

function buildRadarRows(data: SideBySideReportData) {
  const kA = data.sideA?.kpis;
  const kB = data.sideB?.kpis;
  const rows = [
    {
      subject: 'Estande',
      A: kA?.eficienciaPct ?? null,
      B: kB?.eficienciaPct ?? null,
    },
    {
      subject: 'Vigor',
      A: kA?.vigorCulturaPct ?? ratingValue(kA?.vigorRating?.score, kA?.vigorRating?.max ?? 5),
      B: kB?.vigorCulturaPct ?? ratingValue(kB?.vigorRating?.score, kB?.vigorRating?.max ?? 5),
    },
    {
      subject: 'Raiz',
      A: ratingValue(kA?.rootRating?.score, kA?.rootRating?.max ?? 5),
      B: ratingValue(kB?.rootRating?.score, kB?.rootRating?.max ?? 5),
    },
    {
      subject: 'Vigor inf.',
      A: ratingValue(kA?.vigorRating?.score, kA?.vigorRating?.max ?? 5),
      B: ratingValue(kB?.vigorRating?.score, kB?.vigorRating?.max ?? 5),
    },
    {
      subject: 'Sanidade',
      A: kA?.controleDaninhasPct ?? (isFiniteNumber(kA?.fitotoxidez?.score) ? Math.max(0, 100 - (kA!.fitotoxidez!.score! / (kA!.fitotoxidez!.max ?? 10)) * 100) : null),
      B: kB?.controleDaninhasPct ?? (isFiniteNumber(kB?.fitotoxidez?.score) ? Math.max(0, 100 - (kB!.fitotoxidez!.score! / (kB!.fitotoxidez!.max ?? 10)) * 100) : null),
    },
  ];

  if (!rows.some((item) => isFiniteNumber(item.A) || isFiniteNumber(item.B))) {
    return null;
  }

  return rows.map((item) => ({
    ...item,
    A: item.A ?? 0,
    B: item.B ?? 0,
  }));
}

function buildAiAlerts(data: SideBySideReportData): AlertRow[] {
  const motorAlerts = data.decision_layer?.fortsmart_ai?.motor_alertas ?? [];
  const mapped = motorAlerts
    .map<AlertRow | null>((item) => {
      const text = firstText(item.titulo, item.mensagem);
      if (!text) return null;
      const level =
        item.nivel === 'critico' || item.nivel === 'atencao'
          ? 'error'
          : item.nivel === 'monitorar'
            ? 'warning'
            : 'info';
      return { level, text };
    })
    .filter((item): item is AlertRow => Boolean(item));

  if (mapped.length > 0) return mapped.slice(0, 3);

  return (
    data.diagnostics?.recommendations
      ?.slice(0, 2)
      .map<AlertRow>((text) => ({ level: 'warning', text })) ?? []
  );
}

function tabButtonClass(active: boolean, accent: string) {
  return active
    ? `rounded-lg px-3 py-2 text-[11px] font-bold text-white shadow-sm`
    : 'rounded-lg px-3 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900';
}

function PanelHeader({
  title,
  subtitle,
  onPrint,
}: {
  title: string;
  subtitle: string | null;
  onPrint: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
      <FortSmartLogo size={34} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[1.05rem] font-bold text-slate-900">{title}</div>
        <div className="truncate text-xs text-slate-500">{subtitle || 'Relatório comparativo lado a lado'}</div>
      </div>
      <div className="flex items-center gap-1.5 text-slate-500">
        <button
          type="button"
          onClick={onPrint}
          className="rounded-full border border-slate-200 bg-white p-2 transition hover:border-slate-300 hover:text-slate-900"
          aria-label="Imprimir relatório"
        >
          <Printer className="h-4 w-4" />
        </button>
        <span className="rounded-full border border-slate-200 bg-white p-2">
          <Bell className="h-4 w-4" />
        </span>
        <span className="rounded-full border border-slate-200 bg-white p-2">
          <UserCircle2 className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function ScoreBadge({
  label,
  value,
  color,
  compact = false,
}: {
  label: string;
  value: number | null;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl text-white shadow-sm',
        compact ? 'flex items-center gap-2 px-3 py-2' : 'flex min-w-[120px] flex-col items-center px-4 py-3',
      )}
      style={{ backgroundColor: color }}
    >
      <span className={cn('font-black tabular-nums', compact ? 'text-2xl leading-none' : 'text-4xl leading-none')}>
        {value != null ? Math.round(value) : '—'}
      </span>
      <span className={cn('font-bold uppercase tracking-[0.18em]', compact ? 'text-[10px] text-white/80' : 'mt-1 text-[11px] text-white/80')}>
        {label}
      </span>
    </div>
  );
}

function MetricVsCard({ metric }: { metric: MetricCard }) {
  const winnerA = isFiniteNumber(metric.a) && isFiniteNumber(metric.b) && metric.a >= metric.b;
  const winnerB = isFiniteNumber(metric.a) && isFiniteNumber(metric.b) && metric.b >= metric.a;

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
      <div className="text-[11px] font-semibold text-slate-500">{metric.label}</div>
      <div className="mt-2 flex items-center justify-between gap-2 text-sm font-bold text-slate-800">
        <span style={{ color: winnerA ? COLOR_SIDE_A : COLORS.text }}>
          <ValueOrNull value={metric.a} digits={metric.digits ?? 0} nullLabel="null" />
        </span>
        <span className="text-xs font-semibold text-slate-300">vs</span>
        <span style={{ color: winnerB ? COLOR_SIDE_B : COLORS.text }}>
          <ValueOrNull value={metric.b} digits={metric.digits ?? 0} nullLabel="null" />
        </span>
      </div>
      <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{metric.unit}</div>
    </div>
  );
}

function AlertBox({ alert }: { alert: AlertRow }) {
  const isError = alert.level === 'error';
  const isWarning = alert.level === 'warning';
  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-3 py-3 text-sm leading-relaxed"
      style={{
        backgroundColor: isError ? COLORS.redBg : isWarning ? COLORS.amberBg : COLORS.blueBg,
        borderColor: isError ? '#FECACA' : isWarning ? '#FED7AA' : '#BFDBFE',
      }}
    >
      <span className="mt-0.5">
        {isError ? <ShieldAlert className="h-4 w-4 text-red-600" /> : isWarning ? <TriangleAlert className="h-4 w-4 text-amber-600" /> : <Sprout className="h-4 w-4 text-blue-600" />}
      </span>
      <p className="text-slate-800">{alert.text}</p>
    </div>
  );
}

function StatsTable({ rows }: { rows: StatsRow[] | undefined }) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <NullBadge label="criteriosEstatistica: null" />
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
            <th className="px-3 py-2 font-semibold">Diferença</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.criterio}-${index}`} className="border-t border-slate-100 text-slate-700">
              <td className="px-3 py-2 font-medium">
                {row.criterio || 'Critério'}
                {row.unidade ? <span className="text-slate-400"> ({row.unidade})</span> : null}
              </td>
              <td className="px-3 py-2 font-semibold" style={{ color: COLOR_SIDE_A }}>
                <ValueOrNull value={row.mediaA} digits={1} />
              </td>
              <td className="px-3 py-2 font-semibold" style={{ color: COLOR_SIDE_B }}>
                <ValueOrNull value={row.mediaB} digits={1} />
              </td>
              <td className="px-3 py-2">
                <ValueOrNull value={row.cvPctA} suffix="%" digits={1} nullLabel="null" />
              </td>
              <td className="px-3 py-2">
                <ValueOrNull value={row.cvPctB} suffix="%" digits={1} nullLabel="null" />
              </td>
              <td className="px-3 py-2">
                {row.diferencaIndicativa ? (
                  <span
                    className="rounded-full px-2 py-1 font-semibold"
                    style={{
                      backgroundColor: row.diferencaIndicativa ? COLORS.greenBg : COLORS.slateBg,
                      color: row.diferencaIndicativa ? COLORS.green : COLORS.muted,
                    }}
                  >
                    {row.diferencaIndicativa ? 'Indicativa' : 'Neutra'}
                  </span>
                ) : (
                  <NullBadge label="null" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PlantMetricsTable({ rows }: { rows: PlantRow[] | undefined }) {
  if (!rows?.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
        <NullBadge label="plant_evaluation.metrics: null" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={`${row.label || row.key}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <div className="text-sm font-semibold text-slate-800">{row.label || row.key || 'Métrica'}</div>
          <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white px-3 py-2">
              <div className="text-[11px] font-semibold text-slate-500">Manejo A</div>
              <div className="mt-1 font-bold" style={{ color: COLOR_SIDE_A }}>
                <ValueOrNull value={row.meanA} digits={1} />
                {row.unit ? <span className="ml-1 text-xs text-slate-400">{row.unit}</span> : null}
              </div>
            </div>
            <div className="rounded-lg bg-white px-3 py-2">
              <div className="text-[11px] font-semibold text-slate-500">Manejo B</div>
              <div className="mt-1 font-bold" style={{ color: COLOR_SIDE_B }}>
                <ValueOrNull value={row.meanB} digits={1} />
                {row.unit ? <span className="ml-1 text-xs text-slate-400">{row.unit}</span> : null}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhotosGrid({
  sideAName,
  sideBName,
  photosA,
  photosB,
}: {
  sideAName: string;
  sideBName: string;
  photosA: NonNullable<SideBySideReportData['sideA']>['photos'] | undefined;
  photosB: NonNullable<SideBySideReportData['sideB']>['photos'] | undefined;
}) {
  const entries = [
    { side: 'A', name: sideAName, color: COLOR_SIDE_A, photo: photosA?.[0] },
    { side: 'B', name: sideBName, color: COLOR_SIDE_B, photo: photosB?.[0] },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {entries.map((entry) => (
        <div key={entry.side} className="space-y-2">
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {entry.photo?.url ? (
              <img src={entry.photo.url} alt={entry.photo.caption || entry.name} className="aspect-square w-full object-cover" />
            ) : (
              <div className="flex aspect-square items-center justify-center p-3 text-center text-xs text-slate-400">
                <NullBadge label={`side${entry.side}.photos[0].url`} />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="rounded-md px-2 py-1 text-center text-[11px] font-bold text-white" style={{ backgroundColor: entry.color }}>
              {entry.name}
            </div>
            <div className="min-h-[28px] text-center text-[11px] text-slate-500">{entry.photo?.caption || 'Sem legenda publicada.'}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactKpiRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-slate-500">{icon}</span>
      <div className="text-slate-700">
        <span className="font-semibold text-slate-900">{label}: </span>
        {children}
      </div>
    </div>
  );
}

export default function RelatorioLadoALadoDashboard({
  data,
  reportId,
  shareToken,
}: {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
}) {
  const [leftTab, setLeftTab] = useState<(typeof LEFT_TABS)[number]>('Geral');
  const [rightTab, setRightTab] = useState<(typeof RIGHT_TABS)[number]>('KPI');

  const farm = data.farm || {};
  const coleta = data.coleta;
  const sideAName = data.sideA?.name || 'Manejo A';
  const sideBName = data.sideB?.name || 'Manejo B';
  const economics = deriveEconomics(data);
  const risk = deriveRisk(data.ocorrencias);
  const winner = data.conclusion?.winner ?? null;
  const winnerName = winner === 'A' ? sideAName : winner === 'B' ? sideBName : null;
  const scoreA = data.sideA?.kpis?.performanceScore ?? null;
  const scoreB = data.sideB?.kpis?.performanceScore ?? null;
  const deltaScore = isFiniteNumber(scoreA) && isFiniteNumber(scoreB) ? scoreB - scoreA : null;
  const heroPhoto = pickHeroPhoto((winner === 'A' ? data.sideA?.photos : data.sideB?.photos) ?? data.sideB?.photos ?? data.sideA?.photos);
  const radarRows = useMemo(() => buildRadarRows(data), [data]);
  const applicationSeries = useMemo(() => buildApplicationsSeries(data.applications), [data.applications]);
  const alerts = useMemo(() => buildAiAlerts(data), [data]);
  const metrics = useMemo(() => metricCards(data), [data]);
  const statisticalRows = data.criteriosEstatistica;
  const plantRows = data.plant_evaluation?.metrics;
  const leftSubtitle = firstText(data.branding?.subtitle, coleta?.ensaioName, farm.fieldName);
  const rightSubtitle = firstText(coleta?.ensaioName, data.branding?.subtitle, farm.culture);
  const subheaderBits = [
    farm.culture ? `Cultura: ${farm.culture}` : null,
    coleta?.estadio ? `Estádio: ${coleta.estadio}` : null,
    coleta?.dae != null ? `${coleta.dae} DAA` : coleta?.dap != null ? `${coleta.dap} DAP` : null,
  ].filter(Boolean);

  const summaryText =
    data.conclusion?.summary?.trim() ||
    (economics.deltaScHa != null
      ? `${winnerName || 'O manejo favorecido'} apresenta ganho de ${formatNumber(economics.deltaScHa, { decimals: 0 })} sc/ha.`
      : null) ||
    data.resumo?.conclusaoCurta?.trim() ||
    null;

  const recommendationText = data.conclusion?.recommendations?.[0] || data.diagnostics?.recommendations?.[0] || null;

  const handlePrint = async () => {
    window.print();
    if (shareToken?.trim()) {
      void postReportAnalytics({
        shareToken: shareToken.trim(),
        eventType: 'download',
        module: 'avaliacao_lado_a_lado',
      });
    }
  };

  return (
    <div
      className="min-h-screen px-4 py-6 sm:px-6"
      style={{ backgroundColor: COLORS.bg, fontFamily: 'Inter, Roboto, sans-serif' }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 xl:grid xl:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-md">
          <PanelHeader title="Avaliação de Campo" subtitle={leftSubtitle} onPrint={handlePrint} />

          <div className="mt-4 text-xs text-slate-500">{subheaderBits.length > 0 ? subheaderBits.join(' · ') : <NullBadge label="monitoramento_cultura: null" />}</div>

          {data.comparativo_intro?.trim() ? (
            <blockquote className="mt-4 rounded-r-xl border-l-4 border-green-600 bg-green-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
              {data.comparativo_intro.trim()}
            </blockquote>
          ) : null}

          <div className="mt-5 rounded-2xl bg-[linear-gradient(90deg,#143B8A_0%,#15663A_100%)] p-4 text-white">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center">
              <div className="flex items-center gap-3">
                <ScoreBadge label={sideAName} value={scoreA} color={COLOR_SIDE_A} />
              </div>
              <div className="text-center">
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">Melhor desempenho</div>
                <div className="mt-1 text-sm font-bold">
                  {winnerName ? `${winnerName}` : <NullBadge label="conclusion.winner" />}
                </div>
                <div className="mt-1 text-xs text-white/70">« « comparação técnica publicada » »</div>
              </div>
              <div className="flex items-center justify-end gap-3">
                <ScoreBadge label={sideBName} value={scoreB} color={COLOR_SIDE_B} />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => (
              <MetricVsCard key={`${metric.label}-${metric.unit}`} metric={metric} />
            ))}
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <TrendingInline />
              <span className="font-semibold text-slate-900">Previsão Produtividade:</span>
              <span style={{ color: COLOR_SIDE_A }} className="font-bold">
                <ValueOrNull value={economics.scA} suffix=" sc/ha" nullLabel="colheita.A" />
              </span>
              <span className="text-slate-300">→</span>
              <span style={{ color: COLOR_SIDE_B }} className="font-bold">
                <ValueOrNull value={economics.scB} suffix=" sc/ha" nullLabel="colheita.B" />
              </span>
              {economics.deltaScHa != null ? (
                <span className="rounded-full px-2.5 py-1 text-xs font-bold" style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
                  +{formatNumber(economics.deltaScHa, { decimals: 0 })} sc/ha
                </span>
              ) : null}
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{
                  backgroundColor: risk === 'Alto' ? COLORS.redBg : risk === 'Moderado' ? COLORS.amberBg : COLORS.greenBg,
                  color: risk === 'Alto' ? COLORS.red : risk === 'Moderado' ? COLORS.amber : COLORS.green,
                }}
              >
                Risco {risk || 'null'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
              <ClipboardList className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-900">ROI Ajustado:</span>
              <span style={{ color: COLOR_SIDE_A }} className="font-bold">
                <ValueOrNull value={economics.roiA} suffix="%" nullLabel="roi.A" />
              </span>
              <span className="text-slate-300">→</span>
              <span style={{ color: COLOR_SIDE_B }} className="font-bold">
                <ValueOrNull value={economics.roiB} suffix="%" nullLabel="roi.B" />
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                Alertas {alerts.length > 0 ? '!' : 'null'}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-bold text-slate-900">Insights &amp; Alertas</div>
            <div className="space-y-2">
              {alerts.length > 0 ? alerts.map((alert, index) => <AlertBox key={`${alert.level}-${index}`} alert={alert} />) : <NullBadge label="fortsmart_ai.motor_alertas" />}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {LEFT_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setLeftTab(tab)}
                className={tabButtonClass(leftTab === tab, COLOR_SIDE_A)}
                style={leftTab === tab ? { backgroundColor: COLOR_SIDE_A } : undefined}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-4">
            {leftTab === 'Geral' ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">Eventos de Aplicação por DAA</div>
                    <div className="mt-1 text-xs text-amber-700">Série real disponível no JSON: contagem de eventos por `applications[].daa`.</div>
                  </div>
                </div>
                {applicationSeries?.length ? (
                  <div className="mt-4 h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={applicationSeries} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: COLORS.muted }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: COLORS.muted }} />
                        <Tooltip
                          formatter={(value: number, name: string) => [value, name === 'sideA' ? sideAName : sideBName]}
                          labelFormatter={(_, payload) => {
                            const row = payload?.[0]?.payload as { daa?: number } | undefined;
                            return row?.daa != null ? `DAA ${row.daa}` : 'DAA';
                          }}
                        />
                        <Legend formatter={(value) => (value === 'sideA' ? sideAName : sideBName)} />
                        <Area type="monotone" dataKey="sideA" name="sideA" stroke={COLORS.yellow} fill={COLORS.yellow} fillOpacity={0.18} strokeWidth={2}>
                          <LabelList dataKey="sideA" position="top" fill={COLORS.yellow} fontSize={10} />
                        </Area>
                        <Area type="monotone" dataKey="sideB" name="sideB" stroke={COLOR_SIDE_A} fill={COLOR_SIDE_A} fillOpacity={0.08} strokeWidth={2}>
                          <LabelList dataKey="sideB" position="top" fill={COLOR_SIDE_A} fontSize={10} />
                        </Area>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                    <NullBadge label="applications: null" />
                  </div>
                )}
              </div>
            ) : null}

            {leftTab === 'Estatística' ? <StatsTable rows={statisticalRows} /> : null}

            {leftTab === 'Aplicações' ? (
              <div className="space-y-2">
                {data.applications?.length ? (
                  data.applications.map((item, index) => {
                    const names = item.products
                      ?.map((product) => firstText(product.nomeComercial, product.nomeAtivo, product.classe))
                      .filter(Boolean)
                      .join(', ');
                    return (
                      <div
                        key={`${item.side}-${item.daa}-${index}`}
                        className="rounded-xl border px-3 py-3 text-sm"
                        style={{
                          backgroundColor: item.side === 'A' ? COLORS.blueBg : COLORS.greenBg,
                          borderColor: item.side === 'A' ? '#BFDBFE' : '#BBF7D0',
                        }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2 py-1 text-[11px] font-bold text-white"
                            style={{ backgroundColor: item.side === 'A' ? COLOR_SIDE_A : COLOR_SIDE_B }}
                          >
                            Lado {item.side}
                          </span>
                          <span className="font-semibold text-slate-900">DAA {item.daa ?? <NullBadge label="null" />}</span>
                          <span className="text-slate-500">{item.type || <NullBadge label="type" />}</span>
                          <span className="text-slate-500">{names || <NullBadge label="products" />}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <NullBadge label="applications: null" />
                )}
              </div>
            ) : null}

            {leftTab === 'Fitossanidade' ? (
              <div className="space-y-2">
                {data.ocorrencias?.length ? (
                  data.ocorrencias.map((item, index) => (
                    <div key={`${item.nomeAlvo}-${index}`} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">{item.tipo || 'Ocorrência'}</span>
                      <span className="font-semibold text-slate-900">{item.nomeAlvo || <NullBadge label="nomeAlvo" />}</span>
                      <span className="text-slate-500">
                        <ValueOrNull value={item.incidenciaPct} suffix="% incidência" nullLabel="incidenciaPct" />
                      </span>
                      <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-slate-600">{item.severidade || <NullBadge label="severidade" />}</span>
                    </div>
                  ))
                ) : (
                  <NullBadge label="ocorrencias: null" />
                )}
              </div>
            ) : null}

            {leftTab === 'Diagnóstico' ? (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">Problema:</span>{' '}
                  {firstText(data.diagnosis?.problemaPrincipal, data.resumo?.conclusaoCurta) || <NullBadge label="problemaPrincipal" />}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Causa provável:</span>{' '}
                  {data.diagnosis?.causaProvavel || <NullBadge label="causaProvavel" />}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Urgência:</span>{' '}
                  {data.diagnosis?.urgencia ? (
                    <span className="rounded-full bg-red-100 px-2 py-1 text-[11px] font-bold text-red-700">{data.diagnosis.urgencia}</span>
                  ) : (
                    <NullBadge label="urgencia" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Plano:</span>{' '}
                  {data.diagnosis?.planoAcao || <NullBadge label="planoAcao" />}
                </div>
              </div>
            ) : null}

            {leftTab === 'Fotos' ? (
              <PhotosGrid sideAName={sideAName} sideBName={sideBName} photosA={data.sideA?.photos} photosB={data.sideB?.photos} />
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-md">
          <div className="p-5">
            <PanelHeader title="Relatório de Avaliação" subtitle={rightSubtitle} onPrint={handlePrint} />
          </div>

          <div
            className="relative min-h-[124px] overflow-hidden px-5 py-4 text-white"
            style={{
              backgroundImage: heroPhoto?.url
                ? `linear-gradient(180deg, rgba(15,23,42,0.4), rgba(15,23,42,0.7)), url(${heroPhoto.url})`
                : 'linear-gradient(90deg, #14532d 0%, #0f172a 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="text-lg font-bold">
              {data.conclusion?.headline || (winnerName ? `${winnerName} - Superioridade Técnica e Econômica` : <NullBadge label="conclusion.headline" />)}
            </div>
            <div className="mt-1 text-xs text-white/80">
              {winner != null ? `Fonte visual: conclusion.winner = ${winner}` : <NullBadge label="conclusion.winner" />}
            </div>
          </div>

          <div className="space-y-4 p-5">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <ScoreBadge label="Manejo A" value={scoreA} color={COLOR_SIDE_A} compact />
              <div className="flex-1 text-center text-sm text-slate-600">
                {deltaScore != null ? (
                  <>
                    <span className="font-semibold text-slate-900">↔ {Math.abs(deltaScore)} pontos</span>
                    <div className="mt-1 text-xs text-slate-500">{deltaScore > 0 ? 'B > A' : deltaScore < 0 ? 'A > B' : 'A = B'}</div>
                  </>
                ) : (
                  <NullBadge label="score delta" />
                )}
              </div>
              <ScoreBadge label="Manejo B" value={scoreB} color={COLOR_SIDE_B} compact />
            </div>

            <div className="space-y-2">
              <CompactKpiRow icon={<Sprout className="h-4 w-4" />} label="Previsão de Produtividade">
                <span style={{ color: COLOR_SIDE_A }} className="font-bold">
                  <ValueOrNull value={economics.scA} suffix=" sc/ha" nullLabel="A" />
                </span>{' '}
                vs{' '}
                <span style={{ color: COLOR_SIDE_B }} className="font-bold">
                  <ValueOrNull value={economics.scB} suffix=" sc/ha" nullLabel="B" />
                </span>
                {economics.deltaScHa != null ? (
                  <span className="ml-2 font-bold text-green-700">(+{formatNumber(economics.deltaScHa, { decimals: 0 })} sc/ha)</span>
                ) : null}
              </CompactKpiRow>
              <CompactKpiRow icon={<ClipboardList className="h-4 w-4" />} label="ROI Ajustado">
                <span className="font-bold text-green-700">
                  <ValueOrNull value={economics.roiA} suffix="%" nullLabel="roi.A" />
                </span>{' '}
                vs{' '}
                <span className="font-bold text-green-700">
                  <ValueOrNull value={economics.roiB} suffix="%" nullLabel="roi.B" />
                </span>
              </CompactKpiRow>
              <CompactKpiRow icon={<TriangleAlert className="h-4 w-4" />} label="Risco">
                {risk || <NullBadge label="ocorrencias" />}
              </CompactKpiRow>
            </div>

            <div className="flex flex-wrap gap-2">
              {RIGHT_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRightTab(tab)}
                  className={tabButtonClass(rightTab === tab, COLOR_SIDE_A)}
                  style={rightTab === tab ? { backgroundColor: COLOR_SIDE_A } : undefined}
                >
                  {tab}
                </button>
              ))}
            </div>

            {rightTab === 'KPI' ? (
              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm font-bold text-slate-900">Comparativo de Desempenho</div>
                  <div className="mt-1 text-xs text-slate-500">Radar normalizado com base nos KPIs reais publicados.</div>
                  {radarRows ? (
                    <div className="mt-4 h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarRows}>
                          <PolarGrid stroke="#E2E8F0" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: COLORS.muted }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name={sideAName} dataKey="A" stroke={COLOR_SIDE_A} fill={COLOR_SIDE_A} fillOpacity={0.18} strokeWidth={2} />
                          <Radar name={sideBName} dataKey="B" stroke={COLOR_SIDE_B} fill={COLOR_SIDE_B} fillOpacity={0.18} strokeWidth={2} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
                      <NullBadge label="kpis: null" />
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                    <Camera className="h-4 w-4 text-slate-500" />
                    Fotos de Campo
                  </div>
                  <PhotosGrid sideAName={sideAName} sideBName={sideBName} photosA={data.sideA?.photos} photosB={data.sideB?.photos} />
                </div>
              </div>
            ) : null}

            {rightTab === 'Estatística' ? <StatsTable rows={statisticalRows} /> : null}

            {rightTab === 'Plantas' ? (
              <div>
                <div className="mb-3 text-xs text-slate-500">
                  Amostras:{' '}
                  {typeof data.plant_evaluation?.sampleSize === 'object' ? (
                    <>
                      A {data.plant_evaluation?.sampleSize?.A ?? '—'} · B {data.plant_evaluation?.sampleSize?.B ?? '—'}
                    </>
                  ) : (
                    <NullBadge label="sampleSize" />
                  )}
                </div>
                <PlantMetricsTable rows={plantRows} />
              </div>
            ) : null}

            {rightTab === 'Fotos' ? (
              <PhotosGrid sideAName={sideAName} sideBName={sideBName} photosA={data.sideA?.photos} photosB={data.sideB?.photos} />
            ) : null}

            {rightTab === 'Conclusão' ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4 text-sm leading-relaxed text-slate-700">
                  {summaryText || <NullBadge label="conclusion.summary" />}
                </div>
                <div className="text-sm font-bold text-slate-900">Recomendações</div>
                <div className="space-y-2">
                  {data.conclusion?.recommendations?.length ? (
                    data.conclusion.recommendations.map((item, index) => (
                      <div key={`${item}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
                        <span className="mr-2 font-bold text-green-700">{index + 1}.</span>
                        {item}
                      </div>
                    ))
                  ) : (
                    <NullBadge label="conclusion.recommendations" />
                  )}
                </div>
              </div>
            ) : null}

            <div className="border-t border-slate-200 pt-4">
              <div className="text-base font-bold text-slate-900">Resumo Executivo</div>
              <div className="mt-3 space-y-2">
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-slate-800">
                  <div className="flex items-start gap-2">
                    <Sprout className="mt-0.5 h-4 w-4 text-green-700" />
                    <p>
                      {summaryText || (
                        <>
                          {winnerName || 'O manejo vencedor'} demonstra melhor desempenho técnico e econômico.
                          {economics.deltaScHa != null ? ` Projeção de ganho de ${formatNumber(economics.deltaScHa, { decimals: 0 })} sc/ha.` : ''}
                          {economics.deltaReais != null ? ` (+R$ ${formatNumber(economics.deltaReais, { decimals: 0 })}/ha).` : ''}
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-slate-800">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-700" />
                    <p>{recommendationText || <NullBadge label="recommendation" />}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400">
              ID {data.meta?.reportId || reportId || '—'} · Layout reconstruído para leitura web lado a lado
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function TrendingInline() {
  return <span className="text-slate-500">📈</span>;
}
