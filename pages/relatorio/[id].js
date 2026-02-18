import Head from 'next/head';
import { getRelatorioById } from '../../lib/supabaseClient';
import {
  formatDate,
  formatArea,
  formatNumber,
  formatPercent,
  situacaoCssClass,
  situacaoLabel,
} from '../../lib/formatters';
import exemploRelatorio from '../../data/exemplo-relatorio.json';

export async function getServerSideProps(context) {
  const { id } = context.params;
  let relatorio = null;

  // Tentar Supabase primeiro
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    const row = await getRelatorioById(id);
    if (row?.json_data) relatorio = row.json_data;
  }

  // Fallback: exemplo local
  if (!relatorio && id === 'exemplo') {
    relatorio = exemploRelatorio;
  }

  if (!relatorio) {
    return { notFound: true };
  }

  return { props: { relatorio, reportId: id } };
}

function Section({ title, children, className = '' }) {
  return (
    <section className={`section ${className}`}>
      <h2 className="section-title">{title}</h2>
      {children}
    </section>
  );
}

function InfoGrid({ items }) {
  return (
    <div className="info-grid">
      {items.map(([label, value]) => (
        <div key={label} className="info-row">
          <span className="info-label">{label}</span>
          <span className="info-value">{value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
}

function Table({ headers, rows }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RelatorioPage({ relatorio, reportId }) {
  const meta = relatorio.meta || {};
  const prop = relatorio.propriedade || {};
  const talhao = relatorio.talhao || {};
  const contextoSafra = relatorio.contextoSafra || {};
  const fenologia = relatorio.fenologia || {};
  const populacao = relatorio.populacao || {};
  const aplicacoes = relatorio.aplicacoes || [];
  const pragas = relatorio.pragas || [];
  const condicoes = relatorio.condicoes || {};
  const mapa = relatorio.mapa || {};
  const imagens = relatorio.imagens || [];
  const diagnostico = relatorio.diagnostico || {};
  const planoAcao = relatorio.planoAcao || {};
  const assinaturaTecnica = relatorio.assinaturaTecnica || {};
  const conclusao = relatorio.conclusao || '';

  const municipioUf = [prop.municipio, prop.estado].filter(Boolean).join(' / ');

  return (
    <>
      <Head>
        <title>Relatório — {talhao.nome || reportId} | FortSmart</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="report no-print">
        <button type="button" className="btn btn-primary btn-print" onClick={() => window.print()}>
          Baixar PDF
        </button>
      </div>

      <article className="relatorio">
        {/* Cabeçalho */}
        <header className="header">
          <div className="brand">
            <span className="brand-title">FortSmart Agro</span>
          </div>
          <div className="header-meta">
            <div>{formatDate(meta.dataGeracao)}</div>
            <div>{prop.fazenda}</div>
            <div>{talhao.nome} — {meta.safra}</div>
          </div>
        </header>

        <h1 className="report-title">Relatório de Visita Técnica</h1>
        <p className="report-subtitle">
          {prop.fazenda} • {talhao.nome} • {talhao.cultura} • Safra {meta.safra}
        </p>

        {/* Identificação */}
        <Section title="Identificação">
          <InfoGrid
            items={[
              ['Fazenda', prop.fazenda],
              ['Talhão', talhao.nome],
              ['Cultura', talhao.cultura],
              ['Safra', meta.safra],
              ['Área', formatArea(talhao.area)],
              ['Município/UF', municipioUf],
              ['Proprietário', prop.proprietario],
              ['Técnico responsável', meta.tecnico],
              ['CREA', meta.tecnicoCrea],
              ['Data do relatório', formatDate(meta.dataGeracao)],
            ]}
          />
        </Section>

        {/* Contexto da safra */}
        {(contextoSafra.materialVariedade || contextoSafra.dae != null || contextoSafra.dap != null) && (
          <Section title="Contexto da safra">
            <InfoGrid
              items={[
                ['Data de plantio', formatDate(talhao.dataPlantio)],
                ['Material / Variedade', contextoSafra.materialVariedade],
                ['Empresa', contextoSafra.empresa],
                ['Espaçamento (cm)', contextoSafra.espacamentoCm != null ? String(contextoSafra.espacamentoCm) : null],
                ['População alvo (pl/ha)', contextoSafra.populacaoAlvoPlHa != null ? formatNumber(contextoSafra.populacaoAlvoPlHa) : null],
                ['DAE', contextoSafra.dae != null ? `${contextoSafra.dae} dias` : null],
                ['DAP', contextoSafra.dap != null ? `${contextoSafra.dap} dias` : null],
                ['Fenologia atual', fenologia.estadio],
              ]}
            />
          </Section>
        )}

        {/* Fenologia */}
        {fenologia.estadio && (
          <Section title="Fenologia">
            <InfoGrid
              items={[
                ['Estádio atual', fenologia.estadio],
                ['Última avaliação', fenologia.ultimaAvaliacaoDias != null ? `há ${fenologia.ultimaAvaliacaoDias} dias` : formatDate(fenologia.dataUltimaAvaliacao)],
              ]}
            />
          </Section>
        )}

        {/* População e estande */}
        {(populacao.plantasHa != null || populacao.eficienciaPct != null) && (
          <Section title="População e estande">
            <InfoGrid
              items={[
                ['Plantas/ha', populacao.plantasHa != null ? formatNumber(populacao.plantasHa) : null],
                ['Estande efetivo (pl/ha)', populacao.estandeEfetivoPlHa != null ? formatNumber(populacao.estandeEfetivoPlHa) : null],
                ['Eficiência', populacao.eficienciaPct != null ? formatPercent(populacao.eficienciaPct) : null],
                ['Plantas/m', populacao.plantasPorMetro != null ? String(populacao.plantasPorMetro) : null],
                ['Situação', populacao.situacao ? <span className={situacaoCssClass(populacao.situacao)}>{situacaoLabel(populacao.situacao)}</span> : null],
              ]}
            />
          </Section>
        )}

        {/* Aplicações */}
        {aplicacoes.length > 0 && (
          <Section title="Aplicações realizadas">
            <Table
              headers={['Data', 'Tipo', 'Produto', 'Dose', 'Status']}
              rows={aplicacoes.map((a) => [
                formatDate(a.data),
                a.tipo,
                a.produto,
                a.dose != null && a.unidade ? `${a.dose} ${a.unidade}` : a.dose,
                a.status ?? '—',
              ])}
            />
          </Section>
        )}

        {/* Pragas e doenças */}
        {pragas.length > 0 && (
          <Section title="Pragas e doenças">
            <Table
              headers={['Tipo', 'Alvo', 'Incidência', 'Severidade', 'Situação']}
              rows={pragas.map((p) => [
                p.tipo,
                p.alvo,
                p.incidencia ?? '—',
                p.severidade ?? '—',
                p.situacao ? <span key="s" className={situacaoCssClass(p.situacao)}>{situacaoLabel(p.situacao)}</span> : '—',
              ])}
            />
          </Section>
        )}

        {/* Condições do momento */}
        {(condicoes.temperatura != null || condicoes.umidade != null || condicoes.soloUmidade) && (
          <Section title="Condições do momento">
            <InfoGrid
              items={[
                ['Temperatura', condicoes.temperatura != null ? `${condicoes.temperatura} °C` : null],
                ['Umidade', condicoes.umidade != null ? `${condicoes.umidade}%` : null],
                ['Vento', condicoes.vento],
                ['Nebulosidade', condicoes.nebulosidade],
                ['Solo - umidade', condicoes.soloUmidade],
                ['Palhada', condicoes.palhada],
                ['Compactação', condicoes.compactacao],
                ['Vigor da cultura', condicoes.vigorCultura],
                ['Uniformidade', condicoes.uniformidade],
                ['Sintomas', condicoes.sintomas],
              ]}
            />
          </Section>
        )}

        {/* Mapa do talhão */}
        {(mapa.viewBox || mapa.path) && (
          <Section title="Mapa do talhão">
            <div className="mapa-wrap">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox={mapa.viewBox || '0 0 400 300'}
                className="mapa-svg"
                preserveAspectRatio="xMidYMid meet"
              >
                <rect width="100%" height="100%" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
                {mapa.path && (
                  <path d={mapa.path} fill="#e8f5e9" stroke="#2e7d32" strokeWidth="2" />
                )}
                {mapa.pontos?.map((p, i) => (
                  <circle
                    key={i}
                    cx={p.x}
                    cy={p.y}
                    r="6"
                    fill={p.severidade === 'media' ? '#facc15' : p.severidade === 'alta' ? '#ef6c00' : '#2e7d32'}
                    stroke="#fff"
                    strokeWidth="1.5"
                  />
                ))}
              </svg>
            </div>
          </Section>
        )}

        {/* Galeria de imagens */}
        {imagens.length > 0 && (
          <Section title="Registros fotográficos">
            <div className="grid photos-grid">
              {imagens.map((img, i) => (
                <div key={i} className="card photo-card">
                  <img src={img.url} alt={img.descricao || 'Foto'} className="photo-img" />
                  <div className="photo-caption">{img.descricao}</div>
                  {img.data && <div className="photo-meta">{formatDate(img.data)}</div>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Diagnóstico */}
        {(diagnostico.problemaPrincipal || diagnostico.causaProvavel) && (
          <Section title="Diagnóstico técnico">
            <InfoGrid
              items={[
                ['Problema principal', diagnostico.problemaPrincipal],
                ['Causa provável', diagnostico.causaProvavel],
                ['Nível de risco', diagnostico.nivelRisco],
                ['Urgência', diagnostico.urgenciaAcao],
              ]}
            />
          </Section>
        )}

        {/* Plano de ação */}
        {(planoAcao.objetivoManejo || (planoAcao.acoes && planoAcao.acoes.length > 0)) && (
          <Section title="Plano de ação">
            {planoAcao.objetivoManejo && (
              <p className="plano-objetivo"><strong>Objetivo:</strong> {planoAcao.objetivoManejo}</p>
            )}
            {planoAcao.acoes?.length > 0 && (
              <Table
                headers={['Prioridade', 'Ação', 'Prazo']}
                rows={planoAcao.acoes.map((a) => [a.prioridade, a.acao, a.prazo ?? '—'])}
              />
            )}
          </Section>
        )}

        {/* Conclusão */}
        <Section title="Conclusão">
          <div className="conclusao-text">{conclusao || '—'}</div>
        </Section>

        {/* Assinatura técnica */}
        {(assinaturaTecnica.nome || assinaturaTecnica.crea) && (
          <Section title="Assinatura do responsável técnico" className="assinatura-section">
            <div className="assinatura-box">
              <div className="assinatura-nome">{assinaturaTecnica.nome}</div>
              {assinaturaTecnica.crea && <div className="assinatura-crea">CREA: {assinaturaTecnica.crea}</div>}
              {assinaturaTecnica.dataAssinatura && <div className="assinatura-data">{formatDate(assinaturaTecnica.dataAssinatura)}</div>}
              {assinaturaTecnica.cidade && <div className="assinatura-cidade">{assinaturaTecnica.cidade}</div>}
            </div>
          </Section>
        )}

        <footer className="footer">
          <div>Relatório gerado pelo FortSmart Agro</div>
          <div>ID: {meta.id || reportId} • {meta.appVersion}{meta.versao != null ? ` • Versão ${meta.versao}` : ''}</div>
        </footer>
      </article>
    </>
  );
}

