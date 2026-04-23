'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
  reportUrl: string | null;
  reportCode: string | null;
};

export default function ReportFooterEnterprise({ data, reportUrl, reportCode }: Props) {
  const meta = data.meta ?? {};
  const created = meta.createdAt ? new Date(meta.createdAt).toLocaleDateString('pt-BR') : null;
  const design = data.experiment_design;
  const methodology =
    typeof design?.objective_text === 'string' && design.objective_text.trim()
      ? design.objective_text.trim()
      : 'Os indicadores consolidam visitas de campo, aplicações registradas e fechamento económico quando publicados no FortSmart. Valores marcados como estimados derivam de produtividade projetada ou preços de referência do ensaio.';

  const qrSrc =
    reportUrl && reportUrl.length > 8
      ? `https://api.qrserver.com/v1/create-qr-code/?size=132x132&data=${encodeURIComponent(reportUrl)}`
      : null;

  return (
    <footer className="border-t border-slate-200/90 bg-white print:break-inside-avoid">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-4"
      >
        <div className="flex flex-col items-center gap-3 text-center lg:col-span-3 lg:items-start lg:text-left">
          {qrSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrSrc} alt="QR para abrir o relatório" width={112} height={112} className="rounded-lg border border-slate-200 bg-white p-1" />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400">
              QR indisponível
            </div>
          )}
          {reportUrl ? (
            <p className="max-w-[220px] break-all text-[11px] text-slate-500">{reportUrl}</p>
          ) : null}
          {reportCode ? (
            <p className="text-xs font-semibold text-slate-700">
              Código: <span className="tabular-nums">{reportCode}</span>
            </p>
          ) : null}
          {created ? <p className="text-[11px] text-slate-400">Emitido em {created}</p> : null}
        </div>

        <div className="lg:col-span-6">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500">Metodologia</h4>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{methodology}</p>
        </div>

        <div className="text-center lg:col-span-3 lg:text-right">
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
