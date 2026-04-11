'use client';

import React from 'react';
import dp from './decision-premium.module.css';

export default function VtNarrativaDiagnostico({ diagnostico }: { diagnostico: Record<string, unknown> }) {
  const problema = diagnostico.problemaPrincipal != null ? String(diagnostico.problemaPrincipal).trim() : '';
  const causa = diagnostico.causaProvavel != null ? String(diagnostico.causaProvavel).trim() : '';
  const risco = diagnostico.nivelRisco != null ? String(diagnostico.nivelRisco).trim() : '';

  if (!problema && !causa && !risco) return null;

  return (
    <section className={dp.sectionPremium} aria-label="Diagnóstico agronômico">
      <h2 className={dp.sectionTitle}>Diagnóstico</h2>
      <div className={dp.narrativeStack}>
        {problema ? (
          <div className={dp.narrativeCardProblema}>
            <div className={dp.narrativeCardLabel}>Problema principal</div>
            <p className={dp.narrativeCardText}>{problema}</p>
          </div>
        ) : null}
        {causa ? (
          <div className={dp.narrativeCardCausa}>
            <div className={dp.narrativeCardLabel}>Causa provável</div>
            <p className={dp.narrativeCardText}>{causa}</p>
          </div>
        ) : null}
        {risco ? (
          <div className={dp.narrativeCardRisco}>
            <div className={dp.narrativeCardLabel}>Risco declarado</div>
            <p className={dp.narrativeCardText}>{risco}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
