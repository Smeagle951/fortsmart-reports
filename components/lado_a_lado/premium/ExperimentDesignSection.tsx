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
      subtitle="Delineamento, parcelas, layout de coleta e datas-chave do ensaio."
      className="scroll-mt-36"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-24px' }}
        transition={{ duration: 0.35 }}
        className="space-y-5"
      >
      {/* Tabela compacta (lista em vez de cards soltos) */}
      <div className="overflow-hidden rounded-xl border border-slate-200/80 bg-white">
        <dl className="divide-y divide-slate-100">
          {ed?.delineamento != null && String(ed.delineamento).trim() ? (
            <DesignRow label="Delineamento" value={delineamentoLabel(ed.delineamento)} />
          ) : null}
          {ed?.numero_tratamentos != null && Number.isFinite(ed.numero_tratamentos) ? (
            <DesignRow label="Nº de tratamentos" value={formatNumber(ed.numero_tratamentos, { decimals: 0 })} emphasize />
          ) : null}
          {ed?.numero_repeticoes != null && Number.isFinite(ed.numero_repeticoes) ? (
            <DesignRow label="Repetições" value={formatNumber(ed.numero_repeticoes, { decimals: 0 })} emphasize />
          ) : null}
          {ed?.tamanho_parcela_m2 != null && Number.isFinite(ed.tamanho_parcela_m2) ? (
            <DesignRow label="Área útil da parcela" value={`${formatNumber(ed.tamanho_parcela_m2, { decimals: 1 })} m²`} />
          ) : null}
          {ed?.area_util_m2 != null && Number.isFinite(ed.area_util_m2) ? (
            <DesignRow label="Área útil (alternativa)" value={`${formatNumber(ed.area_util_m2, { decimals: 1 })} m²`} />
          ) : null}
          {ed?.bordadura_metros != null && Number.isFinite(ed.bordadura_metros) ? (
            <DesignRow label="Bordadura" value={`${formatNumber(ed.bordadura_metros, { decimals: 2 })} m`} />
          ) : null}
          {layoutPretty ? (
            <DesignRow label="Layout de coleta" value={layoutPretty} />
          ) : null}
          {ed?.data_plantio ? <DesignRow label="Plantio" value={ed.data_plantio} /> : null}
          {ed?.data_emergencia ? <DesignRow label="Emergência" value={ed.data_emergencia} /> : null}
          {ed?.data_inicio_avaliacao ? <DesignRow label="Início avaliação" value={ed.data_inicio_avaliacao} /> : null}
        </dl>
      </div>

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

function DesignRow({ label, value, emphasize = false }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm sm:px-5">
      <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`text-right tabular-nums ${emphasize ? 'text-xl font-black text-slate-900' : 'font-semibold text-slate-800'}`}>
        {value}
      </dd>
    </div>
  );
}
