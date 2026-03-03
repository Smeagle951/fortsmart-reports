'use client';

import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';

type LinhaPonto = { tipo: 'ok' | 'dupla' | 'tripla' | 'falha'; posicao?: number };
type EspacamentoItem = { cm?: number; tipo: string };

interface QualidadePlantioProps {
  espacamentoIdealCm?: number;
  espacamentoRealCm?: number;
  cvPercentual?: number;
  duplasPct?: number;
  triplasPct?: number;
  falhasPct?: number;
  okPct?: number;
  indicePlantabilidade?: number;
  /** Pontos da linha de plantio para visualização (submódulo qualidade / app) */
  linha?: LinhaPonto[];
  /** Espaçamento em cm por semente: Semente 1: 31 cm → OK (submódulo qualidade / app) */
  espacamentosIndividuais?: EspacamentoItem[];
}

export default function QualidadePlantio({
  espacamentoIdealCm,
  espacamentoRealCm,
  cvPercentual,
  duplasPct,
  triplasPct,
  falhasPct,
  okPct,
  indicePlantabilidade,
  linha,
  espacamentosIndividuais,
}: QualidadePlantioProps) {
  const hasResumo =
    espacamentoIdealCm != null ||
    espacamentoRealCm != null ||
    cvPercentual != null ||
    indicePlantabilidade != null ||
    okPct != null ||
    duplasPct != null ||
    triplasPct != null ||
    falhasPct != null;
  const hasLinha = (linha && linha.length > 0) || (espacamentosIndividuais && espacamentosIndividuais.length > 0);
  if (!hasResumo && !hasLinha) return null;

  return (
    <section className="plantio-card" aria-labelledby="qualidade-plantio-titulo">
      <h3 id="qualidade-plantio-titulo" className="plantio-card-title">
        Qualidade do Plantio
      </h3>
      <dl className="plantio-data-list">
        <div className="plantio-data-row">
          <dt>Espaçamento Ideal</dt>
          <dd>{espacamentoIdealCm != null ? `${espacamentoIdealCm} cm` : '—'}</dd>
        </div>
        <div className="plantio-data-row">
          <dt>Espaçamento Real</dt>
<<<<<<< HEAD
          <dd>{espacamentoRealCm != null ? `${espacamentoRealCm} cm` : '—'}</dd>
        </div>
        <div className="plantio-data-row">
          <dt>CV%</dt>
          <dd>{cvPercentual != null ? `${cvPercentual}%` : '—'}</dd>
        </div>
      </dl>
      <div className="plantio-tags">
        <span className="plantio-tag plantio-tag--ok">OK: {okPct != null ? `${okPct}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--dupla">Duplas: {duplasPct != null ? `${duplasPct}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--tripla">Triplas: {triplasPct != null ? `${triplasPct}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--falha">Falhas: {falhasPct != null ? `${falhasPct}%` : '—'}</span>
=======
          <dd>{espacamentoRealCm != null ? `${Number(espacamentoRealCm).toFixed(1)} cm` : '—'}</dd>
        </div>
        <div className="plantio-data-row">
          <dt>CV%</dt>
          <dd>{cvPercentual != null ? `${Number(cvPercentual).toFixed(1)}%` : '—'}</dd>
        </div>
      </dl>
      <div className="plantio-tags">
        <span className="plantio-tag plantio-tag--ok">OK: {okPct != null ? `${Number(okPct).toFixed(1)}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--dupla">Duplas: {duplasPct != null ? `${Number(duplasPct).toFixed(1)}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--tripla">Triplas: {triplasPct != null ? `${Number(triplasPct).toFixed(1)}%` : '—'}</span>
        <span className="plantio-tag plantio-tag--falha">Falhas: {falhasPct != null ? `${Number(falhasPct).toFixed(1)}%` : '—'}</span>
>>>>>>> e461e4262c2f2378d357100a0c42507b208e143f
      </div>
      {indicePlantabilidade != null && (
        <div className="plantio-indice-box">
          <span className="plantio-indice-label">Índice de Plantabilidade</span>
          <span className="plantio-indice-valor">{indicePlantabilidade}/100</span>
        </div>
      )}
      {/* Linha de qualidade do plantio com medições (igual ao app: trena + espaçamentos individuais) */}
      <LinhaPlantioVisualizer
        linha={linha ?? []}
        okPct={okPct}
        duplasPct={duplasPct}
        triplasPct={triplasPct}
        falhasPct={falhasPct}
        indicePlantabilidade={indicePlantabilidade}
        espacamentosIndividuais={espacamentosIndividuais}
        embedded
      />
    </section>
  );
}
