'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { useReducedMotionClient } from './useReducedMotionClient';

type Props = {
  data: SideBySideReportData;
};

export default function PremiumDiagnosticoBlock({ data }: Props) {
  const reduced = useReducedMotionClient();
  const diagnosis = data.diagnosis;
  const conclusion = data.conclusion;
  const diagnostics = data.diagnostics;
  const resumo = data.resumo;

  const has =
    diagnosis?.problemaPrincipal ||
    diagnosis?.causaProvavel ||
    diagnosis?.urgencia ||
    diagnosis?.planoAcao ||
    diagnostics?.recommendations?.length ||
    conclusion?.summary ||
    resumo?.conclusaoCurta;

  return (
    <motion.section
      id="premium-diagnostico"
      className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5 sm:p-6 shadow-sm"
      initial={reduced ? false : { opacity: 0, y: 8 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <h2 className="text-lg font-semibold text-slate-900 mb-3">Diagnóstico técnico</h2>
      {!has ? (
        <p className="text-sm text-slate-500">Sem bloco de diagnóstico estruturado neste JSON. Veja a conclusão técnica ao final.</p>
      ) : null}
      <div className="space-y-2 text-sm text-slate-700">
        {diagnosis?.problemaPrincipal && (
          <p>
            <span className="font-semibold text-slate-900">Problema principal: </span>
            {diagnosis.problemaPrincipal}
          </p>
        )}
        {diagnosis?.problemasSecundarios && diagnosis.problemasSecundarios.length > 0 && (
          <p>
            <span className="font-semibold text-slate-900">Secundários: </span>
            {diagnosis.problemasSecundarios.join('; ')}
          </p>
        )}
        {diagnosis?.causaProvavel && (
          <p>
            <span className="font-semibold text-slate-900">Causa provável: </span>
            {diagnosis.causaProvavel}
          </p>
        )}
        {diagnosis?.urgencia && (
          <p>
            <span className="font-semibold text-slate-900">Urgência: </span>
            {diagnosis.urgencia}
          </p>
        )}
        {diagnosis?.planoAcao && (
          <p>
            <span className="font-semibold text-slate-900">Plano de ação: </span>
            {diagnosis.planoAcao}
          </p>
        )}
        {resumo?.conclusaoCurta && !diagnosis?.problemaPrincipal && <p>{resumo.conclusaoCurta}</p>}
        {conclusion?.summary && <p className="leading-relaxed">{conclusion.summary}</p>}
        {diagnostics?.recommendations && diagnostics.recommendations.length > 0 && (
          <ul className="list-disc list-inside space-y-1">
            {diagnostics.recommendations.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        )}
      </div>
    </motion.section>
  );
}
