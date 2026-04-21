'use client';

import React, { useMemo } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import {
  COLOR_SIDE_A,
  COLOR_SIDE_B,
  evolutionSeriesFromApplications,
  isColheitaJson,
  pickHeroPhoto,
  pressaoFitossanitariaMedia,
} from '@/components/lado_a_lado/ladoALadoHelpers';
import { resolveDecision } from '@/lib/decision';
import { formatNumber } from '@/utils/format';
import { buildPremiumRadarRows } from './evaluationRadar';
import { heroFinancialSnapshot, scoresFromJson, winnerFromJson } from './premiumInference';

function scHaFromSide(data: SideBySideReportData, side: 'A' | 'B'): number | null {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kg = colheita?.kgPerSack ?? 60;
  const row = colheita?.sides?.find((s) => s.side === side);
  if (row?.yieldScHa != null && Number.isFinite(row.yieldScHa)) return row.yieldScHa;
  if (row?.yieldKgHa != null && kg > 0) return row.yieldKgHa / kg;
  const k = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  if (k?.estimatedYieldKgHa != null && kg > 0) return k.estimatedYieldKgHa / kg;
  return null;
}

function estandeDisplay(data: SideBySideReportData, side: 'A' | 'B'): number | null {
  const k = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  const v = k?.eficienciaPct ?? k?.estandeEfetivo ?? null;
  if (v != null && Number.isFinite(v)) return v;
  const pop = k?.finalPopulationPlHa;
  if (pop != null && Number.isFinite(pop)) return pop;
  return null;
}

function vigorDisplay(data: SideBySideReportData, side: 'A' | 'B'): number | null {
  const k = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  if (k?.vigorCulturaPct != null && Number.isFinite(k.vigorCulturaPct)) return k.vigorCulturaPct;
  const sc = k?.vigorRating?.score;
  const mx = k?.vigorRating?.max ?? 5;
  if (sc != null && mx > 0) return (sc / mx) * 100;
  return null;
}

function raizDisplay(data: SideBySideReportData, side: 'A' | 'B'): number | null {
  const k = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  const sc = k?.rootRating?.score;
  const mx = k?.rootRating?.max ?? 5;
  if (sc != null && mx > 0) return (sc / mx) * 100;
  const pr = k?.profundidadeRaizCm;
  if (pr != null && Number.isFinite(pr)) return pr;
  return null;
}

function roiPctSide(data: SideBySideReportData, side: 'A' | 'B'): number | null {
  const r = data.decision_layer?.roiBySide?.[side];
  const v = r?.roiPct;
  return v != null && Number.isFinite(v) ? v : null;
}

function riskLabel(data: SideBySideReportData): string {
  const pressao = pressaoFitossanitariaMedia(data.ocorrencias);
  if (pressao != null) {
    if (pressao >= 40) return 'Risco elevado (fitossanidade)';
    if (pressao >= 15) return 'Risco moderado';
    return 'Risco baixo';
  }
  const al = data.decision_layer?.fortsmart_ai?.motor_alertas ?? [];
  const crit = al.find((a) => a.nivel === 'critico' || a.nivel === 'atencao');
  if (crit?.titulo) return crit.titulo;
  return '—';
}

function insightLines(data: SideBySideReportData): string[] {
  const out: string[] = [];
  const s = data.conclusion?.summary?.trim();
  if (s) {
    s.split(/\n+/).forEach((line) => {
      const t = line.trim();
      if (t.length > 12) out.push(t);
    });
  }
  const expl = data.decision_layer?.fortsmart_ai?.explanations ?? [];
  for (const e of expl) {
    if (typeof e === 'string' && e.trim().length > 12) out.push(e.trim());
  }
  if (out.length === 0 && data.resumo?.conclusaoCurta?.trim()) {
    out.push(data.resumo.conclusaoCurta.trim());
  }
  return out.slice(0, 3);
}

const TAB_TARGETS: { id: string; label: string }[] = [
  { id: 'deck-executivo-premium', label: 'Geral' },
  { id: 'kpis-premium', label: 'KPIs' },
  { id: 'comparativo-premium', label: 'Comparativo' },
  { id: 'coleta-modulos-premium', label: 'Coleta' },
  { id: 'execucao-premium', label: 'Aplicações' },
  { id: 'avaliacao-premium', label: 'Evidências' },
  { id: 'conclusao-premium', label: 'Conclusão' },
];

/**
 * Layout tipo “dashboard executivo” (referência visual do produto), alimentado só pelo JSON publicado.
 */
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
  const { a: scoreA, b: scoreB } = scoresFromJson(data);
  const winner = winnerFromJson(data);
  const resolved = resolveDecision(data);
  const fin = heroFinancialSnapshot(data);

  const winnerSide = winner ?? (resolved.engine === 'A' || resolved.engine === 'B' ? resolved.engine : null);
  const winnerName = winnerSide === 'A' ? nameA : winnerSide === 'B' ? nameB : null;

  const estadio =
    data.phenology?.sideA?.estadio?.trim() ||
    data.phenology?.sideB?.estadio?.trim() ||
    coleta?.estadio?.trim() ||
    null;
  const daa = coleta?.dae ?? coleta?.dap;
  const culture = farm.culture?.trim();
  const metaLine = [culture && `Cultura: ${culture}`, estadio && `Estádio: ${estadio}`, daa != null && `DAA ${daa}`]
    .filter(Boolean)
    .join(' · ');

  const scA = scHaFromSide(data, 'A');
  const scB = scHaFromSide(data, 'B');
  const deltaSc = scA != null && scB != null ? scB - scA : fin.deltaScHa;

  const roiA = roiPctSide(data, 'A');
  const roiB = roiPctSide(data, 'B');

  const eA = estandeDisplay(data, 'A');
  const eB = estandeDisplay(data, 'B');
  const vA = vigorDisplay(data, 'A');
  const vB = vigorDisplay(data, 'B');
  const rA = raizDisplay(data, 'A');
  const rB = raizDisplay(data, 'B');

  const radarRows = useMemo(() => buildPremiumRadarRows(data), [data]);
  const lineSeries = useMemo(() => evolutionSeriesFromApplications(data.applications), [data.applications]);
  const photoA = pickHeroPhoto(data.sideA?.photos);
  const photoB = pickHeroPhoto(data.sideB?.photos);

  const insights = insightLines(data);
  const scoreDelta =
    scoreA != null && scoreB != null ? Math.round(scoreB - scoreA) : null;
  const deltaWinner = scoreDelta != null && scoreDelta > 0 ? 'B' : scoreDelta != null && scoreDelta < 0 ? 'A' : null;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section id={sectionId} className="scroll-mt-36 print:break-inside-avoid">
      <div className="rounded-[1.35rem] border border-slate-200/90 bg-gradient-to-b from-white to-slate-50/90 shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.04] overflow-hidden">
        {/* Cabeçalho tipo app */}
        <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-6 border-b border-slate-100 bg-white/80">
          <div>
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.28em] text-slate-400">Relatório de avaliação</p>
            <h2 className="mt-1.5 text-lg sm:text-2xl font-semibold tracking-tight text-slate-900">
              {[farm.fieldName, coleta?.ensaioName].filter(Boolean).join(' — ') || farm.objective || 'Ensaio lado a lado'}
            </h2>
            {metaLine ? (
              <p className="mt-1 text-xs sm:text-sm text-slate-500">{metaLine}</p>
            ) : null}
          </div>
        </div>

        {/* Faixa comparativa — scores */}
        <div className="px-4 sm:px-6 py-5 sm:py-6 bg-slate-50/90">
          {winnerName ? (
            <p className="text-center text-sm font-semibold text-slate-700 mb-4">
              Melhor desempenho:{' '}
              <span style={{ color: winnerSide === 'A' ? COLOR_SIDE_A : COLOR_SIDE_B }}>{winnerName}</span>
            </p>
          ) : (
            <p className="text-center text-sm text-slate-500 mb-4">Comparativo técnico A × B (dados publicados)</p>
          )}

          <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3 sm:gap-4 max-w-3xl mx-auto">
            <div
              className="flex-1 min-h-[5.5rem] rounded-2xl px-5 py-4 text-white shadow-lg flex flex-col justify-center items-center sm:skew-x-0"
              style={{
                background: `linear-gradient(135deg, ${COLOR_SIDE_A} 0%, #1d4ed8 100%)`,
                clipPath: 'polygon(0 0, 100% 0, 96% 100%, 0% 100%)',
              }}
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/80">{nameA}</p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums leading-none mt-1">
                {scoreA != null ? Math.round(scoreA) : '—'}
              </p>
            </div>
            <div className="flex items-center justify-center px-2">
              {scoreDelta != null ? (
                <div className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm tabular-nums">
                  {deltaWinner === 'B' ? 'B' : deltaWinner === 'A' ? 'A' : '—'} →{' '}
                  {deltaWinner === 'B' ? 'A' : deltaWinner === 'A' ? 'B' : '—'} (
                  {scoreDelta > 0 ? '+' : ''}
                  {scoreDelta})
                </div>
              ) : (
                <span className="text-xs text-slate-400">vs</span>
              )}
            </div>
            <div
              className="flex-1 min-h-[5.5rem] rounded-2xl px-5 py-4 text-white shadow-lg flex flex-col justify-center items-center"
              style={{
                background: `linear-gradient(135deg, ${COLOR_SIDE_B} 0%, #0f766e 100%)`,
                clipPath: 'polygon(4% 0, 100% 0, 100% 100%, 0% 100%)',
              }}
            >
              <p className="text-[0.65rem] font-bold uppercase tracking-widest text-white/80">{nameB}</p>
              <p className="text-4xl sm:text-5xl font-black tabular-nums leading-none mt-1">
                {scoreB != null ? Math.round(scoreB) : '—'}
              </p>
            </div>
          </div>

          {/* Estande · Vigor · Raiz */}
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-xl bg-white/90 border border-slate-200/80 py-3 px-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">Estande</p>
              <p className="mt-1 font-semibold tabular-nums">
                <span style={{ color: COLOR_SIDE_A }}>{eA != null ? formatNumber(eA, { decimals: 0 }) : '—'}</span>
                <span className="text-slate-300 mx-1">vs</span>
                <span style={{ color: COLOR_SIDE_B }}>{eB != null ? formatNumber(eB, { decimals: 0 }) : '—'}</span>
              </p>
            </div>
            <div className="rounded-xl bg-white/90 border border-slate-200/80 py-3 px-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">Vigor</p>
              <p className="mt-1 font-semibold tabular-nums">
                <span style={{ color: COLOR_SIDE_A }}>{vA != null ? formatNumber(vA, { decimals: 0 }) : '—'}</span>
                <span className="text-slate-300 mx-1">vs</span>
                <span style={{ color: COLOR_SIDE_B }}>{vB != null ? formatNumber(vB, { decimals: 0 }) : '—'}</span>
              </p>
            </div>
            <div className="rounded-xl bg-white/90 border border-slate-200/80 py-3 px-2">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-slate-500">Raiz</p>
              <p className="mt-1 font-semibold tabular-nums">
                <span style={{ color: COLOR_SIDE_A }}>{rA != null ? formatNumber(rA, { decimals: 0 }) : '—'}</span>
                <span className="text-slate-300 mx-1">vs</span>
                <span style={{ color: COLOR_SIDE_B }}>{rB != null ? formatNumber(rB, { decimals: 0 }) : '—'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 px-4 sm:px-6 py-4 bg-white border-y border-slate-100">
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[0.6rem] font-bold uppercase text-slate-500">Previsão sc/ha</p>
            <p className="mt-1 text-sm font-bold text-slate-800 tabular-nums">
              {scA != null ? formatNumber(scA, { decimals: 0 }) : '—'} vs {scB != null ? formatNumber(scB, { decimals: 0 }) : '—'}
            </p>
            {deltaSc != null && Number.isFinite(deltaSc) ? (
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                Δ {deltaSc > 0 ? '+' : ''}
                {formatNumber(deltaSc, { decimals: 1 })} sc/ha (B − A)
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[0.6rem] font-bold uppercase text-slate-500">ROI ajustado</p>
            <p className="mt-1 text-sm font-bold tabular-nums text-slate-800">
              {roiA != null ? `${formatNumber(roiA, { decimals: 0 })}%` : '—'} vs{' '}
              {roiB != null ? `${formatNumber(roiB, { decimals: 0 })}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3">
            <p className="text-[0.6rem] font-bold uppercase text-slate-500">Risco</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">{riskLabel(data)}</p>
          </div>
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
            <p className="text-[0.6rem] font-bold uppercase text-amber-900/80">Alertas</p>
            <p className="mt-1 text-xs text-amber-950/90 line-clamp-3">
              {(data.decision_layer?.fortsmart_ai?.motor_alertas ?? [])[0]?.titulo ||
                data.diagnostics?.recommendations?.[0] ||
                'Sem alertas motorizados no JSON.'}
            </p>
          </div>
        </div>

        {/* Insights */}
        {insights.length > 0 ? (
          <div className="px-4 sm:px-6 py-4 space-y-2 bg-white">
            <p className="text-[0.65rem] font-bold uppercase tracking-widest text-slate-500">Insights</p>
            {insights.map((line, i) => (
              <div
                key={i}
                className={`rounded-xl border px-3 py-2.5 text-sm leading-snug ${
                  i === 0 ? 'border-amber-200 bg-amber-50/50 text-amber-950' : 'border-slate-200 bg-slate-50 text-slate-800'
                }`}
              >
                {line}
              </div>
            ))}
          </div>
        ) : null}

        {/* Tabs → âncoras */}
        <div className="px-3 sm:px-5 py-3 bg-slate-50 border-t border-slate-100 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {TAB_TARGETS.map((t, idx) => (
              <button
                key={`${t.id}-${idx}`}
                type="button"
                onClick={() => scrollTo(t.id)}
                className="shrink-0 px-3 py-2 rounded-full text-xs font-semibold uppercase tracking-wide bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 shadow-sm transition-colors"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Radar + fotos */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 px-4 sm:px-6 py-5 bg-white">
          <div className="lg:col-span-3 rounded-2xl border border-slate-200/80 bg-slate-50/40 p-4">
            <p className="text-sm font-semibold text-slate-900">Comparativo de desempenho</p>
            <p className="text-xs text-slate-500 mt-0.5 mb-3">Eixos 0–100 derivados dos KPIs e fenologia publicados.</p>
            {radarRows.length > 0 ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarRows} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name={nameA} dataKey="A" stroke={COLOR_SIDE_A} fill={COLOR_SIDE_A} fillOpacity={0.22} strokeWidth={2} />
                    <Radar name={nameB} dataKey="B" stroke={COLOR_SIDE_B} fill={COLOR_SIDE_B} fillOpacity={0.18} strokeWidth={2} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-slate-500 py-8 text-center">Sem base suficiente para o radar (KPIs / fenologia).</p>
            )}
          </div>
          <div className="lg:col-span-2 flex flex-col gap-3">
            <p className="text-sm font-semibold text-slate-900">Fotos de campo</p>
            <div className="grid grid-cols-2 gap-2 flex-1 min-h-[200px]">
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4]">
                {photoA?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoA.url} alt={nameA} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 p-2 text-center">Sem foto A</div>
                )}
                <div className="absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-bold uppercase text-white bg-slate-900/75">
                  {nameA}
                </div>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[3/4]">
                {photoB?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoB.url} alt={nameB} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 p-2 text-center">Sem foto B</div>
                )}
                <div className="absolute bottom-0 inset-x-0 py-1 text-center text-[10px] font-bold uppercase text-white bg-slate-900/75">
                  {nameB}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Evolução por DAA (eventos) */}
        {lineSeries && lineSeries.length >= 2 ? (
          <div className="px-4 sm:px-6 pb-6 bg-white">
            <p className="text-sm font-semibold text-slate-900 mb-1">Evolução por DAA (aplicações)</p>
            <p className="text-xs text-slate-500 mb-3">Contagem de eventos publicados por manejo e DAA.</p>
            <div className="h-52 w-full rounded-2xl border border-slate-200/80 p-2 bg-slate-50/50">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineSeries} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="A" name={nameA} stroke={COLOR_SIDE_A} strokeWidth={2} dot />
                  <Line type="monotone" dataKey="B" name={nameB} stroke={COLOR_SIDE_B} strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : null}

        {/* Faixa hero escura — mensagem de conclusão curta */}
        {(data.conclusion?.headline?.trim() || winnerName) && (
          <div
            className="relative px-5 py-4 sm:px-8 sm:py-5 text-white overflow-hidden"
            style={{
              background: `linear-gradient(105deg, #0f172a 0%, #14532d 45%, #0f172a 100%)`,
            }}
          >
            <div className="absolute inset-0 opacity-25 bg-[url('data:image/svg+xml,%3Csvg width=\'120\' height=\'120\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\' opacity=\'0.35\'/%3E%3C/svg%3E')]"
              aria-hidden
            />
            <p className="relative text-sm sm:text-base font-medium leading-relaxed max-w-3xl">
              {data.conclusion?.headline?.trim() ||
                (winnerName ? `${winnerName} — superioridade técnica indicada no registro.` : '')}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
