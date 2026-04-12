'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';

/**
 * Bloco único de narrativa — só o texto publicado no relatório (sem inferência no front).
 */
export default function InsightSection({ data }: { data: SideBySideReportData }) {
  const headline = data.conclusion?.headline?.trim();
  const summary = data.conclusion?.summary?.trim();
  if (!summary || summary.length < 40) return null;
  if (headline && summary === headline) return null;

  return (
    <section id="insight-premium" className="scroll-mt-28">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Panorama</p>
        <p className="mt-3 text-lg sm:text-xl text-slate-800 leading-relaxed font-medium">{summary}</p>
      </motion.div>
    </section>
  );
}
