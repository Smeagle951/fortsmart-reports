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

function buildDecisionSummary(model: VtHeroNarrativeModel): string {
  const status = model.statusVariant;
  if (status === 'critico') {
    return 'Intervencao necessaria em ate 48h para evitar perda adicional de produtividade.';
  }
  if (status === 'atencao') {
    return 'Manejo e monitoramento devem ser priorizados nesta janela para evitar piora do quadro.';
  }
  return 'Manter rotina de monitoramento e validar evolucao no proximo ponto de decisao.';
}

function buildScoreInterpretation(model: VtHeroNarrativeModel): string {
  if (model.score < 45 || model.statusVariant === 'critico') {
    return 'Score indica cenario de risco alto, com potencial de perda sem intervencao.';
  }
  if (model.score < 70 || model.statusVariant === 'atencao') {
    return 'Score indica cenario com risco moderado, com tendencia de piora sem manejo.';
  }
  return 'Score indica quadro sob controle, mantendo atencao a mudancas de campo.';
}

export default function VtDecisionHero({ model }: { model: VtHeroNarrativeModel }) {
  return (
    <section className={dp.hero} aria-label="Status do talhao e decisao em 3 segundos">
      <p className={dp.heroKicker}>Decisao em 3 segundos · cockpit agronomico</p>
      <div className={dp.heroTop}>
        <div>
          <h1 className={dp.heroTitle}>{model.tituloTalhao}</h1>
          <p className={dp.heroSub}>{model.sublinha}</p>
        </div>
        <div style={{ textAlign: 'right' as const }}>
          <span className={badgeClass(model.statusVariant)}>{model.statusLabel}</span>
          <p className={dp.scoreLine}>Score {model.score} / 100</p>
          <p className={dp.scoreInterpretation}>{buildScoreInterpretation(model)}</p>
        </div>
      </div>

      <div className={dp.decisionSummary}>{buildDecisionSummary(model)}</div>

      <div className={dp.heroQaStrip} aria-label="Respostas prontas">
        <p className={dp.heroQaRow}>
          <span className={dp.heroQaQ}>Estou perdendo produtividade?</span>
          <span className={dp.heroQaA}>{model.respostaPerdaProdutividade}</span>
        </p>
        <p className={dp.heroQaRow}>
          <span className={dp.heroQaQ}>Preciso agir agora?</span>
          <span className={dp.heroQaA}>{model.respostaAgirAgora}</span>
        </p>
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
          <div className={dp.metricLabel}>Janela crítica</div>
          <div className={dp.metricValue} style={{ fontSize: '0.9rem', lineHeight: 1.35 }}>
            {model.janelaCritica ?? '—'}
          </div>
        </div>
        <div className={dp.metric}>
          <div className={dp.metricLabel}>Próxima ação</div>
          <div className={dp.metricValueAction} style={{ fontSize: '0.9rem', lineHeight: 1.35 }}>
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
