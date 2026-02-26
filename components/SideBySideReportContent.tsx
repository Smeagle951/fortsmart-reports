import React from 'react';
import { formatDate, formatNumber } from '../utils/format';

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
  const branding = data.branding || {};
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

  return (
    <>
      <header className="header side-by-side-header">
        <div className="brand">
          <span className="brand-title">{branding.title || 'FortSmart Agro'}</span>
          {branding.subtitle && (
            <span className="brand-subtitle">{branding.subtitle}</span>
          )}
        </div>
        <div className="header-meta">
          <div>{formatDate(meta.createdAt)}</div>
          <div>{meta.generatedBy?.name}</div>
          <div>{farm.farmName}</div>
        </div>
      </header>

      <h1 className="report-title">Avaliação Lado a Lado</h1>
      <p className="report-subtitle">
        {farm.fieldName} • {farm.culture} • Safra {farm.season}
      </p>

      <section className="section info-grid-section">
        <h2 className="section-title">Identificação</h2>
        <div className="info-grid side-by-side-info">
          <div className="info-row">
            <span className="info-label">Fazenda</span>
            <span className="info-value">{farm.farmName || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Talhão / Campo</span>
            <span className="info-value">{farm.fieldName || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Cultura / Material</span>
            <span className="info-value">{farm.culture || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Safra</span>
            <span className="info-value">{farm.season || '—'}</span>
          </div>
          {farm.areaHa != null && (
            <div className="info-row">
              <span className="info-label">Área</span>
              <span className="info-value">{formatNumber(farm.areaHa, { decimals: 2 })} ha</span>
            </div>
          )}
          <div className="info-row">
            <span className="info-label">Proprietário</span>
            <span className="info-value">{farm.owner || '—'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Local</span>
            <span className="info-value">{[farm.city, farm.state].filter(Boolean).join(' / ') || '—'}</span>
          </div>
          {farm.objective && (
            <div className="info-row full-width">
            <span className="info-label">Objetivo do ensaio</span>
            <span className="info-value">{farm.objective}</span>
          </div>
          )}
        </div>
      </section>

      {coleta && (coleta.ensaioName || coleta.dae != null || coleta.pointCount != null) && (
        <section className="section">
          <h2 className="section-title">Coleta</h2>
          <div className="info-grid side-by-side-info">
            {coleta.ensaioName && (
              <div className="info-row">
                <span className="info-label">Ensaio</span>
                <span className="info-value">{coleta.ensaioName}</span>
              </div>
            )}
            {coleta.dataPlantio && (
              <div className="info-row">
                <span className="info-label">Data de plantio</span>
                <span className="info-value">{formatDate(coleta.dataPlantio)}</span>
              </div>
            )}
            {coleta.dae != null && (
              <div className="info-row">
                <span className="info-label">DAE</span>
                <span className="info-value">{coleta.dae} dias</span>
              </div>
            )}
            {coleta.pointCount != null && (
              <div className="info-row">
                <span className="info-label">Pontos de coleta</span>
                <span className="info-value">{coleta.pointCount} ponto(s)</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Tratamentos</h2>
        <div className="side-by-side-grid" style={{ marginBottom: 0 }}>
          <div className="side-column">
            <div className="side-column-header lado-a">{sideA.name || 'Lado A'}</div>
            <p className="muted">Tratamento A — dados comparativos abaixo</p>
          </div>
          <div className="side-column">
            <div className="side-column-header lado-b">{sideB.name || 'Lado B'}</div>
            <p className="muted">Tratamento B — dados comparativos abaixo</p>
          </div>
        </div>
      </section>

      <section className="section">
        <h2 className="section-title">Comparativo — KPIs</h2>
        <div className="side-by-side-grid">
          <div className="side-column">
            <div className="side-column-header lado-a">{sideA.name || 'Lado A'}</div>
            <div className="kpis-block">
              <KpiRow label="Altura média (cm)" value={kpisA.avgHeightCm} />
              <KpiRow label="Nº folhas" value={kpisA.leafCount} />
              <KpiRow label="População final (pl/ha)" value={kpisA.finalPopulationPlHa} />
              <KpiRow label="Produtividade est. (kg/ha)" value={kpisA.estimatedYieldKgHa} />
              <KpiRow label="Estande efetivo" value={kpisA.estandeEfetivo} />
              <KpiRow label="Eficiência (%)" value={kpisA.eficienciaPct} />
              {kpisA.rootRating != null && (
                <div className="info-row">
                  <span className="info-label">Sanidade raiz</span>
                  <span className="info-value">{kpisA.rootRating.label} ({kpisA.rootRating.score}/{kpisA.rootRating.max})</span>
                </div>
              )}
              {kpisA.profundidadeRaizCm != null && (
                <div className="info-row">
                  <span className="info-label">Profundidade raiz (cm)</span>
                  <span className="info-value">{formatNumber(kpisA.profundidadeRaizCm)}</span>
                </div>
              )}
              {kpisA.pesoRaizG != null && (
                <div className="info-row">
                  <span className="info-label">Peso raiz (g)</span>
                  <span className="info-value">{formatNumber(kpisA.pesoRaizG)}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Compactação solo</span>
                <span className="info-value">{compactionLabel[sideA.soilCompaction || ''] || sideA.soilCompaction || '—'}</span>
              </div>
            </div>
            {sideA.observations && sideA.observations.length > 0 && (
              <div className="observations-block">
                <strong>Observações</strong>
                <ul>
                  {sideA.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="side-column">
            <div className="side-column-header lado-b">{sideB.name || 'Lado B'}</div>
            <div className="kpis-block">
              <KpiRow label="Altura média (cm)" value={kpisB.avgHeightCm} />
              <KpiRow label="Nº folhas" value={kpisB.leafCount} />
              <KpiRow label="População final (pl/ha)" value={kpisB.finalPopulationPlHa} />
              <KpiRow label="Produtividade est. (kg/ha)" value={kpisB.estimatedYieldKgHa} />
              <KpiRow label="Estande efetivo" value={kpisB.estandeEfetivo} />
              <KpiRow label="Eficiência (%)" value={kpisB.eficienciaPct} />
              {kpisB.rootRating != null && (
                <div className="info-row">
                  <span className="info-label">Sanidade raiz</span>
                  <span className="info-value">{kpisB.rootRating.label} ({kpisB.rootRating.score}/{kpisB.rootRating.max})</span>
                </div>
              )}
              {kpisB.profundidadeRaizCm != null && (
                <div className="info-row">
                  <span className="info-label">Profundidade raiz (cm)</span>
                  <span className="info-value">{formatNumber(kpisB.profundidadeRaizCm)}</span>
                </div>
              )}
              {kpisB.pesoRaizG != null && (
                <div className="info-row">
                  <span className="info-label">Peso raiz (g)</span>
                  <span className="info-value">{formatNumber(kpisB.pesoRaizG)}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Compactação solo</span>
                <span className="info-value">{compactionLabel[sideB.soilCompaction || ''] || sideB.soilCompaction || '—'}</span>
              </div>
            </div>
            {sideB.observations && sideB.observations.length > 0 && (
              <div className="observations-block">
                <strong>Observações</strong>
                <ul>
                  {sideB.observations.map((obs, i) => (
                    <li key={i}>{obs}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {ocorrencias.length > 0 && (
        <section className="section">
          <h2 className="section-title">Pragas, doenças e plantas daninhas</h2>
          <div className="table-wrap">
            <table className="table">
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

      {aplicacoes.length > 0 && (
        <section className="section">
          <h2 className="section-title">Aplicações realizadas</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Classe</th>
                  <th>Produtos</th>
                </tr>
              </thead>
              <tbody>
                {aplicacoes.map((a, i) => {
                  const idx = (a as any).index ?? (a as any).pontoIndex ?? (a as any).pointIndex ?? i + 1;
                  return (
                    <tr key={i} data-ponto-index={idx}>
                      <td>{formatDate(a.data)}</td>
                      <td>{a.tipo || '—'}</td>
                      <td>{(a as any).classe || '—'}</td>
                      <td>{a.produtos || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Fotos e evidências</h2>
        <div className="side-by-side-grid photos-grid-sbs">
          <div className="side-column">
            <div className="side-column-header lado-a">{sideA.name || 'Lado A'}</div>
            <div className="photos-in-column">
              {photosA.map((photo, i) => (
                <figure key={i} className="photo-figure">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.caption || 'Evidência'} className="photo-img" />
                  ) : (
                    <div className="photo-placeholder">Sem imagem</div>
                  )}
                  {photo.caption && <figcaption className="photo-caption">{photo.caption}</figcaption>}
                </figure>
              ))}
              {photosA.length === 0 && <p className="muted">Nenhuma foto</p>}
            </div>
          </div>
          <div className="side-column">
            <div className="side-column-header lado-b">{sideB.name || 'Lado B'}</div>
            <div className="photos-in-column">
              {photosB.map((photo, i) => (
                <figure key={i} className="photo-figure">
                  {photo.url ? (
                    <img src={photo.url} alt={photo.caption || 'Evidência'} className="photo-img" />
                  ) : (
                    <div className="photo-placeholder">Sem imagem</div>
                  )}
                  {photo.caption && <figcaption className="photo-caption">{photo.caption}</figcaption>}
                </figure>
              ))}
              {photosB.length === 0 && <p className="muted">Nenhuma foto</p>}
            </div>
          </div>
        </div>
      </section>

      {(hasColheita || hasCusto) && (
        <section className="section">
          <h2 className="section-title">Colheita e custo</h2>
          <div className="info-grid side-by-side-info">
            {hasColheita && (
              <div className="info-row full-width">
                <span className="info-label">Colheita</span>
                <span className="info-value">
                  {typeof data.colheita === 'object' && data.colheita !== null
                    ? JSON.stringify(data.colheita) : 'Não informado'}
                </span>
              </div>
            )}
            {hasCusto && (
              <div className="info-row full-width">
                <span className="info-label">Custo</span>
                <span className="info-value">
                  {typeof data.custo === 'object' && data.custo !== null
                    ? JSON.stringify(data.custo) : 'Não informado'}
                </span>
              </div>
            )}
          </div>
        </section>
      )}

      {!hasColheita && !hasCusto && (
        <section className="section">
          <h2 className="section-title">Colheita e custo</h2>
          <p className="muted">Não informado neste relatório.</p>
        </section>
      )}

      {resumo && (
        <section className="section">
          <h2 className="section-title">Resumo</h2>
          <div className="info-grid side-by-side-info">
            <div className="info-row">
              <span className="info-label">Status</span>
              <span className="info-value">{resumo.statusConcluida ? 'Concluída' : 'Em andamento'}</span>
            </div>
            {resumo.numOcorrencias != null && (
              <div className="info-row">
                <span className="info-label">Ocorrências</span>
                <span className="info-value">{resumo.numOcorrencias}</span>
              </div>
            )}
            {resumo.numAplicacoes != null && (
              <div className="info-row">
                <span className="info-label">Aplicações</span>
                <span className="info-value">{resumo.numAplicacoes}</span>
              </div>
            )}
            {resumo.conclusaoCurta && (
              <div className="info-row full-width">
                <span className="info-label">Conclusão curta</span>
                <span className="info-value">{resumo.conclusaoCurta}</span>
              </div>
            )}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Conclusão</h2>
        {conclusion.summary && (
          <p className="conclusao-text">{conclusion.summary}</p>
        )}
        {recommendations.length > 0 && (
          <div className="recommendations-block">
            <strong>Recomendações</strong>
            <ol>
              {recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ol>
          </div>
        )}
      </section>

      {conclusion.signature && (conclusion.signature.name || conclusion.signature.crea) && (
        <section className="section assinatura-section">
          <h2 className="section-title">Responsável técnico</h2>
          <div className="assinatura-box">
            <div className="assinatura-nome">{conclusion.signature.name}</div>
            {conclusion.signature.crea && <div className="assinatura-crea">CREA: {conclusion.signature.crea}</div>}
            {conclusion.signature.city && <div className="assinatura-cidade">{conclusion.signature.city}</div>}
          </div>
        </section>
      )}

      <footer className="footer">
        <div>Relatório gerado pelo FortSmart Agro</div>
        <div>{meta.reportId || reportId || '—'} • {meta.appVersion || ''}</div>
      </footer>
    </>
  );
}

function KpiRow({ label, value }: { label: string; value?: number | null }) {
  if (value == null) return null;
  const str = Number.isInteger(value) ? formatNumber(value) : formatNumber(value, { decimals: 1 });
  return (
    <div className="info-row">
      <span className="info-label">{label}</span>
      <span className="info-value">{str}</span>
    </div>
  );
}
