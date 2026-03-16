'use client';

import React, { useMemo, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { MapaLayersVisible, MapaInterativoRef } from './MapaInterativo';
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
import { formatPercent2, formatDecimal2, formatDate } from '@/utils/format';
import ModalImagem from './ModalImagem';
import RelatorioLayoutEnterprise from './RelatorioLayoutEnterprise';
import RelatorioSection from './RelatorioSection';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

const defaultMapaLayers: MapaLayersVisible = {
  poligono: true,
  pontos: true,
  heatmap: true,
  fotos: true,
  falhas: true,
  duplos: true,
  observacoes: true,
};

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
  const linhaRaw = (pb?.linha ?? pb?.espacamentosIndividuais ?? pb?.espacamentos_individuais ?? pb?.distancias_entre_sementes ?? pb?.espacamentos) as unknown;
  let linha_plantabilidade: DadosPlantioMonitoramento['linha_plantabilidade'] = undefined;
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

export default function RelatorioFitossanitarioContent({ relatorio, reportId, relatorioUuid }: RelatorioFitossanitarioContentProps) {
  const normalized = useMemo((): RelatorioMonitoramento => {
    const prop = (relatorio.propriedade != null && typeof relatorio.propriedade === 'object') ? relatorio.propriedade as Record<string, unknown> : undefined;
    const meta = (relatorio.meta != null && typeof relatorio.meta === 'object') ? relatorio.meta as Record<string, unknown> : undefined;
    const perfilFaz = (relatorio as any).perfil_fazenda ?? (relatorio as any).fazenda_perfil ?? (relatorio as any).perfilFazenda;
    const fazendaNome = (perfilFaz && typeof perfilFaz === 'object' && (perfilFaz as any).nome) ?? (perfilFaz as any)?.fazenda;
    const fazenda = String(
      fazendaNome
      ?? relatorio.fazenda
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
      ?? prop?.tecnico
      ?? (prop as any)?.agronomo
      ?? (prop as any)?.nome_tecnico
      ?? meta?.tecnico
      ?? (meta as any)?.agronomo
      ?? (meta as any)?.nome_tecnico
      ?? 'FortSmart Agro'
    ).trim() || 'FortSmart Agro';
    const crea = String(
      relatorio.crea ?? relatorio.tecnico_crea ?? meta?.tecnicoCrea ?? meta?.crea ?? prop?.crea ?? ''
    ).trim() || undefined;
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
  const perfilFazenda = (relatorio as any).perfil_fazenda ?? (relatorio as any).fazenda_perfil ?? (relatorio as any).perfilFazenda;
  const primeiroTalhaoRaw = (Array.isArray(relatorio.talhoes) && relatorio.talhoes.length > 0 ? relatorio.talhoes[0] : relatorio.talhao) as Record<string, unknown> | undefined;
  const municipio = (
    (perfilFazenda && typeof perfilFazenda === 'object' && (perfilFazenda as any).municipio) ?? (perfilFazenda as any)?.cidade
    ?? propRaw?.municipio ?? (propRaw as any)?.cidade ?? (propRaw as any)?.municipio_nome
    ?? (relatorio as any).municipio ?? (relatorio as any).cidade ?? (relatorio as any).municipio_nome
    ?? primeiroTalhaoRaw?.municipio ?? (primeiroTalhaoRaw as any)?.cidade ?? (primeiroTalhaoRaw as any)?.municipio_nome
  ) as string;
  const estado = (
    (perfilFazenda && typeof perfilFazenda === 'object' && (perfilFazenda as any).estado) ?? (perfilFazenda as any)?.uf
    ?? propRaw?.estado ?? (propRaw as any)?.uf ?? (propRaw as any)?.estado_sigla
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
  const [mapaLayers, setMapaLayers] = useState<MapaLayersVisible>({ ...defaultMapaLayers });
  const mapaApiRef = useRef<MapaInterativoRef | null>(null);

  const handleExportExcel = () => {
    const dp = dadosPlantioExibir as DadosPlantioMonitoramento | undefined;
    const rows: string[][] = [
      ['Indicador', 'Resultado', 'Ideal'],
      ['População', dp?.populacao_real != null ? String(Math.round(dp.populacao_real)) : '—', dp?.populacao_desejada != null ? String(Math.round(dp.populacao_desejada)) : '—'],
      ['CV%', dp?.cv_percent != null ? `${formatDecimal2(dp.cv_percent)}%` : '—', '<25%'],
      ['Falhas', dp?.indice_falhas_percent != null ? `${formatDecimal2(dp.indice_falhas_percent)}%` : '—', '<10%'],
      ['Duplos', dp?.indice_duplas_percent != null ? `${formatDecimal2(dp.indice_duplas_percent)}%` : '—', '<15%'],
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `relatorio-${normalized.talhoes[0]?.nome ?? 'talhao'}-${normalized.safra ?? 'safra'}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `Relatório ${normalized.talhoes[0]?.nome ?? 'Talhão'} — FortSmart`,
        text: `Relatório de Monitoramento Fitossanitário · ${normalized.fazenda} · ${normalized.safra}`,
        url: typeof window !== 'undefined' ? window.location.href : '',
      }).catch(() => {});
    } else if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href).then(() => {});
    }
  };
  /** Imagens: relatorio.imagens (url + descricao) ou fallback fotos/registros_fotograficos; aceita url absoluta ou data: URL */
  const imagens = useMemo((): Array<{ url: string; descricao?: string }> => {
    const from = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string }>;
    if (from.length > 0) {
      return from.filter((img) => img?.url != null && String(img.url).trim() !== '').map((img) => ({ url: String(img.url!).trim(), descricao: img.descricao }));
    }
    const fotos = (relatorio as any).fotos ?? (relatorio as any).registros_fotograficos;
    if (Array.isArray(fotos) && fotos.length > 0) {
      return fotos
        .filter((f: unknown) => f != null && typeof f === 'object' && ((f as any).url ?? (f as any).src))
        .map((f: any) => ({ url: String(f.url ?? f.src ?? '').trim(), descricao: f.descricao ?? f.legenda ?? f.caption }));
    }
    return [];
  }, [relatorio.imagens, (relatorio as any).fotos, (relatorio as any).registros_fotograficos]);

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
      onExportExcel={handleExportExcel}
      onShare={handleShare}
    >
      <RelatorioSection id="resumo" title="Visão Geral" icon="📋" defaultOpen={true}>
      {/* Header único — dados do relatório uma vez (evita duplicação) */}
      <div className="report-header-card report-header-unico pdf-keep-together">
        <h1 className="report-header-titulo">Relatório de Monitoramento Agronômico</h1>
        <div className="report-header-grid">
          <table className="tabela-header-relatorio">
            <tbody>
              <tr><td className="th">Fazenda</td><td>{normalized.fazenda}</td></tr>
              <tr><td className="th">Talhão</td><td>{primeiroTalhao.nome}</td></tr>
              <tr><td className="th">Cultura</td><td>{primeiroTalhao.cultura ?? '—'}{primeiroTalhao.variedade ? ` (${primeiroTalhao.variedade})` : ''}</td></tr>
              <tr><td className="th">Área</td><td>{primeiroTalhao.area_ha > 0 ? `${formatDecimal2(primeiroTalhao.area_ha)} ha` : '—'}</td></tr>
              <tr><td className="th">Safra</td><td>{normalized.safra}</td></tr>
              <tr><td className="th">Data da visita</td><td>{normalized.data}</td></tr>
              <tr><td className="th">Responsável técnico</td><td>{normalized.tecnico}{normalized.crea ? ` · CREA ${normalized.crea}` : ''}</td></tr>
            </tbody>
          </table>
          <div className="report-header-right">
            <div className={`risk-badge ${riskBadgeClass}`}>
              <span>{riscoNum >= 50 ? '⚠️' : riscoNum >= 25 ? '⚠️' : '✓'}</span>
              <div>
                <div className="risk-score">{riscoNum}</div>
                <div style={{ fontSize: '0.7rem', fontWeight: 500 }}>Risco {riscoLabel}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>Próxima visita: {proximaVisita}</div>
          </div>
        </div>
      </div>

      {/* Tabela técnica compacta: Indicador | Resultado | Ideal */}
      {dadosPlantioExibir && (() => {
        const dp = dadosPlantioExibir as DadosPlantioMonitoramento;
        const hasAny = dp.populacao_real != null || dp.populacao_desejada != null || dp.cv_percent != null || dp.indice_falhas_percent != null || dp.indice_duplas_percent != null;
        if (!hasAny) return null;
        const cellClass = (result: number | undefined, idealMax: number) => {
          if (result == null) return '';
          return result <= idealMax ? 'resultado-ok' : result <= idealMax * 1.5 ? 'resultado-alerta' : 'resultado-critico';
        };
        return (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div className="card-title"><span className="card-title-icon">📊</span> Indicadores técnicos</div>
            <table className="tabela-tecnica-compacta">
              <thead>
                <tr>
                  <th>Indicador</th>
                  <th>Resultado</th>
                  <th>Ideal</th>
                </tr>
              </thead>
              <tbody>
                {(dp.populacao_real != null || dp.populacao_desejada != null) && (
                  <tr>
                    <td>População</td>
                    <td>{dp.populacao_real != null ? String(Math.round(dp.populacao_real)) : '—'}</td>
                    <td>{dp.populacao_desejada != null ? String(Math.round(dp.populacao_desejada)) : '—'}</td>
                  </tr>
                )}
                {dp.cv_percent != null && (
                  <tr>
                    <td>CV</td>
                    <td className={cellClass(dp.cv_percent, 25)}>{formatDecimal2(dp.cv_percent)}%</td>
                    <td>&lt;25%</td>
                  </tr>
                )}
                {dp.indice_falhas_percent != null && (
                  <tr>
                    <td>Falhas</td>
                    <td className={cellClass(dp.indice_falhas_percent, 10)}>{formatDecimal2(dp.indice_falhas_percent)}%</td>
                    <td>&lt;10%</td>
                  </tr>
                )}
                {dp.indice_duplas_percent != null && (
                  <tr>
                    <td>Duplos</td>
                    <td className={cellClass(dp.indice_duplas_percent, 15)}>{formatDecimal2(dp.indice_duplas_percent)}%</td>
                    <td>&lt;15%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        );
      })()}

      {/* #resumo-executivo — Resumo Executivo (cartão premium + recomendações) */}
      <div id="resumo-executivo" className="card resumo-executivo-card pdf-keep-together" style={{ marginTop: '1.25rem' }}>
        <div className="card-title resumo-executivo-title"><span className="card-title-icon">📌</span> Resumo Executivo</div>
        <p className="resumo-executivo-text">
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
        {resumoRecomendacoes.length > 0 && (
          <div className="resumo-executivo-recomendacoes">
            <div className="resumo-executivo-recomendacoes-title">Principais recomendações</div>
            <ul className="resumo-executivo-recomendacoes-list">
              {resumoRecomendacoes.slice(0, 5).map((r, i) => (
                <li key={i}>
                  <strong>{r.produto || '—'}</strong> — {r.dose || '—'} · {r.organismos.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}
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

      </RelatorioSection>

      {/* #propriedade — Mapa do Talhão (horizontal, maior área; mobilidade mantida) */}
      <RelatorioSection id="propriedade" title="Mapa do Talhão" icon="🗺️" defaultOpen={true}>
      <div className="mapa-secao-horizontal pdf-keep-together">
        <div className="mapa-secao-top">
          <div className="card card-propriedade-compact">
            <div className="card-title"><span className="card-title-icon">📍</span> Localização</div>
            <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-main)' }}>{municipio && estado ? `${String(municipio)} — ${String(estado)}` : (municipio || estado || '—')}</p>
            <p style={{ fontSize: '0.75rem', margin: '0.5rem 0 0', color: 'var(--text-muted)' }}>Fazenda, talhão e área constam no cabeçalho do relatório.</p>
          </div>
          <div className="mapa-secao-camadas">
            <div className="card-title"><span className="card-title-icon">📍</span> Polígono GPS · Pontos georreferenciados</div>
            <div className="mapa-camadas no-print" style={{ marginBottom: 0 }}>
              <span className="mapa-camadas-label">Camadas:</span>
              {[
                { key: 'poligono' as const, label: 'Polígono do talhão' },
                { key: 'pontos' as const, label: 'Pontos de monitoramento' },
                { key: 'heatmap' as const, label: 'Heatmap' },
                { key: 'fotos' as const, label: 'Fotos' },
                { key: 'falhas' as const, label: 'Falhas (crítico)' },
                { key: 'duplos' as const, label: 'Duplos (2+ ocorr.)' },
                { key: 'observacoes' as const, label: 'Observações' },
              ].map(({ key, label }) => (
                <label key={key} className="mapa-camadas-check">
                  <input
                    type="checkbox"
                    checked={mapaLayers[key] !== false}
                    onChange={(e) => setMapaLayers((prev) => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="card mapa-card-horizontal">
          <div className="map-card-inner map-card-inner-horizontal">
            <MapaInterativo
              pontos={primeiroTalhao.pontos}
              poligono={primeiroTalhao.poligono_geojson}
              talhaoId={primeiroTalhao.id}
              hideHeader
              onImageClick={(url, descricao) => setGaleriaModal({ url, descricao })}
              layersVisible={mapaLayers}
              onMapReady={(api) => { mapaApiRef.current = api; }}
            />
          </div>
          <div className="map-legend-footer">
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#2E7D32' }} /> Baixo (&lt;10%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#F9A825' }} /> Médio (10–25%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#E65100' }} /> Alto (25–40%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#C62828' }} /> Crítico (&gt;40%)</span>
            <span className="map-legend-item"><span className="map-legend-dot" style={{ background: '#94A3B8' }} /> Sem ocorrência</span>
          </div>
          {primeiroTalhao.pontos.length > 0 && (
            <div className="mapa-ocorrencias-list no-print" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ocorrências georreferenciadas</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                {primeiroTalhao.pontos.map((ponto) => {
                  const resumo = ponto.infestacoes.length === 0
                    ? 'Sem ocorrências'
                    : ponto.infestacoes.slice(0, 2).map((i) => `${i.nome} ${i.severidade}%`).join(' · ');
                  const temImagem = ponto.infestacoes.some((i) => i.imagem);
                  const primeiraImagem = ponto.infestacoes.find((i) => i.imagem)?.imagem;
                  return (
                    <div key={ponto.id} className="mapa-ocorrencia-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: 'var(--bg)', borderRadius: 8, fontSize: '0.8rem' }}>
                      <div style={{ minWidth: 0 }}>
                        <strong>{ponto.identificador}</strong>
                        <span style={{ color: 'var(--text-muted)', marginLeft: 6 }}>{resumo}</span>
                        {primeiroTalhao.dae != null && <span style={{ color: 'var(--text-muted)', marginLeft: 4 }}>· {primeiroTalhao.dae} DAE</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn-action outline"
                          style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                          onClick={() => mapaApiRef.current?.flyTo(ponto.lat, ponto.lng)}
                        >
                          Ver no mapa
                        </button>
                        {temImagem && primeiraImagem && (
                          <button
                            type="button"
                            className="btn-action outline"
                            style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                            onClick={() => setGaleriaModal({ url: primeiraImagem, descricao: `${ponto.identificador} · ${resumo}` })}
                          >
                            Ver imagem
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      </RelatorioSection>

      {/* #dados-plantio — Avaliação do Plantio */}
      <RelatorioSection id="dados-plantio" title="Avaliação do Plantio" icon="🌱" defaultOpen={true}>
      {/* Dados do módulo Plantio (estande, CV%, evolução fenológica) */}
      {dadosPlantioExibir && (() => {
        const dp = dadosPlantioExibir;
        const hasAny = dp.cultura || dp.populacao_desejada != null || dp.populacao_real != null || dp.cv_percent != null || dp.estagio_atual || (dp.evolucao_fenologica?.length ?? 0) > 0 || (dp.linha_plantabilidade?.length ?? 0) > 0;
        if (!hasAny) return null;
        const fmt = (n: number | undefined) => n != null ? formatDecimal2(n) : '—';
        const fmtInt = (n: number | undefined) => n != null ? String(Math.round(n)) : '—';
        return (
          <div className="pdf-keep-together" style={{ marginTop: 0 }}>
            <div className="section-heading">🌾 Dados do Plantio</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Dados do módulo Plantio (estande de plantas, CV%, evolução fenológica) referentes ao talhão.
            </p>
            {/* 1️⃣ Classificação automática plantabilidade (referência — não substitui parecer do técnico) */}
            {dp.cv_percent != null && (
              <div className="card" style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)' }}>
                <div className="card-title"><span className="card-title-icon">✅</span> Classificação automática — Qualidade do plantio (referência)</div>
                {(() => {
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
                  const impacto = cv < 10
                    ? 'Impacto produtivo estimado: +1,8 a +3,5 sc/ha comparado a plantios com CV% > 15%.'
                    : cv < 15
                      ? 'Impacto produtivo: dentro da faixa esperada para o padrão técnico.'
                      : cv < 25
                        ? 'Impacto produtivo estimado: potencial de perda de 0,5 a 2 sc/ha em relação a plantio uniforme.'
                        : 'Impacto produtivo estimado: perda de 2 a 5 sc/ha. Priorizar correções na próxima operação.';
                  return (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                        <div><span className="info-label">Qualidade do plantio</span><div style={{ fontSize: '1.1rem', fontWeight: 700, color: cv < 10 ? 'var(--success)' : cv < 25 ? 'var(--warning)' : 'var(--danger)' }}>{qualidade}</div></div>
                        <div><span className="info-label">CV%</span><div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(cv)}%</div></div>
                        <div><span className="info-label">Faixa ideal</span><div style={{ fontSize: '0.95rem' }}>{faixaIdeal}</div></div>
                      </div>
                      <p style={{ fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '0.5rem' }}><strong>Referência (classificação automática):</strong> {interpretacao}</p>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--text-muted)', margin: 0 }}>{impacto}</p>
                    </>
                  );
                })()}
              </div>
            )}
            {/* Tabela técnica única — desenvolvimento e qualidade (evita vários cards) */}
            <div className="card" style={{ marginBottom: '1rem' }}>
              <div className="card-title"><span className="card-title-icon">📋</span> Dados do talhão e desenvolvimento da cultura</div>
              <table className="tabela-tecnica-compacta">
                <thead>
                  <tr><th>Indicador</th><th>Valor</th></tr>
                </thead>
                <tbody>
                  {dp.cultura != null && <tr><td>Cultura</td><td>{dp.cultura}</td></tr>}
                  {dp.hibrido != null && <tr><td>Híbrido/Variedade</td><td>{dp.hibrido}</td></tr>}
                  <tr><td>Data de plantio</td><td>{dp.data_plantio ? formatDate(dp.data_plantio) : '—'}</td></tr>
                  <tr><td>Data de emergência</td><td>{dp.data_emergencia ? formatDate(dp.data_emergencia) : '—'}</td></tr>
                  <tr><td>Estágio da cultura</td><td style={dp.estagio_atual ? { fontWeight: 700, color: 'var(--primary)' } : undefined}>{dp.estagio_atual ?? '—'}</td></tr>
                  <tr><td>DAE</td><td>{dp.dae != null ? `${dp.dae} dias` : '—'}</td></tr>
                  <tr><td>DAP</td><td>{dp.dap != null ? `${dp.dap} dias` : '—'}</td></tr>
                  <tr><td>Espaçamento entre linhas</td><td>{dp.espacamento_entre_linhas_m != null ? `${fmt(dp.espacamento_entre_linhas_m)} m` : '—'}</td></tr>
                  <tr><td>Espaçamento médio entre plantas</td><td>{dp.espacamento_medio_cm != null ? `${fmt(dp.espacamento_medio_cm)} cm` : '—'}</td></tr>
                  <tr><td>População</td><td>{dp.populacao_real != null ? `${fmtInt(dp.populacao_real)} plantas/ha` : (dp.populacao_desejada != null ? `${fmtInt(dp.populacao_desejada)} (alvo)` : '—')}</td></tr>
                  <tr><td>Eficiência do estande</td><td>{dp.eficiencia_estande_percent != null ? `${fmt(dp.eficiencia_estande_percent)}%` : '—'}</td></tr>
                  <tr><td>CV de plantio</td><td style={dp.cv_classificacao ? { fontWeight: 700 } : undefined}>{dp.cv_percent != null ? `${fmt(dp.cv_percent)}%` : '—'}{dp.cv_classificacao ? ` (${dp.cv_classificacao})` : ''}</td></tr>
                  <tr><td>Falhas</td><td>{dp.indice_falhas_percent != null ? `${fmt(dp.indice_falhas_percent)}%` : '—'}</td></tr>
                  <tr><td>Duplos</td><td>{dp.indice_duplas_percent != null ? `${fmt(dp.indice_duplas_percent)}%` : '—'}</td></tr>
                  <tr><td>Plantas contadas / metros amostrados</td><td>{dp.plantas_contadas != null && dp.metros_amostrados != null ? `${fmtInt(dp.plantas_contadas)} plantas em ${fmt(dp.metros_amostrados)} m` : (dp.plantas_contadas != null ? fmtInt(dp.plantas_contadas) : (dp.metros_amostrados != null ? `${fmt(dp.metros_amostrados)} m` : '—'))}</td></tr>
                </tbody>
              </table>
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
            {/* 2️⃣ Qualidade do plantio — Card métricas + gráfico linha + sulco + tabela */}
            {Array.isArray(dp.linha_plantabilidade) && dp.linha_plantabilidade.length > 0 && (() => {
              const lin = dp.linha_plantabilidade;
              const total = lin.length;
              const ok = lin.filter(p => p.tipo === 'ok').length;
              const duplas = lin.filter(p => p.tipo === 'dupla').length;
              const triplas = lin.filter(p => p.tipo === 'tripla').length;
              const falhas = lin.filter(p => p.tipo === 'falha').length;
              const pct = (n: number) => total > 0 ? formatDecimal2((n / total) * 100) : '0';
              const tipoLabel = (t: string) => t === 'ok' ? 'OK' : t === 'dupla' ? 'Dupla' : t === 'tripla' ? 'Tripla' : 'Falha';
              const corDot = (t: string) => t === 'ok' ? '#22c55e' : t === 'dupla' ? '#eab308' : t === 'tripla' ? '#a855f7' : '#ef4444';
              const espacamentoIdeal = dp.espacamento_medio_cm ?? (lin.length > 0 ? lin.reduce((a, p) => a + p.espacamento_cm, 0) / lin.length : undefined);
              const comprimentoAvaliado = dp.metros_amostrados ?? (lin.length > 0 ? (lin.reduce((a, p) => a + p.espacamento_cm, 0) / 100) : undefined);
              const sliceShow = Math.min(lin.length, 25);
              const linShow = lin.slice(0, sliceShow);
              const pxPerCm = 4;
              return (
                <>
                  {/* Card 1 — CV%, Comprimento, Espaçamento ideal */}
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-title"><span className="card-title-icon">📐</span> Qualidade do plantio</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>CV%</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{dp.cv_percent != null ? formatDecimal2(dp.cv_percent) : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Comprimento avaliado</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{comprimentoAvaliado != null ? `${formatDecimal2(comprimentoAvaliado)} m` : '—'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Espaç. ideal</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{espacamentoIdeal != null ? `${formatDecimal2(espacamentoIdeal)} cm` : '—'}</div>
                      </div>
                    </div>
                  </div>
                  {/* Card 2 — Visualização da linha: ●----Xcm----● com largura proporcional ao espaçamento */}
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-title"><span className="card-title-icon">📐</span> Visualização da qualidade do plantio</div>
                    <div style={{ overflowX: 'auto', padding: '12px 0' }}>
                      {/* Linha com pontos e espaçamentos entre eles: ●----31cm----●----41cm----● */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, minWidth: 'max-content', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                        {linShow.map((p, i) => (
                          <React.Fragment key={i}>
                            <span
                              title={`Semente ${i + 1} — ${p.espacamento_cm.toFixed(1)} cm — ${tipoLabel(p.tipo)}`}
                              style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 24, height: 24, borderRadius: '50%', backgroundColor: corDot(p.tipo), color: '#fff', fontWeight: 700, flexShrink: 0,
                              }}
                            >
                              ●
                            </span>
                            {i < linShow.length - 1 && (
                              <span
                                style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  minWidth: Math.max(20, p.espacamento_cm * pxPerCm),
                                  padding: '0 4px',
                                  color: 'var(--text-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ——{p.espacamento_cm.toFixed(0)}cm——
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                        {lin.length > sliceShow && <span style={{ marginLeft: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>+{lin.length - sliceShow} pontos</span>}
                      </div>
                      {/* Linha de bolinhas com espaçamento proporcional ao espacamento (cm) */}
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, marginTop: 10, minWidth: 'max-content' }}>
                        {linShow.map((p, i) => (
                          <React.Fragment key={i}>
                            <span
                              title={`${p.espacamento_cm.toFixed(1)} cm — ${tipoLabel(p.tipo)}`}
                              style={{ display: 'inline-block', width: 14, height: 14, borderRadius: '50%', backgroundColor: corDot(p.tipo), flexShrink: 0 }}
                            />
                            {i < linShow.length - 1 && (
                              <span style={{ display: 'inline-block', minWidth: Math.max(4, p.espacamento_cm * (pxPerCm * 0.4)), flexShrink: 0 }} />
                            )}
                          </React.Fragment>
                        ))}
                        {lin.length > sliceShow && <span style={{ marginLeft: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>…</span>}
                      </div>
                      {/* Legenda */}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e', marginRight: 4, verticalAlign: 'middle' }} /> OK</span>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308', marginRight: 4, verticalAlign: 'middle' }} /> Dupla</span>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a855f7', marginRight: 4, verticalAlign: 'middle' }} /> Tripla</span>
                        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', marginRight: 4, verticalAlign: 'middle' }} /> Falha</span>
                      </div>
                    </div>
                    {/* Sulco simulado: distância entre plantas proporcional ao espaçamento (cm) informado */}
                    <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Sulco simulado (espaçamento real entre plantas)</div>
                      <div style={{ fontFamily: 'monospace', fontSize: '1rem', lineHeight: 1.8, overflowX: 'auto', padding: '10px 12px', background: 'var(--surface-muted)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: 0, minWidth: 'max-content' }}>
                          <span style={{ marginRight: 4 }}>|</span>
                          {linShow.map((p, i) => (
                            <React.Fragment key={i}>
                              {p.tipo === 'falha' ? (
                                <span
                                  style={{
                                    display: 'inline-block',
                                    minWidth: Math.max(12, p.espacamento_cm * pxPerCm),
                                    color: 'var(--text-muted)',
                                    textAlign: 'center',
                                  }}
                                  title={`Falha — ${p.espacamento_cm.toFixed(1)} cm até próxima`}
                                >
                                  ⋯
                                </span>
                              ) : (
                                <>
                                  <span style={{ whiteSpace: 'nowrap' }}>
                                    {p.tipo === 'ok' && '🌱'}
                                    {p.tipo === 'dupla' && '🌱🌱'}
                                    {p.tipo === 'tripla' && '🌱🌱🌱'}
                                  </span>
                                  {i < linShow.length - 1 && (
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        minWidth: Math.max(8, p.espacamento_cm * pxPerCm),
                                        flexShrink: 0,
                                      }}
                                      aria-hidden
                                    />
                                  )}
                                </>
                              )}
                            </React.Fragment>
                          ))}
                          <span style={{ marginLeft: 4 }}>|</span>
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>🌱 planta · espaço vazio = falha · distância entre plantas proporcional ao espaçamento (cm)</div>
                      </div>
                    </div>
                    {/* Resumo contagem */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.8rem' }}>
                      <span><strong>Total avaliado:</strong> {total} sementes</span>
                      <span style={{ color: '#22c55e' }}>OK: {ok} ({pct(ok)}%)</span>
                      <span style={{ color: '#eab308' }}>Duplas: {duplas} ({pct(duplas)}%)</span>
                      <span style={{ color: '#a855f7' }}>Triplas: {triplas} ({pct(triplas)}%)</span>
                      <span style={{ color: '#ef4444' }}>Falhas: {falhas} ({pct(falhas)}%)</span>
                    </div>
                  </div>
                  {/* Tabela de espaçamentos */}
                  <div className="card" style={{ marginBottom: '1rem' }}>
                    <div className="card-title"><span className="card-title-icon">📋</span> Tabela de espaçamentos</div>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left' }}>
                            <th style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Semente</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Espaçamento (cm)</th>
                            <th style={{ padding: '6px 8px', fontWeight: 600, color: 'var(--text-muted)' }}>Classificação</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lin.slice(0, 100).map((p, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                              <td style={{ padding: '6px 8px' }}>{i + 1}</td>
                              <td style={{ padding: '6px 8px', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{p.espacamento_cm.toFixed(1)}</td>
                              <td style={{ padding: '6px 8px' }}>{tipoLabel(p.tipo)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {lin.length > 100 && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, marginBottom: 0 }}>Exibindo as primeiras 100 de {lin.length} sementes.</p>}
                    </div>
                  </div>
                </>
              );
            })()}
            {/* Evolução fenológica (tabela) */}
            {Array.isArray(dp.evolucao_fenologica) && dp.evolucao_fenologica.length > 0 && (
              <>
                {/* 5️⃣ Linha do tempo da lavoura — âncora Evolução Fenológica */}
                <div id="evolucao-fenologica" className="card" style={{ marginBottom: '1rem' }}>
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
            {/* Removido: card Simulação de produtividade (recomendação do usuário). */}
          </div>
        );
      })()}

      </RelatorioSection>

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

      {/* #monitoramento — linha compacta + tabela técnica única (Ponto | Tipo | Alvo | Incidência | Severidade | Situação) */}
      <div id="monitoramento" className="pdf-keep-together">
        <div className="section-heading">🔬 Monitoramento Fitossanitário</div>
        <div className="monitoramento-meta-line">
          <span><strong>Método:</strong> {metodoAmostragem}</span>
          <span><strong>Pontos amostrados:</strong> {String(metricasTalhao?.totalPontos ?? metricasGlobais?.totalPontos ?? primeiroTalhao?.pontos?.length ?? '—')}</span>
        </div>
        {primeiroTalhao?.pontos && primeiroTalhao.pontos.length > 0 && (() => {
          const rows: { ponto: string; tipo: string; alvo: string; incidencia: string; severidade: string; situacao: string }[] = [];
          const severidadeLabel = (s: number) => s < 25 ? 'baixa' : s < 50 ? 'moderada' : s < 75 ? 'alta' : 'crítica';
          const situacaoLabel = (s: number) => s < 25 ? 'Monitorar' : s < 50 ? 'Atenção' : s < 75 ? 'Atenção' : 'Crítico';
          primeiroTalhao.pontos.forEach((p) => {
            if (p.infestacoes.length === 0) {
              rows.push({ ponto: p.identificador, tipo: '—', alvo: 'Sem ocorrência', incidencia: '—', severidade: '—', situacao: '—' });
            } else {
              p.infestacoes.forEach((inf) => {
                const sev = inf.severidade ?? 0;
                rows.push({
                  ponto: p.identificador,
                  tipo: TIPO_LABEL[inf.tipo],
                  alvo: inf.nome,
                  incidencia: inf.quantidade != null ? String(inf.quantidade) : '—',
                  severidade: severidadeLabel(sev),
                  situacao: situacaoLabel(sev),
                });
              });
            }
          });
          if (rows.length === 0) return null;
          return (
            <div className="card" style={{ marginTop: '0.75rem' }}>
              <table className="tabela-monitoramento-fitossanitario">
                <thead>
                  <tr>
                    <th>Ponto</th>
                    <th>Tipo</th>
                    <th>Alvo</th>
                    <th>Incidência</th>
                    <th>Severidade</th>
                    <th>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.ponto}</td>
                      <td>{r.tipo}</td>
                      <td>{r.alvo}</td>
                      <td>{r.incidencia}</td>
                      <td>{r.severidade}</td>
                      <td>{r.situacao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Observações e anotações do responsável técnico — apenas conteúdo do payload (nunca texto fictício do sistema) */}
      <div id="diagnostico" className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
        <div className="card-title"><span className="card-title-icon">📝</span> Diagnóstico Agronômico — Observações do responsável técnico</div>
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

      {/* Recomendações (Plano de Aplicação + Análise de Pragas) */}
      <div id="recomendacoes">
      {/* Plano de Aplicação */}
      {resumoRecomendacoes.length > 0 && (
        <div className="card plano-aplicacao pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title plano-aplicacao-title">Plano de Aplicação</div>
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
                    <div className={`action-bar ${badgeClass === 'baixo' ? 'priority-low' : ''}`} style={badgeClass !== 'baixo' ? { borderLeftColor: 'var(--warning)' } : undefined}>
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
        </div>
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

      {/* Galeria de Imagens */}
      {imagens.length > 0 && (
        <div id="galeria" className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
          <div className="card-title">Registros fotográficos</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
            {imagens.map((img, i) => (
              <button key={i} type="button" onClick={() => setGaleriaModal({ url: img.url, descricao: img.descricao })} className="no-print" style={{ padding: 0, border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'transparent' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.descricao ?? `Foto ${i + 1}`}
                  style={{ width: '100%', height: 140, objectFit: 'cover' }}
                  crossOrigin={img.url.startsWith('data:') ? undefined : 'anonymous'}
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = 'none';
                    const wrap = el.closest('button');
                    if (wrap) {
                      const fallback = document.createElement('div');
                      fallback.className = 'relatorio-imagem-falha';
                      fallback.style.cssText = 'width:100%;height:140px;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text-muted);font-size:0.8rem;';
                      fallback.textContent = 'Imagem não disponível';
                      wrap.appendChild(fallback);
                    }
                  }}
                />
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
