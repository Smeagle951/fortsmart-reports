'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ExperimentDesignJson } from '@/types/side-by-side-report';
import {
  collectionLayoutLabel,
  warningsFromExperimentDesignJson,
} from '@/lib/experimentDesignWarnings';
import { formatNumber } from '@/utils/format';
import PremiumSectionShell from './PremiumSectionShell';

const DELINEAMENTO_LABELS: Record<string, string> = {
  dbc: 'DBC — Blocos casualizados',
  dic: 'DIC — Inteiramente casualizado',
  faixas: 'Faixas lado a lado',
  split_plot: 'Split-plot (parcelas subdivididas)',
};

function delineamentoLabel(code: string | undefined): string {
  const k = (code || 'dbc').trim().toLowerCase();
  return DELINEAMENTO_LABELS[k] ?? k;
}

function hasExperimentContent(ed: ExperimentDesignJson | null | undefined, collectionLayout?: string | null): boolean {
  if (collectionLayout && collectionLayout.trim()) return true;
  if (!ed || typeof ed !== 'object') return false;
  return Object.keys(ed).length > 0;
}

function witnessFromProtocol(data: SideBySideReportData): { side: 'A' | 'B'; name: string } | null {
  const sides = data.treatment_protocol?.sides;
  if (!sides?.length) return null;
  for (const s of sides) {
    if (s.side !== 'A' && s.side !== 'B') continue;
    if (s.is_control_side === true) {
      const name = s.name?.trim() || `Manejo ${s.side}`;
      return { side: s.side, name };
    }
  }
  return null;
}

export default function ExperimentDesignSection({
  data,
  sectionId = 'ensaio-design-premium',
}: {
  data: SideBySideReportData;
  /** Permite âncora distinta no layout dashboard. */
  sectionId?: string;
}) {
  const ed = data.experiment_design;
  const layout = data.collection_layout?.trim() || '';
  if (!hasExperimentContent(ed, layout)) return null;

  const warnings = warningsFromExperimentDesignJson(ed);
  const witness = witnessFromProtocol(data);
  const layoutPretty = collectionLayoutLabel(layout || undefined);

  return (
    <PremiumSectionShell
      id={sectionId}
      eyebrow="Desenho experimental"
      title="Planejamento do ensaio"
      subtitle="Delineamento, parcelas, layout de coleta e datas conforme registrados no JSON publicado — sem inferência adicional no front."
      className="scroll-mt-36"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-24px' }}
        transition={{ duration: 0.35 }}
        className="space-y-5"
      >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ed?.delineamento != null && String(ed.delineamento).trim() ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Delineamento</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">{delineamentoLabel(ed.delineamento)}</p>
          </div>
        ) : null}
        {ed?.numero_tratamentos != null && Number.isFinite(ed.numero_tratamentos) ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Nº tratamentos</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(ed.numero_tratamentos, { decimals: 0 })}
            </p>
          </div>
        ) : null}
        {ed?.numero_repeticoes != null && Number.isFinite(ed.numero_repeticoes) ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Repetições</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(ed.numero_repeticoes, { decimals: 0 })}
            </p>
          </div>
        ) : null}
        {ed?.tamanho_parcela_m2 != null && Number.isFinite(ed.tamanho_parcela_m2) ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Área útil da parcela</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(ed.tamanho_parcela_m2, { decimals: 1 })} m²
            </p>
          </div>
        ) : null}
        {ed?.area_util_m2 != null && Number.isFinite(ed.area_util_m2) ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Área útil (alternativa)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
              {formatNumber(ed.area_util_m2, { decimals: 1 })} m²
            </p>
          </div>
        ) : null}
        {ed?.bordadura_metros != null && Number.isFinite(ed.bordadura_metros) ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03]">
            <p className="text-[10px] font-bold uppercase text-slate-500">Bordadura</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900">
              {formatNumber(ed.bordadura_metros, { decimals: 2 })} m
            </p>
          </div>
        ) : null}
        {layoutPretty ? (
          <div className="rounded-xl border border-slate-200/60 bg-white/95 p-4 shadow-[0_1px_8px_-2px_rgba(15,23,42,0.05)] ring-1 ring-slate-900/[0.03] sm:col-span-2 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase text-slate-500">Layout de coleta</p>
            <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">{layoutPretty}</p>
            {layout && layout !== 'paired_points' && layout !== 'parcel_per_treatment' ? (
              <p className="mt-1 text-xs text-slate-500 font-mono">{layout}</p>
            ) : null}
          </div>
        ) : null}
      </div>

      {(ed?.data_plantio || ed?.data_emergencia || ed?.data_inicio_avaliacao) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700">
          <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Datas registradas</p>
          <ul className="space-y-1">
            {ed.data_plantio ? (
              <li>
                <span className="text-slate-500">Plantio:</span> {ed.data_plantio}
              </li>
            ) : null}
            {ed.data_emergencia ? (
              <li>
                <span className="text-slate-500">Emergência:</span> {ed.data_emergencia}
              </li>
            ) : null}
            {ed.data_inicio_avaliacao ? (
              <li>
                <span className="text-slate-500">Início avaliação:</span> {ed.data_inicio_avaliacao}
              </li>
            ) : null}
          </ul>
        </div>
      )}

      {witness ? (
        <div className="rounded-xl border border-teal-200 bg-teal-50/60 px-4 py-3 text-sm text-teal-900">
          <span className="font-semibold">Testemunha / controle</span>
          <span className="text-teal-800">
            {' '}
            — lado {witness.side}: {witness.name}
          </span>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-2">
          {warnings.map((w) => (
            <div
              key={w.code}
              className="bg-amber-50 border-l-4 border-amber-500 px-4 py-3 text-sm text-amber-950"
              role="note"
            >
              {w.message}
            </div>
          ))}
        </div>
      ) : null}
      </motion.div>
    </PremiumSectionShell>
  );
}
