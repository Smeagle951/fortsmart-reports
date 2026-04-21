'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import PremiumSectionShell from './PremiumSectionShell';

/**
 * Bloco único de narrativa — só o texto publicado no relatório (sem inferência no front).
 */
export default function InsightSection({ data }: { data: SideBySideReportData }) {
  const headline = data.conclusion?.headline?.trim();
  const summary = data.conclusion?.summary?.trim();
  if (!summary || summary.length < 40) return null;
  if (headline && summary === headline) return null;

  return (
    <PremiumSectionShell
      id="insight-premium"
      eyebrow="Narrativa técnica"
      title="Panorama"
      subtitle="Texto integral publicado no relatório — sem geração adicional no navegador."
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="rounded-2xl border border-slate-200/60 bg-gradient-to-br from-slate-50/90 via-white to-emerald-50/20 px-5 py-6 sm:px-8 sm:py-7 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.9)] ring-1 ring-slate-900/[0.03]"
      >
        <p className="text-lg sm:text-xl text-slate-800 leading-relaxed font-medium">{summary}</p>
      </motion.div>
    </PremiumSectionShell>
  );
}
