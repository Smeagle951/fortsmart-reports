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
import { formatPercent2, formatDecimal2, formatDate } from '@/utils/format';
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
};

/** Bloco de dados de plantio enviado pelo app para enriquecer o relatório de monitoramento */
export interface DadosPlantioMonitoramento {
  cultura?: string;
  data_plantio?: string;
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
  const imagens = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string }>;

  /** Próxima visita: meta ou metricas (formato ISO ou DD/MM/YYYY). */
  const proximaVisitaRaw =
    (metricasGlobais?.proximaVisita ?? metricasGlobais?.proxima_visita ?? (relatorio.meta as Record<string, unknown>)?.proximaVisita ?? (relatorio.meta as Record<string, unknown>)?.proxima_visita) as string | undefined;
  const proximaVisita = proximaVisitaRaw
    ? (formatDate(proximaVisitaRaw) !== '—' ? formatDate(proximaVisitaRaw) : String(proximaVisitaRaw))
    : '—';

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
      <div id="resumo" className="report-header-card pdf-keep-together">
        <div className="report-header-info">
          <h1>📋 Relatório de Monitoramento Fitossanitário</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
            Emitido em {normalized.data}{normalized.tecnico ? ` · ${normalized.tecnico}` : ''}{normalized.crea ? ` · ${normalized.crea}` : ''}
          </p>
          <div className="report-meta-tags">
            <span className="meta-tag">🌾 {primeiroTalhao.cultura} — Safra {normalized.safra}</span>
            <span className="meta-tag">📍 {municipio && estado ? `${String(municipio)} · ${String(estado)}` : (municipio || estado || '—')}</span>
            <span className="meta-tag">📐 {primeiroTalhao.area_ha > 0 ? `${formatDecimal2(primeiroTalhao.area_ha)} ha` : '—'} · {primeiroTalhao.nome}</span>
            <span className="meta-tag">🌱 {String(primeiroTalhao.estagio || (fenologiaGlobal?.estadio ?? '—'))} — {String((primeiroTalhao.dae ?? fenologiaGlobal?.dae) ?? '')} DAE</span>
            {primeiroTalhao.variedade && <span className="meta-tag">Híbrido: {primeiroTalhao.variedade}</span>}
          </div>
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

      {/* #propriedade — Grid 2: Propriedade + Mapa (base: relatorio.html) */}
      <div id="propriedade" className="grid-2 pdf-keep-together">
        <div className="card">
          <div className="card-title"><span className="card-title-icon">🏡</span> Propriedade</div>
          <div className="info-row"><span className="info-label">Fazenda</span><span className="info-value">{normalized.fazenda}</span></div>
          <div className="info-row"><span className="info-label">Município</span><span className="info-value">{municipio && estado ? `${String(municipio)} — ${String(estado)}` : String(municipio || estado || '—')}</span></div>
          <div className="info-row"><span className="info-label">Talhão</span><span className="info-value">{primeiroTalhao.nome}{primeiroTalhao.area_ha > 0 ? ` (${formatDecimal2(primeiroTalhao.area_ha)} ha)` : ''}</span></div>
        </div>
        <div className="card">
          <div className="card-title"><span className="card-title-icon">📍</span> Polígono GPS · Pontos georreferenciados</div>
          <div className="map-card-inner">
            <MapaInterativo pontos={primeiroTalhao.pontos} poligono={primeiroTalhao.poligono_geojson} talhaoId={primeiroTalhao.id} hideHeader />
          </div>
        </div>
      </div>

      {/* #dados-plantio — Dados do módulo Plantio (estande, CV%, evolução fenológica) */}
      {relatorio.dados_plantio && (() => {
        const dp = relatorio.dados_plantio as import('@/components/RelatorioFitossanitarioContent').DadosPlantioMonitoramento;
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
            <div className="grid-2" style={{ marginBottom: '1rem' }}>
              <div className="card">
                <div className="card-title"><span className="card-title-icon">📋</span> Informações principais</div>
                <div className="info-row"><span className="info-label">Cultura</span><span className="info-value">{dp.cultura ?? '—'}</span></div>
                <div className="info-row"><span className="info-label">Data de plantio</span><span className="info-value">{dp.data_plantio ? formatDate(dp.data_plantio) : '—'}</span></div>
                <div className="info-row"><span className="info-label">População desejada</span><span className="info-value">{dp.populacao_desejada != null ? `${fmtInt(dp.populacao_desejada)} plantas/ha` : '—'}</span></div>
                <div className="info-row"><span className="info-label">População real</span><span className="info-value">{dp.populacao_real != null ? `${fmt(dp.populacao_real)} plantas/ha` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Espaçamento entre linhas</span><span className="info-value">{dp.espacamento_entre_linhas_m != null ? `${fmt(dp.espacamento_entre_linhas_m)} m` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Espaçamento médio entre plantas</span><span className="info-value">{dp.espacamento_medio_cm != null ? `${fmt(dp.espacamento_medio_cm)} cm` : '—'}</span></div>
              </div>
              <div className="card">
                <div className="card-title"><span className="card-title-icon">📊</span> Qualidade do plantio</div>
                <div className="info-row"><span className="info-label">CV de plantio</span><span className="info-value" style={dp.cv_classificacao ? { fontWeight: 700 } : undefined}>{dp.cv_percent != null ? `${fmt(dp.cv_percent)}%` : '—'}{dp.cv_classificacao ? ` (${dp.cv_classificacao})` : ''}</span></div>
                <div className="info-row"><span className="info-label">Índice de falhas</span><span className="info-value">{dp.indice_falhas_percent != null ? `${fmt(dp.indice_falhas_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Índice de duplas</span><span className="info-value">{dp.indice_duplas_percent != null ? `${fmt(dp.indice_duplas_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Eficiência do estande</span><span className="info-value">{dp.eficiencia_estande_percent != null ? `${fmt(dp.eficiencia_estande_percent)}%` : '—'}</span></div>
                <div className="info-row"><span className="info-label">Plantas contadas / metros amostrados</span><span className="info-value">{dp.plantas_contadas != null && dp.metros_amostrados != null ? `${fmtInt(dp.plantas_contadas)} plantas em ${fmt(dp.metros_amostrados)} m` : (dp.plantas_contadas != null ? fmtInt(dp.plantas_contadas) : (dp.metros_amostrados != null ? `${fmt(dp.metros_amostrados)} m` : '—'))}</span></div>
              </div>
            </div>
            {/* Linha de plantabilidade (visualização espacamentos) */}
            {Array.isArray(dp.linha_plantabilidade) && dp.linha_plantabilidade.length > 0 && (
              <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="card-title"><span className="card-title-icon">📐</span> Visualização da qualidade do plantio — espaçamento entre sementes</div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Cada ponto representa o espaçamento real (cm) entre sementes. Verde: OK · Amarelo: dupla · Roxo: tripla · Vermelho: falha.
                </p>
                <div style={{ overflowX: 'auto', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 'max-content', flexWrap: 'wrap' }}>
                    {dp.linha_plantabilidade.slice(0, 60).map((p, i) => {
                      const cor = p.tipo === 'ok' ? '#22c55e' : p.tipo === 'dupla' ? '#eab308' : p.tipo === 'tripla' ? '#a855f7' : '#ef4444';
                      return (
                        <span key={i} title={`${p.espacamento_cm.toFixed(1)} cm — ${p.tipo}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                          <span style={{ width: 6, height: 12, borderRadius: 2, backgroundColor: cor }} />
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>{p.espacamento_cm.toFixed(1)}</span>
                        </span>
                      );
                    })}
                    {dp.linha_plantabilidade.length > 60 && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{dp.linha_plantabilidade.length - 60} pontos</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#22c55e', marginRight: 4 }} /> OK</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#eab308', marginRight: 4 }} /> Duplas</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#a855f7', marginRight: 4 }} /> Triplas</span>
                  <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', marginRight: 4 }} /> Falhas</span>
                </div>
              </div>
            )}
            {/* Evolução fenológica (tabela) */}
            {Array.isArray(dp.evolucao_fenologica) && dp.evolucao_fenologica.length > 0 && (
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
          </div>
        );
      })()}

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
          <div className="stat-card">
            <div className="stat-label">Temperatura</div>
            <div className="stat-value">{condicoesExibir?.temperatura != null ? `${condicoesExibir.temperatura}°C` : '—'}</div>
            <div className="stat-unit">no momento da visita</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Umidade relativa</div>
            <div className="stat-value">{condicoesExibir?.umidade != null ? `${condicoesExibir.umidade}%` : '—'}</div>
            <div className="stat-unit">umidade do ar</div>
          </div>
        </div>
        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card">
            <div className="card-title"><span className="card-title-icon">🌱</span> Ciclo da Cultura</div>
            <div className="info-row"><span className="info-label">Safra</span><span className="info-value">{normalized.safra}</span></div>
            <div className="info-row"><span className="info-label">Cultura</span><span className="info-value">{primeiroTalhao.cultura}</span></div>
            <div className="info-row"><span className="info-label">Híbrido</span><span className="info-value">{primeiroTalhao.variedade ?? '—'}</span></div>
            {(() => {
              const contextoSafra = (relatorio as any).contextoSafra ?? (relatorio as any).contexto_safra;
              const fenologia = (relatorio as any).fenologia ?? {};
              const talhaoRaw = (Array.isArray(relatorio.talhoes) && (relatorio.talhoes as any[])[0]) || {};
              const dataSemeaduraRaw = contextoSafra?.dataPlantio ?? contextoSafra?.data_plantio ?? talhaoRaw.dataPlantio ?? talhaoRaw.data_plantio;
              const dataEmergenciaRaw = fenologia.dataEmergencia ?? fenologia.data_emergencia;
              const daeCiclo = contextoSafra?.dae ?? fenologia.dae ?? primeiroTalhao.dae;
              const estadioCiclo = fenologia.estadio ?? fenologia.estagio ?? primeiroTalhao.estagio;
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
          <div className="card">
            <div className="card-title">💧 Condições Climáticas Recentes</div>
            <div className="grid-3" style={{ margin: 0, gap: '1rem' }}>
              <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary)' }}>{condicoesExibir?.chuva ?? '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chuva nos últimos 7 dias</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--warning)' }}>{condicoesExibir?.umidade != null ? `${condicoesExibir.umidade}%` : '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Umidade do ar</div>
              </div>
              <div style={{ textAlign: 'center', background: 'var(--bg)', borderRadius: 10, padding: '1rem' }}>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>{condicoesExibir?.temperatura != null ? `${condicoesExibir.temperatura}°C` : '—'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Temperatura máx.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {observacoes && (
        <div className="card pdf-keep-together" style={{ marginBottom: '1.25rem' }}>
          <div style={{ marginTop: '1rem', padding: '0.9rem', background: 'var(--bg)', borderRadius: 8, borderLeft: '3px solid var(--primary)', fontSize: '0.85rem', color: 'var(--text-main)' }}>
            📝 <strong>Observações gerais:</strong> {observacoes}
          </div>
        </div>
      )}

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

        <div id="auditoria" style={{ marginBottom: '1.25rem' }} />

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
