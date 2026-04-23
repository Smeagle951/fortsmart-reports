'use client';

import { motion } from 'framer-motion';
import { Bell, Printer, UserRound } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
  onPrint: () => void;
};

export default function ReportHeader({ data, onPrint }: Props) {
  const farm = data.farm ?? {};
  const coleta = data.coleta;
  const meta = data.meta ?? {};
  const sig = data.conclusion?.signature;
  const created = meta.createdAt ? new Date(meta.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : null;

  const subline = [farm.culture, farm.season, coleta?.estadio].filter((x) => x && String(x).trim()).join(' · ');

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-slate-200/90 bg-white print:border-slate-200"
      style={{ boxShadow: ENT.shadowCard }}
    >
      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-2 px-4 py-5 sm:gap-3 sm:px-6 sm:py-6">
        <div className="col-span-12 flex flex-wrap items-start justify-between gap-4 lg:col-span-8">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-emerald-700">FortSmart · Agrointeligência</p>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[28px] md:text-[32px]">
              Relatório de Avaliação de Campo
            </h1>
            <p className="mt-1.5 text-sm font-medium text-slate-500 sm:text-base">Ensaio comparativo de manejos</p>
            {subline ? <p className="mt-3 text-sm text-slate-600">{subline}</p> : null}
          </div>
        </div>

        <div className="col-span-12 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end lg:col-span-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/90 px-3 py-2.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600"
              aria-hidden
            >
              <UserRound className="h-5 w-5" />
            </div>
            <div className="min-w-0 text-left text-sm">
              <p className="truncate font-semibold text-slate-900">{sig?.name?.trim() || meta.generatedBy?.name || 'Consultor técnico'}</p>
              <p className="truncate text-xs text-slate-500">{sig?.crea?.trim() ? `CREA ${sig.crea}` : meta.generatedBy?.role || 'Responsável técnico'}</p>
              {created ? <p className="text-xs text-slate-400">{created}</p> : null}
            </div>
          </div>
          <div className="flex items-center justify-end gap-1 print:hidden">
            <button
              type="button"
              onClick={onPrint}
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm transition hover:scale-[1.03] hover:border-slate-300 hover:shadow-md"
              aria-label="Imprimir relatório"
            >
              <Printer className="h-4 w-4" />
            </button>
            <span
              className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-slate-300"
              aria-hidden
              title="Notificações"
            >
              <Bell className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
