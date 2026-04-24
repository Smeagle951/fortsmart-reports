'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import type { RoiSideSnapshot } from '@/lib/decisionLayer';
import { estimatedRevenueBrlPerHa, heroFinancialSnapshot, winnerFromJson } from './premiumInference';
import EconomicTimelineChart from './EconomicTimelineChart';
import PremiumSectionShell from './PremiumSectionShell';

const PRECO_FONTE_OCULTAR = new Set(['padrao_sistema', 'padrao sistema', 'sistema', 'default', 'interno', 'internal']);

function showEconomiaFontePreco(fonte?: string | null): boolean {
  const f = (fonte || '').trim().toLowerCase();
  if (!f) return false;
  return !PRECO_FONTE_OCULTAR.has(f);
}

function MotorMetric({
  label,
  value,
  sub,
  borderColor,
}: {
  label: string;
  value: string;
  sub?: string | null;
  borderColor: string;
}) {
  return (
    <div
      className="rounded-xl border bg-white p-3 shadow-sm"
      style={{ borderLeftWidth: 3, borderLeftColor: borderColor }}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-lg font-bold tabular-nums text-slate-900 mt-0.5">{value}</p>
      {sub ? <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p> : null}
    </div>
  );
}

function SideMotorColumn({
  title,
  roi,
  borderColor,
}: {
  title: string;
  roi: RoiSideSnapshot;
  borderColor: string;
}) {
  const rev = roi.revenueBrlHa;
  const cost = roi.costBrlHa ?? roi.costPerHa;
  const margin = roi.marginBrlHa;
  const roiPct = roi.roiPct;
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-2">
      <p className="text-xs font-bold uppercase text-slate-600">{title}</p>
      <div className="grid grid-cols-2 gap-2">
        <MotorMetric
          label="Receita / ha"
          value={rev != null ? `R$ ${formatNumber(rev, { decimals: 0 })}` : '—'}
          sub={roi.yieldSource === 'estimated' ? 'Produtividade estimada' : roi.yieldSource === 'harvest' ? 'Colheita publicada' : null}
          borderColor={borderColor}
        />
        <MotorMetric
          label="Custo / ha"
          value={cost != null ? `R$ ${formatNumber(cost, { decimals: 2 })}` : '—'}
          sub={roi.costSource === 'custo_snapshot' ? 'Snapshot custos' : null}
          borderColor={borderColor}
        />
        <MotorMetric
          label="Margem / ha"
          value={margin != null ? `R$ ${formatNumber(margin, { decimals: 0 })}` : '—'}
          sub={null}
          borderColor={borderColor}
        />
        <MotorMetric
          label="ROI s/ custo"
          value={roiPct != null ? `${formatNumber(roiPct, { decimals: 1 })}%` : '—'}
          sub="Margem ÷ custo"
          borderColor={borderColor}
        />
      </div>
    </div>
  );
}

export default function EconomicSection({ data }: { data: SideBySideReportData }) {
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const economia = data.economia;
  const nameA = data.sideA?.name || 'Manejo A';
  const nameB = data.sideB?.name || 'Manejo B';
  const winner = winnerFromJson(data);
  const { rows: revRows, higherSide } = estimatedRevenueBrlPerHa(data);

  const mr = data.market_reference;
  const timeline = data.economic_timeline;
  const dl = data.decision_layer;
  const roiA = dl?.roiBySide?.A;
  const roiB = dl?.roiBySide?.B;
  const economicsSuppressed = dl?.dataQuality?.enterpriseEconomicsSuppressed === true;

  const motorComplete =
    !economicsSuppressed &&
    roiA != null &&
    roiB != null &&
    roiA.economicsSuppressed !== true &&
    roiB.economicsSuppressed !== true &&
    roiA.revenueBrlHa != null &&
    roiB.revenueBrlHa != null &&
    roiA.costBrlHa != null &&
    roiB.costBrlHa != null &&
    roiA.marginBrlHa != null &&
    roiB.marginBrlHa != null;

  const has =
    (custo?.by_side && custo.by_side.length > 0) ||
    (colheita?.sides && colheita.sides.length > 0) ||
    economia?.preco_saca_brl != null ||
    revRows.length > 0 ||
    mr != null ||
    (timeline?.sides && timeline.sides.length > 0) ||
    motorComplete;

  if (!has) return null;

  const kg = colheita?.kgPerSack ?? mr?.kg_per_sack ?? 60;
  const preco = economia?.preco_saca_brl ?? mr?.price_sack_brl;

  const bestRevName = higherSide === 'A' ? nameA : higherSide === 'B' ? nameB : null;
  const winnerName = winner === 'A' ? nameA : winner === 'B' ? nameB : null;

  const deltaMargin = dl?.deltaMarginBrlHa;
  const roiWinner = dl?.engineRoiWinner;
  const marginHighlight =
    roiWinner === 'A' || roiWinner === 'B'
      ? (() => {
          const favName = roiWinner === 'A' ? nameA : nameB;
          const otherName = roiWinner === 'A' ? nameB : nameA;
          if (deltaMargin == null || !Number.isFinite(deltaMargin)) return null;
          const abs = Math.abs(deltaMargin);
          if (abs < 1) return null;
          return roiWinner === 'B'
            ? `${favName} apresenta margem líquida maior em ≈ R$ ${formatNumber(abs, { decimals: 0 })}/ha em relação a ${otherName} (variação B − A no motor publicado).`
            : `${favName} apresenta margem líquida maior em ≈ R$ ${formatNumber(abs, { decimals: 0 })}/ha em relação a ${otherName} (variação B − A no motor publicado).`;
        })()
      : null;

  const econAnalysis = data.economic_analysis;
  const evoTl = data.evolution_timeline;
  const finSnap = heroFinancialSnapshot(data);
  const gain100Ha = finSnap.gainBrlHa != null && Number.isFinite(finSnap.gainBrlHa) ? finSnap.gainBrlHa * 100 : null;

  return (
    <PremiumSectionShell
      id="economico-premium"
      eyebrow="Margem e ROI"
      title="Fechamento econômico"
      subtitle="Valores do motor econômico e referências de mercado conforme publicados no JSON. Uso decisório sujeito à validação do responsável técnico e ao contexto comercial da propriedade."
    >
      {finSnap.gainBrlHa != null && Math.abs(finSnap.gainBrlHa) >= 1 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 grid gap-3 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-900">Ganho de receita bruta estimada (B vs A)</p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-emerald-950">
              {finSnap.gainBrlHa > 0 ? '+' : ''}R$ {formatNumber(Math.abs(finSnap.gainBrlHa), { decimals: 0 })}/ha
            </p>
            <p className="mt-1 text-xs text-emerald-900/85">
              Com base em produtividade em sacas publicada e preço da saca no relatório.
            </p>
          </div>
          {gain100Ha != null && Math.abs(gain100Ha) >= 1 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Ordem de grandeza (100 ha)</p>
              <p className="mt-2 text-xl font-bold tabular-nums text-slate-900">
                {gain100Ha > 0 ? '+' : ''}R$ {formatNumber(Math.abs(gain100Ha), { decimals: 0 })} · 100 ha
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Projeção linear (ganho R$/ha publicado × 100). Não substitui análise de risco comercial nem preço futuro.
              </p>
            </div>
          ) : null}
        </motion.div>
      ) : null}
      {marginHighlight ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800 shadow-sm"
        >
          <span className="font-semibold text-slate-900">Motor de margem: </span>
          {marginHighlight}
        </motion.div>
      ) : null}

      {econAnalysis && typeof econAnalysis === 'object' ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Pacote econômico (enterprise)</p>
          <p className="mt-2 text-sm text-slate-700">
            Este bloco (`economic_analysis`) é uma ponte de contrato: aponta quais seções estão preenchidas no JSON, sem recalcular
            números fora do motor.
          </p>
          {(() => {
            const p = (econAnalysis as { pointers?: Record<string, unknown> }).pointers;
            if (!p) return null;
            const entries = Object.entries(p).filter(([, v]) => v != null);
            if (entries.length === 0) return null;
            return (
              <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
                {entries.map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-white/70 border border-slate-200/70 px-3 py-2">
                    <span className="text-slate-500">{k}</span>
                    <span className="font-semibold text-slate-900">{String(v)}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </motion.div>
      ) : null}

      {evoTl && typeof evoTl === 'object' ? (
        <p className="mb-6 text-xs text-slate-500">
          Também foi publicado um bloco canônico <span className="font-semibold">evolution_timeline</span> (além de{' '}
          <span className="font-semibold">economic_timeline</span> e <span className="font-semibold">evolucao</span>).
        </p>
      ) : null}

      {mr && (mr.price_sack_brl != null || mr.kg_per_sack != null) ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Referência de mercado (snapshot)</p>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
            {mr.culture ? (
              <div>
                <p className="text-slate-500 text-xs">Cultura</p>
                <p className="font-semibold text-slate-900">{mr.culture}</p>
              </div>
            ) : null}
            {mr.region ? (
              <div>
                <p className="text-slate-500 text-xs">Região</p>
                <p className="font-semibold text-slate-900">{mr.region}</p>
              </div>
            ) : null}
            {mr.price_sack_brl != null ? (
              <div>
                <p className="text-slate-500 text-xs">Preço da saca</p>
                <p className="font-semibold text-slate-900">R$ {formatNumber(mr.price_sack_brl, { decimals: 2 })}/sc</p>
              </div>
            ) : null}
            {mr.kg_per_sack != null ? (
              <div>
                <p className="text-slate-500 text-xs">Kg / saca</p>
                <p className="font-semibold text-slate-900">{formatNumber(mr.kg_per_sack, { decimals: 0 })} kg</p>
              </div>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {mr.source ? (
              <span>
                <span className="font-semibold text-slate-600">Origem do preço: </span>
                {showEconomiaFontePreco(mr.source) ? mr.source : 'Padrão / sistema'}
              </span>
            ) : null}
            {mr.updated_at ? (
              <span>
                <span className="font-semibold text-slate-600">Snapshot: </span>
                {new Date(mr.updated_at).toLocaleString('pt-BR')}
              </span>
            ) : null}
            {mr.economicEngineVersion != null ? (
              <span>
                <span className="font-semibold text-slate-600">Motor v</span>
                {mr.economicEngineVersion}
              </span>
            ) : null}
          </div>
        </motion.div>
      ) : null}

      {economicsSuppressed ? (
        <p className="mb-4 text-sm text-slate-800 bg-slate-100 border border-slate-200 rounded-xl px-4 py-2">
          <strong>Modo lacunas (enterprise):</strong> produtividade estimada foi publicada (auditável), porém{' '}
          <strong>margem/ROI</strong> não foi fechada sem colheita real — isso evita exibir fechamento econômico enganoso.
        </p>
      ) : dl?.dataQuality?.usedEstimatedYield ? (
        <p className="mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          Parte da produtividade usada no motor foi <strong>estimada em campo</strong> — resultados econômicos podem mudar após colheita real.
        </p>
      ) : null}

      {motorComplete && roiA && roiB ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 rounded-2xl border border-indigo-200 bg-indigo-50/60 p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-indigo-900">Motor econômico (publicado)</p>
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <SideMotorColumn title={nameA} roi={roiA} borderColor="#2563eb" />
            <SideMotorColumn title={nameB} roi={roiB} borderColor="#16a34a" />
          </div>
          {marginHighlight ? (
            <p className="mt-4 text-sm font-semibold text-indigo-950 leading-snug">{marginHighlight}</p>
          ) : null}
        </motion.div>
      ) : null}

      {timeline && timeline.sides && timeline.sides.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 border-y border-slate-200 py-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Custo acumulado por DAA</p>
          <p className="mt-1 text-xs text-slate-600 max-w-3xl leading-relaxed">{timeline.methodology}</p>
          <div className="mt-3 w-full min-w-0 overflow-x-auto">
            <EconomicTimelineChart timeline={timeline} nameA={nameA} nameB={nameB} />
          </div>
        </motion.div>
      ) : null}

      {revRows.length >= 2 && preco != null && !motorComplete ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-900">Receita bruta estimada / ha</p>
          <div className="mt-4 grid sm:grid-cols-2 gap-4">
            {revRows.map((r) => (
              <div
                key={r.side}
                className={`rounded-xl border bg-white p-4 ${
                  r.side === 'A' ? 'border-blue-200' : 'border-emerald-200'
                }`}
              >
                <p className="text-xs font-semibold text-slate-500">Manejo {r.side}</p>
                <p className="text-2xl font-bold tabular-nums text-slate-900 mt-1">
                  R$ {formatNumber(r.revenueBrlHa, { decimals: 0 })}/ha
                </p>
              </div>
            ))}
          </div>
          {bestRevName ? (
            <p className="mt-4 text-sm font-semibold text-emerald-900">
              Maior receita bruta estimada: <span className="text-emerald-950">{bestRevName}</span>
            </p>
          ) : null}
          {winnerName && higherSide && winner !== higherSide ? (
            <p className="mt-2 text-xs text-emerald-900/85 leading-snug">
              A indicação registrada no relatório favorece <strong>{winnerName}</strong>, enquanto a receita bruta estimada com estes números favorece{' '}
              <strong>{bestRevName}</strong>.
            </p>
          ) : null}
        </motion.div>
      ) : null}

      {custo?.by_side != null && custo.by_side.length > 0 ? (
        <div className="mt-2 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Teste / manejo</th>
                <th className="px-3 py-2 text-right">Custo (R$/ha)</th>
              </tr>
            </thead>
            <tbody>
              {custo.by_side.map((row, i) => {
                const testLabel =
                  row.sideName?.trim() ||
                  (row.side === 'A' ? nameA : row.side === 'B' ? nameB : `Manejo ${row.side}`);
                return (
                  <tr key={i} className="border-t border-slate-100">
                    <td
                      className="px-3 py-2.5 font-medium text-slate-800"
                      style={{ borderLeftWidth: 3, borderLeftColor: row.side === 'A' ? '#2563eb' : '#16a34a' }}
                    >
                      {testLabel}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold text-slate-900">
                      {row.costPerHa != null ? `R$ ${formatNumber(row.costPerHa, { decimals: 2 })}` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {colheita?.sides != null && colheita.sides.length > 0 ? (
        <div className="mt-4 overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full min-w-[320px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2">Teste / manejo</th>
                <th className="px-3 py-2 text-right">Produtividade</th>
              </tr>
            </thead>
            <tbody>
              {colheita.sides.map((s, i) => {
                const testLabel = s.sideName?.trim() || (s.side === 'A' ? nameA : s.side === 'B' ? nameB : `Manejo ${s.side}`);
                const y =
                  s.yieldScHa != null
                    ? `${formatNumber(s.yieldScHa, { decimals: 1 })} sc/ha`
                    : s.yieldKgHa != null
                      ? `${formatNumber(s.yieldKgHa, { decimals: 0 })} kg/ha`
                      : '—';
                return (
                  <tr key={`c-${i}`} className="border-t border-slate-100">
                    <td
                      className="px-3 py-2.5 font-medium text-slate-800"
                      style={{ borderLeftWidth: 3, borderLeftColor: s.side === 'A' ? '#2563eb' : '#16a34a' }}
                    >
                      {testLabel}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-900">
                      {y}
                      {s.yieldKgHa != null && s.yieldScHa == null && kg > 0 ? (
                        <span className="block text-xs font-normal text-slate-500">
                          ≈ {formatNumber(s.yieldKgHa / kg, { decimals: 1 })} sc/ha
                        </span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {preco != null ? (
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-3">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Preço de referência (saca)</p>
          <p className="text-lg font-bold tabular-nums text-slate-900">R$ {formatNumber(preco, { decimals: 2 })}/sc</p>
          {showEconomiaFontePreco(economia?.fonte_preco) ? (
            <p className="w-full text-xs text-slate-600">Fonte: {economia?.fonte_preco}</p>
          ) : null}
        </div>
      ) : null}
      {custo?.deltaCostPerHa_B_vs_A != null ? (
        <p className="mt-4 text-center text-sm font-semibold text-slate-700">
          Variação de custo (B − A): R$ {formatNumber(custo.deltaCostPerHa_B_vs_A, { decimals: 2 })}/ha
        </p>
      ) : null}
    </PremiumSectionShell>
  );
}
