'use client';

interface QualidadePlantioProps {
  espacamentoIdealCm?: number;
  espacamentoRealCm?: number;
  cvPercentual?: number;
  duplasPct?: number;
  triplasPct?: number;
  falhasPct?: number;
  okPct?: number;
  indicePlantabilidade?: number;
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
}: QualidadePlantioProps) {
  const hasAny =
    espacamentoIdealCm != null ||
    espacamentoRealCm != null ||
    cvPercentual != null ||
    indicePlantabilidade != null ||
    okPct != null ||
    duplasPct != null ||
    triplasPct != null ||
    falhasPct != null;
  if (!hasAny) return null;

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
      </div>
      {indicePlantabilidade != null && (
        <div className="plantio-indice-box">
          <span className="plantio-indice-label">Índice de Plantabilidade</span>
          <span className="plantio-indice-valor">{indicePlantabilidade}/100</span>
        </div>
      )}
    </section>
  );
}
