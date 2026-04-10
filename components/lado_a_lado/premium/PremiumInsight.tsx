'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { buildInsightParagraph, deriveWinner } from '@/lib/lado-a-lado-premium';
import { useReducedMotionClient } from './useReducedMotionClient';

type Props = {
  data: SideBySideReportData;
  sideAName: string;
  sideBName: string;
};

export default function PremiumInsight({ data, sideAName, sideBName }: Props) {
  const reduced = useReducedMotionClient();
  const text = buildInsightParagraph(data, sideAName, sideBName);
  const w = deriveWinner(sideAName, sideBName, data);
  const rec =
    data.conclusion?.recommendations?.[0] ||
    data.diagnosis?.planoAcao ||
    data.resumo?.conclusaoCurta ||
    null;

  return (
    <motion.section
      id="premium-insight"
      className="rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/95 to-white p-5 sm:p-6 shadow-sm"
      initial={reduced ? false : { opacity: 0, y: 12 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay: 0.08 }}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          ✓
        </span>
        <div className="min-w-0 space-y-2">
          <h2 className="text-lg font-semibold text-emerald-900">Análise automática</h2>
          <p className="text-sm text-slate-700 leading-relaxed">{text}</p>
          {rec && (
            <p className="text-sm">
              <span className="font-semibold text-slate-800">Recomendação: </span>
              <span className="text-slate-700">{rec}</span>
            </p>
          )}
          {w !== 'tie' && (
            <p className="text-xs text-slate-500">
              Indicador sintético de destaque: manejo {w === 'B' ? sideBName : sideAName} (com base em produtividade estimada e/ou médias por critério).
            </p>
          )}
        </div>
      </div>
    </motion.section>
  );
}
