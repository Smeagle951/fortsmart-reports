'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatWind } from '@/components/lado_a_lado/ladoALadoHelpers';
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

export default function HeroSection({ data }: { data: SideBySideReportData }) {
  const farm = data.farm || {};
  const coleta = data.coleta;
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

  const alignedSubtitle =
    data.decision_layer &&
    resolved.app &&
    resolved.aligned &&
    (resolved.engine === resolved.app ||
      resolved.engine === 'tie' ||
      resolved.engine == null)
      ? 'Resultado consistente com análise técnica e econômica agregada pelo motor.'
      : null;

  const showConflictAlert = resolved.conflict && engineName && resolved.engine !== 'tie';

  const ensaioTitle =
    coleta?.ensaioName?.trim() ||
    farm.objective?.trim() ||
    data.branding?.title?.trim() ||
    'Avaliação agronômica lado a lado';

  const subHook =
    !decisionLine && !headlineFromApp
      ? data.branding?.subtitle?.trim() ||
        'Comparativo técnico e econômico para decisão em campo.'
      : null;

  const animA = useCountUp(scoreA ?? 0, 1000, 0);
  const animB = useCountUp(scoreB ?? 0, 1000, 0);

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
    <section className="relative overflow-hidden text-white">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_80%_0%,rgba(52,211,153,0.22),transparent)]"
        aria-hidden
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="grid lg:grid-cols-[1fr_auto] gap-10 lg:gap-14 items-start"
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-emerald-300/90">
              Relatório decisório
            </p>
            <h1 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight max-w-3xl">
              {ensaioTitle}
            </h1>

            {decisionLine ? (
              <p className="mt-6 text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-snug max-w-3xl">
                {decisionLine}
              </p>
            ) : subHook ? (
              <p className="mt-6 text-xl sm:text-2xl font-semibold text-white/90 leading-snug max-w-2xl">
                {subHook}
              </p>
            ) : null}

            {alignedSubtitle ? (
              <p className="mt-4 text-base sm:text-lg text-emerald-100/95 max-w-2xl leading-relaxed">
                {alignedSubtitle}
              </p>
            ) : null}

            {data.decision_layer?.dataQuality?.usedEstimatedYield ? (
              <p className="mt-3 text-sm text-amber-200/95 max-w-2xl leading-snug">
                Produtividade estimada usada em parte dos cálculos — o resultado econômico pode variar após colheita.
              </p>
            ) : null}

            {showConflictAlert ? (
              <div className="mt-5">
                <DecisionAlert title="Divergência detectada">
                  <p>
                    O motor multifator indica <span className="font-semibold">{engineName}</span> com melhor
                    desempenho agregado nas métricas do motor.
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
                            R$ {formatNumber(Math.abs(deltaMargin), { decimals: 0 })}/ha)
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

            {deltaParts.length > 0 ? (
              <p className="mt-5 text-lg sm:text-xl font-semibold text-emerald-200 tabular-nums">
                {deltaParts.join(' · ')}
              </p>
            ) : null}

            <div className="mt-10 flex flex-wrap gap-8 sm:gap-12 items-end">
              <div>
                <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest">Score A</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-blue-300">
                  {scoreA != null ? animA : '—'}
                </p>
                <p className="text-xs text-white/60 mt-1 truncate max-w-[10rem]">{nameA}</p>
              </div>
              <span className="text-xl font-light text-white/35 pb-1">vs</span>
              <div>
                <p className="text-[10px] font-semibold text-emerald-200 uppercase tracking-widest">Score B</p>
                <p className="text-3xl sm:text-4xl font-bold tabular-nums text-emerald-300">
                  {scoreB != null ? animB : '—'}
                </p>
                <p className="text-xs text-white/60 mt-1 truncate max-w-[10rem]">{nameB}</p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-white/80 border-t border-white/10 pt-8">
              {farm.farmName ? (
                <span>
                  <span className="text-white/45">Local · </span>
                  {farm.farmName}
                  {farm.fieldName ? ` · ${farm.fieldName}` : ''}
                </span>
              ) : null}
              {[farm.culture, coleta?.estadio].filter(Boolean).length > 0 ? (
                <span>
                  <span className="text-white/45">Cultura · </span>
                  {[farm.culture, coleta?.estadio].filter(Boolean).join(' · ')}
                </span>
              ) : null}
              {climate &&
              (climate.temperature != null ||
                climate.humidity != null ||
                climate.wind != null) ? (
                <span>
                  <span className="text-white/45">Clima (último registro) · </span>
                  {[
                    climate.temperature != null ? `${climate.temperature}°C` : null,
                    climate.humidity != null ? `${climate.humidity}% umid.` : null,
                    climate.wind != null ? `vento ${formatWind(climate.wind)}` : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
              ) : null}
            </div>
          </div>

          {gauge ? (
            <div className="flex flex-col items-center lg:items-end gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-white/50 text-center lg:text-right">
                {gauge.label}
              </p>
              <ScoreGauge value={gauge.value} max={100} size={152} />
            </div>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
