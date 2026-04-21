'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import type { RoiSideSnapshot } from '@/lib/decisionLayer';
import { estimatedRevenueBrlPerHa, winnerFromJson } from './premiumInference';
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

  const motorComplete =
    roiA != null &&
    roiB != null &&
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

  return (
    <PremiumSectionShell
      id="economico-premium"
      eyebrow="Margem e ROI"
      title="Fechamento econômico"
      subtitle="Valores do motor econômico e referências de mercado conforme publicados no JSON. Uso decisório sujeito à validação do responsável técnico e ao contexto comercial da propriedade."
    >

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

      {dl?.dataQuality?.usedEstimatedYield ? (
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
          className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Custo acumulado por DAA</p>
          <p className="mt-1 text-xs text-slate-600 max-w-3xl leading-relaxed">{timeline.methodology}</p>
          <EconomicTimelineChart timeline={timeline} nameA={nameA} nameB={nameB} />
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

      <div className="grid md:grid-cols-2 gap-4">
        {custo?.by_side?.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            style={{ borderLeftWidth: 4, borderLeftColor: row.side === 'A' ? '#2563eb' : '#16a34a' }}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">Custo · manejo {row.side}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {row.costPerHa != null ? `R$ ${formatNumber(row.costPerHa, { decimals: 2 })}/ha` : 'não informado'}
            </p>
            {row.sideName ? <p className="text-sm text-slate-600 mt-1">{row.sideName}</p> : null}
          </motion.div>
        ))}
        {colheita?.sides?.map((s, i) => (
          <motion.div
            key={`c-${i}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            style={{ borderLeftWidth: 4, borderLeftColor: s.side === 'A' ? '#2563eb' : '#16a34a' }}
          >
            <p className="text-xs font-semibold uppercase text-slate-500">Produtividade · manejo {s.side}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {s.yieldScHa != null
                ? `${formatNumber(s.yieldScHa, { decimals: 1 })} sc/ha`
                : s.yieldKgHa != null
                  ? `${formatNumber(s.yieldKgHa, { decimals: 0 })} kg/ha`
                  : 'não informado'}
            </p>
            {s.yieldKgHa != null && s.yieldScHa == null && kg > 0 ? (
              <p className="text-xs text-slate-500 mt-1">≈ {formatNumber(s.yieldKgHa / kg, { decimals: 1 })} sc/ha (conversão)</p>
            ) : null}
          </motion.div>
        ))}
      </div>
      {preco != null ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm"
        >
          <p className="text-sm font-semibold text-slate-800">Preço da saca (bloco economia)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">R$ {formatNumber(preco, { decimals: 2 })}/sc</p>
          {showEconomiaFontePreco(economia?.fonte_preco) ? (
            <p className="text-xs text-slate-600 mt-1">Fonte informada: {economia?.fonte_preco}</p>
          ) : null}
        </motion.div>
      ) : null}
      {custo?.deltaCostPerHa_B_vs_A != null ? (
        <p className="mt-4 text-center text-sm font-semibold text-slate-700">
          Variação de custo (B − A): R$ {formatNumber(custo.deltaCostPerHa_B_vs_A, { decimals: 2 })}/ha
        </p>
      ) : null}
    </PremiumSectionShell>
  );
}
