'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatWind, isColheitaJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { resolveDecision } from '@/lib/decision';
import DecisionAlert from './DecisionAlert';
import { formatNumber } from '@/utils/format';
import {
  climateFromLatestApplication,
  heroFinancialSnapshot,
  heroGaugeScore,
  productivityDeltaKgHaFromKpis,
  scoresFromJson,
  winnerFromJson,
} from './premiumInference';
import ScoreGauge from './ScoreGauge';
import { useCountUp } from './useCountUp';

/**
 * Hero A vs B — identidade e métricas rápidas. Metadados de capa em `CoverSection`.
 */
export default function HeroSection({ data }: { data: SideBySideReportData }) {
  const sideA = data.sideA;
  const sideB = data.sideB;
  const nameA = sideA?.name || 'Manejo A';
  const nameB = sideB?.name || 'Manejo B';
  const winner = winnerFromJson(data);
  const resolved = resolveDecision(data);
  const fin = heroFinancialSnapshot(data);
  const dKg = productivityDeltaKgHaFromKpis(data);
  const gauge = heroGaugeScore(data);
  const climate = climateFromLatestApplication(data);
  const { a: scoreA, b: scoreB } = scoresFromJson(data);

  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;
  const headlineFromApp = data.conclusion?.headline?.trim();
  const decisionLine =
    headlineFromApp ||
    (winnerName ? `${winnerName} recomendado pelo técnico` : null);

  const engineName =
    resolved.engine === 'A' ? nameA : resolved.engine === 'B' ? nameB : null;
  const roiWinner = data.decision_layer?.engineRoiWinner;
  const roiName =
    roiWinner === 'A' ? nameA : roiWinner === 'B' ? nameB : null;
  const deltaMargin = data.decision_layer?.deltaMarginBrlHa;

  const showConflictAlert = resolved.conflict && engineName && resolved.engine !== 'tie';

  const animA = useCountUp(scoreA ?? 0, 1000, 0);
  const animB = useCountUp(scoreB ?? 0, 1000, 0);

  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const kg = colheita?.kgPerSack ?? 60;
  const rowA = colheita?.sides?.find((s) => s.side === 'A');
  const rowB = colheita?.sides?.find((s) => s.side === 'B');
  const sc = (row: typeof rowA) => {
    if (!row) return null;
    if (row.yieldScHa != null) return row.yieldScHa;
    if (row.yieldKgHa != null && kg > 0) return row.yieldKgHa / kg;
    return null;
  };
  const scA = sc(rowA);
  const scB = sc(rowB);
  const yA = sideA?.kpis?.estimatedYieldKgHa;
  const yB = sideB?.kpis?.estimatedYieldKgHa;
  const prodLineA =
    scA != null
      ? `${formatNumber(scA, { decimals: 1 })} sc/ha`
      : yA != null
        ? `${formatNumber(yA, { decimals: 0 })} kg/ha`
        : '—';
  const prodLineB =
    scB != null
      ? `${formatNumber(scB, { decimals: 1 })} sc/ha`
      : yB != null
        ? `${formatNumber(yB, { decimals: 0 })} kg/ha`
        : '—';

  const roiA = data.decision_layer?.roiBySide?.A?.roiPct;
  const roiB = data.decision_layer?.roiBySide?.B?.roiPct;

  const obsAList = (sideA?.observations ?? []).map((o) => o?.trim()).filter(Boolean) as string[];
  const obsBList = (sideB?.observations ?? []).map((o) => o?.trim()).filter(Boolean) as string[];

  const deltaParts: string[] = [];
  if (dKg != null && Math.abs(dKg) >= 1) {
    deltaParts.push(`${dKg > 0 ? '+' : ''}${formatNumber(dKg, { decimals: 0 })} kg/ha (B vs A)`);
  }
  if (fin.gainBrlHa != null && Math.abs(fin.gainBrlHa) >= 1) {
    deltaParts.push(
      `${fin.gainBrlHa > 0 ? '+' : ''}R$ ${formatNumber(Math.abs(fin.gainBrlHa), { decimals: 0 })}/ha na receita bruta estimada`,
    );
  }

  return (
    <section className="bg-[var(--fs-cream,#fafaf7)] border-b border-[var(--fs-border,rgba(0,0,0,0.08))] text-[var(--fs-ink,#1a1a18)]">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 py-10 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--fs-forest-md,#2d6a4f)]">
            Comparativo de manejos
          </p>
          {decisionLine ? (
            <p className="mt-2 premium-font-serif text-xl sm:text-2xl text-[var(--fs-ink,#1a1a18)] leading-snug max-w-3xl">
              {decisionLine}
            </p>
          ) : null}

          {data.decision_layer?.dataQuality?.usedEstimatedYield ? (
            <p className="mt-3 text-sm text-amber-800 max-w-2xl">
              Produtividade estimada usada em parte dos cálculos — o resultado econômico pode variar após colheita.
            </p>
          ) : null}

          {showConflictAlert ? (
            <div className="mt-5">
              <DecisionAlert title="Divergência detectada">
                <p>
                  O motor multifator indica <span className="font-semibold">{engineName}</span> com melhor desempenho
                  agregado nas métricas do motor.
                  {roiName &&
                  roiWinner &&
                  roiWinner !== 'tie' &&
                  roiWinner !== resolved.app &&
                  deltaMargin != null &&
                  Number.isFinite(deltaMargin) ? (
                    <>
                      {' '}
                      O critério de margem líquida favorece <span className="font-semibold">{roiName}</span>
                      {Math.abs(deltaMargin) >= 1 ? (
                        <>
                          {' '}
                          (Δ margem B−A: {deltaMargin > 0 ? '+' : ''}
                          {' R$ '}
                          {formatNumber(Math.abs(deltaMargin), { decimals: 0 })}/ha)
                        </>
                      ) : null}
                      .
                    </>
                  ) : null}
                </p>
                {data.decision_layer?.summaryLines && data.decision_layer.summaryLines.length > 0 ? (
                  <ul className="mt-2 list-disc list-inside text-xs text-amber-100/90 space-y-1">
                    {data.decision_layer.summaryLines.slice(0, 4).map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                ) : null}
              </DecisionAlert>
            </div>
          ) : null}

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-2 items-stretch">
            <div
              className="rounded-lg border p-5 sm:p-6"
              style={{
                background: 'var(--fs-forest-xs, #d8f3dc)',
                borderColor: 'rgba(27,67,50,0.15)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fs-forest,#1b4332)]">
                Lado A · {sideA?.label?.trim() || 'Referência'}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--fs-ink,#1a1a18)]">{nameA}</p>
              <p className="mt-3 text-sm text-[var(--fs-ink-md,#4a4a46)]">
                Produtividade publicada: <span className="font-mono text-xs bg-black/[0.06] px-1.5 py-0.5 rounded">{prodLineA}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-md,#4a4a46)]">
                ROI (motor):{' '}
                <span className="font-semibold tabular-nums">
                  {roiA != null ? `${formatNumber(roiA, { decimals: 1 })}%` : '—'}
                </span>
              </p>
              {obsAList.length > 0 ? (
                <ul className="mt-3 text-xs text-[var(--fs-ink-md,#4a4a46)] leading-relaxed list-disc pl-4 space-y-1">
                  {obsAList.slice(0, 4).map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="flex items-center justify-center py-2 lg:py-0">
              <span className="text-sm font-semibold text-[var(--fs-ink-lt,#8a8a84)]">vs</span>
            </div>

            <div
              className="rounded-lg border p-5 sm:p-6"
              style={{
                background: 'var(--fs-side-b-lt, #fbeee8)',
                borderColor: 'rgba(123,45,0,0.15)',
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--fs-side-b,#7b2d00)]">
                Lado B · {sideB?.label?.trim() || 'Tratamento'}
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--fs-ink,#1a1a18)]">{nameB}</p>
              <p className="mt-3 text-sm text-[var(--fs-ink-md,#4a4a46)]">
                Produtividade publicada: <span className="font-mono text-xs bg-black/[0.06] px-1.5 py-0.5 rounded">{prodLineB}</span>
              </p>
              <p className="mt-2 text-sm text-[var(--fs-ink-md,#4a4a46)]">
                ROI (motor):{' '}
                <span className="font-semibold tabular-nums">
                  {roiB != null ? `${formatNumber(roiB, { decimals: 1 })}%` : '—'}
                </span>
              </p>
              {obsBList.length > 0 ? (
                <ul className="mt-3 text-xs text-[var(--fs-ink-md,#4a4a46)] leading-relaxed list-disc pl-4 space-y-1">
                  {obsBList.slice(0, 4).map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>

          {deltaParts.length > 0 ? (
            <p className="mt-6 text-sm font-semibold text-[var(--fs-forest-md,#2d6a4f)] tabular-nums">{deltaParts.join(' · ')}</p>
          ) : null}

          <div className="mt-8 flex flex-col sm:flex-row flex-wrap gap-8 sm:gap-12 items-end justify-between border-t border-[var(--fs-border,rgba(0,0,0,0.08))] pt-8">
            <div className="flex flex-wrap gap-8 sm:gap-12 items-end">
              <div>
                <p className="text-[10px] font-semibold text-blue-700 uppercase tracking-widest">Score A</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-blue-800">
                  {scoreA != null ? animA : '—'}
                </p>
                <p className="text-xs text-[var(--fs-ink-lt,#8a8a84)] mt-1 truncate max-w-[10rem]">{nameA}</p>
              </div>
              <span className="text-xl font-light text-[var(--fs-ink-lt,#8a8a84)] pb-1">vs</span>
              <div>
                <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-widest">Score B</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-emerald-800">
                  {scoreB != null ? animB : '—'}
                </p>
                <p className="text-xs text-[var(--fs-ink-lt,#8a8a84)] mt-1 truncate max-w-[10rem]">{nameB}</p>
              </div>
            </div>
            {gauge ? (
              <div className="flex flex-col items-center sm:items-end gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--fs-ink-lt,#8a8a84)] text-center sm:text-right">
                  {gauge.label}
                </p>
                <ScoreGauge value={gauge.value} max={100} size={140} />
              </div>
            ) : null}
          </div>

          {climate &&
          (climate.temperature != null || climate.humidity != null || climate.wind != null) ? (
            <p className="mt-8 text-sm text-[var(--fs-ink-md,#4a4a46)]">
              <span className="text-[var(--fs-ink-lt,#8a8a84)]">Clima (último registro de aplicação) · </span>
              {[
                climate.temperature != null ? `${climate.temperature}°C` : null,
                climate.humidity != null ? `${climate.humidity}% umid.` : null,
                climate.wind != null ? `vento ${formatWind(climate.wind)}` : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
