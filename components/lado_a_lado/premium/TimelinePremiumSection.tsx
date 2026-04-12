'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { distinctApplicationDaas } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate } from '@/utils/format';

export default function TimelinePremiumSection({ data }: { data: SideBySideReportData }) {
  const coleta = data.coleta;
  const apps = data.applications ?? [];
  const daas = distinctApplicationDaas(apps);
  const minDaa = daas.length ? Math.min(...daas) : null;
  const maxDaa = daas.length ? Math.max(...daas) : null;

  const steps: { title: string; body: string }[] = [];
  if (coleta?.dataPlantio?.trim()) {
    steps.push({
      title: 'Plantio',
      body: formatDate(coleta.dataPlantio),
    });
  }
  if (apps.length > 0 && minDaa != null && maxDaa != null) {
    steps.push({
      title: 'Aplicações',
      body:
        minDaa === maxDaa
          ? `Registro em ${minDaa} DAA`
          : `Do ${minDaa} ao ${maxDaa} DAA · ${apps.length} evento${apps.length > 1 ? 's' : ''}`,
    });
  } else if (data.aplicacoes && data.aplicacoes.length > 0) {
    const first = data.aplicacoes[0];
    steps.push({
      title: 'Aplicações',
      body: first?.data ? formatDate(first.data) : 'Registro resumido no relatório',
    });
  }
  if (coleta?.dae != null) {
    steps.push({
      title: 'Referência',
      body: `${coleta.dae} DAE no talhão`,
    });
  } else if (maxDaa != null) {
    steps.push({
      title: 'Avaliação',
      body: `Referência até ${maxDaa} DAA`,
    });
  }

  if (steps.length === 0) return null;

  return (
    <section id="timeline-premium" className="scroll-mt-28">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Linha do tempo</h2>
      <p className="mt-2 text-sm text-slate-600 mb-8 max-w-xl">
        Contexto mínimo do ensaio — só o que foi publicado no relatório.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        {steps.map((s, i) => (
          <motion.div
            key={`${s.title}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="relative rounded-2xl border border-slate-200 bg-slate-50/80 p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white text-sm font-bold"
                aria-hidden
              >
                {i + 1}
              </span>
              {s.title}
            </div>
            <p className="mt-3 text-slate-800 font-semibold leading-snug">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
