'use client';

import React from 'react';
import { formatDate, formatNumber } from '@/utils/format';
import HeaderInstitucionalLadoALado from '@/components/lado_a_lado/HeaderInstitucionalLadoALado';
import TabelaComparativaKPIs from '@/components/lado_a_lado/TabelaComparativaKPIs';

export type SideBySideReportData = {
  tipo: string;
  meta?: {
    reportId?: string;
    createdAt?: string;
    appVersion?: string;
    generatedBy?: { name?: string; role?: string };
  };
  branding?: { title?: string; subtitle?: string };
  farm?: {
    farmName?: string;
    owner?: string;
    city?: string;
    state?: string;
    culture?: string;
    season?: string;
    fieldName?: string;
    areaHa?: number;
    objective?: string;
  };
  sideA?: SideData;
  sideB?: SideData;
  conclusion?: {
    summary?: string;
    recommendations?: string[];
    signature?: { name?: string; crea?: string; city?: string };
  };
  coleta?: {
    ensaioName?: string;
    dataPlantio?: string;
    dae?: number;
    pointCount?: number;
  };
  ocorrencias?: Array<{
    tipo?: string;
    nomeAlvo?: string;
    incidenciaPct?: number;
    severidade?: string;
    recomendacao?: string;
  }>;
  aplicacoes?: Array<{
    data?: string;
    tipo?: string;
    produtos?: string;
    classe?: string;
  }>;
  resumo?: {
    statusConcluida?: boolean;
    conclusaoCurta?: string;
    numOcorrencias?: number;
    numAplicacoes?: number;
  };
  colheita?: Record<string, unknown> | null;
  custo?: Record<string, unknown> | null;
};

type SideData = {
  label?: string;
  name?: string;
  code?: string;
  kpis?: {
    avgHeightCm?: number;
    leafCount?: number;
    finalPopulationPlHa?: number;
    estimatedYieldKgHa?: number;
    rootRating?: { label?: string; score?: number; max?: number };
    vigorRating?: { label?: string; score?: number; max?: number };
    profundidadeRaizCm?: number;
    pesoRaizG?: number;
    estandeEfetivo?: number;
    eficienciaPct?: number;
  };
  soilCompaction?: string;
  observations?: string[];
  photos?: Array<{ caption?: string; url?: string }>;
};

const compactionLabel: Record<string, string> = {
  leve: 'Leve',
  media: 'Média',
  alta: 'Alta',
  nao_informado: 'Não informado',
};

interface SideBySideReportContentProps {
  data: SideBySideReportData;
  reportId?: string;
}

export default function SideBySideReportContent({ data, reportId }: SideBySideReportContentProps) {
  const meta = data.meta || {};
  const farm = data.farm || {};
  const sideA = data.sideA || ({} as SideData);
  const sideB = data.sideB || ({} as SideData);
  const conclusion = data.conclusion || {};
  const kpisA = sideA.kpis || {};
  const kpisB = sideB.kpis || {};
  const photosA = sideA.photos || [];
  const photosB = sideB.photos || [];
  const recommendations = conclusion.recommendations || [];
  const coleta = data.coleta;
  const ocorrencias = data.ocorrencias || [];
  const aplicacoes = data.aplicacoes || [];
  const resumo = data.resumo;
  const hasColheita = data.colheita && Object.keys(data.colheita).length > 0;
  const hasCusto = data.custo && Object.keys(data.custo).length > 0;

  const sideAName = sideA.name || 'Lado A';
  const sideBName = sideB.name || 'Lado B';

  return (
    <div className="sbs-report">
      <HeaderInstitucionalLadoALado
        meta={meta}
        farm={farm}
        sideAName={sideAName}
        sideBName={sideBName}
        reportId={reportId || meta.reportId}
      />

      {/* Coleta: ensaio, data plantio, DAE, pontos */}
      {coleta && (coleta.ensaioName || coleta.dae != null || coleta.pointCount != null || coleta.dataPlantio) && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Dados da coleta</h2>
          <div className="sbs-info-grid">
            {coleta.ensaioName && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">Ensaio</span>
                <span className="sbs-info-value">{coleta.ensaioName}</span>
              </div>
            )}
            {coleta.dataPlantio && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">Data de plantio</span>
                <span className="sbs-info-value">{formatDate(coleta.dataPlantio)}</span>
              </div>
            )}
            {coleta.dae != null && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">DAE</span>
                <span className="sbs-info-value">{coleta.dae} dias</span>
              </div>
            )}
            {coleta.pointCount != null && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">Pontos de coleta</span>
                <span className="sbs-info-value">{coleta.pointCount} ponto(s)</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Objetivo do ensaio (farm.objective) */}
      {farm.objective && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Objetivo do ensaio</h2>
          <p className="sbs-text-block">{farm.objective}</p>
        </section>
      )}

      {/* Tratamentos: identificação A vs B */}
      <section className="sbs-section">
        <h2 className="sbs-section-title">Tratamentos</h2>
        <div className="sbs-two-columns">
          <div className="sbs-column sbs-column-a">
            <div className="sbs-column-badge">{sideAName}</div>
            <p className="sbs-muted">Tratamento A — indicadores e evidências abaixo</p>
          </div>
          <div className="sbs-column sbs-column-b">
            <div className="sbs-column-badge">{sideBName}</div>
            <p className="sbs-muted">Tratamento B — indicadores e evidências abaixo</p>
          </div>
        </div>
      </section>

      {/* Tabela comparativa única — padrão agronômico */}
      <TabelaComparativaKPIs
        sideAName={sideAName}
        sideBName={sideBName}
        kpisA={kpisA}
        kpisB={kpisB}
        soilCompactionA={sideA.soilCompaction}
        soilCompactionB={sideB.soilCompaction}
        compactionLabels={compactionLabel}
      />

      {/* Observações por lado */}
      {(sideA.observations?.length || sideB.observations?.length) ? (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Observações de campo</h2>
          <div className="sbs-two-columns">
            <div className="sbs-column sbs-column-a">
              <div className="sbs-column-badge">{sideAName}</div>
              {sideA.observations && sideA.observations.length > 0 ? (
                <ul className="sbs-list">
                  {sideA.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              ) : (
                <p className="sbs-muted">Nenhuma observação</p>
              )}
            </div>
            <div className="sbs-column sbs-column-b">
              <div className="sbs-column-badge">{sideBName}</div>
              {sideB.observations && sideB.observations.length > 0 ? (
                <ul className="sbs-list">
                  {sideB.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              ) : (
                <p className="sbs-muted">Nenhuma observação</p>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {/* Pragas, doenças e plantas daninhas */}
      {ocorrencias.length > 0 && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Pragas, doenças e plantas daninhas</h2>
          <div className="sbs-table-wrap">
            <table className="sbs-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Alvo</th>
                  <th>Incidência</th>
                  <th>Severidade</th>
                  <th>Recomendação</th>
                </tr>
              </thead>
              <tbody>
                {ocorrencias.map((o, i) => (
                  <tr key={i}>
                    <td>{o.tipo || '—'}</td>
                    <td>{o.nomeAlvo || '—'}</td>
                    <td>{o.incidenciaPct != null ? `${formatNumber(o.incidenciaPct)}%` : '—'}</td>
                    <td>{o.severidade || '—'}</td>
                    <td>{o.recomendacao || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Aplicações realizadas */}
      {aplicacoes.length > 0 && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Aplicações realizadas</h2>
          <div className="sbs-table-wrap">
            <table className="sbs-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Classe</th>
                  <th>Produtos</th>
                </tr>
              </thead>
              <tbody>
                {aplicacoes.map((a, i) => (
                  <tr key={i}>
                    <td>{formatDate(a.data)}</td>
                    <td>{a.tipo || '—'}</td>
                    <td>{a.classe || '—'}</td>
                    <td>{a.produtos || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Fotos e evidências */}
      <section className="sbs-section">
        <h2 className="sbs-section-title">Fotos e evidências</h2>
        <div className="sbs-two-columns sbs-photos-columns">
          <div className="sbs-column sbs-column-a">
            <div className="sbs-column-badge">{sideAName}</div>
            <div className="sbs-photos-grid">
              {photosA.map((photo, i) => (
                <figure key={i} className="sbs-figure">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.caption || 'Evidência'} className="sbs-photo-img" />
                  ) : (
                    <div className="sbs-photo-placeholder">Sem imagem</div>
                  )}
                  {photo.caption && <figcaption className="sbs-figcaption">{photo.caption}</figcaption>}
                </figure>
              ))}
              {photosA.length === 0 && <p className="sbs-muted">Nenhuma foto</p>}
            </div>
          </div>
          <div className="sbs-column sbs-column-b">
            <div className="sbs-column-badge">{sideBName}</div>
            <div className="sbs-photos-grid">
              {photosB.map((photo, i) => (
                <figure key={i} className="sbs-figure">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.caption || 'Evidência'} className="sbs-photo-img" />
                  ) : (
                    <div className="sbs-photo-placeholder">Sem imagem</div>
                  )}
                  {photo.caption && <figcaption className="sbs-figcaption">{photo.caption}</figcaption>}
                </figure>
              ))}
              {photosB.length === 0 && <p className="sbs-muted">Nenhuma foto</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Colheita e custo */}
      {(hasColheita || hasCusto) && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Colheita e custo</h2>
          <div className="sbs-info-grid">
            {hasColheita && (
              <div className="sbs-info-row sbs-info-row-full">
                <span className="sbs-info-label">Colheita</span>
                <span className="sbs-info-value">
                  {typeof data.colheita === 'object' && data.colheita !== null
                    ? JSON.stringify(data.colheita)
                    : 'Não informado'}
                </span>
              </div>
            )}
            {hasCusto && (
              <div className="sbs-info-row sbs-info-row-full">
                <span className="sbs-info-label">Custo</span>
                <span className="sbs-info-value">
                  {typeof data.custo === 'object' && data.custo !== null
                    ? JSON.stringify(data.custo)
                    : 'Não informado'}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Resumo executivo */}
      {resumo && (
        <section className="sbs-section">
          <h2 className="sbs-section-title">Resumo</h2>
          <div className="sbs-info-grid">
            <div className="sbs-info-row">
              <span className="sbs-info-label">Status</span>
              <span className="sbs-info-value">{resumo.statusConcluida ? 'Concluída' : 'Em andamento'}</span>
            </div>
            {resumo.numOcorrencias != null && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">Ocorrências</span>
                <span className="sbs-info-value">{resumo.numOcorrencias}</span>
              </div>
            )}
            {resumo.numAplicacoes != null && (
              <div className="sbs-info-row">
                <span className="sbs-info-label">Aplicações</span>
                <span className="sbs-info-value">{resumo.numAplicacoes}</span>
              </div>
            )}
            {resumo.conclusaoCurta && (
              <div className="sbs-info-row sbs-info-row-full">
                <span className="sbs-info-label">Conclusão curta</span>
                <span className="sbs-info-value">{resumo.conclusaoCurta}</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Conclusão */}
      <section className="sbs-section">
        <h2 className="sbs-section-title">Conclusão</h2>
        {conclusion.summary && <p className="sbs-text-block sbs-conclusao-text">{conclusion.summary}</p>}
        {recommendations.length > 0 && (
          <div className="sbs-recommendations">
            <strong className="sbs-recommendations-title">Recomendações</strong>
            <ol className="sbs-list sbs-list-ordered">
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {/* Assinatura */}
      {conclusion.signature && (conclusion.signature.name || conclusion.signature.crea) && (
        <section className="sbs-section sbs-signature-section">
          <h2 className="sbs-section-title">Responsável técnico</h2>
          <div className="sbs-signature-box">
            <div className="sbs-signature-name">{conclusion.signature.name}</div>
            {conclusion.signature.crea && (
              <div className="sbs-signature-crea">CREA: {conclusion.signature.crea}</div>
            )}
            {conclusion.signature.city && (
              <div className="sbs-signature-city">{conclusion.signature.city}</div>
            )}
          </div>
        </section>
      )}

      <footer className="sbs-footer">
        <div>Relatório gerado pelo FortSmart Agro</div>
        <div className="sbs-footer-meta">
          {meta.reportId || reportId || '—'} {meta.appVersion ? `• ${meta.appVersion}` : ''}
        </div>
      </footer>
    </div>
  );
}
