'use client';

import { motion } from 'framer-motion';
import { UserRound } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { ENT } from './enterpriseTheme';

type Props = {
  data: SideBySideReportData;
  onPrint?: () => void;
};

export default function ReportHeader({ data }: Props) {
  const meta = data.meta ?? {};
  const sig = data.conclusion?.signature;
  const created = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const consultant = sig?.name?.trim() || meta.generatedBy?.name || 'Consultor técnico';
  const crea = sig?.crea?.trim() ? `CREA ${sig.crea}` : meta.generatedBy?.role || 'Responsável técnico';
  const initials = consultant
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'RT';

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="border-b border-slate-200/90 bg-white print:border-slate-200"
      style={{ boxShadow: ENT.shadowSoft }}
    >
      <div className="mx-auto grid max-w-[1400px] items-start gap-6 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-12 lg:items-center">
        {/* Marca (referência: logo + linha sutil) */}
        <div className="lg:col-span-3">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-slate-500">Relatório técnico</p>
          <div className="mt-1 flex items-baseline gap-0.5">
            <span className="text-2xl font-black tracking-tight" style={{ color: ENT.green }}>
              Fort
            </span>
            <span className="text-2xl font-black tracking-tight text-slate-800">Smart</span>
          </div>
          <p className="mt-0.5 text-xs font-medium text-slate-500">Avaliação de campo</p>
        </div>

        {/* Título central (desktop) */}
        <div className="text-center lg:col-span-6">
          <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[26px] md:text-[28px]">
            Relatório de Avaliação de Campo
          </h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500 sm:text-base">Ensaio comparativo de manejos</p>
        </div>

        {/* Consultor + data (referência: cartão à direita) */}
        <div className="flex justify-start lg:col-span-3 lg:justify-end">
          <div className="flex w-full max-w-sm items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/95 px-3 py-2.5 shadow-sm sm:max-w-none">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-md ring-2 ring-white"
              style={{
                background: `linear-gradient(145deg, ${ENT.blue} 0%, ${ENT.green} 100%)`,
              }}
              aria-hidden
            >
              {initials.length >= 1 ? <span className="tabular-nums tracking-tight">{initials}</span> : <UserRound className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-bold text-slate-900">{consultant}</p>
              <p className="truncate text-xs text-slate-600">{crea}</p>
              {created ? <p className="text-[11px] text-slate-500">{created}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
