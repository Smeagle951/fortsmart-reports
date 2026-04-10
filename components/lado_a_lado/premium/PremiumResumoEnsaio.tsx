'use client';

import React from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { computeExecutiveScores } from '@/lib/lado-a-lado-executive';
import { deriveWinner } from '@/lib/lado-a-lado-premium';
import {
  colheitaScHaDiff,
  readColheitaPayload,
  readEconomiaPayload,
} from '@/lib/lado-a-lado-economic';
import { formatDate, formatNumber } from '@/utils/format';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

function ScoreRing({
  value,
  label,
  subLabel,
  stroke,
}: {
  value: number;
  label: string;
  subLabel: string;
  stroke: string;
}) {
  const pct = Math.min(100, Math.max(0, value));
  const r = 42;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="flex flex-col items-center text-center px-2">
      <div className="relative w-[7.5rem] h-[7.5rem]">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
          <circle
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900 tabular-nums">{value}</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-slate-800 mt-2 leading-tight">{label}</p>
      <p className="text-[10px] text-slate-500 mt-0.5">{subLabel}</p>
    </div>
  );
}

export default function PremiumResumoEnsaio({ data, sideAName, sideBName }: Props) {
  const farm = data.farm || {};
  const coleta = data.coleta;
  const scores = computeExecutiveScores(data);
  const winner = deriveWinner(sideAName, sideBName, data);
  const colheita = readColheitaPayload(data.colheita);
  const economia = readEconomiaPayload(data.economia);
  const scDiff = colheitaScHaDiff(colheita);

  const photosA = data.sideA?.photos || [];
  const photosB = data.sideB?.photos || [];
  const heroPhoto =
    photosA.find((p) => p?.url)?.url || photosB.find((p) => p?.url)?.url || null;

  const cultureLine = [farm.culture, coleta?.ensaioName].filter(Boolean).join(' · ');

  let resultadoLine: string;
  if (winner === 'tie') {
    resultadoLine = `RESULTADO: desempenho técnico equilibrado entre ${sideAName} e ${sideBName}.`;
  } else {
    const winName = winner === 'B' ? sideBName : sideAName;
    const loseName = winner === 'B' ? sideAName : sideBName;
    const diff =
      scores?.relativeDiffPct != null && Math.abs(scores.relativeDiffPct) >= 0.5
        ? ` (+${scores.relativeDiffPct > 0 ? scores.relativeDiffPct.toFixed(1) : (-scores.relativeDiffPct).toFixed(1)}% indicadores)`
        : '';
    resultadoLine = `RESULTADO: manejo ${winName} com melhor síntese de indicadores vs ${loseName}${diff}.`;
  }

  const badgeParts: string[] = [];
  if (scDiff != null && Math.abs(scDiff) >= 0.01) {
    badgeParts.push(
      `${scDiff > 0 ? '+' : ''}${formatNumber(scDiff, { decimals: 2 })} sc/ha (B vs A)`
    );
  }
  if (economia && scDiff != null && Math.abs(scDiff) >= 0.01) {
    const revDelta = scDiff * economia.precoSacaBrl;
    badgeParts.push(`Δ receita ≈ ${revDelta >= 0 ? '+' : ''}R$ ${formatNumber(Math.abs(revDelta), { decimals: 0 })}/ha`);
  }

  const scoreA = scores?.scoreA ?? null;
  const scoreB = scores?.scoreB ?? null;
  const ringDiff =
    scoreA != null && scoreB != null && scoreA > 0
      ? (((scoreB - scoreA) / scoreA) * 100).toFixed(0)
      : scoreB != null && scoreA != null
        ? (scoreB - scoreA).toString()
        : null;

  const audit = metaLine(data);

  return (
    <section
      id="premium-resumo-ensaio"
      className="relative overflow-hidden rounded-2xl border border-slate-200/90 shadow-[0_12px_40px_-16px_rgba(15,23,42,0.25)] print:shadow-md"
    >
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={
          heroPhoto
            ? {
                backgroundImage: `linear-gradient(105deg, rgba(15,23,42,0.82) 0%, rgba(15,23,42,0.45) 45%, rgba(5,150,105,0.35) 100%), url(${heroPhoto})`,
              }
            : {
                backgroundImage:
                  'linear-gradient(135deg, #0f172a 0%, #134e4a 40%, #0d9488 70%, #5eead4 100%)',
              }
        }
      />
      <div className="relative text-white p-6 sm:p-8">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
          Resumo do ensaio
        </p>
        <h2 className="mt-1 text-lg sm:text-xl font-bold text-white drop-shadow-sm">
          {[farm.fieldName || farm.farmName, farm.city && farm.state ? `${farm.city} — ${farm.state}` : null]
            .filter(Boolean)
            .join(' · ')}
        </h2>
        {cultureLine && <p className="text-sm text-white/85 mt-1">{cultureLine}</p>}

        <div className="mt-6 flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex items-start gap-2 rounded-xl bg-white/12 backdrop-blur-sm border border-white/20 px-4 py-3">
              <span className="text-2xl shrink-0" aria-hidden>
                🏆
              </span>
              <p className="text-sm sm:text-base font-medium leading-snug text-white">{resultadoLine}</p>
            </div>
            {badgeParts.length > 0 && (
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-emerald-400/95 text-emerald-950 px-4 py-2 text-xs sm:text-sm font-semibold shadow-lg">
                {badgeParts.join(' · ')}
              </div>
            )}
            {scores && (scores.sampleSizeA < 2 || scores.sampleSizeB < 2) && (
              <p className="text-[11px] text-white/70 max-w-prose">
                Índice composto a partir dos KPIs disponíveis no relatório (quanto mais dados no app, mais robusta a comparação).
              </p>
            )}
          </div>

          {scoreA != null && scoreB != null ? (
            <div className="flex flex-wrap justify-center gap-8 sm:gap-10 lg:shrink-0 rounded-2xl bg-white/95 text-slate-900 px-6 py-5 border border-white/40 shadow-xl">
              <ScoreRing
                value={scoreA}
                label={sideAName}
                subLabel="Índice técnico"
                stroke="#0369a1"
              />
              <div className="hidden sm:flex flex-col items-center justify-center">
                {ringDiff != null && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">
                    {Number(ringDiff) >= 0 ? '+' : ''}
                    {ringDiff}%
                  </span>
                )}
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">B vs A</span>
              </div>
              <ScoreRing
                value={scoreB}
                label={sideBName}
                subLabel="Índice técnico"
                stroke="#047857"
              />
            </div>
          ) : (
            <div className="rounded-2xl bg-white/15 border border-white/25 px-5 py-4 text-sm text-white/90 max-w-md">
              Preencha indicadores na avaliação em campo (estande, raiz, fenologia, produtividade) e publique novamente para
              exibir o comparativo circular aqui.
            </div>
          )}
        </div>

        {audit && (
          <p className="mt-6 text-[10px] text-white/50 font-mono border-t border-white/10 pt-3">{audit}</p>
        )}
      </div>
    </section>
  );
}

function metaLine(data: SideBySideReportData): string | null {
  const bits: string[] = [];
  if (data.version) bits.push(data.version);
  if (data.schemaVersion) bits.push(`schema ${data.schemaVersion}`);
  if (data.generated_at) bits.push(`emitido ${formatDate(data.generated_at)}`);
  return bits.length ? bits.join(' · ') : null;
}
