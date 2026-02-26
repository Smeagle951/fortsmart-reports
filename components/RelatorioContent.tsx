import React from 'react';
import Header, { ReportFooter } from './Header';
import MapaTalhao from './MapaTalhaoDynamic';
import HeaderRelatorio from './HeaderRelatorio';
import Mapa from './Mapa';
import Galeria from './Galeria';
import TabelaDados, { InfoGrid, situacaoCssClass, situacaoLabel } from './TabelaDados';
import TabelaAplicacoes from './TabelaAplicacoes';
import { formatDate, formatArea, formatNumber, formatPercent } from '@/utils/format';
import ReportPageSaaS, { type ReportPageSaaSData } from './saas/ReportPageSaaS';

export type RelatorioJson = {
  meta?: Record<string, unknown>;
  propriedade?: Record<string, unknown>;
  talhao?: Record<string, unknown>;
  contextoSafra?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  populacao?: Record<string, unknown>;
  aplicacoes?: Array<Record<string, unknown>>;
  pragas?: Array<Record<string, unknown>>;
  condicoes?: Record<string, unknown>;
  mapa?: Record<string, unknown> & { viewBox?: string; path?: string; pontos?: Array<{ x: number; y: number; severidade?: string }> };
  imagens?: Array<{ url?: string; path?: string; descricao?: string; data?: string }>;
  diagnostico?: Record<string, unknown>;
  planoAcao?: Record<string, unknown> & { acoes?: Array<{ prioridade?: number; acao?: string; prazo?: string }> };
  assinaturaTecnica?: Record<string, unknown>;
  conclusao?: string;
};

interface RelatorioContentProps {
  relatorio: RelatorioJson;
  reportId?: string;
  relatorioUuid?: string;
}

export default function RelatorioContent({ relatorio, reportId, relatorioUuid }: RelatorioContentProps) {
  const meta = relatorio.meta || {};
  const prop = relatorio.propriedade || {};
  const talhao = relatorio.talhao || {};
  const contextoSafra = relatorio.contextoSafra || {};
  const fenologia = relatorio.fenologia || {};
  const populacao = relatorio.populacao || {};
  const aplicacoes = (relatorio.aplicacoes || []) as Array<Record<string, unknown>>;
  const pragas = (relatorio.pragas || []) as Array<Record<string, unknown>>;
  const condicoes = relatorio.condicoes || {};
  const mapa = relatorio.mapa || {};
  const imagens = relatorio.imagens || [];
  const diagnostico = relatorio.diagnostico || {};
  const planoAcao = relatorio.planoAcao || {};
  const assinaturaTecnica = relatorio.assinaturaTecnica || {};
  const conclusao = relatorio.conclusao || '';
  const idForStorage = relatorioUuid || reportId || '';

  const municipioUf = [prop.municipio, prop.estado].filter(Boolean).join(' / ');

  // Se for relatório de visita técnica, renderizar versão SaaS premium (cards, tabela, aplicações, galeria).
  // Detecção: tipo === 'visita_tecnica' OU payload com meta/propriedade/talhao OU blocos típicos (aplicacoes, pragas, fenologia, imagens).
  const tipo = (relatorio as any).tipo ?? (relatorio as any).tipoRelatorio;
  const tipoStr = tipo != null ? String(tipo).toLowerCase() : '';
  const hasVisitaKeys =
    'meta' in relatorio && 'propriedade' in relatorio && 'talhao' in relatorio &&
    typeof (relatorio as any).meta === 'object' && (relatorio as any).meta != null &&
    typeof (relatorio as any).propriedade === 'object' && (relatorio as any).propriedade != null &&
    typeof (relatorio as any).talhao === 'object' && (relatorio as any).talhao != null;
  const hasVisitaBlocks = Boolean(
    (Array.isArray((relatorio as any).aplicacoes) || Array.isArray((relatorio as any).pragas)) &&
    (typeof (relatorio as any).fenologia === 'object' || Array.isArray((relatorio as any).imagens))
  );
  const isVisitaTecnica =
    tipoStr === 'visita_tecnica' ||
    (tipoStr !== 'plantio' && tipoStr !== 'avaliacao_lado_a_lado' && tipoStr !== 'monitoramento' && (hasVisitaKeys || hasVisitaBlocks));
  if (isVisitaTecnica) {
    const ctxDae = (contextoSafra as any)?.dae;
    const saasData: ReportPageSaaSData = {
      meta: {
        dataGeracao: String(meta.dataGeracao ?? ''),
        tecnico: String(meta.tecnico ?? ''),
        tecnicoCrea: (meta as any).tecnicoCrea != null ? String((meta as any).tecnicoCrea) : undefined,
        id: (meta as any).id != null ? String((meta as any).id) : undefined,
        versao: (meta as any).versao != null ? Number((meta as any).versao) : undefined,
        status: String((meta as any).status ?? 'Final'),
        safra: (meta as any).safra != null ? String((meta as any).safra) : undefined,
      },
      propriedade: { fazenda: String(prop.fazenda ?? ''), proprietario: String(prop.proprietario ?? ''), municipio: (prop as any).municipio != null ? String((prop as any).municipio) : undefined, estado: (prop as any).estado != null ? String((prop as any).estado) : undefined },
      talhao: { nome: String(talhao.nome ?? ''), cultura: String(talhao.cultura ?? '') },
      contextoSafra: { dae: ctxDae != null ? Number(ctxDae) : undefined, materialVariedade: (contextoSafra as any)?.materialVariedade != null ? String((contextoSafra as any).materialVariedade) : undefined, empresa: (contextoSafra as any)?.empresa != null ? String((contextoSafra as any).empresa) : undefined },
      fenologia: { estadio: (fenologia as any)?.estadio ?? undefined },
      populacao: (populacao && (populacao as any).plantasPorMetro != null) ? { plantasPorMetro: Number((populacao as any).plantasPorMetro) } : undefined,
      estande: (relatorio as any).estande ?? undefined,
      fitossanidade: (relatorio as any).fitossanidade ? { ipe: Number(((relatorio as any).fitossanidade as any).ipe ?? 0), ipeStatus: ((relatorio as any).fitossanidade as any).ipeStatus ?? undefined } : undefined,
      diagnosticoIntegrado: { spt: Number((diagnostico as any).spt ?? (relatorio as any).indiceAgronomicoTalhao?.valor ?? undefined) },
      indiceAgronomicoTalhao: (relatorio as any).indiceAgronomicoTalhao ?? undefined,
      aplicacoes: aplicacoes.map((a: any) => ({
        tipo: a.tipo ?? a.classe ?? '',
        data: a.data ?? '',
        produto: a.produto ?? a.produtoNome ?? '',
        dose: a.dose ?? '',
        unidade: a.unidade ?? '',
        classe: a.classe ?? '',
        alvo: a.alvo ?? '',
        talhao: a.talhao ?? '',
        responsavel: a.responsavel ?? '',
      })),
      imagens: (imagens as any[]).map((im: any) => ({ url: im.url ?? im.path ?? '', descricao: im.descricao ?? im.caption ?? '', data: im.data ?? undefined, categoria: im.categoria ?? undefined })),
    };

    return <ReportPageSaaS data={saasData} reportId={reportId} relatorioUuid={relatorioUuid} />;
  }

  return (
    <>
      <header aria-label="Cabeçalho do relatório">
        <HeaderRelatorio
          meta={meta as { dataGeracao?: string; safra?: string; tecnico?: string; tecnicoCrea?: string; id?: string; appVersion?: string; versao?: number }}
          propriedade={prop as { fazenda?: string; proprietario?: string; municipio?: string; estado?: string }}
          talhao={talhao as { nome?: string; cultura?: string; area?: number; dataPlantio?: string }}
          contextoSafra={contextoSafra as { materialVariedade?: string; empresa?: string }}
          reportId={reportId}
        />
      </header>

      <div className="report-intro">
        <h1 className="report-title">Relatório de Visita Técnica</h1>
        <p className="report-subtitle">
          {String(prop.fazenda || '')} • {String(talhao.nome || '')} • {String(talhao.cultura || '')} • Safra {String(meta.safra || '')}
        </p>
      </div>

      {(contextoSafra.materialVariedade || contextoSafra.dae != null || contextoSafra.dap != null || contextoSafra.espacamentoCm != null) && (
        <section className="section contextoSafra-section">
          <h2 className="section-title">Contexto da safra</h2>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                <tr>
                  <th>Material / Variedade</th>
                  <td>{String(contextoSafra.materialVariedade ?? '—')}</td>
                  <th>Empresa</th>
                  <td>{String(contextoSafra.empresa ?? '—')}</td>
                </tr>
                <tr>
                  <th>Espaçamento</th>
                  <td>{contextoSafra.espacamentoCm != null ? `${contextoSafra.espacamentoCm} cm` : '—'}</td>
                  <th>População alvo</th>
                  <td>{contextoSafra.populacaoAlvoPlHa != null ? formatNumber(contextoSafra.populacaoAlvoPlHa as number | string) + ' pl/ha' : '—'}</td>
                </tr>
                <tr>
                  <th>DAE</th>
                  <td>{contextoSafra.dae != null ? `${contextoSafra.dae} dias` : '—'}</td>
                  <th>DAP</th>
                  <td>{contextoSafra.dap != null ? `${contextoSafra.dap} dias` : '—'}</td>
                </tr>
                <tr>
                  <th>Data de plantio</th>
                  <td colSpan={3}>{formatDate(talhao.dataPlantio as string) || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {(fenologia.estadio || (fenologia.historico as any[])?.length > 0) && (
        <section className="section" id="section-fenologia" aria-labelledby="section-fenologia-title">
          <h2 id="section-fenologia-title" className="section-title">Fenologia</h2>
          <div className="fenologia-content">
            <div className="table-wrap">
              <table className="table fenologia-table">
                <tbody>
                  <tr>
                    <th>Estádio atual</th>
                    <td><strong>{String(fenologia.estadio ?? '—')}</strong></td>
                    <th>Última avaliação</th>
                    <td>{fenologia.ultimaAvaliacaoDias != null ? `há ${fenologia.ultimaAvaliacaoDias} dias` : formatDate(fenologia.dataUltimaAvaliacao as string) || '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            {(fenologia.historico as any[])?.length > 0 && (
              <div className="fenologia-historico" style={{ marginTop: 20 }}>
                <h3 className="fenologia-historico-title">Histórico</h3>
                <table className="table fenologia-table">
                  <thead>
                    <tr>
                      <th>Estágio</th>
                      <th>Data</th>
                      <th>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fenologia.historico as any[]).map((h: any, i: number) => (
                      <tr key={i}>
                        <td><strong>{h.estagio ?? '—'}</strong></td>
                        <td>{h.data ?? '—'}</td>
                        <td>{h.observacoes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {(populacao.plantasHa != null || populacao.eficienciaPct != null) && (
        <InfoGrid
          title="População e estande"
          items={[
            ['Plantas/ha', populacao.plantasHa != null ? formatNumber(populacao.plantasHa as number | string) : null],
            ['Estande efetivo (pl/ha)', populacao.estandeEfetivoPlHa != null ? formatNumber(populacao.estandeEfetivoPlHa as number | string) : null],
            ['Eficiência', populacao.eficienciaPct != null ? formatPercent(populacao.eficienciaPct as number | string) : null],
            ['Plantas/m', populacao.plantasPorMetro != null ? String(populacao.plantasPorMetro) : null],
            ['Situação', populacao.situacao ? <span key="s" className={situacaoCssClass(String(populacao.situacao))}>{situacaoLabel(String(populacao.situacao))}</span> : null],
          ]}
        />
      )}

      {aplicacoes.length > 0 && <TabelaAplicacoes rows={aplicacoes as any} />}

      {pragas.length > 0 && (
        <TabelaDados
          title="Pragas e doenças"
          headers={['Tipo', 'Alvo', 'Incidência', 'Severidade', 'Situação']}
          rows={pragas.map((p) => [
            String(p.tipo ?? '—'),
            String(p.alvo ?? '—'),
            String(p.incidencia ?? '—'),
            String(p.severidade ?? '—'),
            p.situacao ? <span key="s" className={situacaoCssClass(String(p.situacao))}>{situacaoLabel(String(p.situacao))}</span> : '—',
          ])}
        />
      )}

      {(condicoes.temperatura != null || condicoes.umidade != null || condicoes.soloUmidade) && (
        <InfoGrid
          title="Condições do momento"
          items={[
            ['Temperatura', condicoes.temperatura != null ? `${condicoes.temperatura} °C` : null],
            ['Umidade', condicoes.umidade != null ? `${condicoes.umidade}%` : null],
            ['Vento', String(condicoes.vento ?? '—')],
            ['Nebulosidade', String(condicoes.nebulosidade ?? '—')],
            ['Solo - umidade', String(condicoes.soloUmidade ?? '—')],
            ['Palhada', String(condicoes.palhada ?? '—')],
            ['Compactação', String(condicoes.compactacao ?? '—')],
          ]}
        />
      )}

      <MapaTalhao
        polygon={(mapa as any)?.polygon}
        pontos={(mapa as any)?.pontos?.map((p: any) => ({
          id: p.id ?? p.index,
          latitude: p.lat ?? p.latitude ?? (typeof p.y === 'number' && Math.abs(p.y) <= 90 ? p.y : undefined) ?? 0,
          longitude: p.lng ?? p.longitude ?? (typeof p.x === 'number' && Math.abs(p.x) <= 180 ? p.x : undefined) ?? 0,
          titulo: p.titulo ?? p.label ?? (p.tipo ? `${p.tipo}` : undefined),
          descricao: p.descricao ?? p.obs ?? undefined,
          estagio: p.severidade ?? p.estagio ?? undefined,
          data: p.data ?? undefined,
        })).filter((p: any) => p.latitude !== 0 || p.longitude !== 0) || []}
      />

      <Galeria imagens={imagens} relatorioId={idForStorage} />

      {(diagnostico.problemaPrincipal || diagnostico.causaProvavel) && (
        <InfoGrid
          title="Diagnóstico técnico"
          items={[
            ['Problema principal', String(diagnostico.problemaPrincipal ?? '—')],
            ['Causa provável', String(diagnostico.causaProvavel ?? '—')],
            ['Nível de risco', String(diagnostico.nivelRisco ?? '—')],
            ['Urgência', String(diagnostico.urgenciaAcao ?? '—')],
          ]}
        />
      )}

      {(planoAcao.objetivoManejo || (planoAcao.acoes && planoAcao.acoes.length > 0)) && (
        <section className="section">
          <h2 className="section-title">Plano de ação</h2>
          {!!planoAcao.objetivoManejo && (
            <p className="plano-objetivo"><strong>Objetivo:</strong> {String(planoAcao.objetivoManejo)}</p>
          )}
          {(planoAcao.acoes ?? []).length > 0 && (
            <TabelaDados
              title=""
              headers={['Prioridade', 'Ação', 'Prazo']}
              rows={(planoAcao.acoes ?? []).map((a) => [a.prioridade ?? '—', a.acao ?? '—', a.prazo ?? '—'])}
            />
          )}
        </section>
      )}

      <section className="section">
        <h2 className="section-title">Conclusão</h2>
        <div className="conclusao-text">{conclusao || '—'}</div>
      </section>

      {(assinaturaTecnica.nome || assinaturaTecnica.crea) && (
        <section className="section assinatura-section">
          <h2 className="section-title">Assinatura do responsável técnico</h2>
          <div className="assinatura-box">
            <div className="assinatura-nome">{String(assinaturaTecnica.nome)}</div>
            {!!assinaturaTecnica.crea && <div className="assinatura-crea">CREA: {String(assinaturaTecnica.crea)}</div>}
            {!!assinaturaTecnica.dataAssinatura && <div className="assinatura-data">{formatDate(assinaturaTecnica.dataAssinatura as string)}</div>}
            {!!assinaturaTecnica.cidade && <div className="assinatura-cidade">{String(assinaturaTecnica.cidade)}</div>}
          </div>
        </section>
      )}

      <ReportFooter meta={meta as { id?: string; appVersion?: string; versao?: number }} reportId={reportId} />
    </>
  );
}
