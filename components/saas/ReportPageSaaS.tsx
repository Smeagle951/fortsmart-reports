'use client';

import { useCallback } from 'react';
import HeaderInstitucionalVisitaTecnica from '@/components/visita/HeaderInstitucionalVisitaTecnica';
import HeaderSection, { type StatusGeral } from './HeaderSection';
import KpiCardsSection from './KpiCardsSection';
import EvaluationTable, { type AvaliacaoRow } from './EvaluationTable';
import StatisticsSection, { type EstatisticaItem } from './StatisticsSection';
import ApplicationsTable, { type AplicacaoRow } from './ApplicationsTable';
import ImageGallerySaaS, { type ImagemItem } from './ImageGallerySaaS';
import ComparisonSection, { type ComparativoItem } from './ComparisonSection';

export interface ReportPageSaaSData {
  meta?: { dataGeracao?: string; tecnico?: string; tecnicoCrea?: string; id?: string; versao?: number; status?: string; safra?: string };
  propriedade?: { fazenda?: string; proprietario?: string; municipio?: string; estado?: string };
  talhao?: { nome?: string; cultura?: string };
  contextoSafra?: {
    dae?: number;
    dap?: number;
    materialVariedade?: string;
    empresa?: string;
    espacamentoCm?: number;
    populacaoAlvoPlHa?: number;
  };
  fenologia?: { estadio?: string };
  plantabilidade?: {
    cvPercentual?: number;
    espacamentoRealCm?: number;
    espacamentoIdealCm?: number;
    duplasPct?: number;
    triplasPct?: number;
    falhasPct?: number;
    okPct?: number;
    indicePlantabilidade?: number;
    linha?: Array<{ tipo: string }>;
  };
  estande?: {
    registros?: Array<{ data: string; plantasPorMetro?: number; perdaTotalPct?: number }>;
    perdaTotalPct?: number;
  };
  fitossanidade?: { ipe?: number; ipeStatus?: string };
  diagnosticoIntegrado?: { spt?: number };
  indiceAgronomicoTalhao?: { valor?: number; status?: string };
  populacao?: { plantasPorMetro?: number; eficienciaPct?: number };
  aplicacoes?: Array<{
    tipo?: string;
    classe?: string;
    data?: string;
    produto?: string;
    dose?: string;
    unidade?: string;
    alvo?: string;
    talhao?: string;
    responsavel?: string;
  }>;
  imagens?: Array<{ url?: string; descricao?: string; data?: string; categoria?: string }>;
  avaliacoes?: AvaliacaoRow[];
  pragas?: Array<{ tipo?: string; nome?: string; alvo?: string; incidencia?: string; severidade?: string; situacao?: string; observacoes?: string }>;
  desvios?: Array<{ tipo?: string; descricao?: string; data?: string; severidade?: string; local?: string; acaoRecomendada?: string }>;
  diagnostico?: { problemaPrincipal?: string; causaProvavel?: string; nivelRisco?: string; urgenciaAcao?: string; recomendacoes?: string[] };
  planoAcao?: { objetivoManejo?: string; acoes?: Array<{ prioridade?: string; acao?: string; prazo?: string }> };
  conclusao?: string;
}

interface ReportPageSaaSProps {
  data: ReportPageSaaSData;
  reportId?: string;
  relatorioUuid?: string;
  /** Quando true, não exibe o header (evita duplicação em abas) */
  embedded?: boolean;
}

function buildAvaliacoesFromData(d: ReportPageSaaSData): AvaliacaoRow[] {
  if (d.avaliacoes?.length) return d.avaliacoes;

  const plant = d.plantabilidade;
  const est = d.estande;
  const fit = d.fitossanidade;
  const pop = d.populacao;
  const meta = d.meta?.dataGeracao || '';

  const cv = plant?.cvPercentual ?? null;
  const estandePlm = pop?.plantasPorMetro ?? est?.registros?.[0]?.plantasPorMetro ?? null;
  const perda = est?.perdaTotalPct ?? null;
  const iat = d.indiceAgronomicoTalhao?.valor ?? d.diagnosticoIntegrado?.spt ?? null;

  let classificacao = 'Moderado';
  if (cv != null) {
    if (cv <= 10) classificacao = 'Excelente';
    else if (cv <= 15) classificacao = 'Bom';
    else if (cv <= 25) classificacao = 'Moderado';
    else classificacao = cv <= 35 ? 'Atenção' : 'Crítico';
  }

  const status = classificacao === 'Excelente' || classificacao === 'Bom' ? 'OK' : classificacao === 'Atenção' || classificacao === 'Crítico' ? 'Crítico' : 'Atenção';

  const row: AvaliacaoRow = {
    id: '1',
    data: meta || '—',
    dae: d.contextoSafra?.dae ?? null,
    cvPercent: cv,
    classificacao,
    estandePlm,
    fenologia: d.fenologia?.estadio || '—',
    perdaPct: perda,
    iat,
    status,
    drillDown: {
      plantabilidade: plant
        ? {
          'Comprimento Amostrado': '5.0 m',
          'Espaçamento Médio': `${plant.espacamentoRealCm ?? '—'} cm`,
          'CV%': `${plant.cvPercentual ?? '—'}%`,
          Falhas: `${plant.falhasPct ?? 0}%`,
          Duplas: plant.duplasPct ?? 0,
          Triplas: plant.triplasPct ?? 0,
        }
        : undefined,
      estande: pop || est
        ? {
          'População Desejada': '62.000 pl/ha',
          'População Real': `${pop?.plantasPorMetro ? Math.round(pop.plantasPorMetro * 10000) : '—'}`,
          'Perda Total': `${est?.perdaTotalPct ?? 0}%`,
          'Impacto Produtividade': classificacao === 'Excelente' || classificacao === 'Bom' ? 'Baixo' : 'Moderado',
        }
        : undefined,
      fitossanidade: fit
        ? {
          IPE: fit.ipe ?? 0,
          Organismos: 'Nenhum',
          Status: fit.ipeStatus ?? 'Monitorar',
        }
        : undefined,
    },
  };

  return [row];
}

function buildEstatisticas(d: ReportPageSaaSData): EstatisticaItem[] {
  const plant = d.plantabilidade;
  if (!plant) return [];

  const n = plant.linha?.length ?? 14;
  const media = plant.espacamentoRealCm ?? 0;
  const cv = plant.cvPercentual ?? 0;
  const dp = (media * (cv / 100)).toFixed(1);
  const ic = (1.96 * parseFloat(dp) / Math.sqrt(n)).toFixed(2);

  return [
    { metrica: 'Média Espaçamento', valor: `${media} cm` },
    { metrica: 'Desvio Padrão', valor: `${dp} cm` },
    { metrica: 'Coeficiente de Variação', valor: `${cv}%` },
    { metrica: 'IC 95%', valor: `${media} ± ${ic}` },
    { metrica: 'n (amostras)', valor: n },
  ];
}

function buildAplicacoes(d: ReportPageSaaSData): AplicacaoRow[] {
  const apps = d.aplicacoes ?? [];
  return apps.map((a, i) => ({
    id: `app-${i}`,
    data: a.data ?? '—',
    produto: a.produto ?? '—',
    classe: a.classe ?? a.tipo ?? '—',
    dose: a.dose ? `${a.dose} ${a.unidade ?? ''}`.trim() : '—',
    alvo: a.alvo ?? '—',
    talhao: a.talhao,
    responsavel: a.responsavel,
  }));
}

function buildImagens(d: ReportPageSaaSData): ImagemItem[] {
  const imgs = d.imagens ?? [];
  return imgs.map((img, i) => ({
    id: `img-${i}`,
    url: img.url ?? '',
    data: img.data,
    legenda: img.descricao,
  }));
}

function buildComparativo(d: ReportPageSaaSData): ComparativoItem[] {
  const plant = d.plantabilidade;
  const est = d.estande;
  const regs = est?.registros ?? [];

  if (regs.length < 2) return [];

  const r1 = regs[0];
  const r2 = regs[regs.length - 1];
  const cv1 = plant?.cvPercentual ?? 0;
  const cv2 = 12;
  const e1 = r1.plantasPorMetro ?? 0;
  const e2 = r2.plantasPorMetro ?? 0;
  const iat1 = d.indiceAgronomicoTalhao?.valor ?? 100;
  const iat2 = 92;

  return [
    { metrica: 'CV%', avaliacao1: `${cv1}%`, avaliacao2: `${cv2}%`, variacao: `${(cv1 - cv2).toFixed(1)}%` },
    { metrica: 'Estande', avaliacao1: e1.toFixed(1), avaliacao2: e2.toFixed(1), variacao: `+${(e1 - e2).toFixed(1)}` },
    { metrica: 'IAT', avaliacao1: iat1, avaliacao2: iat2, variacao: `+${iat1 - iat2}` },
  ];
}

export default function ReportPageSaaS({ data, reportId, relatorioUuid, embedded }: ReportPageSaaSProps) {
  const meta = data.meta ?? {};
  const prop = data.propriedade ?? {};
  const talhao = data.talhao ?? {};

  const statusGeral: StatusGeral =
    (data.indiceAgronomicoTalhao?.status as StatusGeral) ?? 'Saudável';

  const kpiCards = [
    {
      id: 'spt',
      indicador: 'SPT',
      valor: data.diagnosticoIntegrado?.spt ?? data.indiceAgronomicoTalhao?.valor ?? 100,
      classificacao: 'Excelente' as const,
      tendencia: 'up' as const,
      tooltip: 'Índice de Saúde da Planta',
      historico: data.estande?.registros?.map((r) => ({
        data: r.data ?? '',
        valor: r.plantasPorMetro ?? '—',
      })) ?? [],
    },
    {
      id: 'cv',
      indicador: 'CV%',
      valor: data.plantabilidade?.cvPercentual != null ? `${data.plantabilidade.cvPercentual}%` : '—',
      classificacao: ((data.plantabilidade?.cvPercentual ?? 0) <= 10 ? 'Excelente' : (data.plantabilidade?.cvPercentual ?? 0) <= 15 ? 'Bom' : 'Moderado') as 'Excelente' | 'Bom' | 'Moderado',
      tendencia: 'neutral' as const,
      tooltip: 'Coeficiente de Variação do espaçamento',
      historico: [],
    },
    {
      id: 'estande',
      indicador: 'Estande',
      valor: data.populacao?.plantasPorMetro ?? data.estande?.registros?.[0]?.plantasPorMetro ?? '—',
      classificacao: ((data.populacao?.eficienciaPct ?? 0) >= 95 ? 'Excelente' : 'Bom') as 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico',
      tendencia: 'neutral' as const,
      tooltip: 'Plantas por metro',
      historico: data.estande?.registros?.map((r) => ({
        data: r.data ?? '',
        valor: r.plantasPorMetro ?? '—',
      })) ?? [],
    },
    {
      id: 'ipe',
      indicador: 'IPE',
      valor: data.fitossanidade?.ipe ?? 0,
      classificacao: ((data.fitossanidade?.ipe ?? 0) <= 0.5 ? 'Excelente' : 'Moderado') as 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico',
      tendencia: 'down' as const,
      tooltip: 'Índice de Pressão de Entomofauna',
      historico: [],
    },
  ];

  const avaliacoes = buildAvaliacoesFromData(data);
  const estatisticas = buildEstatisticas(data);
  const aplicacoes = buildAplicacoes(data);
  const imagens = buildImagens(data);
  const comparativo = buildComparativo(data);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  const handleExportExcel = useCallback(() => {
    const csv = [
      ['Data', 'DAE', 'CV%', 'Classificação', 'Estande (pl/m)', 'Fenologia', 'Perda %', 'IAT', 'Status'].join(','),
      ...avaliacoes.map((r) =>
        [r.data, r.dae ?? '', r.cvPercent ?? '', r.classificacao, r.estandePlm ?? '', r.fenologia, r.perdaPct ?? '', r.iat ?? '', r.status].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${talhao.nome ?? 'talhao'}-${meta.dataGeracao ?? ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [avaliacoes, talhao.nome, meta.dataGeracao]);

  const handleExportCsv = useCallback(() => {
    handleExportExcel();
  }, [handleExportExcel]);

  return (
    <div className={`min-h-screen bg-[#F8FAFC] ${embedded ? 'rounded-xl border border-slate-200' : ''}`}>
      {!embedded && (
        <>
          <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
            <HeaderInstitucionalVisitaTecnica
              meta={{ dataGeracao: meta.dataGeracao, tecnico: meta.tecnico, tecnicoCrea: meta.tecnicoCrea, id: meta.id, versao: meta.versao, status: meta.status, safra: meta.safra }}
              propriedade={{ fazenda: prop.fazenda, proprietario: prop.proprietario, municipio: prop.municipio, estado: prop.estado }}
              talhao={talhao}
              contextoSafra={{ materialVariedade: data.contextoSafra?.materialVariedade, empresa: data.contextoSafra?.empresa }}
              reportId={reportId}
            />
          </div>
          <HeaderSection
            cliente={prop.proprietario}
            fazenda={prop.fazenda}
            talhao={talhao.nome}
            cultura={talhao.cultura}
            dataAvaliacao={meta.dataGeracao}
            responsavel={meta.tecnico}
            status={statusGeral}
            onExportPdf={handleExportPdf}
            onCompartilhar={() => {}}
          />
        </>
      )}

      <main className={`mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 ${embedded ? 'pt-4' : ''}`}>
        <KpiCardsSection cards={kpiCards} />
        <EvaluationTable rows={avaliacoes} onExportCsv={handleExportCsv} />
        {estatisticas.length > 0 && <StatisticsSection items={estatisticas} />}
        {aplicacoes.length > 0 && (
          <ApplicationsTable rows={aplicacoes} mostrarApenasNomeProduto />
        )}
        {imagens.length > 0 && (
          <ImageGallerySaaS imagens={imagens} marcaDagua="FortSmart" />
        )}
        {comparativo.length > 0 && (
          <ComparisonSection
            items={comparativo}
            labelAvaliacao1={data.estande?.registros?.[0]?.data}
            labelAvaliacao2={data.estande?.registros?.[data.estande.registros.length - 1]?.data}
          />
        )}

        {/* Contexto da safra */}
        {(data.contextoSafra?.materialVariedade != null || data.contextoSafra?.dae != null || data.contextoSafra?.espacamentoCm != null || data.contextoSafra?.populacaoAlvoPlHa != null) && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Contexto da safra</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                  {data.contextoSafra?.materialVariedade != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Material / Variedade</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.materialVariedade}</p></div>
                  )}
                  {data.contextoSafra?.empresa != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Empresa</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.empresa}</p></div>
                  )}
                  {data.contextoSafra?.espacamentoCm != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Espaçamento</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.espacamentoCm} cm</p></div>
                  )}
                  {data.contextoSafra?.populacaoAlvoPlHa != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">População alvo</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.populacaoAlvoPlHa.toLocaleString('pt-BR')} pl/ha</p></div>
                  )}
                  {data.contextoSafra?.dae != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">DAE</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.dae} dias</p></div>
                  )}
                  {data.contextoSafra?.dap != null && (
                    <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">DAP</p><p className="font-medium text-slate-800 mt-0.5">{data.contextoSafra.dap} dias</p></div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Pragas e doenças */}
        {data.pragas != null && data.pragas.length > 0 && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Pragas e doenças observadas</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="saas-table w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="saas-th">Tipo</th>
                      <th className="saas-th">Alvo / Nome</th>
                      <th className="saas-th">Incidência</th>
                      <th className="saas-th">Severidade</th>
                      <th className="saas-th">Situação</th>
                      <th className="saas-th">Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pragas.map((p, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="saas-td">{p.tipo ?? '—'}</td>
                        <td className="saas-td font-medium">{p.nome ?? p.alvo ?? '—'}</td>
                        <td className="saas-td">{p.incidencia ?? '—'}</td>
                        <td className="saas-td">{p.severidade ?? '—'}</td>
                        <td className="saas-td">{p.situacao ?? '—'}</td>
                        <td className="saas-td text-slate-600 max-w-[200px]">{p.observacoes ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Desvios */}
        {data.desvios != null && data.desvios.length > 0 && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Desvios registrados</h2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="saas-table w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="saas-th">Data</th>
                      <th className="saas-th">Tipo</th>
                      <th className="saas-th">Descrição</th>
                      <th className="saas-th">Severidade</th>
                      <th className="saas-th">Local</th>
                      <th className="saas-th">Ação recomendada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.desvios.map((d, i) => (
                      <tr key={i} className="border-b border-slate-100">
                        <td className="saas-td">{d.data ?? '—'}</td>
                        <td className="saas-td font-medium">{d.tipo ?? '—'}</td>
                        <td className="saas-td text-slate-700">{d.descricao ?? '—'}</td>
                        <td className="saas-td">{d.severidade ?? '—'}</td>
                        <td className="saas-td">{d.local ?? '—'}</td>
                        <td className="saas-td text-slate-600">{d.acaoRecomendada ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Diagnóstico final */}
        {data.diagnostico != null && (data.diagnostico.problemaPrincipal != null || data.diagnostico.causaProvavel != null || (data.diagnostico.recomendacoes?.length ?? 0) > 0) && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Diagnóstico final</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
                {data.diagnostico.problemaPrincipal != null && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Problema principal</p><p className="text-sm text-slate-800 mt-1">{data.diagnostico.problemaPrincipal}</p></div>
                )}
                {data.diagnostico.causaProvavel != null && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Causa provável</p><p className="text-sm text-slate-700 mt-1">{data.diagnostico.causaProvavel}</p></div>
                )}
                {(data.diagnostico.nivelRisco != null || data.diagnostico.urgenciaAcao != null) && (
                  <div className="flex flex-wrap gap-4">
                    {data.diagnostico.nivelRisco != null && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Nível de risco</p><p className="text-sm font-medium text-slate-800 mt-0.5">{data.diagnostico.nivelRisco}</p></div>}
                    {data.diagnostico.urgenciaAcao != null && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Urgência de ação</p><p className="text-sm font-medium text-slate-800 mt-0.5">{data.diagnostico.urgenciaAcao}</p></div>}
                  </div>
                )}
                {(data.diagnostico.recomendacoes?.length ?? 0) > 0 && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recomendações</p><ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">{data.diagnostico.recomendacoes!.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Plano de ação */}
        {data.planoAcao != null && (data.planoAcao.objetivoManejo != null || (data.planoAcao.acoes?.length ?? 0) > 0) && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Plano de ação</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
                {data.planoAcao.objetivoManejo != null && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Objetivo de manejo</p><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{data.planoAcao.objetivoManejo}</p></div>}
                {(data.planoAcao.acoes?.length ?? 0) > 0 && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ações</p><ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">{data.planoAcao.acoes!.map((a, i) => <li key={i}><span className="font-medium">{a.acao ?? '—'}</span>{(a.prioridade != null || a.prazo != null) && <span className="text-slate-500 text-xs ml-2">{[a.prioridade != null && `Prioridade ${a.prioridade}`, a.prazo].filter(Boolean).join(' · ')}</span>}</li>)}</ol></div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Conclusão */}
        {data.conclusao != null && String(data.conclusao).trim() !== '' && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Conclusão do consultor</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5"><p className="text-sm text-slate-800 whitespace-pre-wrap">{data.conclusao}</p></div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
