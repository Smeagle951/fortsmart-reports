'use client';

import React, { useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  RelatorioMonitoramento,
  Talhao,
  PontoMonitoramento,
  Infestacao,
  CondicoesClimaticas,
  GeoJSONPolygon,
  Recomendacao,
  TipoOrganismo,
} from '@/lib/types/monitoring';
import { calcularMetricasTalhao } from '@/lib/calculations';
import { formatPercent2, formatDecimal2, formatDate, formatDateTime } from '@/utils/format';
import ModalImagem from './ModalImagem';
import RelatorioLayoutEnterprise from './RelatorioLayoutEnterprise';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

/** Normaliza nome de produto para deduplicação (lowercase, trim, remove acentos). */
function normalizarProduto(s: string): string {
  if (!s || s === '—') return '';
  return String(s)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ');
}

const TIPO_LABEL: Record<TipoOrganismo, string> = {
  praga: 'Praga',
  doenca: 'Doença',
  daninha: 'Daninha',
};

function defaultPolygon(pontos: PontoMonitoramento[]): GeoJSONPolygon {
  if (pontos.length === 0) {
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[-48, -16], [-47.9, -16], [-47.9, -15.9], [-48, -15.9], [-48, -16]]] },
    };
  }
  let minLat = pontos[0].lat, maxLat = pontos[0].lat, minLng = pontos[0].lng, maxLng = pontos[0].lng;
  pontos.forEach(p => {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  });
  const pad = 0.0001;
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [minLng - pad, minLat - pad],
        [maxLng + pad, minLat - pad],
        [maxLng + pad, maxLat + pad],
        [minLng - pad, maxLat + pad],
        [minLng - pad, minLat - pad],
      ]],
    },
  };
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTalhao(raw: Record<string, unknown>): Talhao {
  const pontosRaw = Array.isArray(raw.pontos) ? raw.pontos : [];
  const pontos: PontoMonitoramento[] = pontosRaw
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p, i) => {
      const infRaw = Array.isArray(p.infestacoes) ? p.infestacoes : [];
      const infestacoes: Infestacao[] = infRaw
        .filter((inf): inf is Record<string, unknown> => inf != null && typeof inf === 'object')
        .map((inf, j) => ({
          id: String(inf.id ?? `inf-${i}-${j}`),
          tipo: (['praga', 'doenca', 'daninha'].includes(String(inf.tipo ?? '')) ? inf.tipo : 'praga') as TipoOrganismo,
          nome: String(inf.nome ?? '—'),
          terco: String(inf.terco ?? 'Médio'),
          quantidade: inf.quantidade != null ? safeNum(inf.quantidade) : null,
          severidade: safeNum(inf.severidade ?? 0),
          observacao: (inf.observacao != null && String(inf.observacao)) ? String(inf.observacao) : undefined,
          imagem: (() => {
            const v = inf.imagem ?? inf.url ?? inf.foto_url ?? inf.foto_path ?? inf.image_url;
            if (v != null && String(v).trim()) return String(v).trim();
            const paths = inf.foto_paths;
            if (Array.isArray(paths) && paths.length > 0 && paths[0] != null && String(paths[0]).trim()) return String(paths[0]).trim();
            return undefined;
          })(),
        }));
      return {
        id: String(p.id ?? `p-${i}`),
        identificador: String(p.identificador ?? `P${i + 1}`),
        lat: safeNum(p.lat ?? 0),
        lng: safeNum(p.lng ?? 0),
        infestacoes,
      };
    });

  const poligonoRaw = raw.poligono_geojson ?? raw.poligono ?? raw.polygon ?? raw.geometry ?? raw.geojson;
  const poly = poligonoRaw as GeoJSONPolygon | null | undefined;
  const poligono = (poly && poly.type === 'Feature' && poly.geometry?.type === 'Polygon' && Array.isArray(poly.geometry?.coordinates))
    ? poly
    : defaultPolygon(pontos);
  const cond = raw.condicoes_climaticas as Record<string, unknown> | undefined;
  const condicoes_climaticas: CondicoesClimaticas | undefined = cond
    ? { temperatura: Number(cond.temperatura ?? 0), umidade: Number(cond.umidade ?? 0), chuva: (cond.chuva as string) ?? 'Sem Chuva' }
    : undefined;

  const recRaw = (raw.recomendacoes ?? []) as Array<{ acao?: string; organismo?: string; produto?: string; dose?: string; nivel?: string } | Recomendacao>;
  const recomendacoes: Recomendacao[] = recRaw.map((r): Recomendacao => {
    if (r && typeof r === 'object' && 'nivel' in r && 'organismo' in r && (r.produto != null || r.dose != null) && String((r as Recomendacao).organismo ?? '').trim() !== '—') {
      return r as Recomendacao;
    }
    const x = r as Record<string, unknown>;
    const acaoVal = (typeof x.manejo === 'string' ? x.manejo.trim() : '') || (typeof x.acao === 'string' ? x.acao : '');
    return {
      nivel: (x.nivel as Recomendacao['nivel']) ?? 'MONITORAR',
      organismo: (x.organismo != null && String(x.organismo).trim()) ? String(x.organismo).trim() : '—',
      tipo: (x.tipo as Recomendacao['tipo']) ?? 'praga',
      produto: (x.produto != null && String(x.produto).trim()) ? String(x.produto).trim() : '',
      dose: (x.dose != null && String(x.dose).trim()) ? String(x.dose).trim() : '',
      acao: acaoVal || '—',
      pontos: Array.isArray(x.pontos) ? x.pontos : [],
      severidade: typeof x.severidade === 'number' ? x.severidade : 0,
    };
  });

  const rawTalhao = raw.talhao != null && typeof raw.talhao === 'object' ? (raw.talhao as Record<string, unknown>) : null;
  const rawDetalhes = raw.detalhes != null && typeof raw.detalhes === 'object' ? (raw.detalhes as Record<string, unknown>) : null;
  const areaHa = safeNum(
    raw.area_ha ?? raw.area ?? raw.areaHa ?? raw.area_hectares ?? raw.hectares ?? raw.superficie_ha ?? raw.superficie ?? raw.tamanho_ha
    ?? rawTalhao?.area_ha ?? rawTalhao?.area ?? rawTalhao?.area_hectares ?? rawTalhao?.hectares
    ?? rawDetalhes?.area_ha ?? rawDetalhes?.area ?? rawDetalhes?.area_hectares ?? 0
  );
  const dae = raw.dae != null ? safeNum(raw.dae) : undefined;
  const estandeRaw = raw.estande != null && typeof raw.estande === 'object' ? raw.estande as Record<string, unknown> : undefined;
  const populacaoEstande = estandeRaw?.plantasPorMetro != null ? safeNum(estandeRaw.plantasPorMetro) : (estandeRaw?.populacao != null ? safeNum(estandeRaw.populacao) : undefined);
  return {
    id: String(raw.id ?? 't1'),
    nome: String(raw.nome ?? 'Talhão'),
    cultura: String(raw.cultura ?? '—'),
    area_ha: Number.isFinite(areaHa) ? areaHa : 0,
    variedade: (raw.variedade != null && String(raw.variedade)) ? String(raw.variedade) : undefined,
    estagio: (raw.estagio != null && String(raw.estagio)) ? String(raw.estagio) : undefined,
    dae: dae != null && Number.isFinite(dae) ? dae : undefined,
    populacao_estande: populacaoEstande != null && Number.isFinite(populacaoEstande) ? populacaoEstande : undefined,
    poligono_geojson: poligono,
    pontos,
    condicoes_climaticas,
    recomendacoes,
  };
}

export type PayloadFitossanitario = Record<string, unknown> & {
  tipo?: string;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  crea?: string;
  propriedade?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  talhoes?: Record<string, unknown>[];
  metricas?: Record<string, unknown>;
  estande?: Record<string, unknown>;
  cv?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  observacoes?: string | null;
  alertas?: string[] | null;
  organismos?: Array<Record<string, unknown>>;
  imagens?: Array<{ url?: string; descricao?: string }>;
  /** Dados do módulo Plantio integrados ao monitoramento (estande, CV%, evolução fenológica) */
  dados_plantio?: DadosPlantioMonitoramento | null;
  /** Módulo plantio bruto (plantabilidade, estande, fenologia) para derivar dados_plantio quando não enviado */
  modulo_plantio?: Record<string, unknown>;
};

/** Bloco de dados de plantio enviado pelo app para enriquecer o relatório de monitoramento */
export interface DadosPlantioMonitoramento {
  cultura?: string;
  hibrido?: string;
  data_plantio?: string;
  data_emergencia?: string;
  populacao_desejada?: number;
  populacao_real?: number;
  espacamento_entre_linhas_m?: number;
  espacamento_medio_cm?: number;
  plantas_por_metro?: number;
  cv_percent?: number;
  cv_classificacao?: string;
  desvio_padrao_cm?: number;
  indice_falhas_percent?: number;
  indice_duplas_percent?: number;
  metros_amostrados?: number;
  plantas_contadas?: number;
  eficiencia_estande_percent?: number;
  dae?: number;
  dap?: number;
  estagio_atual?: string;
  evolucao_fenologica?: Array<{ data?: string; dae?: number; dap?: number; estagio?: string; altura_cm?: number }>;
  linha_plantabilidade?: Array<{ espacamento_cm: number; tipo: 'ok' | 'dupla' | 'tripla' | 'falha' }>;
  estande_detalhes?: Record<string, unknown>;
  cv_detalhes?: Record<string, unknown>;
  fenologia_detalhes?: Record<string, unknown>;
}

interface RelatorioFitossanitarioContentProps {
  relatorio: PayloadFitossanitario;
  reportId?: string;
  relatorioUuid?: string;
}

function severidadeLabel(severidade: number): string {
  if (severidade < 10) return 'Baixo';
  if (severidade < 25) return 'Moderado';
  if (severidade < 40) return 'Alto';
  return 'Crítico';
}

function severidadeColor(severidade: number): string {
  if (severidade < 10) return '#2E7D32';
  if (severidade < 25) return '#F59E0B';
  if (severidade < 40) return '#E65100';
  return '#C62828';
}

/** Deriva DadosPlantioMonitoramento a partir de modulo_plantio (plantabilidade, estande, fenologia). */
function deriveDadosPlantioFromModuloPlantio(modulo: Record<string, unknown> | null | undefined): DadosPlantioMonitoramento | null {
  if (!modulo || typeof modulo !== 'object') return null;
  const pb = (modulo.plantabilidade ?? (modulo as any).plantabilidade) as Record<string, unknown> | undefined;
  const est = (modulo.estande ?? (modulo as any).estande) as Record<string, unknown> | undefined;
  const fen = (modulo.fenologia ?? (modulo as any).fenologia) as Record<string, unknown> | undefined;
  const ctx = (modulo.contextoSafra ?? modulo.contexto_safra ?? modulo.contexto) as Record<string, unknown> | undefined;
  const getNum = (v: unknown): number | undefined => (v != null && Number.isFinite(Number(v)) ? Number(v) : undefined);
  const getStr = (v: unknown): string | undefined => (v != null && String(v).trim() ? String(v).trim() : undefined);
  const getDate = (v: unknown): string | undefined => (v != null ? String(v) : undefined);
  const cultura = getStr(ctx?.cultura ?? modulo.cultura ?? est?.cultura);
  const hibrido = getStr(ctx?.hibrido ?? ctx?.variedade ?? ctx?.materialVariedade ?? modulo.hibrido ?? est?.hibrido);
  const dataPlantio = getDate(ctx?.dataPlantio ?? ctx?.data_plantio ?? modulo.data_plantio ?? est?.data_plantio);
  const dataEmergencia = getDate(fen?.dataEmergencia ?? fen?.data_emergencia ?? fen?.data ?? modulo.data_emergencia);
  const populacaoDesejada = getNum(ctx?.populacaoAlvoPlHa ?? ctx?.populacao_desejada ?? est?.populacao_ideal ?? est?.populacao_desejada);
  const populacaoReal = getNum(est?.populacao ?? est?.populacao_real ?? est?.plantasPorMetro);
  const espacamentoMedio = getNum(pb?.espacamentoRealCm ?? pb?.espacamento_real_cm ?? ctx?.espacamentoCm ?? ctx?.espacamento_cm ?? est?.espacamento_medio_cm);
  const cvPercent = getNum(pb?.cvPercentual ?? pb?.cv_percentual ?? pb?.coeficiente_variacao);
  const cvClassificacao = getStr(pb?.classificacao ?? pb?.cv_classificacao);
  const indiceFalhas = getNum(pb?.falhasPct ?? pb?.falhas_pct ?? pb?.indice_falhas);
  const indiceDuplas = getNum(pb?.duplasPct ?? pb?.duplas_pct ?? pb?.indice_duplas);
  const metrosAmostrados = getNum(est?.metrosAmostrados ?? est?.metros_amostrados ?? est?.comprimento_avaliado_m);
  const plantasContadas = getNum(est?.plantasContadas ?? est?.plantas_contadas ?? est?.plantas_por_metro);
  const eficienciaEstande = getNum(est?.eficienciaPct ?? est?.eficiencia_percentual ?? est?.eficiencia_estande_percent);
  const dae = getNum(fen?.dae ?? ctx?.dae ?? modulo.dae);
  const estagioAtual = getStr(fen?.estadio ?? fen?.estagio ?? fen?.estagioFenologico ?? modulo.estagio_atual);
  const evolucaoRaw = (fen?.evolucao ?? fen?.registros ?? modulo.evolucao_fenologica) as Array<Record<string, unknown>> | undefined;
  const evolucao_fenologica = Array.isArray(evolucaoRaw) && evolucaoRaw.length > 0
    ? evolucaoRaw.map(ev => ({
        data: getDate(ev.data ?? ev.data_registro),
        dae: getNum(ev.dae),
        dap: getNum(ev.dap ?? ev.dae),
        estagio: getStr(ev.estagio ?? ev.estadio),
        altura_cm: getNum(ev.altura_cm ?? ev.altura),
      })).filter(ev => ev.data || ev.dae != null || ev.estagio)
    : undefined;
  const linhaRaw = (pb?.linha ?? pb?.espacamentosIndividuais ?? pb?.espacamentos_individuais) as unknown;
  let linha_plantabilidade: DadosPlantioMonitoramento['linha_plantabilidade'];
  if (Array.isArray(linhaRaw) && linhaRaw.length > 0) {
    linha_plantabilidade = linhaRaw.map((item: unknown) => {
      if (item != null && typeof item === 'object') {
        const o = item as Record<string, unknown>;
        const cm = getNum(o.espacamento_cm ?? o.espacamentoCm ?? o.cm);
        const t = String(o.tipo ?? 'ok').toLowerCase();
        const tipo = (['ok', 'dupla', 'tripla', 'falha'].includes(t) ? t : 'ok') as 'ok' | 'dupla' | 'tripla' | 'falha';
        if (cm != null) return { espacamento_cm: cm, tipo };
      }
      return null;
    }).filter((x): x is { espacamento_cm: number; tipo: 'ok' | 'dupla' | 'tripla' | 'falha' } => x != null);
    if (linha_plantabilidade.length === 0) linha_plantabilidade = undefined;
  } else if (typeof linhaRaw === 'string') {
    const parts = linhaRaw.split(/[|,;\s]+/).map(p => getNum(p.trim())).filter((n): n is number => n != null && n > 0);
    if (parts.length > 0) {
      const media = parts.reduce((a, b) => a + b, 0) / parts.length;
      linha_plantabilidade = parts.map(cm => {
        let tipo: 'ok' | 'dupla' | 'tripla' | 'falha' = 'ok';
        if (cm < media * 0.4) tipo = 'tripla';
        else if (cm < media * 0.6) tipo = 'dupla';
        else if (cm > media * 1.6) tipo = 'falha';
        return { espacamento_cm: cm, tipo };
      });
    }
  }
  const hasAny = cultura || hibrido || dataPlantio || dataEmergencia || populacaoDesejada != null || populacaoReal != null ||
    cvPercent != null || estagioAtual || (evolucao_fenologica?.length ?? 0) > 0 || (linha_plantabilidade?.length ?? 0) > 0;
  if (!hasAny) return null;
  return {
    cultura: cultura ?? undefined,
    hibrido: hibrido ?? undefined,
    data_plantio: dataPlantio ?? undefined,
    data_emergencia: dataEmergencia ?? undefined,
    populacao_desejada: populacaoDesejada ?? undefined,
    populacao_real: populacaoReal ?? undefined,
    espacamento_medio_cm: espacamentoMedio ?? undefined,
    cv_percent: cvPercent ?? undefined,
    cv_classificacao: cvClassificacao ?? undefined,
    indice_falhas_percent: indiceFalhas ?? undefined,
    indice_duplas_percent: indiceDuplas ?? undefined,
    metros_amostrados: metrosAmostrados ?? undefined,
    plantas_contadas: plantasContadas ?? undefined,
    eficiencia_estande_percent: eficienciaEstande ?? undefined,
    dae: dae ?? undefined,
    dap: dae ?? undefined,
    estagio_atual: estagioAtual ?? undefined,
    evolucao_fenologica: evolucao_fenologica ?? undefined,
    linha_plantabilidade,
  };
}

export default function RelatorioFitossanitarioContent({ relatorio, reportId, relatorioUuid }: RelatorioFitossanitarioContentProps) {
  const normalized = useMemo((): RelatorioMonitoramento => {
    const prop = (relatorio.propriedade != null && typeof relatorio.propriedade === 'object') ? relatorio.propriedade as Record<string, unknown> : undefined;
    const meta = (relatorio.meta != null && typeof relatorio.meta === 'object') ? relatorio.meta as Record<string, unknown> : undefined;
    const fazenda = String(
      relatorio.fazenda
      ?? (relatorio as any).nome_fazenda
      ?? (relatorio as any).fazenda_nome
      ?? prop?.fazenda
      ?? prop?.nome
      ?? (relatorio as any).nomeFazenda
      ?? (relatorio as any).fazenda_nome
      ?? meta?.fazenda
      ?? ''
    ).trim() || 'Fazenda';
    const safra = String(relatorio.safra ?? meta?.safra ?? '').trim() || '—';
    const dataRaw =
      relatorio.data
      ?? meta?.dataGeracao
      ?? (meta as any)?.dataVisita
      ?? (relatorio as any).data_emissao
      ?? (relatorio as any).data_visita
      ?? (relatorio as any).dataVisita
      ?? '';
    const data = typeof dataRaw === 'string' ? dataRaw : (dataRaw != null ? String(dataRaw) : '');
    const tecnico = String(
      relatorio.tecnico
      ?? (relatorio as any).agronomo
      ?? (relatorio as any).nome_tecnico
      ?? (relatorio as any).nome_agronomo
      ?? (relatorio as any).tecnicoNome
      ?? (relatorio as any).responsavel_tecnico
      ?? (relatorio as any).emitido_por
      ?? (relatorio as any).aprovado_por
      ?? prop?.tecnico
      ?? (prop as any)?.agronomo
      ?? (prop as any)?.nome_tecnico
      ?? (prop as any)?.responsavel_tecnico
      ?? meta?.tecnico
      ?? (meta as any)?.agronomo
      ?? (meta as any)?.nome_tecnico
      ?? (meta as any)?.responsavel
      ?? (meta as any)?.emitido_por
      ?? (meta as any)?.aprovado_por
      ?? 'FortSmart Agro'
    ).trim() || 'FortSmart Agro';
    const creaRaw = relatorio.crea ?? (relatorio as any).tecnico_crea ?? (relatorio as any).crea_tecnico ?? meta?.tecnicoCrea ?? meta?.crea ?? (meta as any)?.crea_tecnico ?? prop?.crea ?? (prop as any)?.crea_tecnico ?? '';
    const crea = String(creaRaw).trim() || undefined;
    const talhoesRaw =
      Array.isArray(relatorio.talhoes) && relatorio.talhoes.length > 0
        ? relatorio.talhoes
        : relatorio.talhao != null && typeof relatorio.talhao === 'object'
          ? [relatorio.talhao]
          : [];
    const talhoes = talhoesRaw.map((t: unknown) => normalizeTalhao(t != null && typeof t === 'object' ? t as Record<string, unknown> : {}));
    return { fazenda, safra, data, tecnico, crea: crea || undefined, talhoes };
  }, [relatorio]);

  const primeiroTalhao = normalized.talhoes[0];
  /** Dados de plantio: payload ou derivados do módulo plantio (plantabilidade, estande, fenologia). */
  const dadosPlantioExibir = useMemo((): DadosPlantioMonitoramento | null | undefined => {
    const dp = relatorio.dados_plantio;
    if (dp && typeof dp === 'object') {
      const has = dp.cultura || dp.populacao_desejada != null || dp.populacao_real != null || dp.cv_percent != null || dp.estagio_atual || (dp.evolucao_fenologica?.length ?? 0) > 0 || (dp.linha_plantabilidade?.length ?? 0) > 0;
      if (has) return dp as DadosPlantioMonitoramento;
    }
    return deriveDadosPlantioFromModuloPlantio((relatorio as any).modulo_plantio) ?? null;
  }, [relatorio.dados_plantio, (relatorio as any).modulo_plantio]);
  const metricasGlobais = relatorio.metricas as Record<string, unknown> | undefined;
  const fenologiaGlobal = (relatorio.fenologia ?? (primeiroTalhao && { estadio: primeiroTalhao.estagio, dae: primeiroTalhao.dae })) as Record<string, unknown> | undefined;
  const observacoes = (relatorio.observacoes ?? '') as string;
  const alertas = (relatorio.alertas ?? []) as string[];
  const organismosPayload = (relatorio.organismos ?? []) as Array<Record<string, unknown>>;

  const riscoNum = useMemo(() => {
    const n = metricasGlobais?.nivelRisco;
    if (typeof n === 'number' && Number.isFinite(n)) return Math.min(100, Math.max(0, n));
    if (typeof n === 'string') {
      const parsed = parseInt(n.replace(/\D/g, ''), 10);
      if (Number.isFinite(parsed)) return Math.min(100, Math.max(0, parsed));
    }
    if (primeiroTalhao) {
      const m = calcularMetricasTalhao(primeiroTalhao);
      return Math.round(m.severidadeMedia);
    }
    return 0;
  }, [metricasGlobais, primeiroTalhao]);

  const riscoLabel = useMemo(() => {
    if (riscoNum < 25) return 'Baixo';
    if (riscoNum < 50) return 'Moderado';
    if (riscoNum < 75) return 'Alto';
    return 'Crítico';
  }, [riscoNum]);

  const handleExportPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const el = document.getElementById('relatorio-fitossanitario-content');
    if (!el) return;
    document.body.classList.add('exporting-pdf');
    const safeFazenda = (normalized.fazenda || 'Relatorio').replace(/\s/g, '_');
    const safeData = (normalized.data || '').replace(/\//g, '-').replace(/\s/g, '_') || 'data';
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `FortSmart_Relatorio_Fitossanitario_${safeFazenda}_${safeData}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
    } finally {
      document.body.classList.remove('exporting-pdf');
    }
  };

  const propRaw = relatorio.propriedade as Record<string, unknown> | undefined;
  const primeiroTalhaoRaw = (Array.isArray(relatorio.talhoes) && relatorio.talhoes.length > 0 ? relatorio.talhoes[0] : relatorio.talhao) as Record<string, unknown> | undefined;
  const municipio = (
    propRaw?.municipio ?? (propRaw as any)?.cidade ?? (propRaw as any)?.municipio_nome
    ?? (relatorio as any).municipio ?? (relatorio as any).cidade ?? (relatorio as any).municipio_nome
    ?? primeiroTalhaoRaw?.municipio ?? (primeiroTalhaoRaw as any)?.cidade ?? (primeiroTalhaoRaw as any)?.municipio_nome
  ) as string;
  const estado = (
    propRaw?.estado ?? (propRaw as any)?.uf ?? (propRaw as any)?.estado_sigla
    ?? (relatorio as any).estado ?? (relatorio as any).uf ?? (relatorio as any).estado_sigla
    ?? primeiroTalhaoRaw?.estado ?? (primeiroTalhaoRaw as any)?.uf ?? (primeiroTalhaoRaw as any)?.estado_sigla
  ) as string;

  const metricasTalhao = primeiroTalhao ? calcularMetricasTalhao(primeiroTalhao) : null;
  const topPragas = metricasTalhao?.top5Infestacoes ?? [];
  const recomendacoesTalhao = primeiroTalhao?.recomendacoes ?? [];

  /** Condições climáticas: talhão ou fallback do relatório (condicoes_climaticas / condicoes da visita). */
  const condicoesRelatorio = (() => {
    const cc = (relatorio as any).condicoes_climaticas;
    if (cc && typeof cc === 'object' && (cc.temperatura != null || cc.umidade != null || cc.chuva != null)) {
      return { temperatura: Number(cc.temperatura ?? 0), umidade: Number(cc.umidade ?? 0), chuva: (cc.chuva as string) ?? 'Sem Chuva' };
    }
    const cond = (relatorio as any).condicoes;
    if (cond && typeof cond === 'object' && (cond.temperatura != null || cond.umidade != null)) {
      return { temperatura: Number(cond.temperatura ?? 0), umidade: Number(cond.umidade ?? 0), chuva: (cond.chuva as string) ?? 'Sem Chuva' };
    }
    return null;
  })();
  const condicoesExibir = primeiroTalhao?.condicoes_climaticas ?? condicoesRelatorio;

  /** Método de amostragem: do payload (visita / metricas / raiz). */
  const metodoAmostragem = String(
    (relatorio as any).metodo_amostragem
    ?? (relatorio as any).metodo
    ?? metricasGlobais?.metodo
    ?? (relatorio as any).visita?.metodo
    ?? (relatorio as any).padrao_amostragem
    ?? ''
  ).trim() || '—';

  type PragaComRec = {
    nome: string;
    tipo: TipoOrganismo;
    percentual: number;
    severidadeMedia: number;
    quantidadeMedia: number | null;
    observacao?: string;
    recomendacao: string;
    imagem?: string;
    produto: string;
    dose: string;
    manejo: string;
  };
  const pragasComRecomendacao = useMemo((): PragaComRec[] => {
    const todasInfestacoes = primeiroTalhao?.pontos?.flatMap(p => p.infestacoes) ?? [];
    return topPragas.map(inf => {
      const rec = recomendacoesTalhao.find(r => (r.organismo ?? '').toLowerCase() === inf.nome.toLowerCase());
      const obs = todasInfestacoes.find(i => i.nome === inf.nome)?.observacao;
      const org = organismosPayload.find(o => String(o.nome ?? '').toLowerCase() === inf.nome.toLowerCase());
      const qtdMedia = org?.quantidadeMedia != null ? safeNum(org.quantidadeMedia) : null;
      const primeiraImagem = todasInfestacoes.find(i => i.nome === inf.nome && i.imagem)?.imagem;
      const manejoStr = (rec as unknown as Record<string, unknown>)?.manejo ?? rec?.acao;
      const manejo = (typeof manejoStr === 'string' ? manejoStr.trim() : '') || (inf.percentual >= 25 ? 'Monitorar e retornar em 3–7 dias.' : 'Acompanhamento semanal.');
      return {
        nome: inf.nome,
        tipo: inf.tipo,
        percentual: inf.percentual,
        severidadeMedia: org?.severidadeMedia != null ? safeNum(org.severidadeMedia) : (inf.percentual < 10 ? 5 : inf.percentual < 25 ? 18 : inf.percentual < 40 ? 32 : 50),
        quantidadeMedia: qtdMedia,
        observacao: obs,
        recomendacao: rec?.acao ?? (inf.percentual >= 25 ? 'Monitoramento intensificado. Retorno recomendado em até 3–7 dias.' : 'Acompanhamento semanal.'),
        imagem: primeiraImagem,
        produto: (rec?.produto ?? '').trim() || '—',
        dose: (rec?.dose ?? '').trim() || '—',
        manejo,
      };
    });
  }, [topPragas, recomendacoesTalhao, primeiroTalhao, organismosPayload]);

  /** Resumo único de recomendações: máx. 4 produtos distintos (produto+dose), com organismos alvo agregados. */
  type ResumoRec = { produto: string; dose: string; organismos: string[]; manejo: string };
  const resumoRecomendacoes = useMemo((): ResumoRec[] => {
    const seen = new Map<string, ResumoRec>();
    const MAX = 4;
    for (const p of pragasComRecomendacao) {
      if (seen.size >= MAX) break;
      const prodNorm = normalizarProduto(p.produto);
      const doseNorm = String(p.dose ?? '').trim().toLowerCase();
      const key = `${prodNorm}|${doseNorm}`;
      if (!key || key === '|') continue;
      const existing = seen.get(key);
      if (existing) {
        if (!existing.organismos.includes(p.nome)) existing.organismos.push(p.nome);
        if (p.manejo && p.manejo !== '—' && !existing.manejo) existing.manejo = p.manejo;
      } else {
        seen.set(key, {
          produto: p.produto,
          dose: p.dose,
          organismos: [p.nome],
          manejo: p.manejo || '—',
        });
      }
    }
    return Array.from(seen.values()).slice(0, MAX);
  }, [pragasComRecomendacao]);

  const [galeriaModal, setGaleriaModal] = useState<{ url: string; descricao?: string } | null>(null);
  /** Filtro da tabela técnica de pragas por tipo (praga / doenca / daninha). */
  const [filtroTipoPragas, setFiltroTipoPragas] = useState<TipoOrganismo | 'todos'>('todos');
  /** Linhas da tabela técnica detalhada: ponto, tipo, infestação, terço, quantidade, severidade, data. */
  const tabelaTecnicaRows = useMemo(() => {
    const pontos = primeiroTalhao?.pontos ?? [];
    const dataVisita = relatorio.data ?? (relatorio.meta as Record<string, unknown>)?.dataVisita ?? (relatorio.meta as Record<string, unknown>)?.data_visita;
    const dataStr = dataVisita != null ? (formatDate(String(dataVisita)) !== '—' ? formatDate(String(dataVisita)) : String(dataVisita)) : '—';
    const rawTalhao = Array.isArray(relatorio.talhoes) && relatorio.talhoes.length > 0 ? (relatorio.talhoes as Record<string, unknown>[])[0] : undefined;
    const rawPontos = (rawTalhao && Array.isArray(rawTalhao.pontos)) ? (rawTalhao.pontos as Record<string, unknown>[]) : [];
    return pontos.flatMap((p, pi) => (p.infestacoes ?? []).map((inf, ji) => {
      const rawP = rawPontos[pi];
      const rawInfs = rawP && typeof rawP === 'object' && Array.isArray((rawP as Record<string, unknown>).infestacoes) ? (rawP as Record<string, unknown>).infestacoes as Record<string, unknown>[] : [];
      const rawInf = rawInfs[ji];
      const dataCell = rawInf && typeof rawInf === 'object' && (rawInf.data ?? rawInf.data_avaliacao ?? rawInf.data_registro) != null
        ? (rawInf.data ?? rawInf.data_avaliacao ?? rawInf.data_registro)
        : dataStr;
      return {
        ponto: p.identificador,
        tipo: inf.tipo,
        infestacao: inf.nome,
        terco: inf.terco,
        quantidade: inf.quantidade,
        severidade: inf.severidade,
        data: dataCell != null ? (formatDate(String(dataCell)) !== '—' ? formatDate(String(dataCell)) : String(dataCell)) : dataStr,
      };
    }));
  }, [primeiroTalhao?.pontos, relatorio.data, relatorio.meta, relatorio.talhoes]);
  const tabelaTecnicaFiltrada = useMemo(() => {
    if (filtroTipoPragas === 'todos') return tabelaTecnicaRows;
    return tabelaTecnicaRows.filter(r => r.tipo === filtroTipoPragas);
  }, [tabelaTecnicaRows, filtroTipoPragas]);
  const imagens = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string }>;

  /** Próxima visita: meta ou metricas (formato ISO ou DD/MM/YYYY). */
  const proximaVisitaRaw =
    (metricasGlobais?.proximaVisita ?? metricasGlobais?.proxima_visita ?? (relatorio.meta as Record<string, unknown>)?.proximaVisita ?? (relatorio.meta as Record<string, unknown>)?.proxima_visita) as string | undefined;
  const proximaVisita = proximaVisitaRaw
    ? (formatDate(proximaVisitaRaw) !== '—' ? formatDate(proximaVisitaRaw) : String(proximaVisitaRaw))
    : '—';

  /** Índice FortSmart de Qualidade (IQF): 0–100 por dimensão + média. Calculado a partir de dados_plantio, risco e métricas. */
  const iqf = useMemo(() => {
    const dp = dadosPlantioExibir as DadosPlantioMonitoramento | undefined;
    const plantabilidade = dp?.cv_percent != null
      ? Math.round(Math.max(0, 100 - Math.min(dp.cv_percent * 5, 100)))
      : null;
    const estande = dp?.eficiencia_estande_percent != null
      ? Math.round(dp.eficiencia_estande_percent)
      : (dp?.populacao_desejada != null && dp?.populacao_real != null && dp.populacao_desejada > 0
        ? Math.round((dp.populacao_real / dp.populacao_desejada) * 100)
        : null);
    const sanidade = riscoNum != null ? Math.round(100 - riscoNum) : null;
    const falhasPct = (dp?.indice_falhas_percent ?? 0) + (dp?.indice_duplas_percent ?? 0);
    const uniformidade = dp ? Math.round(Math.max(0, 100 - falhasPct * 4)) : null;
    const valores = [plantabilidade, estande, sanidade, uniformidade].filter((v): v is number => v != null && Number.isFinite(v));
    const media = valores.length > 0 ? Math.round(valores.reduce((a, b) => a + b, 0) / valores.length) : null;
    const classificacao = media == null ? null : media >= 90 ? 'EXCELENTE' : media >= 75 ? 'BOM' : media >= 50 ? 'REGULAR' : 'CRÍTICO';
    return { plantabilidade, estande, sanidade, uniformidade, media, classificacao };
  }, [dadosPlantioExibir, riscoNum]);

  /** Potencial produtivo estimado (faixa sc/ha) para o resumo executivo — fórmula aproximada a partir de população e eficiência. */
  const potencialProdutivo = useMemo(() => {
    const dp = dadosPlantioExibir as DadosPlantioMonitoramento | undefined;
    if (dp?.populacao_real == null || dp.populacao_real < 10000) return null;
    const base = Math.min(85, 45 + (dp.populacao_real / 10000) * 0.35);
    const ef = (dp.eficiencia_estande_percent ?? 95) / 100;
    const cv = (dp.cv_percent ?? 15) / 100;
    const min = Math.round(base * ef * (1 - cv * 0.5));
    const max = Math.round(base * ef * (1 + 0.05));
    return { min: Math.max(30, min), max: Math.min(100, max) };
  }, [dadosPlantioExibir]);

  if (!primeiroTalhao) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        Nenhum talhão disponível para exibir o relatório fitossanitário.
      </div>
    );
  }

  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (riscoNum / 100) * circumference;
  const riskBadgeClass = riscoNum < 25 ? 'baixo' : riscoNum < 50 ? 'medio' : riscoNum < 75 ? 'alto' : 'critico';
  const gaugeFillClass = riskBadgeClass;

  return (
    <RelatorioLayoutEnterprise
      fazenda={normalized.fazenda}
      talhaoNome={primeiroTalhao.nome}
      tecnico={normalized.tecnico}
      crea={normalized.crea}
      reportId={reportId}
      onExportPDF={handleExportPDF}
    >
      {/* #resumo — Report Header Card (base: relatorio.html) */}
      {(() => {
        const meta = (relatorio.meta != null && typeof relatorio.meta === 'object') ? relatorio.meta as Record<string, unknown> : {};
        const dataEmissaoRaw = relatorio.data ?? meta.dataGeracao ?? (meta as any).dataVisita ?? (relatorio as any).data_emissao ?? (relatorio as any).data_visita ?? (relatorio as any).dataVisita ?? '';
        const dataEmissaoStr = dataEmissaoRaw != null ? String(dataEmissaoRaw) : '';
        const dataEmissaoFormatada = dataEmissaoStr.includes('T') ? formatDateTime(dataEmissaoStr) : (dataEmissaoStr ? (formatDate(dataEmissaoStr) !== '—' ? formatDate(dataEmissaoStr) : dataEmissaoStr) : normalized.data);
        const aprovadoPor = (relatorio as any).aprovado_por ?? (meta as any).aprovado_por ?? (meta as any).aprovadoPor ?? '';
        const subtitulo = `Emitido em ${dataEmissaoFormatada}${aprovadoPor ? ` - Aprovado por ${String(aprovadoPor)}` : ''}${normalized.tecnico && normalized.tecnico !== 'FortSmart Agro' ? ` · ${normalized.tecnico}` : ''}${normalized.crea ? ` · ${normalized.crea}` : ''}`;
        return (
      <div id="resumo" className="report-header-card pdf-keep-together">
        <div className="report-header-info">
          <h1>📋 Relatório de Monitoramento Fitossanitário</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
            {subtitulo}
          </p>
          <div className="report-meta-tags">
            <span className="meta-tag">🌾 {primeiroTalhao.cultura} — Safra {normalized.safra}</span>
            <span className="meta-tag">📍 {municipio && estado ? `${String(municipio)} · ${String(estado)}` : (municipio || estado || '—')}</span>
            <span className="meta-tag">📐 {primeiroTalhao.area_ha > 0 ? `${formatDecimal2(primeiroTalhao.area_ha)} ha` : '—'} · {primeiroTalhao.nome}</span>
            <span className="meta-tag">🌱 {String(primeiroTalhao.estagio || (fenologiaGlobal?.estadio ?? '—'))} — {String((primeiroTalhao.dae ?? fenologiaGlobal?.dae) ?? '')} DAE</span>
            {primeiroTalhao.variedade && <span className="meta-tag">Híbrido: {primeiroTalhao.variedade}</span>}
          </div>
          {iqf.media != null && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 0, fontWeight: 500 }}>
              <strong style={{ color: 'var(--text-main)' }}>Status da lavoura:</strong>
              {' '}{iqf.plantabilidade != null ? `Plantio: ${iqf.plantabilidade >= 75 ? 'Excelente' : iqf.plantabilidade >= 50 ? 'Bom' : 'Atenção'}` : ''}
              {iqf.estande != null ? ` · População: ${iqf.estande >= 75 ? 'Adequada' : iqf.estande >= 50 ? 'Regular' : 'Atenção'}` : ''}
              {iqf.sanidade != null ? ` · Sanidade: ${iqf.sanidade >= 70 ? 'Boa' : 'Atenção'}` : ''}
              {' · '}Risco: {riscoLabel}
            </p>
          )}
        </div>
        <div className="report-header-right">
          <div className={`risk-badge ${riskBadgeClass}`}>
            <span>{riscoNum >= 50 ? '⚠️' : riscoNum >= 25 ? '⚠️' : '✓'}</span>
            <div>
              <div className="risk-score">{riscoNum}</div>
              <div style={{ fontSize: '0.7rem', fontWeight: 500 }}>Risco {riscoLabel}</div>
            </div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Próxima visita: {proximaVisita}</span>
        </div>
      </div>
        );
      })()}

      {/* #resumo-executivo — Resumo Executivo Inteligente (cartão premium) */}
      <div id="resumo-executivo" className="card pdf-keep-together" style={{ marginTop: '1.25rem', borderLeft: '4px solid var(--primary)' }}>
        <div className="card-title"><span className="card-title-icon">📌</span> Resumo Executivo</div>
        <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--text-main)', margin: 0 }}>
          Relatório de monitoramento fitossanitário do talhão <strong>{primeiroTalhao.nome}</strong>, cultura <strong>{primeiroTalhao.cultura}</strong>{primeiroTalhao.variedade ? ` (${primeiroTalhao.variedade})` : ''}, safra {normalized.safra}.
          {primeiroTalhao.area_ha > 0 && ` Área: ${formatDecimal2(primeiroTalhao.area_ha)} ha.`}
          {primeiroTalhao.estagio && ` Estádio fenológico atual: ${primeiroTalhao.estagio}${primeiroTalhao.dae != null ? ` (${primeiroTalhao.dae} DAE)` : ''}.`}
          {' '}Qualidade de plantio e estande constam na seção Dados do Plantio.
          {' '}Risco agronômico atual: <strong>{riscoLabel}</strong> (score {riscoNum}).
          {proximaVisita !== '—' && ` Próxima visita técnica recomendada: ${proximaVisita}.`}
          {topPragas.length > 0 && ` Foram identificadas ${topPragas.length} praga(s)/doença(s) nos pontos amostrados; recomendações e plano de aplicação constam nas seções abaixo.`}
          {potencialProdutivo && (
            <>
              {' '}
              <strong>Potencial produtivo estimado:</strong> {potencialProdutivo.min} – {potencialProdutivo.max} sc/ha.
            </>
          )}
        </p>
      </div>

      {/* #iqf — Índice FortSmart de Qualidade Agronômica */}
      {iqf.media != null && (
        <div id="iqf" className="card pdf-keep-together" style={{ marginTop: '1rem' }}>
          <div className="card-title"><span className="card-title-icon">📊</span> Índice FortSmart de Qualidade Agronômica (IQF)</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {iqf.plantabilidade != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Plantabilidade</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${iqf.plantabilidade}%`, height: '100%', background: 'var(--primary)', borderRadius: 5 }} />
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 28 }}>{iqf.plantabilidade}</span>
                </div>
              </div>
            )}
            {iqf.estande != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Estande</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${iqf.estande}%`, height: '100%', background: 'var(--success)', borderRadius: 5 }} />
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 28 }}>{iqf.estande}</span>
                </div>
              </div>
            )}
            {iqf.sanidade != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Sanidade</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${iqf.sanidade}%`, height: '100%', background: iqf.sanidade >= 70 ? 'var(--success)' : 'var(--warning)', borderRadius: 5 }} />
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 28 }}>{iqf.sanidade}</span>
                </div>
              </div>
            )}
            {iqf.uniformidade != null && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>Uniformidade</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, height: 10, background: 'var(--bg)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ width: `${iqf.uniformidade}%`, height: '100%', background: 'var(--primary)', borderRadius: 5 }} />
                  </div>
                  <span style={{ fontWeight: 700, minWidth: 28 }}>{iqf.uniformidade}</span>
                </div>
              </div>
            )}
          </div>
          <div style={{ padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Nota geral</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: iqf.media >= 75 ? 'var(--success)' : iqf.media >= 50 ? 'var(--warning)' : 'var(--danger)' }}>{iqf.media} / 100</div>
            </div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)' }}>Classificação: {iqf.classificacao}</div>
          </div>
        </div>
      )}

      {/* #propriedade — Grid 2: Propriedade (perfil fazenda) + Mapa com legenda embaixo */}
      <div id="propriedade" className="grid-2 pdf-keep-together">
        <div className="card card-propriedade-compact">
          <div className="card-title"><span className="card-title-icon">🏡</span> Propriedade</div>
          <div className="info-row info-row-compact"><span className="info-label">Fazenda</span><span className="info-value">{normalized.fazenda}</span></div>
          <div className="info-row info-row-compact"><span className="info-label">Município</span><span className="info-value">{municipio && estado ? `${String(municipio)} — ${String(estado)}` : String(municipio || estado || '—')}</span></div>
          {(propRaw?.endereco ?? (propRaw as any)?.logradouro) && (
            <div className="info-row info-row-compact"><span className="info-label">Endereço</span><span className="info-value">{(propRaw?.endereco ?? (propRaw as any)?.logradouro) as string}</span></div>
          )}
          <div className="info-row info-row-compact"><span className="info-label">Talhão</span><span className="info-value">{primeiroTalhao.nome}{primeiroTalhao.area_ha > 0 ? ` (${formatDecimal2(primeiroTalhao.area_ha)} ha)` : ''}</span></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="card-title-icon">📍</span> Polígono GPS · Pontos georreferenciados</div>
          <p className="no-print" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, marginTop: -4 }}>Zoom: scroll do mouse ou pinça no celular.</p>
          <div className="map-card-inner">
            <MapaInterativo pontos={primeiroTalhao.pontos} poligono={primeiroTalhao.poligono_geojson} talhaoId={primeiroTalhao.id} hideHeader legendPosition="outside" />
          </div>
          <div className="map-legend-outside">
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#2E7D32' }} /> Baixo (&lt;10%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#F9A825' }} /> Médio (10–25%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#E65100' }} /> Alto (25–40%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#C62828' }} /> Crítico (&gt;40%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#94A3B8' }} /> Sem ocorrência</span>
          </div>
        </div>
      </div>

      {/* #dados-plantio — Dados do módulo Plantio (estande, CV%, evolução fenológica) */}
      {dadosPlantioExibir && (() => {
        const dp = dadosPlantioExibir as import('@/components/RelatorioFitossanitarioContent').DadosPlantioMonitoramento;
        const hasAny = dp.cultura || dp.populacao_desejada != null || dp.populacao_real != null || dp.cv_percent != null || dp.estagio_atual || (dp.evolucao_fenologica?.length ?? 0) > 0 || (dp.linha_plantabilidade?.length ?? 0) > 0;
        if (!hasAny) return null;
        const fmt = (n: number | undefined) => n != null ? formatDecimal2(n) : '—';
        const fmtInt = (n: number | undefined) => n != null ? String(Math.round(n)) : '—';
        return (
          <div id="dados-plantio" className="pdf-keep-together" style={{ marginTop: '1.5rem' }}>
            <div className="section-heading">🌾 Dados do Plantio</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Dados do módulo Plantio (estande de plantas, CV%, evolução fenológica) referentes ao talhão.
            </p>
            {/* Cabeçalho técnico — documento profissional */}
            <div className="card report-header-tecnico" style={{ marginBottom: '1rem', background: 'var(--bg)', borderColor: 'var(--border)' }}>
              <div className="card-title"><span className="card-title-icon">📋</span> Cabeçalho técnico</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem 1.5rem', fontSize: '0.85rem' }}>
                <div><span className="info-label">Fazenda</span><span className="info-value">{normalized.fazenda}</span></div>
                <div><span className="info-label">Talhão</span><span className="info-value">{primeiroTalhao.nome}</span></div>
                <div><span className="info-label">Cultura</span><span className="info-value">{dp.cultura ?? primeiroTalhao.cultura ?? '—'}</span></div>
                <div><span className="info-label">Cultivar / Híbrido</span><span className="info-value">{dp.hibrido ?? primeiroTalhao.variedade ?? '—'}</span></div>
                <div><span className="info-label">Data da avaliação</span><span className="info-value">{dp.data_plantio ? formatDate(dp.data_plantio) : normalized.data || '—'}</span></div>
                <div><span className="info-label">Consultor</span><span className="info-value">{normalized.tecnico && normalized.tecnico !== 'FortSmart Agro' ? normalized.tecnico : '—'}</span></div>
                <div><span className="info-label">Comprimento avaliado</span><span className="info-value">{dp.metros_amostrados != null ? `${fmt(dp.metros_amostrados)} m` : '—'}</span></div>
              </div>
            </div>
            {/* Indicadores principais (KPI) — antes do gráfico */}
            <div className="section-divider">Indicadores principais</div>
            <div className="kpi-strip" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              {dp.cv_percent != null && <div className="kpi-box"><span className="kpi-label">CV%</span><span className="kpi-value">{fmt(dp.cv_percent)}%</span></div>}
              {dp.espacamento_medio_cm != null && <div className="kpi-box"><span className="kpi-label">Espaçamento médio</span><span className="kpi-value">{fmt(dp.espacamento_medio_cm)} cm</span></div>}
              {dp.indice_falhas_percent != null && <div className="kpi-box"><span className="kpi-label">Falhas</span><span className="kpi-value">{fmt(dp.indice_falhas_percent)}%</span></div>}
              {dp.indice_duplas_percent != null && <div className="kpi-box"><span className="kpi-label">Duplas</span><span className="kpi-value">{fmt(dp.indice_duplas_percent)}%</span></div>}
              {(dp.populacao_desejada != null || dp.populacao_real != null) && (
                <div className="kpi-box">
                  <span className="kpi-label">População estimada</span>
                  <span className="kpi-value">{dp.populacao_real != null ? `${fmtInt(dp.populacao_real)} pl/ha` : dp.populacao_desejada != null ? `${fmtInt(dp.populacao_desejada)} pl/ha` : '—'}</span>
                </div>
              )}
            </div>
            {/* 1️⃣ Classificação automática plantabilidade (referência — não substitui parecer do técnico) */}
            {dp.cv_percent != null && (() => {
              const cv = dp.cv_percent;
              const qualidade = cv < 10 ? 'EXCELENTE' : cv < 15 ? 'BOM' : cv < 25 ? 'REGULAR' : 'CRÍTICO';
              const faixaIdeal = '< 10%';
              const interpretacao = cv < 10
                ? 'A distribuição de sementes apresenta excelente uniformidade, indicando boa regulagem da plantadeira e adequada deposição de sementes.'
                : cv < 15
                  ? 'A uniformidade do plantio está dentro do esperado. Pequenos ajustes podem melhorar ainda mais o desempenho.'
                  : cv < 25
                    ? 'Há desuniformidade moderada. Recomenda-se verificar regulagem do dosador e condições de solo.'
                    : 'Alta desuniformidade. Revisar regulagem, profundidade e velocidade de plantio.';
              const recomendacao = cv < 10 ? 'Manter regulagem atual da plantadeira.' : cv < 15 ? 'Manter monitoramento; ajustes finos opcionais.' : cv < 25 ? 'Verificar regulagem do dosador e condições de palhada.' : 'Priorizar correções: regulagem, profundidade e velocidade de plantio.';
              const falhasPct = dp.indice_falhas_percent ?? 0;
              const duplasPct = dp.indice_duplas_percent ?? 0;
              const notaPlantabilidade = Math.min(10, Math.max(0, 10 - (cv / 5) - (falhasPct / 10) - (duplasPct / 15)));
              return (
              <>
                <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                  <div className="card-title"><span className="card-title-icon">✅</span> Classificação automática — Qualidade do plantio (referência)</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                    <div><span className="info-label">Qualidade do plantio</span><div style={{ fontSize: '1.1rem', fontWeight: 700, color: cv < 10 ? 'var(--success)' : cv < 25 ? 'var(--warning)' : 'var(--danger)' }}>{qualidade}</div></div>
                    <div><span className="info-label">CV%</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(cv)}%</div></div>
                    <div><span className="info-label">Faixa ideal</span><div style={{ fontSize: '0.95rem' }}>{faixaIdeal}</div></div>
                    <div className="nota-plantabilidade-box" style={{ marginLeft: 'auto', background: 'var(--primary-bg)', padding: '8px 14px', borderRadius: 10, border: '1px solid var(--primary)' }}>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600 }}>Índice de Plantabilidade</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>{formatDecimal2(notaPlantabilidade)} / 10</div>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.5rem' }}><strong>Referência (classificação automática):</strong> {interpretacao}</p>
                  <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>Baseado em CV%, falhas e duplas.</p>
                </div>
                {/* Diagnóstico agronômico — interpretação + recomendação */}
                <div className="card diagnostico-agronomico-card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                  <div className="card-title"><span className="card-title-icon">📋</span> Diagnóstico agronômico</div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: '0.75rem' }}>
                    {cv < 10 && `CV%: ${fmt(cv)}% (Excelente). Distribuição de sementes uniforme. Baixa ocorrência de falhas.`}
                    {cv >= 10 && cv < 25 && `CV%: ${fmt(cv)}% (${cv < 15 ? 'Bom' : 'Regular'}). ${falhasPct > 5 ? 'Atenção a falhas.' : 'Distribuição dentro do esperado.'}`}
                    {cv >= 25 && `CV% elevado (${fmt(cv)}%). ${falhasPct > 5 ? 'Alta ocorrência de falhas. Possível excesso de velocidade de plantio.' : 'Desuniformidade. Verificar regulagem e condições de solo.'}`}
                  </p>
                  <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', margin: 0 }}>
                    Recomendação: {recomendacao}
                  </p>
                </div>
              </>
              );
            })()}
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div className="card card-dados-plantio-compact">
                <div className="card-title"><span className="card-title-icon">📋</span> Informações principais</div>
                <div className="info-row"><span className="info-label">Cultura</span><span className="info-value">{dp.cultura ?? '—'}</span></div>
                <div className="info-row"><span className="info-label">Híbrido/Variedade</span><span className="info-value">{dp.hibrido ?? '—'}</span></div>
                <div className="info-row"><span className="info-label">Data de plantio</span><span className="info-value">{dp.data_plantio ? formatDate(dp.data_plantio) : '—'}</span></div>
                <div className="info-row"><span className="info-label">Data de emergência</span><span className="info-value">{dp.data_emergencia ? formatDate(dp.data_emergencia) : '—'}</span></div>
                <div className="info-row"><span className="info-label">Ciclo (DAE/DAP)</span><span className="info-value">{dp.dae != null ? `${dp.dae} dias` : (dp.dap != null ? `${dp.dap} dias` : '—')}</span></div>
                <div className="info-row"><span className="info-label">Estádio fenológico</span><span className="info-value" style={dp.estagio_atual ? { fontWeight: 700, color: 'var(--primary)' } : undefined}>{dp.estagio_atual ?? '—'}</span></div>
                <div className="info-row"><span className="info-label">Espaçamento entre linhas</span><span className="info-value">{dp.espacamento_entre_linhas_m != null ? `${fmt(dp.espacamento_entre_linhas_m)} m` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Espaçamento médio entre plantas</span><span className="info-value">{dp.espacamento_medio_cm != null ? `${fmt(dp.espacamento_medio_cm)} cm` : '—'}</span></div>
              </div>
              <div className="card card-dados-plantio-compact">
                <div className="card-title"><span className="card-title-icon">📊</span> Qualidade do plantio</div>
                <div className="info-row"><span className="info-label">CV de plantio</span><span className="info-value" style={dp.cv_classificacao ? { fontWeight: 700 } : undefined}>{dp.cv_percent != null ? `${fmt(dp.cv_percent)}%` : '—'}{dp.cv_classificacao ? ` (${dp.cv_classificacao})` : ''}</span></div>
                <div className="info-row"><span className="info-label">Índice de falhas</span><span className="info-value">{dp.indice_falhas_percent != null ? `${fmt(dp.indice_falhas_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Índice de duplas</span><span className="info-value">{dp.indice_duplas_percent != null ? `${fmt(dp.indice_duplas_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Eficiência do estande</span><span className="info-value">{dp.eficiencia_estande_percent != null ? `${fmt(dp.eficiencia_estande_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Plantas contadas / metros amostrados</span><span className="info-value">{dp.plantas_contadas != null && dp.metros_amostrados != null ? `${fmtInt(dp.plantas_contadas)} plantas em ${fmt(dp.metros_amostrados)} m` : (dp.plantas_contadas != null ? fmtInt(dp.plantas_contadas) : (dp.metros_amostrados != null ? `${fmt(dp.metros_amostrados)} m` : '—'))}</span></div>
              </div>
            </div>
            {/* 3️⃣ Diagnóstico do estande — números + recomendações padrão (referência) */}
            {dp.populacao_desejada != null && dp.populacao_real != null && (
              <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--warning)' }}>
                <div className="card-title"><span className="card-title-icon">📉</span> Diagnóstico do estande (referência)</div>
                {(() => {
                  const alvo = dp.populacao_desejada;
                  const real = dp.populacao_real;
                  const perda = Math.max(0, alvo - real);
                  const perdaPct = alvo > 0 ? (perda / alvo) * 100 : 0;
                  const impactoScHa = perda > 0 ? (perda / 1000) * 0.4 : 0;
                  const recomendacoes = perda > 5000
                    ? ['Revisar pressão da roda compactadora', 'Conferir profundidade de plantio', 'Avaliar regulagem do dosador']
                    : perda > 2000
                      ? ['Conferir regulagem do dosador', 'Verificar condições de palhada']
                      : ['Manter monitoramento do estande'];
                  return (
                    <>
                      <div className="info-row"><span className="info-label">População alvo</span><span className="info-value">{fmtInt(alvo)} plantas/ha</span></div>
                      <div className="info-row"><span className="info-label">População real</span><span className="info-value">{fmt(real)} plantas/ha</span></div>
                      <div className="info-row"><span className="info-label">Perda estimada</span><span className="info-value" style={{ color: perda > 0 ? 'var(--warning)' : undefined }}>{fmtInt(perda)} plantas/ha</span></div>
                      {perda > 0 && (
                        <>
                          <div className="info-row"><span className="info-label">Impacto produtivo estimado</span><span className="info-value" style={{ color: 'var(--danger)' }}>-{formatDecimal2(impactoScHa)} sc/ha</span></div>
                          <p style={{ fontSize: '0.85rem', marginTop: '0.75rem', marginBottom: '0.5rem', fontWeight: 600 }}>Recomenda-se:</p>
                          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.85rem', lineHeight: 1.7 }}>
                            {recomendacoes.map((r, i) => <li key={i}>✔ {r}</li>)}
                          </ul>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            {/* 2️⃣ Linha de plantabilidade — gráfico técnico + métricas */}
            {Array.isArray(dp.linha_plantabilidade) && dp.linha_plantabilidade.length > 0 && (
              <>
            <div className="section-divider">Gráfico de plantio · Simulação do sulco · Tabela de dados</div>
            {(() => {
              const lin = dp.linha_plantabilidade;
              const total = lin.length;
              const ok = lin.filter(p => p.tipo === 'ok').length;
              const duplas = lin.filter(p => p.tipo === 'dupla').length;
              const triplas = lin.filter(p => p.tipo === 'tripla').length;
              const falhas = lin.filter(p => p.tipo === 'falha').length;
              const pct = (n: number) => total > 0 ? formatDecimal2((n / total) * 100) : '0';
              const maxCm = Math.max(...lin.map(p => p.espacamento_cm), 1);
              const mediaCm = lin.reduce((s, p) => s + p.espacamento_cm, 0) / total;
              const idealCm = dp.espacamento_medio_cm ?? mediaCm;
              const bucketSize = 2;
              const minC = Math.floor(Math.min(...lin.map(p => p.espacamento_cm)) / bucketSize) * bucketSize;
              const maxC = Math.ceil(Math.max(...lin.map(p => p.espacamento_cm)) / bucketSize) * bucketSize;
              const buckets: { label: string; count: number }[] = [];
              for (let b = minC; b < maxC; b += bucketSize) {
                const count = lin.filter(p => p.espacamento_cm >= b && p.espacamento_cm < b + bucketSize).length;
                if (count > 0) buckets.push({ label: `${b}–${b + bucketSize} cm`, count });
              }
              const classLabel = (t: string) => t === 'ok' ? 'OK' : t === 'dupla' ? 'Dupla' : t === 'tripla' ? 'Tripla' : 'Falha';
              return (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-title"><span className="card-title-icon">📐</span> Distribuição de espaçamento entre plantas</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  Linha de referência (ideal): <strong style={{ color: 'var(--primary)' }}>{formatDecimal2(idealCm)} cm</strong>
                  {' · '}Espaçamento real (média): <strong>{formatDecimal2(mediaCm)} cm</strong>. Cada segmento = semente. 🟢 OK · 🟡 Dupla · 🟣 Tripla · 🔴 Falha.
                </p>
                <div style={{ overflowX: 'auto', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'stretch', gap: 0, minWidth: 'max-content', height: 28 }}>
                    {lin.slice(0, 50).map((p, i) => {
                      const cor = p.tipo === 'ok' ? '#22c55e' : p.tipo === 'dupla' ? '#eab308' : p.tipo === 'tripla' ? '#a855f7' : '#ef4444';
                      const widthPct = Math.max(8, (p.espacamento_cm / maxCm) * 25);
                      return (
                        <span key={i} title={`${p.espacamento_cm.toFixed(1)} cm — ${p.tipo}`} style={{ display: 'inline-block', minWidth: 4, width: `${widthPct}px`, backgroundColor: cor, borderRadius: 2, marginRight: 1 }} />
                      );
                    })}
                    {lin.length > 50 && <span style={{ alignSelf: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>+{lin.length - 50} pontos</span>}
                  </div>
                </div>
                {/* Simulação do sulco — didática */}
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.75rem', marginBottom: 4 }}>Simulação do sulco</p>
                <div style={{ fontFamily: 'monospace', fontSize: '1rem', letterSpacing: 2, marginBottom: 4 }}>
                  | {lin.slice(0, 40).map((p, i) => (
                    <React.Fragment key={i}>{i > 0 ? ' ' : ''}{p.tipo === 'falha' ? <span style={{ color: 'var(--text-muted)' }}>⬜</span> : (p.tipo === 'dupla' || p.tipo === 'tripla') ? '🌱🌱' : '🌱'}</React.Fragment>
                  ))} |
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>🌱 normal · 🌱🌱 dupla/tripla · ⬜ falha</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem' }}>
                  <span><strong>Total avaliado:</strong> {total} sementes</span>
                  <span style={{ color: '#22c55e' }}>OK: {ok} ({pct(ok)}%)</span>
                  <span style={{ color: '#eab308' }}>Duplas: {duplas} ({pct(duplas)}%)</span>
                  <span style={{ color: '#a855f7' }}>Triplas: {triplas} ({pct(triplas)}%)</span>
                  <span style={{ color: '#ef4444' }}>Falhas: {falhas} ({pct(falhas)}%)</span>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e', marginRight: 4 }} /> OK</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308', marginRight: 4 }} /> Duplas</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a855f7', marginRight: 4 }} /> Triplas</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', marginRight: 4 }} /> Falhas</span>
                </div>
                {/* Histograma de espaçamento */}
                {buckets.length > 0 && (
                  <>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, marginTop: '1rem', marginBottom: 6 }}>Distribuição de espaçamento</p>
                    <div style={{ fontSize: '0.8rem', marginBottom: '1rem' }}>
                      {buckets.map((b, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ width: 90, flexShrink: 0 }}>{b.label}</span>
                          <span style={{ background: 'var(--primary)', height: 14, borderRadius: 4, width: `${Math.max(10, (b.count / total) * 120)}px`, minWidth: 4 }} />
                          <span style={{ color: 'var(--text-muted)' }}>{b.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {/* Tabela detalhada — semente, espaçamento, classificação */}
                <p style={{ fontSize: '0.75rem', fontWeight: 600, marginBottom: 6 }}>Tabela de dados</p>
                <div style={{ overflowX: 'auto', maxHeight: 200, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Semente</th>
                        <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 600 }}>Espaçamento</th>
                        <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 600 }}>Classificação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lin.slice(0, 100).map((p, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--bg)' }}>
                          <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{formatDecimal2(p.espacamento_cm)} cm</td>
                          <td style={{ padding: '6px 8px' }}>{classLabel(p.tipo)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {lin.length > 100 && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>Exibindo 100 de {lin.length}.</p>}
                </div>
              </div>
              );
            })()}
              </>
            )}
            {/* Evolução fenológica (tabela) */}
            {Array.isArray(dp.evolucao_fenologica) && dp.evolucao_fenologica.length > 0 && (
              <>
                {/* 5️⃣ Linha do tempo da lavoura */}
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-title"><span className="card-title-icon">📅</span> Linha do tempo da lavoura</div>
                  <div style={{ overflowX: 'auto', padding: '12px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, minWidth: 'max-content' }}>
                      {dp.data_plantio && (
                        <>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Plantio</span>
                          <span style={{ margin: '0 8px', color: 'var(--text-muted)' }}>───</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(dp.data_plantio)}</span>
                          <span style={{ margin: '0 12px', color: 'var(--text-muted)' }}>───</span>
                        </>
                      )}
                      {dp.evolucao_fenologica.map((ev, i) => (
                        <React.Fragment key={i}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{ev.estagio ?? `Estágio ${i + 1}`}</span>
                          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>───</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{ev.data ? formatDate(ev.data) : (ev.dae != null ? `${ev.dae} DAE` : '—')}</span>
                          {i < dp.evolucao_fenologica!.length - 1 && <span style={{ margin: '0 12px', color: 'var(--text-muted)' }}>───</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="card" style={{ marginBottom: '1rem' }}>
                  <div className="card-title"><span className="card-title-icon">🌱</span> Evolução fenológica</div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>Data</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>DAE</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>DAP</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>Estágio</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>Altura (cm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dp.evolucao_fenologica.map((ev, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px' }}>{ev.data ? formatDate(ev.data) : '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{ev.dae ?? '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{ev.dap ?? ev.dae ?? '—'}</td>
                            <td style={{ padding: '8px 12px', fontWeight: 600 }}>{ev.estagio ?? '—'}</td>
                            <td style={{ padding: '8px 12px' }}>{ev.altura_cm != null ? formatDecimal2(ev.altura_cm) : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
            {/* Resumo estágio atual quando não há tabela */}
            {dp.estagio_atual && (!Array.isArray(dp.evolucao_fenologica) || dp.evolucao_fenologica.length === 0) && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-title"><span className="card-title-icon">🌱</span> Estágio atual</div>
                <div className="info-row"><span className="info-label">Estágio</span><span className="info-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>{dp.estagio_atual}</span></div>
                <div className="info-row"><span className="info-label">DAE / DAP</span><span className="info-value">{dp.dae != null ? `${dp.dae} dias` : '—'}</span></div>
              </div>
            )}
            {/* Relação Plantio × Infestação (insight) */}
            {((dp.cv_percent != null && dp.cv_percent > 25) || (dp.indice_falhas_percent != null && dp.indice_falhas_percent > 5)) && (primeiroTalhao?.pontos?.length ?? 0) > 0 && (
              <div className="card" style={{ background: 'var(--surface-muted)', borderColor: 'var(--primary-muted)' }}>
                <div className="card-title"><span className="card-title-icon">🔗</span> Relação Plantio × Monitoramento</div>
                <p style={{ fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                  {(dp.cv_percent != null && dp.cv_percent > 25) && (dp.indice_falhas_percent != null && dp.indice_falhas_percent > 5)
                    ? 'Alta variabilidade de plantio (CV% e falhas) pode favorecer reboleiras e plantas daninhas. Recomenda-se monitorar com maior frequência áreas com falhas e duplas.'
                    : (dp.cv_percent != null && dp.cv_percent > 25)
                      ? 'CV% de plantio elevado indica desuniformidade. Considere correlacionar pontos de maior infestação com áreas de maior variabilidade de estande.'
                      : 'Áreas com falhas de estande podem apresentar maior pressão de plantas daninhas. O monitoramento fitossanitário complementa a análise do plantio.'}
                </p>
              </div>
            )}
            {/* Diagnóstico do Agrônomo: apenas conteúdo do responsável técnico — sem texto fictício do sistema */}
            {/* Removido: parágrafo gerado automaticamente. Observações e parecer vêm somente de observacoes/diagnostico_tecnico do payload. */}
            {/* Simulação de produtividade: valor da qualidade do plantio */}
            {dp.cv_percent != null && dp.cv_percent < 20 && potencialProdutivo && (
              <div className="card" style={{ marginTop: '1rem', borderLeft: '4px solid var(--success)' }}>
                <div className="card-title"><span className="card-title-icon">📈</span> Simulação de produtividade</div>
                <p style={{ fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
                  Com CV de {fmt(dp.cv_percent)}%, o potencial produtivo estimado está na faixa de {potencialProdutivo.min} – {potencialProdutivo.max} sc/ha.
                  Se o CV fosse 20%, a produtividade estimada cairia para aproximadamente {Math.round((potencialProdutivo.min + potencialProdutivo.max) / 2 * 0.88)} – {Math.round((potencialProdutivo.min + potencialProdutivo.max) / 2 * 0.92)} sc/ha, evidenciando o valor da qualidade do plantio.
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* 8️⃣ Ranking de desempenho da lavoura (múltiplos talhões) */}
      {normalized.talhoes.length > 1 && (
        <div id="ranking-talhoes" className="card pdf-keep-together" style={{ marginTop: '1.5rem' }}>
          <div className="section-heading">📊 Ranking de desempenho da lavoura</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Talhão</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Área (ha)</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Produtividade estimada</th>
                </tr>
              </thead>
              <tbody>
                {normalized.talhoes
                  .map(t => ({ talhao: t, metricas: calcularMetricasTalhao(t) }))
                  .sort((a, b) => (b.talhao.area_ha ?? 0) - (a.talhao.area_ha ?? 0))
                  .map(({ talhao }) => {
                    const raw = Array.isArray(relatorio.talhoes) ? (relatorio.talhoes as Record<string, unknown>[]).find((t: Record<string, unknown>) => String(t?.id ?? '') === talhao.id) : undefined;
                    const prodEst = raw?.produtividade_estimada ?? (raw as any)?.produtividade_estimada_sc_ha;
                    return (
                      <tr key={talhao.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{talhao.nome}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{talhao.area_ha > 0 ? formatDecimal2(talhao.area_ha) : '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{typeof prodEst === 'number' ? `${formatDecimal2(prodEst)} sc/ha` : (typeof prodEst === 'string' ? prodEst : '—')}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: 0 }}>Quando disponível, a produtividade estimada é enviada pelo app.</p>
        </div>
      )}

      {/* #monitoramento — Ciclo + Visita + Clima (base: relatorio.html) */}
      <div id="monitoramento" className="pdf-keep-together">
        <div className="section-heading">🔬 Visita de Monitoramento</div>
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          <div className="stat-card">
            <div className="stat-label">Método</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', marginTop: 6, lineHeight: 1.3 }}>{metodoAmostragem}</div>
            <div className="stat-unit">Padrão técnico</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pontos amostrados</div>
            <div className="stat-value">{String(metricasTalhao?.totalPontos ?? metricasGlobais?.totalPontos ?? primeiroTalhao?.pontos?.length ?? '—')}</div>
            <div className="stat-unit">pontos de coleta</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-title"><span className="card-title-icon">🌱</span> Ciclo da Cultura</div>
            <div className="info-row"><span className="info-label">Safra</span><span className="info-value">{normalized.safra}</span></div>
            <div className="info-row"><span className="info-label">Cultura</span><span className="info-value">{dadosPlantioExibir?.cultura ?? primeiroTalhao.cultura}</span></div>
            <div className="info-row"><span className="info-label">Híbrido</span><span className="info-value">{dadosPlantioExibir?.hibrido ?? primeiroTalhao.variedade ?? '—'}</span></div>
            {(() => {
              const contextoSafra = (relatorio as any).contextoSafra ?? (relatorio as any).contexto_safra;
              const fenologia = (relatorio as any).fenologia ?? {};
              const talhaoRaw = (Array.isArray(relatorio.talhoes) && (relatorio.talhoes as any[])[0]) || {};
              const dataSemeaduraRaw = contextoSafra?.dataPlantio ?? contextoSafra?.data_plantio ?? talhaoRaw.dataPlantio ?? talhaoRaw.data_plantio ?? dadosPlantioExibir?.data_plantio;
              const dataEmergenciaRaw = (fenologia as any).dataEmergencia ?? (fenologia as any).data_emergencia ?? dadosPlantioExibir?.data_emergencia;
              const daeCiclo = contextoSafra?.dae ?? (fenologia as any).dae ?? primeiroTalhao.dae ?? dadosPlantioExibir?.dae;
              const estadioCiclo = (fenologia as any).estadio ?? (fenologia as any).estagio ?? primeiroTalhao.estagio ?? dadosPlantioExibir?.estagio_atual;
              return (
                <>
                  <div className="info-row"><span className="info-label">Data de semeadura</span><span className="info-value">{dataSemeaduraRaw ? (formatDate(String(dataSemeaduraRaw)) || String(dataSemeaduraRaw)) : '—'}</span></div>
                  <div className="info-row"><span className="info-label">Data de emergência</span><span className="info-value">{dataEmergenciaRaw ? (formatDate(String(dataEmergenciaRaw)) || String(dataEmergenciaRaw)) : '—'}</span></div>
                  <div className="info-row"><span className="info-label">DAE</span><span className="info-value">{daeCiclo != null ? `${daeCiclo} dias` : '—'}</span></div>
                  <div className="info-row"><span className="info-label">Estádio fenológico</span><span className="info-value" style={{ color: 'var(--primary)', fontWeight: 700 }}>{estadioCiclo || '—'}</span></div>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Observações e anotações do responsável técnico — apenas conteúdo do payload (nunca texto fictício do sistema) */}
      <div id="observacoes-tecnico" className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title"><span className="card-title-icon">📝</span> Observações e anotações do responsável técnico</div>
        {observacoes && observacoes.trim() ? (
          <div style={{ padding: '0.9rem', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--primary)', fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {observacoes}
          </div>
        ) : (
          <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0 }}>
            Nenhuma observação registrada pelo responsável técnico.
          </p>
        )}
      </div>

      {/* Plano de Aplicação */}
      {resumoRecomendacoes.length > 0 && (
        <div className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title">Plano de Aplicação</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Produto</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Dose</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Organismos alvo</th>
                  <th style={{ textAlign: 'left', padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Manejo</th>
                </tr>
              </thead>
              <tbody>
                {resumoRecomendacoes.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg)' }}>
                    <td style={{ padding: '12px', fontWeight: 600, color: 'var(--text-main)' }}>{r.produto || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.dose || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{r.organismos.join(', ') || '—'}</td>
                    <td style={{ padding: '12px', color: 'var(--text-muted)', maxWidth: 280 }}>{r.manejo || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* #pragas — Análise de Pragas */}
      <div id="pragas" className="pdf-keep-together">
        <div className="section-heading">🐛 Análise de Pragas</div>
        <div style={{ padding: 20 }}>
          {pragasComRecomendacao.length === 0 ? (
            <p className="card" style={{ padding: '1.5rem', color: 'var(--text-muted)', margin: 0 }}>Nenhuma praga ou doença registrada nesta visita.</p>
          ) : (
            <div className="grid-2">
              {pragasComRecomendacao.map((p, idx) => {
                const sev = p.severidadeMedia;
                const badgeClass = sev < 10 ? 'baixo' : sev < 25 ? 'moderado' : sev < 40 ? 'alto' : 'critico';
                return (
                  <div key={idx} className="pest-card pdf-keep-together">
                    <div className="pest-header">
                      <div>
                        <div className="pest-name">{p.nome}</div>
                        <div className="pest-cat">{TIPO_LABEL[p.tipo]} · Distribuição nos pontos amostrados</div>
                      </div>
                      <span className={`severity-badge ${badgeClass}`}>{sev < 10 ? '✓' : '⚠️'} {severidadeLabel(sev)}</span>
                    </div>
                    {p.imagem && (
                      <div className="no-print" style={{ marginBottom: '1rem', position: 'relative' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.imagem} alt={p.nome} style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                        <button type="button" onClick={() => setGaleriaModal({ url: p.imagem!, descricao: `${p.nome} — ${TIPO_LABEL[p.tipo]}` })} style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'pointer' }} aria-label="Ampliar" />
                      </div>
                    )}
                    <div className="pest-metrics">
                      <div className="pest-metric">
                        <div className="pest-metric-val">{p.quantidadeMedia != null ? formatDecimal2(p.quantidadeMedia) : '—'}</div>
                        <div className="pest-metric-lbl">méd./ponto</div>
                      </div>
                      <div className="pest-metric">
                        <div className="pest-metric-val">{p.percentual}%</div>
                        <div className="pest-metric-lbl">plantas afetadas</div>
                      </div>
                      {p.observacao && (
                        <div className="pest-metric" style={{ gridColumn: '1 / -1', textAlign: 'left' }}>
                          <div className="pest-metric-val" style={{ fontSize: '1rem', lineHeight: 1.4 }}>{p.observacao}</div>
                          <div className="pest-metric-lbl">dano observado</div>
                        </div>
                      )}
                    </div>
                    <div className="action-bar" style={{ borderLeftColor: badgeClass === 'baixo' ? 'var(--success)' : 'var(--warning)' }}>
                      <div>
                        <div className="action-type">Recomendação: {String(p.produto)} · Dose: {String(p.dose)}</div>
                        <div className="action-deadline">{p.manejo}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Tabela Técnica Detalhada: Ponto, Tipo, Infestação, Terço, Quantidade, Severidade, Data — com filtro por tipo */}
          {tabelaTecnicaRows.length > 0 && (
            <div className="card pdf-keep-together" style={{ marginTop: '1.5rem' }}>
              <div className="card-title">📋 Tabela Técnica Detalhada</div>
              <div className="no-print" style={{ marginBottom: '1rem' }}>
                <label htmlFor="filtro-tipo-pragas" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginRight: 8 }}>Filtrar por tipo:</label>
                <select
                  id="filtro-tipo-pragas"
                  value={filtroTipoPragas}
                  onChange={(e) => setFiltroTipoPragas((e.target.value as TipoOrganismo | 'todos'))}
                  style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.9rem', background: 'var(--white)' }}
                >
                  <option value="todos">Todos</option>
                  <option value="praga">Praga</option>
                  <option value="doenca">Doença</option>
                  <option value="daninha">Daninha</option>
                </select>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Ponto</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Tipo</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Infestação</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Terço</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Quantidade</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Severidade</th>
                      <th style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--text-muted)' }}>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabelaTecnicaFiltrada.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{row.ponto}</td>
                        <td style={{ padding: '10px 12px' }}>{TIPO_LABEL[row.tipo]}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{row.infestacao}</td>
                        <td style={{ padding: '10px 12px' }}>{row.terco}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.quantidade != null ? formatDecimal2(row.quantidade) : '—'}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.severidade != null ? `${row.severidade}%` : '—'}</td>
                        <td style={{ padding: '10px 12px' }}>{row.data}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* #risco — Avaliação de Risco e Suporte à Decisão */}
      <div id="risco" className="pdf-keep-together">
        <div className="section-heading">📊 Avaliação de Risco e Suporte à Decisão</div>
        <div className="grid-2">
          <div className="card">
            <div className="card-title"><span className="card-title-icon">⚠️</span> Score de Risco Global</div>
            <div className="risk-gauge-wrap">
              <div className="gauge-ring">
                <svg viewBox="0 0 120 120">
                  <circle className="gauge-track" cx="60" cy="60" r="50" />
                  <circle className={`gauge-fill ${gaugeFillClass}`} cx="60" cy="60" r="50" strokeDasharray={314} strokeDashoffset={strokeDashoffset} />
                </svg>
                <div className="gauge-label">{riscoNum}</div>
              </div>
              <div className="gauge-sub">Risco <strong>{riscoLabel}</strong> — Prioridade: {riscoNum >= 50 ? 'Monitorar' : 'Acompanhar'}</div>
            </div>
            <div className="info-row" style={{ marginTop: '1rem' }}>
              <span className="info-label">Decisão recomendada</span>
              <span className="info-value">{riscoNum >= 50 ? '🔍 Monitorar' : riscoNum >= 25 ? 'Acompanhar' : 'Controle adequado'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Próxima visita técnica</span>
              <span className="info-value" style={{ color: 'var(--warning)', fontWeight: 600 }}>{proximaVisita}</span>
            </div>
          </div>
          {alertas.length > 0 ? (
            <div className="card">
              <div className="card-title"><span className="card-title-icon">🧠</span> Inteligência de Dados</div>
              {alertas.map((a, i) => (
                <div key={i} className="insight-item">
                  <span className="insight-icon">💡</span>
                  <span className="insight-text">{a}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div id="auditoria" className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title"><span className="card-title-icon">🔒</span> Auditoria técnica</div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Relatório gerado por FortSmart Monitoramento Agrícola. Dados da avaliação e inspeção abaixo.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.88rem' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Responsável técnico</div>
            <div>{normalized.tecnico}{normalized.crea ? ` · ${normalized.crea}` : ''}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Data da avaliação</div>
            <div>{normalized.data || '—'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Coordenadas da inspeção</div>
            <div>{(primeiroTalhao?.pontos?.length ?? 0) > 0 ? `${primeiroTalhao!.pontos.length} pontos georreferenciados registrados` : '—'}</div>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>Registros fotográficos</div>
            <div>{imagens.length > 0 ? `${imagens.length} foto(s) anexada(s)` : 'Nenhuma foto anexada'}</div>
          </div>
        </div>
      </div>

      {/* Registros fotográficos */}
      {imagens.length > 0 && (
        <div className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title">Registros fotográficos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {imagens.filter(img => img.url).map((img, i) => (
              <button key={i} type="button" onClick={() => setGaleriaModal({ url: img.url!, descricao: img.descricao })} className="no-print" style={{ padding: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'transparent' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.descricao ?? `Foto ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal de zoom (galeria + imagens das pragas) */}
      {galeriaModal && (
        <ModalImagem
          src={galeriaModal.url}
          descricao={galeriaModal.descricao}
          onClose={() => setGaleriaModal(null)}
        />
      )}
    </RelatorioLayoutEnterprise>
  );
}
