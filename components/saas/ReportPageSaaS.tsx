'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import HeaderInstitucionalVisitaTecnica from '@/components/visita/HeaderInstitucionalVisitaTecnica';
import HeaderSection, { type StatusGeral } from './HeaderSection';
import KpiCardsSection from './KpiCardsSection';
import EvaluationTable, { type AvaliacaoRow } from './EvaluationTable';
import StatisticsSection, { type EstatisticaItem } from './StatisticsSection';
import ApplicationsTable, { type AplicacaoRow } from './ApplicationsTable';
import ImageGallerySaaS, { type ImagemItem } from './ImageGallerySaaS';
import ComparisonSection, { type ComparativoItem } from './ComparisonSection';
import SaasLeafletErrorBoundary from './SaasLeafletErrorBoundary';
import type { VisitaMapaEspacialPayload } from './VisitaMapaEspacialSaaS';
import { asArray, asStringList } from '@/utils/arrayGuards';
import { formatDecimal2, formatPercent2 } from '@/utils/format';

const VisitaMapaEspacialSaaS = dynamic(() => import('./VisitaMapaEspacialSaaS'), { ssr: false });
const VisitaMapaSchematicSaaS = dynamic(() => import('./VisitaMapaSchematicSaaS'), { ssr: false });

/** Retorna número válido ou null (evita NaN no UI). */
function safeNum(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function pontoTemCoordenadasGeo(p: unknown): boolean {
  if (!p || typeof p !== 'object') return false;
  const o = p as Record<string, unknown>;
  const lat = o.lat ?? o.latitude;
  const lng = o.lng ?? o.longitude;
  if (lat == null || lng == null) return false;
  const la = Number(lat);
  const ln = Number(lng);
  return Number.isFinite(la) && Number.isFinite(ln) && Math.abs(la) <= 90 && Math.abs(ln) <= 180;
}

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
  populacao?: {
    plantasPorMetro?: number;
    eficienciaPct?: number;
    perdaTotalPct?: number;
    estagioFenologico?: string;
  };
  /** Score agregado do app (0–100); usado quando SPT/IAT específicos não vêm no payload. */
  inteligenciaAgronomica?: { score?: number; status?: string };
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
  planoAcao?: {
    objetivoManejo?: string;
    acoes?: Array<{
      prioridade?: string;
      acao?: string;
      prazo?: string;
      produto?: string;
      dose?: string;
      momento?: string;
      objetivoTecnico?: string;
    }>;
  };
  conclusao?: string;
  /** Mapa Leaflet: polígono do talhão, pontos georreferenciados, clusters e time-lapse (evolução espacial). */
  mapa?: VisitaMapaEspacialPayload;
}

interface ReportPageSaaSProps {
  data: ReportPageSaaSData;
  reportId?: string;
  relatorioUuid?: string;
  /** Quando true, não exibe o header (evita duplicação em abas) */
  embedded?: boolean;
}

type SaaSAplicacao = NonNullable<ReportPageSaaSData['aplicacoes']>[number];
type SaaSImagem = NonNullable<ReportPageSaaSData['imagens']>[number];
type EstandeRegistro = NonNullable<NonNullable<ReportPageSaaSData['estande']>['registros']>[number];

function isValidAvaliacaoRow(x: unknown): x is AvaliacaoRow {
  if (x == null || typeof x !== 'object') return false;
  const o = x as AvaliacaoRow;
  return typeof o.id === 'string' && o.id.length > 0;
}

/** Normaliza campos numéricos vindos do JSON (strings/objetos quebram .toFixed / sort). */
function normalizeAvaliacaoRow(row: AvaliacaoRow): AvaliacaoRow {
  return {
    ...row,
    dae: safeNum(row.dae as unknown),
    cvPercent: safeNum(row.cvPercent as unknown),
    estandePlm: safeNum(row.estandePlm as unknown),
    perdaPct: safeNum(row.perdaPct as unknown),
    iat: safeNum(row.iat as unknown),
    data: row.data != null ? String(row.data) : '—',
    classificacao: row.classificacao != null ? String(row.classificacao) : 'Sem dado',
    fenologia: row.fenologia != null ? String(row.fenologia) : '—',
    status: row.status != null ? String(row.status) : 'OK',
  };
}

function buildAvaliacoesFromData(d: ReportPageSaaSData): AvaliacaoRow[] {
  if (Array.isArray(d.avaliacoes) && d.avaliacoes.length > 0) {
    const valid = d.avaliacoes.filter(isValidAvaliacaoRow).map(normalizeAvaliacaoRow);
    if (valid.length > 0) return valid;
  }

  const plant = d.plantabilidade;
  const est = d.estande;
  const estRegs = asArray<EstandeRegistro>(est?.registros);
  const fit = d.fitossanidade;
  const pop = d.populacao;
  const meta = d.meta?.dataGeracao || '';

  const cv = safeNum(plant?.cvPercentual);
  const estandePlm = safeNum(pop?.plantasPorMetro) ?? (estRegs[0] != null ? safeNum((estRegs[0] as any).plantasPorMetro) : null);
  const perdaPop = safeNum(pop?.perdaTotalPct);
  const perda =
    perdaPop ??
    (est?.perdaTotalPct != null ? safeNum(est.perdaTotalPct) : null) ??
    (estRegs[0] != null ? safeNum((estRegs[0] as any).perdaTotalPct) : null);
  const iat = safeNum(
    d.indiceAgronomicoTalhao?.valor ?? d.diagnosticoIntegrado?.spt ?? d.inteligenciaAgronomica?.score,
  );

  let classificacao = 'Sem dado';
  if (cv != null) {
    classificacao =
      cv <= 10 ? 'Excelente' : cv <= 15 ? 'Bom' : cv <= 25 ? 'Moderado' : cv <= 35 ? 'Atenção' : 'Crítico';
  }

  const status =
    cv != null
      ? classificacao === 'Excelente' || classificacao === 'Bom'
        ? 'OK'
        : classificacao === 'Atenção' || classificacao === 'Crítico'
          ? 'Crítico'
          : 'Atenção'
      : d.inteligenciaAgronomica?.status === 'Crítico'
        ? 'Crítico'
        : d.inteligenciaAgronomica?.status === 'Atenção'
          ? 'Atenção'
          : 'OK';

  const fenologiaStr =
    (d.fenologia?.estadio && String(d.fenologia.estadio).trim()) ||
    (pop?.estagioFenologico && String(pop.estagioFenologico).trim()) ||
    '—';

  const row: AvaliacaoRow = {
    id: '1',
    data: meta || '—',
    dae: d.contextoSafra?.dae ?? null,
    cvPercent: cv,
    classificacao,
    estandePlm,
    fenologia: fenologiaStr,
    perdaPct: perda,
    iat,
    status,
    drillDown: {
      plantabilidade: plant
        ? {
          'Comprimento Amostrado': '5.0 m',
          'Espaçamento Médio':
            plant.espacamentoRealCm != null && Number.isFinite(Number(plant.espacamentoRealCm))
              ? `${formatDecimal2(plant.espacamentoRealCm)} cm`
              : '—',
          'CV%': cv != null ? formatPercent2(cv) : '—',
          Falhas: formatPercent2(plant.falhasPct ?? 0),
          Duplas: plant.duplasPct != null ? formatDecimal2(plant.duplasPct) : 0,
          Triplas: plant.triplasPct != null ? formatDecimal2(plant.triplasPct) : 0,
        }
        : undefined,
      estande: pop || est
        ? {
          'População Desejada': '62.000 pl/ha',
          'População Real': estandePlm != null ? String(Math.round(estandePlm * 10000)) : '—',
          'Perda Total': formatPercent2(perda ?? 0),
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

  const linhaArr = asArray<{ tipo: string }>(plant.linha);
  const n = linhaArr.length > 0 ? linhaArr.length : 14;
  const media = plant.espacamentoRealCm ?? 0;
  const cv = safeNum(plant.cvPercentual) ?? 0;
  const dpNum = media * (cv / 100);
  const icNum = (1.96 * dpNum) / Math.sqrt(n);

  return [
    { metrica: 'Média Espaçamento', valor: `${formatDecimal2(media)} cm` },
    { metrica: 'Desvio Padrão', valor: `${formatDecimal2(dpNum)} cm` },
    { metrica: 'Coeficiente de Variação', valor: formatPercent2(cv) },
    { metrica: 'IC 95%', valor: `${formatDecimal2(media)} ± ${formatDecimal2(icNum)}` },
    { metrica: 'n (amostras)', valor: n },
  ];
}

function buildAplicacoes(d: ReportPageSaaSData): AplicacaoRow[] {
  const apps = asArray<SaaSAplicacao>(d.aplicacoes);
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
  const imgs = asArray<SaaSImagem>(d.imagens);
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
  const regs = asArray<EstandeRegistro>(est?.registros);

  if (regs.length < 2) return [];

  const r1 = regs[0];
  const r2 = regs[regs.length - 1];
  const cv1 = safeNum(plant?.cvPercentual) ?? 0;
  const cv2 = 12;
  const e1 = safeNum((r1 as any).plantasPorMetro) ?? 0;
  const e2 = safeNum((r2 as any).plantasPorMetro) ?? 0;
  const iat1 = safeNum(d.indiceAgronomicoTalhao?.valor) ?? 100;
  const iat2 = 92;

  return [
    { metrica: 'CV%', avaliacao1: formatPercent2(cv1), avaliacao2: formatPercent2(cv2), variacao: formatPercent2(cv1 - cv2) },
    { metrica: 'Estande', avaliacao1: formatDecimal2(e1), avaliacao2: formatDecimal2(e2), variacao: `+${formatDecimal2(e1 - e2)}` },
    { metrica: 'IAT', avaliacao1: formatDecimal2(iat1), avaliacao2: formatDecimal2(iat2), variacao: `+${formatDecimal2(iat1 - iat2)}` },
  ];
}

function classifFromScoreSpt(score: number | null): 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico' | 'Sem dado' {
  if (score == null) return 'Sem dado';
  if (score >= 85) return 'Excelente';
  if (score >= 70) return 'Bom';
  if (score >= 50) return 'Moderado';
  if (score >= 30) return 'Atenção';
  return 'Crítico';
}

function classifFromCv(cv: number | null): 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico' | 'Sem dado' {
  if (cv == null) return 'Sem dado';
  if (cv <= 10) return 'Excelente';
  if (cv <= 15) return 'Bom';
  if (cv <= 25) return 'Moderado';
  if (cv <= 35) return 'Atenção';
  return 'Crítico';
}

function classifFromIpe(ipe: number | null): 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico' | 'Sem dado' {
  if (ipe == null) return 'Sem dado';
  if (ipe <= 0.5) return 'Excelente';
  if (ipe <= 1.2) return 'Bom';
  if (ipe <= 2.5) return 'Moderado';
  if (ipe <= 4) return 'Atenção';
  return 'Crítico';
}

function classifFromEstande(ef: number | null, plm: number | null): 'Excelente' | 'Bom' | 'Moderado' | 'Atenção' | 'Crítico' | 'Sem dado' {
  if (ef == null && plm == null) return 'Sem dado';
  if (ef != null) {
    if (ef >= 95) return 'Excelente';
    if (ef >= 85) return 'Bom';
    if (ef >= 75) return 'Moderado';
    if (ef >= 60) return 'Atenção';
    return 'Crítico';
  }
  return 'Moderado';
}

export default function ReportPageSaaS({ data, reportId, relatorioUuid, embedded }: ReportPageSaaSProps) {
  const meta = data.meta ?? {};
  const prop = data.propriedade ?? {};
  const talhao = data.talhao ?? {};
  const pragasRows = asArray<NonNullable<ReportPageSaaSData['pragas']>[number]>(data.pragas);
  const desviosRows = asArray<NonNullable<ReportPageSaaSData['desvios']>[number]>(data.desvios);
  const recomendacoesList = asStringList(data.diagnostico?.recomendacoes);
  const planoAcaoAcoes = asArray<NonNullable<NonNullable<ReportPageSaaSData['planoAcao']>['acoes']>[number]>(data.planoAcao?.acoes);

  const intel = data.inteligenciaAgronomica;
  const rawTalhaoStatus = data.indiceAgronomicoTalhao?.status;
  const statusGeral: StatusGeral =
    rawTalhaoStatus === 'Atenção' || rawTalhaoStatus === 'Crítico' || rawTalhaoStatus === 'Saudável'
      ? rawTalhaoStatus
      : intel?.status === 'Atenção'
        ? 'Atenção'
        : intel?.status === 'Crítico'
          ? 'Crítico'
          : 'Saudável';

  const sptValor =
    safeNum(data.diagnosticoIntegrado?.spt ?? data.indiceAgronomicoTalhao?.valor ?? intel?.score);
  const cvNum =
    data.plantabilidade?.cvPercentual != null && Number.isFinite(Number(data.plantabilidade.cvPercentual))
      ? Number(data.plantabilidade.cvPercentual)
      : null;
  const ipeNum = safeNum(data.fitossanidade?.ipe);
  const plmEstande = safeNum(data.populacao?.plantasPorMetro ?? data.estande?.registros?.[0]?.plantasPorMetro);
  const efPct = data.populacao?.eficienciaPct != null && Number.isFinite(Number(data.populacao.eficienciaPct))
    ? Number(data.populacao.eficienciaPct)
    : null;

  const kpiCards = [
    {
      id: 'spt',
      indicador: 'SPT',
      valor: sptValor != null ? formatDecimal2(sptValor) : '—',
      classificacao: classifFromScoreSpt(sptValor),
      tendencia: (sptValor != null && sptValor >= 70 ? 'up' : sptValor != null && sptValor < 50 ? 'down' : 'neutral') as 'up' | 'neutral' | 'down',
      tooltip:
        sptValor != null && intel?.score != null && sptValor === intel.score && data.diagnosticoIntegrado?.spt == null && data.indiceAgronomicoTalhao?.valor == null
          ? 'Score agregado da visita (inteligência agronômica, 0–100)'
          : 'Índice de Saúde da Planta / talhão',
      historico: asArray<EstandeRegistro>(data.estande?.registros).map((r) => ({
        data: r.data ?? '',
        valor:
          r.plantasPorMetro != null
            ? (() => {
                const v = safeNum(r.plantasPorMetro);
                return v != null ? formatDecimal2(v) : '—';
              })()
            : '—',
      })),
    },
    {
      id: 'cv',
      indicador: 'CV%',
      valor: cvNum != null ? formatPercent2(cvNum) : '—',
      classificacao: classifFromCv(cvNum),
      tendencia: 'neutral' as const,
      tooltip: 'Coeficiente de variação do espaçamento (módulo plantio / plantabilidade)',
      historico: [],
    },
    {
      id: 'estande',
      indicador: 'Estande',
      valor: plmEstande != null ? formatDecimal2(plmEstande) : '—',
      classificacao: classifFromEstande(efPct, plmEstande),
      tendencia: 'neutral' as const,
      tooltip: 'Plantas por metro (avaliação de estande)',
      historico: asArray<EstandeRegistro>(data.estande?.registros).map((r) => ({
        data: r.data ?? '',
        valor:
          r.plantasPorMetro != null
            ? (() => {
                const v = safeNum(r.plantasPorMetro);
                return v != null ? formatDecimal2(v) : '—';
              })()
            : '—',
      })),
    },
    {
      id: 'ipe',
      indicador: 'IPE',
      valor: ipeNum != null ? formatDecimal2(ipeNum) : '—',
      classificacao: classifFromIpe(ipeNum),
      tendencia: 'down' as const,
      tooltip: 'Índice de pressão de entomofauna (quando registrado na visita)',
      historico: [],
    },
  ];

  const avaliacoes = buildAvaliacoesFromData(data);
  const estatisticas = buildEstatisticas(data);
  const aplicacoes = buildAplicacoes(data);
  const imagens = buildImagens(data);
  const comparativo = buildComparativo(data);

  const mapaVisita = data.mapa;
  const pontosGeo =
    mapaVisita != null && Array.isArray(mapaVisita.pontos)
      ? mapaVisita.pontos.filter(pontoTemCoordenadasGeo)
      : [];
  const showMapaEspacial =
    mapaVisita != null &&
    ((Array.isArray(mapaVisita.polygon) && mapaVisita.polygon.length >= 3) || pontosGeo.length > 0);
  const hasSchematicMap =
    mapaVisita != null &&
    typeof mapaVisita.path === 'string' &&
    mapaVisita.path.trim().length > 0 &&
    typeof mapaVisita.viewBox === 'string' &&
    mapaVisita.viewBox.trim().length > 0;
  const showMapaSchematic = !showMapaEspacial && hasSchematicMap;
  const mapaForLeaflet: VisitaMapaEspacialPayload | undefined =
    mapaVisita != null && showMapaEspacial ? { ...mapaVisita } : undefined;

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
    <div
      className={`report-m3-saas min-h-screen ${embedded ? 'rounded-xl border border-slate-200' : ''}`}
    >
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
            variant="toolbar"
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
        {showMapaEspacial && mapaForLeaflet != null && (
          <SaasLeafletErrorBoundary
            fallback={
              hasSchematicMap && mapaVisita ? (
                <VisitaMapaSchematicSaaS
                  path={mapaVisita.path!}
                  viewBox={mapaVisita.viewBox!}
                  pontos={mapaVisita.pontos}
                />
              ) : undefined
            }
          >
            <VisitaMapaEspacialSaaS mapa={mapaForLeaflet} />
          </SaasLeafletErrorBoundary>
        )}
        {showMapaSchematic && mapaVisita != null && (
          <VisitaMapaSchematicSaaS
            path={mapaVisita.path!}
            viewBox={mapaVisita.viewBox!}
            pontos={mapaVisita.pontos}
          />
        )}
        {comparativo.length > 0 && (
          <ComparisonSection
            items={comparativo}
            labelAvaliacao1={asArray<EstandeRegistro>(data.estande?.registros)[0]?.data}
            labelAvaliacao2={
              (() => {
                const rr = asArray<EstandeRegistro>(data.estande?.registros);
                return rr.length ? rr[rr.length - 1]?.data : undefined;
              })()
            }
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
        {pragasRows.length > 0 && (
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
                    {pragasRows.map((p, i) => (
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
        {desviosRows.length > 0 && (
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
                    {desviosRows.map((d, i) => (
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
        {data.diagnostico != null && (data.diagnostico.problemaPrincipal != null || data.diagnostico.causaProvavel != null || recomendacoesList.length > 0) && (
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
                {recomendacoesList.length > 0 && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Recomendações</p><ul className="list-disc pl-5 space-y-1 text-sm text-slate-700">{recomendacoesList.map((texto, i) => <li key={i}>{texto}</li>)}</ul></div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Plano de ação */}
        {data.planoAcao != null && (data.planoAcao.objetivoManejo != null || planoAcaoAcoes.length > 0) && (
          <section className="saas-section print:break-inside-avoid">
            <div className="mx-auto max-w-7xl">
              <h2 className="saas-section-title">Plano de ação</h2>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4 sm:p-5 space-y-4">
                {data.planoAcao.objetivoManejo != null && <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Objetivo de manejo</p><p className="text-sm text-slate-800 mt-1 whitespace-pre-wrap">{data.planoAcao.objetivoManejo}</p></div>}
                {planoAcaoAcoes.length > 0 && (
                  <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Ações</p><ol className="list-decimal pl-5 space-y-2 text-sm text-slate-700">{planoAcaoAcoes.map((a, i) => <li key={i}><span className="font-medium">{a.acao ?? '—'}</span>{(a.prioridade != null || a.prazo != null) && <span className="text-slate-500 text-xs ml-2">{[a.prioridade != null && `Prioridade ${a.prioridade}`, a.prazo].filter(Boolean).join(' · ')}</span>}</li>)}</ol></div>
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
