import React from 'react';
import Header, { ReportFooter } from './Header';
import Mapa from './Mapa';
import Galeria from './Galeria';
import TabelaDados, { InfoGrid, situacaoCssClass, situacaoLabel } from './TabelaDados';
import { formatDate, formatArea, formatNumber, formatPercent } from '@/utils/format';

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

  return (
    <>
      <Header
        meta={meta as { dataGeracao?: string; safra?: string; tecnico?: string; tecnicoCrea?: string; id?: string; appVersion?: string; versao?: number }}
        propriedade={prop as { fazenda?: string }}
        talhao={talhao as { nome?: string; cultura?: string }}
        reportId={reportId}
      />
      <h1 className="report-title">Relatório de Visita Técnica</h1>
      <p className="report-subtitle">
        {String(prop.fazenda || '')} • {String(talhao.nome || '')} • {String(talhao.cultura || '')} • Safra {String(meta.safra || '')}
      </p>

      <InfoGrid
        title="Identificação"
        items={[
          ['Fazenda', String(prop.fazenda ?? '—')],
          ['Talhão', String(talhao.nome ?? '—')],
          ['Cultura', String(talhao.cultura ?? '—')],
          ['Safra', String(meta.safra ?? '—')],
          ['Área', formatArea(talhao.area as number | string)],
          ['Município/UF', municipioUf || '—'],
          ['Proprietário', String(prop.proprietario ?? '—')],
          ['Técnico responsável', String(meta.tecnico ?? '—')],
          ['CREA', String(meta.tecnicoCrea ?? '—')],
          ['Data do relatório', formatDate(meta.dataGeracao as string)],
        ]}
      />

      {(contextoSafra.materialVariedade || contextoSafra.dae != null || contextoSafra.dap != null) && (
        <InfoGrid
          title="Contexto da safra"
          items={[
            ['Data de plantio', formatDate(talhao.dataPlantio as string)],
            ['Material / Variedade', String(contextoSafra.materialVariedade ?? '—')],
            ['Empresa', String(contextoSafra.empresa ?? '—')],
            ['Espaçamento (cm)', contextoSafra.espacamentoCm != null ? String(contextoSafra.espacamentoCm) : null],
            ['População alvo (pl/ha)', contextoSafra.populacaoAlvoPlHa != null ? formatNumber(contextoSafra.populacaoAlvoPlHa as number | string) : null],
            ['DAE', contextoSafra.dae != null ? `${contextoSafra.dae} dias` : null],
            ['DAP', contextoSafra.dap != null ? `${contextoSafra.dap} dias` : null],
            ['Fenologia atual', String(fenologia.estadio ?? '—')],
          ]}
        />
      )}

      {fenologia.estadio && (
        <InfoGrid
          title="Fenologia"
          items={[
            ['Estádio atual', String(fenologia.estadio)],
            ['Última avaliação', fenologia.ultimaAvaliacaoDias != null ? `há ${fenologia.ultimaAvaliacaoDias} dias` : formatDate(fenologia.dataUltimaAvaliacao as string)],
          ]}
        />
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

      {aplicacoes.length > 0 && (
        <TabelaDados
          title="Aplicações realizadas"
          headers={['Data', 'Tipo', 'Produto', 'Dose', 'Status']}
          rows={aplicacoes.map((a) => [
            formatDate(a.data as string),
            String(a.tipo ?? '—'),
            String(a.produto ?? '—'),
            a.dose != null && a.unidade ? `${a.dose} ${a.unidade}` : String(a.dose ?? '—'),
            String(a.status ?? '—'),
          ])}
        />
      )}

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

      <Mapa mapa={mapa as { viewBox?: string; path?: string; pontos?: Array<{ x: number; y: number; severidade?: string }> }} relatorioId={idForStorage} />

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
