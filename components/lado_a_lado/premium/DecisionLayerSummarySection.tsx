'use client';

import { AlertCircle } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { mergeReportDataGaps } from '@/lib/ladoALadoPayloadGaps';
import { formatNumber } from '@/utils/format';
import {
  heroFinancialSnapshot,
  productivityDeltaKgHaFromKpis,
  scoresFromJson,
} from './premiumInference';
import DecisionKpiStrip from './DecisionKpiStrip';
import DecisionLayerHero from './DecisionLayerHero';

const SIDE_A = '#2E7D32';
const SIDE_B = '#1565C0';

function RoiTypeChip({
  side,
  label,
  roiType,
  uiLabel,
}: {
  side: 'A' | 'B';
  label: string;
  roiType: string;
  uiLabel: string;
}) {
  const border = side === 'A' ? SIDE_A : SIDE_B;
  const bg =
    roiType === 'real'
      ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
      : roiType === 'estimated'
        ? 'bg-amber-50 text-amber-900 border-amber-200'
        : 'bg-slate-100 text-slate-600 border-slate-200';
  return (
    <div
      className={`rounded-lg border px-2.5 py-1.5 text-left ${bg}`}
      style={{ borderLeftWidth: 3, borderLeftColor: border }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-xs font-semibold mt-0.5">ROI: {uiLabel}</p>
    </div>
  );
}

/**
 * Camada de decisão executiva — primeira leitura após o herói (alinhada ao layout premium de referência).
 */
export default function DecisionLayerSummarySection({ data }: { data: SideBySideReportData }) {
  const meta = data.meta;
  const conf = meta?.confidenceScore;
  const gaps = meta?.missingData;
  const dl = data.decision_layer;
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const engine = dl?.engineOverallWinner as 'A' | 'B' | 'tie' | null | undefined;
  const wApp = data.conclusion?.winner;
  const winnerLetter: 'A' | 'B' | null =
    engine === 'A' || engine === 'B'
      ? engine
      : wApp === 'A' || wApp === 'B'
        ? wApp
        : null;
  const winnerName = winnerLetter === 'A' ? nameA : winnerLetter === 'B' ? nameB : null;

  const { a: sA, b: sB } = scoresFromJson(data);
  const fin = heroFinancialSnapshot(data);
  const dKg = productivityDeltaKgHaFromKpis(data);
  const summaryLines = (dl?.summaryLines as string[] | undefined) ?? [];
  const rec =
    (data.conclusion?.recommendations && data.conclusion.recommendations[0]?.trim()) ||
    data.conclusion?.headline?.trim() ||
    (winnerName
      ? `Recomenda-se avaliar a adoção do ${winnerName} com base no conjunto de evidências publicadas.`
      : null);

  const ea = data.economic_analysis as Record<string, unknown> | null | undefined;
  const roiAudit = ea?.roiAudit as
    | {
        A?: { roi?: number | null; roiType?: string; source?: string | null };
        B?: { roi?: number | null; roiType?: string; source?: string | null };
      }
    | undefined;
  const uiLabels = (ea?.uiLabels as Record<string, string> | undefined) ?? {
    real: 'Baseado em colheita',
    estimated: 'Estimativa agronômica',
    unavailable: 'Dados insuficientes',
  };

  const pickUi = (t?: string) => uiLabels[t ?? 'unavailable'] ?? uiLabels.unavailable;
  const mergedGaps = mergeReportDataGaps(gaps, data);
  const showReliability = conf != null && Number.isFinite(conf);
  const showGaps = mergedGaps.length > 0;

  return (
    <section
      id="decisao-executiva-premium"
      className="fs-l2-avoid scroll-mt-36 print:break-inside-avoid"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
        {(showReliability || showGaps) && (
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:flex-row sm:items-start sm:justify-between">
            {showReliability ? (
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Confiabilidade do relatório
                </p>
                <p className="text-2xl font-bold tabular-nums text-slate-900">
                  {formatNumber(Math.min(100, Math.max(0, conf as number)), { decimals: 0 })}%
                </p>
              </div>
            ) : null}
            {showGaps ? (
              <div
                className={`flex-1 min-w-0 ${showReliability ? 'sm:pl-6 sm:border-l border-slate-200' : ''}`}
              >
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  Registo / dados a completar para o relatório fazer fecho completo
                </p>
                <ul className="mt-1.5 list-disc pl-4 text-sm text-slate-600 space-y-0.5">
                  {mergedGaps.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}

        <DecisionLayerHero winnerName={winnerName} fin={fin} dKg={dKg} />

        <div className="rounded-3xl border border-slate-200/90 bg-white shadow-[0_8px_40px_-12px_rgba(15,23,42,0.12)] overflow-hidden">
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Indicadores do painel de decisão
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Leitura resumida a partir de colheita, motor econômico e KPIs publicados
            </p>
          </div>

          <div className="px-4 sm:px-6 pt-0 pb-2 sm:pt-0 sm:pb-1">
            <DecisionKpiStrip data={data} />
          </div>

          {sA != null && sB != null && (
            <div className="px-4 sm:px-6 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 text-sm text-slate-600 border-y border-slate-100/90 bg-slate-50/60">
              <span className="font-semibold tabular-nums text-slate-800">
                {nameA} {formatNumber(sA, { decimals: 0 })}
                <span className="text-slate-400 font-normal"> vs </span>
                {formatNumber(sB, { decimals: 0 })} {nameB}
              </span>
              <span className="hidden sm:inline text-slate-300" aria-hidden>
                |
              </span>
              <span className="text-xs sm:text-sm">
                diferença de score (B−A):{' '}
                <span className="font-bold tabular-nums text-slate-900">
                  {sB - sA > 0 ? '+' : ''}
                  {formatNumber(sB - sA, { decimals: 0 })} pts
                </span>
              </span>
            </div>
          )}

          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div
                className="rounded-2xl p-4 text-center border-2"
                style={{ borderColor: SIDE_A, background: 'linear-gradient(180deg,#f1f8e9 0%,#fff 45%)' }}
              >
                <p className="text-[10px] font-bold uppercase text-slate-500">{nameA}</p>
                <p className="text-3xl sm:text-4xl font-black tabular-nums text-slate-900 mt-1">
                  {sA != null ? formatNumber(sA, { decimals: 0 }) : '—'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Score</p>
              </div>
              <div
                className="rounded-2xl p-4 text-center border-2"
                style={{ borderColor: SIDE_B, background: 'linear-gradient(180deg,#e3f2fd 0%,#fff 45%)' }}
              >
                <p className="text-[10px] font-bold uppercase text-slate-500">{nameB}</p>
                <p className="text-3xl sm:text-4xl font-black tabular-nums text-slate-900 mt-1">
                  {sB != null ? formatNumber(sB, { decimals: 0 }) : '—'}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Score</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold uppercase text-slate-500">Nota do motor (contexto)</p>
              {summaryLines[0] ? (
                <p className="text-sm text-slate-600 leading-relaxed">{summaryLines[0]}</p>
              ) : (
                <p className="text-sm text-slate-500">Sem linha de resumo adicional do motor no payload.</p>
              )}
            </div>
          </div>

          {roiAudit?.A && roiAudit?.B && (
            <div className="px-4 pb-4 sm:px-6 sm:pb-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <RoiTypeChip
                side="A"
                label={nameA}
                roiType={roiAudit.A.roiType ?? 'unavailable'}
                uiLabel={pickUi(roiAudit.A.roiType)}
              />
              <RoiTypeChip
                side="B"
                label={nameB}
                roiType={roiAudit.B.roiType ?? 'unavailable'}
                uiLabel={pickUi(roiAudit.B.roiType)}
              />
            </div>
          )}

          {rec ? (
            <div className="px-4 pb-5 sm:px-6 border-t border-slate-100 bg-slate-50/80">
              <p className="text-xs font-bold uppercase text-slate-500 pt-4">Recomendação</p>
              <p className="text-sm sm:text-base text-slate-800 font-medium leading-relaxed mt-1.5">
                {rec}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
