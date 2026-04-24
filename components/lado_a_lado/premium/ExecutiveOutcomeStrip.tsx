'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { resolveDecision } from '@/lib/decision';
import { formatNumber } from '@/utils/format';
import { heroFinancialSnapshot } from './premiumInference';

/**
 * Resultado executivo imediato — só números e vencedores já publicados no JSON / motor.
 */
export default function ExecutiveOutcomeStrip({ data }: { data: SideBySideReportData }) {
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const dl = data.decision_layer;
  const engine = dl?.engineOverallWinner;
  const wApp = data.conclusion?.winner;
  const winnerLetter: 'A' | 'B' | null =
    engine === 'A' || engine === 'B'
      ? engine
      : wApp === 'A' || wApp === 'B'
        ? wApp
        : null;
  const winnerName = winnerLetter === 'A' ? nameA : winnerLetter === 'B' ? nameB : null;
  const resolved = resolveDecision(data);
  const fin = heroFinancialSnapshot(data);

  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kg = colheita?.kgPerSack ?? 60;
  const rowA = colheita?.sides?.find((s) => s.side === 'A');
  const scA =
    rowA?.yieldScHa ??
    (rowA?.yieldKgHa != null && kg > 0 ? rowA.yieldKgHa / kg : null);
  const yieldPct =
    fin.deltaScHa != null && scA != null && scA > 0 && Number.isFinite(fin.deltaScHa)
      ? (fin.deltaScHa / scA) * 100
      : null;

  const roiB = dl?.roiBySide?.B?.roiPct ?? (dl?.roiBySide as Record<string, { roiPct?: number }> | undefined)?.b?.roiPct;
  const deltaMargin = dl?.deltaMarginBrlHa;

  const chips: string[] = [];
  if (yieldPct != null && Math.abs(yieldPct) >= 0.05) {
    chips.push(`${yieldPct > 0 ? '+' : ''}${formatNumber(yieldPct, { decimals: 1 })}% produtividade (sc/ha, B vs A)`);
  } else if (fin.deltaScHa != null && Math.abs(fin.deltaScHa) >= 0.01) {
    chips.push(`${fin.deltaScHa > 0 ? '+' : ''}${formatNumber(fin.deltaScHa, { decimals: 1 })} sc/ha (B − A)`);
  }
  if (fin.gainBrlHa != null && Math.abs(fin.gainBrlHa) >= 1) {
    chips.push(
      `${fin.gainBrlHa > 0 ? '+' : ''}R$ ${formatNumber(Math.abs(fin.gainBrlHa), { decimals: 0 })}/ha receita bruta estimada`,
    );
  }
  if (deltaMargin != null && Number.isFinite(deltaMargin) && Math.abs(deltaMargin) >= 1) {
    chips.push(`${deltaMargin > 0 ? '+' : ''}R$ ${formatNumber(Math.abs(deltaMargin), { decimals: 0 })}/ha margem (motor)`);
  }
  if (roiB != null && Number.isFinite(roiB)) {
    chips.push(`ROI publicado (B): ${formatNumber(roiB, { decimals: 1 })}%`);
  }

  if (!winnerName && chips.length === 0 && !resolved.conflict) return null;

  return (
    <div className="mx-auto max-w-[1140px] px-4 sm:px-6 py-6">
      <div
        className="rounded-xl px-6 py-6 sm:px-8 sm:py-7 text-white shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 55%, #1b4332 100%)',
        }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">Resultado do ensaio</p>
        {winnerName ? (
          <p className="mt-2 premium-font-serif text-xl sm:text-2xl font-semibold tracking-tight">
            Indicação técnica: <span className="text-white">{winnerName}</span> com melhor desempenho agregado no
            conjunto de critérios publicados
          </p>
        ) : (
          <p className="mt-2 premium-font-serif text-xl sm:text-2xl font-semibold tracking-tight">
            Comparativo publicado — registe o vencedor observado na app ou complete colheita / motor para fecho
            económico
          </p>
        )}
        {chips.length > 0 ? (
          <p className="mt-3 text-sm text-white/85 leading-relaxed">{chips.join(' · ')}</p>
        ) : null}
        {resolved.conflict ? (
          <p className="mt-3 text-xs text-amber-200/95">
            Há divergência entre indicação do técnico e o motor — ver secção Decisão.
          </p>
        ) : null}
      </div>
    </div>
  );
}
