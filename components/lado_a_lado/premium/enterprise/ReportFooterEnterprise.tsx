'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
};

function agronomicMethodologyText(data: SideBySideReportData): string {
  const design = data.experiment_design;
  const farm = data.farm;
  const parts: string[] = [];

  const designExtra = design as { objective_notes?: string } | undefined;
  const obs = [
    farm?.objective?.trim(),
    designExtra?.objective_notes?.trim(),
    design?.objective_text?.trim(),
  ].filter(Boolean) as string[];
  if (obs.length) parts.push(obs.join('\n\n'));

  const sideObs = [...(data.sideA?.observations ?? []), ...(data.sideB?.observations ?? [])]
    .map((o) => o?.trim())
    .filter(Boolean) as string[];
  if (sideObs.length) parts.push(`Observações de campo (A/B):\n${sideObs.join('\n')}`);

  const merged = parts.filter(Boolean).join('\n\n').trim();
  if (merged) return merged;

  return 'Indicadores consolidam visitas de campo, aplicações e fechamento económico quando publicados. Valores estimados assentam em produtividade e preços de referência do ensaio.';
}

/**
 * Rodapé: observações do agrónomo / objectivo do ensaio quando existirem; caso contrário texto padrão.
 */
export default function ReportFooterEnterprise({ data, reportId }: Props) {
  const meta = data.meta;
  const methodology = agronomicMethodologyText(data);

  const idLine = meta?.reportId || reportId;
  const created = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const apps = data.applications ?? [];
  const lastApp = apps.length ? apps[apps.length - 1] : null;
  const appSummary =
    apps.length > 0
      ? `${apps.length} evento(s) de aplicação publicado(s)${lastApp?.date ? ` · última data ${new Date(lastApp.date).toLocaleDateString('pt-BR')}` : ''}`
      : null;

  return (
    <footer className="mt-6 border-t border-slate-200/90 bg-white print:break-inside-avoid print:mt-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.45 }}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-8"
      >
        <div className="lg:col-span-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Resumo de publicação</p>
          {idLine ? <p className="text-sm font-semibold text-slate-800">Ref. {String(idLine)}</p> : null}
          {created ? <p className="text-xs text-slate-500">Emitido em {created}</p> : null}
          {appSummary ? <p className="text-xs leading-relaxed text-slate-600">{appSummary}</p> : null}
          {data.farm?.fieldName || data.farm?.farmName ? (
            <p className="text-xs text-slate-600">
              {[data.farm?.farmName, data.farm?.fieldName].filter(Boolean).join(' · ')}
              {data.farm?.areaHa != null ? ` · ${data.farm.areaHa} ha` : null}
            </p>
          ) : null}
        </div>

        <div className="lg:col-span-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Observações e metodologia</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap">{methodology}</p>
        </div>

        <div className="text-center lg:col-span-3 lg:text-right">
          <p className="text-lg font-bold" style={{ color: ENT.blue }}>
            FortSmart
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Agricultura inteligente</p>
          <p className="mt-2 text-xs text-slate-400">Relatório de avaliação de campo</p>
        </div>
      </motion.div>
    </footer>
  );
}
