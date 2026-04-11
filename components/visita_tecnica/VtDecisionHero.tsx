'use client';

import React from 'react';
import type { VtHeroNarrativeModel } from '@/lib/visita-tecnica/buildVtDecisionNarrative';
import dp from './decision-premium.module.css';

function badgeClass(variant: VtHeroNarrativeModel['statusVariant']): string {
  switch (variant) {
    case 'critico':
      return dp.badgeCritico;
    case 'atencao':
      return dp.badgeAtencao;
    case 'ok':
      return dp.badgeOk;
    case 'bom':
      return dp.badgeBom;
    default:
      return dp.badgeAtencao;
  }
}

export default function VtDecisionHero({ model }: { model: VtHeroNarrativeModel }) {
  return (
    <section className={dp.hero} aria-label="Status e decisão da visita">
      <div className={dp.heroTop}>
        <div>
          <h1 className={dp.heroTitle}>{model.tituloTalhao}</h1>
          <p className={dp.heroSub}>{model.sublinha}</p>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <span className={badgeClass(model.statusVariant)}>{model.statusLabel}</span>
          <p className={dp.scoreLine}>Score {model.score} / 100</p>
        </div>
      </div>

      {model.resumoDecisao?.trim() ? (
        <p className={dp.heroResumo}>{model.resumoDecisao.trim()}</p>
      ) : null}

      <div className={dp.heroMetrics}>
        <div className={dp.metric}>
          <div className={dp.metricLabel}>Impacto produtivo</div>
          <div className={model.impactoScHaTexto ? dp.metricValueImpact : dp.metricValue}>
            {model.impactoScHaTexto ?? '—'}
          </div>
        </div>
        <div className={dp.metric}>
          <div className={dp.metricLabel}>Risco</div>
          <div className={dp.metricValue}>{model.riscoExibicao}</div>
        </div>
        <div className={dp.metric}>
          <div className={dp.metricLabel}>Próxima ação</div>
          <div className={dp.metricValueAction} style={{ fontSize: '0.95rem', lineHeight: 1.35 }}>
            {model.proximaAcao}
          </div>
        </div>
      </div>

      {model.causaLinha ? (
        <div className={dp.causaStrip}>
          <strong>Causa provável / foco:</strong> {model.causaLinha}
        </div>
      ) : null}
    </section>
  );
}
