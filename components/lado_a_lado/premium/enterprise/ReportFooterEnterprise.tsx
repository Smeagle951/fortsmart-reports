'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
};

/**
 * Rodapé executivo: metodologia e marca. Sem QR (pedido de produto).
 */
export default function ReportFooterEnterprise({ data, reportId }: Props) {
  const design = data.experiment_design;
  const meta = data.meta;
  const methodology =
    typeof design?.objective_text === 'string' && design.objective_text.trim()
      ? design.objective_text.trim()
      : 'Indicadores consolidam visitas de campo, aplicações e fechamento económico quando publicados. Valores estimados assentam em produtividade e preços de referência do ensaio.';

  const idLine = meta?.reportId || reportId;
  const created = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <footer className="mt-6 border-t border-slate-200/90 bg-white print:break-inside-avoid print:mt-4">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:items-start lg:gap-8"
      >
        <div className="lg:col-span-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Documento</p>
          {idLine ? <p className="mt-1 text-sm font-semibold text-slate-800">ID {String(idLine)}</p> : null}
          {created ? <p className="mt-0.5 text-xs text-slate-500">Emitido em {created}</p> : null}
        </div>

        <div className="lg:col-span-5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Metodologia</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{methodology}</p>
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
