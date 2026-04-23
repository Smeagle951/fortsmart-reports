'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
};

export default function ReportFooterEnterprise({ data }: Props) {
  const design = data.experiment_design;
  const methodology =
    typeof design?.objective_text === 'string' && design.objective_text.trim()
      ? design.objective_text.trim()
      : 'Os indicadores consolidam visitas de campo, aplicações registadas e fechamento económico quando disponíveis no relatório. Valores estimados derivam de produtividade projectada ou preços de referência do ensaio.';

  return (
    <footer className="border-t border-slate-200/90 bg-white print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-4"
      >
        <div className="lg:col-span-8">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Metodologia</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{methodology}</p>
        </div>

        <div className="text-center lg:col-span-4 lg:text-right">
          <p className="text-lg font-bold" style={{ color: ENT.blue }}>
            FortSmart
          </p>
          <p className="mt-1 text-xs font-medium text-slate-500">Tecnologia que gera resultados</p>
          <p className="mt-3 text-xs text-slate-400">Agricultura inteligente · relatório decisório</p>
        </div>
      </motion.div>
    </footer>
  );
}
