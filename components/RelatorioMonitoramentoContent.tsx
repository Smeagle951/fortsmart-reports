'use client';

import React, { useMemo, useState } from 'react';
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
import { calcularMetricasTalhao, corClassificacao, labelClassificacao } from '@/lib/calculations';
import { formatPercent2, formatDecimal2 } from '@/utils/format';
import '@/styles/report-monitoramento-premium.css';
import TalhaoBloco from './TalhaoBloco';
import MonitoramentoNdeContextoPanel, { parseOrganismosContextoFromPayload } from './MonitoramentoNdeContextoPanel';
import PlantioIntegradoPremiumSection from './PlantioIntegradoPremiumSection';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import type { NivelRecomendacao } from '@/lib/types/monitoring';

/** Polígono padrão (bbox) quando o payload não traz geojson */
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

function recoToCardKind(nivel: string): 'crit' | 'high' | 'med' {
  if (nivel === 'ACAO_IMEDIATA') return 'crit';
  if (nivel === 'ALTO_RISCO') return 'high';
  return 'med';
}

type PremiumRecoRow = {
  talhaoNome: string;
  culturaLinha: string;
  organismo: string;
  acao: string;
  tags: string[];
  kind: 'crit' | 'high' | 'med';
  badge: string;
};

function collectRecomendacoesPrioritas(talhoes: Talhao[]): PremiumRecoRow[] {
  const order: Record<PremiumRecoRow['kind'], number> = { crit: 0, high: 1, med: 2 };
  const nivelLabel: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: 'Ação imediata',
    ALTO_RISCO: 'Alto risco',
    MONITORAR: 'Monitorar',
    PREVENTIVO: 'Preventivo',
  };
  const out: PremiumRecoRow[] = [];
  for (const t of talhoes) {
    for (const r of t.recomendacoes ?? []) {
      const org = (r.organismo && String(r.organismo).trim() && r.organismo !== '—') ? String(r.organismo).trim() : '';
      if (!org) continue;
      const kind = recoToCardKind(String(r.nivel));
      const acaoRaw = typeof r.acao === 'string' ? r.acao.trim() : '';
      out.push({
        talhaoNome: t.nome,
        culturaLinha: [t.cultura, t.estagio].filter(x => x && String(x).trim()).join(' · ') || '—',
        organismo: org,
        acao: acaoRaw.length > 0 && acaoRaw !== '—' ? acaoRaw : '',
        tags: [r.produto, r.dose].map(x => (x != null ? String(x).trim() : '')).filter(Boolean),
        kind,
        badge: nivelLabel[String(r.nivel) as NivelRecomendacao] ?? String(r.nivel),
      });
    }
  }
  out.sort((a, b) => order[a.kind] - order[b.kind]);
  return out.slice(0, 6);
}

function countTalhoesPorClasse(talhoes: Talhao[]) {
  let crit = 0;
  let alto = 0;
  let att = 0;
  let ok = 0;
  for (const t of talhoes) {
    const c = calcularMetricasTalhao(t).classificacao;
    if (c === 'CRITICO') crit += 1;
    else if (c === 'ALTO_RISCO') alto += 1;
    else if (c === 'ATENCAO') att += 1;
    else ok += 1;
  }
  return { crit, alto, att, ok, intervenir: crit + alto, monitorar: att };
}

function headlineRiscoGlobal(
  talhoes: Talhao[],
  metricasPayload: Record<string, unknown> | undefined,
): { word: string; wordClass: string; subtitle: string } {
  const nr = String(metricasPayload?.nivelRisco ?? '').toUpperCase();
  let hasCritTal = false;
  let hasAltoTal = false;
  let hasAttTal = false;
  for (const t of talhoes) {
    const c = calcularMetricasTalhao(t).classificacao;
    if (c === 'CRITICO') hasCritTal = true;
    if (c === 'ALTO_RISCO') hasAltoTal = true;
    if (c === 'ATENCAO') hasAttTal = true;
  }
  if (hasCritTal || nr.includes('CRIT'))
    return { word: 'Crítica', wordClass: 'fs-mon-premium__risk-word', subtitle: 'consolidar decisões nos talhões em alerta máximo' };
  if (hasAltoTal || nr.includes('ALTO'))
    return {
      word: 'Elevado',
      wordClass: 'fs-mon-premium__risk-word fs-mon-premium__risk-word--high',
      subtitle: 'intervenção ou replanejamento de manejo recomendados',
    };
  if (hasAttTal || nr.includes('MED'))
    return {
      word: 'Moderado',
      wordClass: 'fs-mon-premium__risk-word fs-mon-premium__risk-word--med',
      subtitle: 'monitorar evolução e amostrar pontos estratégicos',
    };
  return {
    word: 'Controlada',
    wordClass: 'fs-mon-premium__risk-word fs-mon-premium__risk-word--ok',
    subtitle: 'manter o calendário de visitas habitual',
  };
}

function liveBadgeClass(talhoesCrit: number, metricasPayload: Record<string, unknown> | undefined): string {
  if (talhoesCrit > 0) return 'fs-mon-premium__badge-live--crit';
  const nr = String(metricasPayload?.nivelRisco ?? '').toUpperCase();
  if (nr.includes('CRIT') || nr.includes('ALT')) return 'fs-mon-premium__badge-live--high';
  if (nr.includes('MED') || nr.includes('ATEN')) return 'fs-mon-premium__badge-live--med';
  return 'fs-mon-premium__badge-live--ok';
}

function textoBadgeTopo(talhoesCrit: number, metricasPayload: Record<string, unknown> | undefined): string {
  if (talhoesCrit > 0) return `${talhoesCrit} CRÍT.`;
  const nr = String(metricasPayload?.nivelRisco ?? '').trim();
  return nr.length > 0 ? nr : 'VISÃO GERAL';
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

  const poligonoRaw = (raw.poligono_geojson ?? raw.poligono ?? raw.polygon ?? raw.geometry ?? raw.geojson) as GeoJSONPolygon | undefined | null;
  const poligono = (poligonoRaw && poligonoRaw.type === 'Feature' && poligonoRaw.geometry?.type === 'Polygon' && Array.isArray(poligonoRaw.geometry?.coordinates))
    ? poligonoRaw
    : defaultPolygon(pontos);
  const cond = raw.condicoes_climaticas as Record<string, unknown> | undefined;
  const condicoes_climaticas: CondicoesClimaticas | undefined = cond
    ? { temperatura: Number(cond.temperatura ?? 0), umidade: Number(cond.umidade ?? 0), chuva: (cond.chuva as string) ?? 'Sem Chuva' }
    : undefined;

  const recRaw = (raw.recomendacoes ?? []) as Array<{ acao?: string; organismo?: string; produto?: string; dose?: string; nivel?: string } | Recomendacao>;
  const recomendacoes: Recomendacao[] = recRaw.map((r: any) => {
    if (r.nivel && (r.produto != null || r.dose != null) && (r.organismo && r.organismo !== '—')) return r as Recomendacao;
    return {
      nivel: (r.nivel as Recomendacao['nivel']) ?? 'MONITORAR',
      organismo: (r.organismo != null && String(r.organismo).trim()) ? String(r.organismo).trim() : '—',
      tipo: (r.tipo as Recomendacao['tipo']) ?? 'praga',
      produto: (r.produto != null && String(r.produto).trim()) ? String(r.produto).trim() : '',
      dose: (r.dose != null && String(r.dose).trim()) ? String(r.dose).trim() : '',
      acao: typeof r.acao === 'string' ? r.acao : (r.acao ?? '—'),
      pontos: Array.isArray(r.pontos) ? r.pontos : [],
      severidade: typeof r.severidade === 'number' ? r.severidade : 0,
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

export type PayloadMonitoramento = Record<string, unknown> & {
  tipo?: string;
  propriedade?: Record<string, unknown>;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  talhoes?: Record<string, unknown>[];
  metricas?: Record<string, unknown>;
  estande?: Record<string, unknown>;
  cv?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  observacoes?: string | null;
  alertas?: string[] | null;
  imagens?: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  consultoria?: { nome?: string; logo?: string };
  organismos_contexto?: Array<Record<string, unknown>>;
  dados_plantio?: Record<string, unknown> | null;
  modulo_plantio?: Record<string, unknown>;
};

interface RelatorioMonitoramentoContentProps {
  relatorio: PayloadMonitoramento;
  reportId?: string;
  relatorioUuid?: string;
  /** Token `/r/[token]` — audiência PDF no analytics (paridade com ex-fitossanitário). */
  shareToken?: string;
}

export default function RelatorioMonitoramentoContent({
  relatorio,
  reportId,
  relatorioUuid,
  shareToken,
}: RelatorioMonitoramentoContentProps) {
  const normalized = useMemo((): RelatorioMonitoramento => {
    const prop = (relatorio.propriedade != null && typeof relatorio.propriedade === 'object') ? relatorio.propriedade as Record<string, unknown> : undefined;
    const meta = (relatorio.meta != null && typeof relatorio.meta === 'object') ? relatorio.meta as Record<string, unknown> : undefined;
    const fazenda = String(
      relatorio.fazenda
      ?? relatorio.nome_fazenda
      ?? relatorio.fazenda_nome
      ?? prop?.fazenda
      ?? prop?.nome
      ?? (relatorio as any).nomeFazenda
      ?? (relatorio as any).fazenda_nome
      ?? meta?.fazenda
      ?? ''
    ).trim();
    const safra = String(relatorio.safra ?? meta?.safra ?? '').trim();
    const dataRaw = relatorio.data ?? meta?.dataGeracao ?? '';
    const data = typeof dataRaw === 'string' ? dataRaw : (dataRaw != null ? String(dataRaw) : '');
    const tecnico = String(
      relatorio.tecnico
      ?? relatorio.agronomo
      ?? relatorio.nome_tecnico
      ?? relatorio.nome_agronomo
      ?? (relatorio as any).tecnicoNome
      ?? prop?.tecnico
      ?? prop?.agronomo
      ?? prop?.nome_tecnico
      ?? meta?.tecnico
      ?? meta?.agronomo
      ?? meta?.nome_tecnico
      ?? 'FortSmart Agro'
    ).trim() || 'FortSmart Agro';
    const crea = String(
      relatorio.crea
      ?? relatorio.tecnico_crea
      ?? relatorio.crea_tecnico
      ?? (relatorio as any).creaAgronomo
      ?? meta?.tecnicoCrea
      ?? meta?.crea
      ?? prop?.crea
      ?? prop?.tecnico_crea
      ?? ''
    ).trim() || undefined;
    const talhoesRaw = Array.isArray(relatorio.talhoes) ? relatorio.talhoes : [];
    const talhoes = talhoesRaw.map((t: unknown) => normalizeTalhao(t != null && typeof t === 'object' ? t as Record<string, unknown> : {}));

    let consultoria: { nome: string; logoUrl?: string } | undefined = undefined;
    if (relatorio.consultoria && relatorio.consultoria.nome) {
      consultoria = {
        nome: String(relatorio.consultoria.nome).trim(),
        logoUrl: relatorio.consultoria.logo ? String(relatorio.consultoria.logo).trim() : undefined,
      };
    }

    const out = {
      fazenda,
      safra,
      data,
      tecnico,
      crea: crea || undefined,
      talhoes,
      consultoria,
    };
    return out as RelatorioMonitoramento;
  }, [relatorio]);

  const handleExportPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const el = document.getElementById('relatorio-monitoramento-content');
    if (!el) return;
    const safeFazenda = (normalized.fazenda || 'Relatorio').replace(/\s/g, '_');
    const safeData = (normalized.data || '').replace(/\//g, '-').replace(/\s/g, '_') || 'data';
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `FortSmart_Monitoramento_${safeFazenda}_${safeData}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(el).save().then(() => {
      if (shareToken) {
        void postReportAnalytics({
          shareToken,
          eventType: 'download',
          module: 'monitoramento',
        });
      }
    });
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    normalized.talhoes.forEach(t => {
      const rows: (string | number | null)[][] = [['Ponto', 'Tipo', 'Infestação', 'Terço', 'Quantidade', 'Severidade (%)']];
      t.pontos.forEach(p => {
        p.infestacoes.forEach(i => {
          rows.push([p.identificador, i.tipo, i.nome, i.terco, i.quantidade ?? 'N/A', i.severidade]);
        });
      });
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, sheet, t.nome.substring(0, 31));
    });
    XLSX.writeFile(wb, `FortSmart_Monitoramento_${(normalized.data || '').replace(/\//g, '-') || 'export'}.xlsx`);
  };

  const metricas = relatorio.metricas as Record<string, unknown> | undefined;
  const estande = relatorio.estande as Record<string, unknown> | undefined;
  const cv = relatorio.cv as Record<string, unknown> | undefined;
  const fenologia = relatorio.fenologia as Record<string, unknown> | undefined;
  const observacoes = relatorio.observacoes as string | undefined | null;
  const alertas = relatorio.alertas as string[] | undefined | null;
  const imagens = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  const [galeriaModal, setGaleriaModal] = useState<{ url: string; descricao?: string } | null>(null);

  const organismosContextoRows = useMemo(
    () => parseOrganismosContextoFromPayload(relatorio as Record<string, unknown>),
    [relatorio],
  );
  const propriedadeUfNde = useMemo(() => {
    const p = relatorio.propriedade;
    if (p != null && typeof p === 'object') {
      const o = p as Record<string, unknown>;
      const u = o.estado ?? o.uf ?? o.estado_sigla;
      if (u != null && String(u).trim()) return String(u).trim();
    }
    return undefined;
  }, [relatorio]);

  const actionRows = useMemo(() => collectRecomendacoesPrioritas(normalized.talhoes), [normalized.talhoes]);
  const classCount = useMemo(() => countTalhoesPorClasse(normalized.talhoes), [normalized.talhoes]);
  const riskPhrase = useMemo(() => headlineRiscoGlobal(normalized.talhoes, metricas), [normalized.talhoes, metricas]);

  const totalPontosMon = useMemo(() => {
    const m = metricas?.totalPontos != null ? safeNum(metricas.totalPontos) : 0;
    if (m > 0) return m;
    return normalized.talhoes.reduce((s, t) => s + t.pontos.length, 0);
  }, [metricas, normalized.talhoes]);

  const totalOcorrenciasMon = useMemo(() => {
    if (metricas?.totalOcorrencias != null) return safeNum(metricas.totalOcorrencias);
    return normalized.talhoes.reduce((s, t) => s + calcularMetricasTalhao(t).totalOcorrencias, 0);
  }, [metricas, normalized.talhoes]);

  const nCulturas = useMemo(() => {
    const s = new Set(normalized.talhoes.map(t => (t.cultura && String(t.cultura).trim()) ? String(t.cultura).trim() : '').filter(Boolean));
    return Math.max(1, s.size);
  }, [normalized.talhoes]);

  const eyebrowContext = [
    normalized.fazenda || 'Propriedade',
    normalized.safra && `Safra ${normalized.safra}`,
    `${normalized.talhoes.length} talhões`,
    `${totalPontosMon} pontos`,
    nCulturas > 1 ? `${nCulturas} culturas` : null,
  ].filter(Boolean).join(' · ');

  const areaMonHa = useMemo(
    () => normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0),
    [normalized.talhoes],
  );

  return (
    <div className="fs-mon-premium" id="relatorio-monitoramento-content">
      <nav className="nav-lateral fs-mon-premium__mono-nav no-print" aria-hidden="true">
        {normalized.talhoes.map(t => (
          <a
            key={t.id}
            href={`#talhao-${t.id}`}
            title={t.nome}
            className="nav-dot"
            onClick={e => {
              e.preventDefault();
              document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        ))}
      </nav>

      <header className="fs-mon-premium__topbar no-print">
        <div className="fs-mon-premium__logo" aria-hidden>
          <svg viewBox="0 0 24 24"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 10l-7 7z" /></svg>
        </div>
        <span className="fs-mon-premium__brand">{normalized.consultoria?.nome?.trim() || 'FortSmart'}</span>
        <div className="fs-mon-premium__sep" />
        <span className="fs-mon-premium__top-title">Monitoramento fitossanitário</span>
        <div className="fs-mon-premium__top-actions">
          <div className={`fs-mon-premium__badge-live ${liveBadgeClass(classCount.crit, metricas)}`}>
            <span className="fs-mon-premium__dot" aria-hidden />
            {textoBadgeTopo(classCount.crit, metricas)}
          </div>
          {relatorioUuid && (
            <span className="fs-mon-premium__mono" style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }} title="Origem">App</span>
          )}
          <button type="button" className="fs-mon-premium__btn-export fs-mon-premium__btn-export--ghost" onClick={handleExportExcel}>
            Excel
          </button>
          <button type="button" className="fs-mon-premium__btn-export" onClick={handleExportPDF}>
            PDF
          </button>
        </div>
      </header>

      <section className="fs-mon-premium__hero">
        <div className="fs-mon-premium__hero-bg" aria-hidden />
        <div className="fs-mon-premium__hero-inner">
          <div className="fs-mon-premium__eyebrow">
            <span className="fs-mon-premium__pill">Monitoramento</span>
            <span className="fs-mon-premium__mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.04em' }}>{eyebrowContext}</span>
          </div>
          <div className="fs-mon-premium__hero-kicker">Risco fitossanitário global</div>
          <h1 className="fs-mon-premium__hero-title">
            Situação <span className={riskPhrase.wordClass}>{riskPhrase.word}</span>
            <em>{riskPhrase.subtitle}</em>
          </h1>

          <div className="fs-mon-premium__impact-grid">
            <div className="fs-mon-premium__impact-cell fs-mon-premium__impact-cell--crit">
              <div className="fs-mon-premium__impact-label">Talhões críticos</div>
              <div className="fs-mon-premium__impact-val">
                {classCount.crit}<span className="fs-mon-premium__impact-unit"> / {normalized.talhoes.length || '—'}</span>
              </div>
              <div className="fs-mon-premium__impact-sub">classificação por severidade média nas amostras</div>
            </div>
            <div className="fs-mon-premium__impact-cell fs-mon-premium__impact-cell--high">
              <div className="fs-mon-premium__impact-label">Pontos avaliados</div>
              <div className="fs-mon-premium__impact-val">{totalPontosMon}</div>
              <div className="fs-mon-premium__impact-sub">pontos de monitoramento registrados</div>
            </div>
            <div className="fs-mon-premium__impact-cell fs-mon-premium__impact-cell--amber">
              <div className="fs-mon-premium__impact-label">Ocorrências</div>
              <div className="fs-mon-premium__impact-val">{totalOcorrenciasMon}</div>
              <div className="fs-mon-premium__impact-sub">infestações registradas no relatório</div>
            </div>
            <div className="fs-mon-premium__impact-cell fs-mon-premium__impact-cell--ok">
              <div className="fs-mon-premium__impact-label">Confiança / área</div>
              <div className="fs-mon-premium__impact-val">
                {metricas?.confiancaDados != null ? (
                  <>
                    {formatPercent2(Number(metricas.confiancaDados) <= 1 ? Number(metricas.confiancaDados) * 100 : Number(metricas.confiancaDados))}
                    <span className="fs-mon-premium__impact-unit"> dados</span>
                  </>
                ) : (
                  '—'
                )}
              </div>
              <div className="fs-mon-premium__impact-sub">
                {areaMonHa > 0 ? `${formatDecimal2(areaMonHa)} ha somados` : 'Área não informada em todos os talhões'}
              </div>
            </div>
          </div>

          {(alertas && alertas.length > 0) && (
            <div className="fs-mon-premium__alert-strip" role="status">
              <div style={{ fontSize: 22, lineHeight: 1 }} aria-hidden>⏱</div>
              <div>
                <strong>Alertas do relatório</strong>
                <span>{alertas[0]}{alertas.length > 1 ? ` (+${alertas.length - 1})` : ''}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {(actionRows.length > 0 || normalized.talhoes.length > 0) && (
        <section className="fs-mon-premium__decision">
          <div className="fs-mon-premium__decision-inner">
            <div className="fs-mon-premium__decision-head">
              <div>
                <div className="fs-mon-premium__decision-label">02 · Decisão executiva</div>
                <div className="fs-mon-premium__decision-title">Prioridades técnicas</div>
              </div>
              <div className="fs-mon-premium__decision-ts">
                Avaliado em {normalized.data || '—'} · {normalized.tecnico}
              </div>
            </div>

            {actionRows.length > 0 ? (
              <div className="fs-mon-premium__action-grid">
                {actionRows.map((row, ix) => (
                  <div
                    key={`${row.talhaoNome}-${row.organismo}-${ix}`}
                    className={`fs-mon-premium__action-card fs-mon-premium__action-card--${row.kind}`}
                  >
                    <div className={`fs-mon-premium__action-badge fs-mon-premium__action-badge--${row.kind}`}>
                      <span aria-hidden>●</span> {row.badge}
                    </div>
                    <div className="fs-mon-premium__action-talhao">{row.talhaoNome} — {row.culturaLinha}</div>
                    <div className="fs-mon-premium__action-org">{row.organismo}</div>
                    {row.acao && <div className="fs-mon-premium__action-rec">{row.acao}</div>}
                    {row.tags.length > 0 && (
                      <div className="fs-mon-premium__action-tags">
                        {row.tags.map((tag, ti) => (
                          <span key={`${tag}-${ti}`} className="fs-mon-premium__action-tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 14, lineHeight: 1.6 }}>
                Não há recomendações estruturadas no payload para este relatório; os achados aparecem nos blocos por talhão abaixo.
              </p>
            )}

            <div className="fs-mon-premium__dsummary">
              <div className="fs-mon-premium__dsummary-cell">
                <div className="fs-mon-premium__dsummary-label">Talhões sem alerta forte</div>
                <div className="fs-mon-premium__dsummary-val" style={{ color: 'var(--fs-risk-ok)' }}>{classCount.ok}</div>
              </div>
              <div className="fs-mon-premium__dsummary-cell">
                <div className="fs-mon-premium__dsummary-label">Em monitoramento</div>
                <div className="fs-mon-premium__dsummary-val" style={{ color: 'var(--fs-amber)' }}>{classCount.monitorar}</div>
              </div>
              <div className="fs-mon-premium__dsummary-cell">
                <div className="fs-mon-premium__dsummary-label">Intervenção / alto risco</div>
                <div className="fs-mon-premium__dsummary-val" style={{ color: 'var(--fs-risk-high)' }}>{classCount.intervenir}</div>
              </div>
            </div>
          </div>
        </section>
      )}

          <div className="fs-mon-premium__main">

        {(metricas || estande || cv || fenologia || observacoes || (alertas && alertas.length > 0)) && (
          <section className="fs-mon-premium__section">
            <div className="fs-mon-premium__section-head">
              <span className="fs-mon-premium__section-num">03</span>
              <h2 className="fs-mon-premium__section-title">Resumo técnico <em>agregado</em></h2>
              <div className="fs-mon-premium__section-rule" />
            </div>
            <div className="fs-mon-premium__surface">
              <div className="fs-mon-premium__surface-h">Indicadores do relatório</div>
              <div className="fs-mon-premium__grid-kpi">
                {metricas && (
                  <>
                    {metricas.totalPontos != null && <Row label="Total de pontos" value={String(metricas.totalPontos)} />}
                    {metricas.totalOcorrencias != null && <Row label="Ocorrências" value={String(metricas.totalOcorrencias)} />}
                    {metricas.nivelRisco != null && <Row label="Nível de risco" value={String(metricas.nivelRisco)} />}
                    {metricas.confiancaDados != null && (
                      <Row
                        label="Confiança dos dados"
                        value={formatPercent2(Number(metricas.confiancaDados) <= 1 ? Number(metricas.confiancaDados) * 100 : Number(metricas.confiancaDados))}
                      />
                    )}
                    {metricas.severidadeMedia != null && <Row label="Severidade média" value={formatPercent2(Number(metricas.severidadeMedia))} />}
                  </>
                )}
                {estande && (estande.populacao != null || estande.plantasPorMetro != null) && (
                  <Row label="Estande" value={estande.plantasPorMetro != null ? `${formatDecimal2(Number(estande.plantasPorMetro))} plantas/m` : `${formatDecimal2(Number(estande.populacao))} plantas/ha`} />
                )}
                {cv && (cv.cvPercent != null || cv.cvClassificacao != null) && (
                  <Row label="CV" value={typeof cv.cvClassificacao === 'string' ? cv.cvClassificacao : (cv.cvPercent != null ? formatPercent2(Number(cv.cvPercent)) : '—')} />
                )}
                {fenologia && (fenologia.estadio || fenologia.dae != null) && (
                  <Row label="Fenologia" value={[fenologia.estadio ?? (fenologia as Record<string, unknown>).estagio, fenologia.dae != null ? `DAE ${formatDecimal2(Number(fenologia.dae))}` : ''].filter(Boolean).join(' · ') || '—'} />
                )}
              </div>
            </div>
            {observacoes && (
              <div className="fs-mon-premium__surface" style={{ marginTop: 16 }}>
                <div className="fs-mon-premium__surface-h">Observações</div>
                <div style={{ padding: '18px 22px', fontSize: 14, color: '#3d4a3d', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{observacoes}</div>
              </div>
            )}
            {alertas && alertas.length > 0 && (
              <div className="fs-mon-premium__surface" style={{ marginTop: 16 }}>
                <div className="fs-mon-premium__surface-h">Alertas</div>
                <ul style={{ margin: 0, padding: '16px 24px 22px', fontSize: 14, color: '#b45309', lineHeight: 1.8 }}>
                  {alertas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </section>
        )}

        <PlantioIntegradoPremiumSection relatorio={relatorio as Record<string, unknown>} />

        {organismosContextoRows.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <MonitoramentoNdeContextoPanel rows={organismosContextoRows} propriedadeUf={propriedadeUfNde} />
          </div>
        )}

        {normalized.talhoes.length > 0 && (
          <section className="fs-mon-premium__section">
            <div className="fs-mon-premium__section-head">
              <span className="fs-mon-premium__section-num">04</span>
              <h2 className="fs-mon-premium__section-title">Panorama <em>dos talhões</em></h2>
              <div className="fs-mon-premium__section-rule" />
            </div>
            <div className="fs-mon-premium__surface fs-mon-premium__table-wrap">
              <table className="fs-mon-premium__table">
                <thead>
                  <tr>
                    <th>Talhão</th>
                    <th style={{ textAlign: 'right' }}>Área (ha)</th>
                    <th style={{ textAlign: 'right' }}>Índice</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {normalized.talhoes.map(t => {
                    const m = calcularMetricasTalhao(t);
                    const cor = corClassificacao(m.classificacao);
                    const areaStr = t.area_ha != null && Number(t.area_ha) > 0 ? formatDecimal2(t.area_ha) : '—';
                    return (
                      <tr key={t.id}>
                        <td>
                          <a href={`#talhao-${t.id}`} onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>
                            {t.nome}
                          </a>
                        </td>
                        <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{areaStr}</td>
                        <td style={{ textAlign: 'right', fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>{formatPercent2(m.indiceOcorrencia)}</td>
                        <td>
                          <span className="fs-mon-premium__pill-sm" style={{ background: `${cor}18`, color: cor }}>{labelClassificacao(m.classificacao)}</span>
                        </td>
                      </tr>
                    );
                  })}
                  <tr style={{ background: 'rgba(26,107,53,0.05)' }}>
                    <td style={{ fontWeight: 700 }}>Total área informada</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      {normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0) > 0
                        ? formatDecimal2(normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0))
                        : '—'}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="fs-mon-premium__section">
          <div className="fs-mon-premium__section-head">
            <span className="fs-mon-premium__section-num">05</span>
            <h2 className="fs-mon-premium__section-title">Profundidade <em>por talhão</em></h2>
            <div className="fs-mon-premium__section-rule" />
          </div>
          {normalized.talhoes.map((talhao, idx) => (
            <TalhaoBloco key={talhao.id} talhao={talhao} index={idx + 1} total={normalized.talhoes.length} data={normalized.data} variant="premium" />
          ))}
        </section>

        {imagens.length > 0 && (
          <section className="fs-mon-premium__section">
            <div className="fs-mon-premium__section-head">
              <span className="fs-mon-premium__section-num">06</span>
              <h2 className="fs-mon-premium__section-title">Galeria <em>do relatório</em></h2>
              <div className="fs-mon-premium__section-rule" />
            </div>
            <div className="fs-mon-premium__surface">
              <div className="fs-mon-premium__surface-h">Imagens consolidadas</div>
              <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {imagens.map((img, i) => (
                  <figure key={i} style={{ margin: 0 }}>
                    {img.url && (
                      <button
                        type="button"
                        onClick={() => setGaleriaModal({ url: img.url!, descricao: img.descricao })}
                        style={{ display: 'block', width: '100%', padding: 0, border: '1px solid rgba(0,0,0,.08)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: '#f0efe9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={img.descricao ?? `Foto ${i + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                      </button>
                    )}
                    {img.descricao && <figcaption style={{ fontSize: 12, color: '#7a8a7a', marginTop: 8, lineHeight: 1.4 }}>{img.descricao}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
            {galeriaModal && (
              <div
                onClick={() => setGaleriaModal(null)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  background: 'rgba(0,0,0,0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 9999,
                  cursor: 'pointer',
                }}
              >
                <div onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={galeriaModal.url}
                    alt={galeriaModal.descricao ?? 'Foto'}
                    style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
                  />
                  {galeriaModal.descricao && <div style={{ color: '#fff', marginTop: 12, fontSize: 14 }}>{galeriaModal.descricao}</div>}
                  <a href={galeriaModal.url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8, color: '#93C5FD', fontSize: 13 }}>Abrir em tamanho original</a>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="fs-mon-premium__conclusion">
          <div className="fs-mon-premium__conclusion-inner">
            <div>
              <div className="fs-mon-premium__conclusion-label">07 · Conclusão executiva</div>
              <h3 className="fs-mon-premium__conclusion-title">
                Consolidado técnico <em>FortSmart</em>
              </h3>
              <div className="fs-mon-premium__conclusion-body">
                {observacoes && observacoes.trim().length > 0 ? (
                  <p>{observacoes}</p>
                ) : (
                  <p>
                    Este relatório consolida o monitoramento de <strong>{normalized.talhoes.length}</strong> talhão(ões),
                    {' '}com <strong>{totalPontosMon}</strong> pontos amostrados e <strong>{totalOcorrenciasMon}</strong> registros de ocorrência.
                    Priorize os cartões na seção de decisão e os detalhes por talhão para plano de ação em campo.
                  </p>
                )}
              </div>
            </div>
            <aside>
              <div className="fs-mon-premium__sig-card">
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,.3)', marginBottom: 14 }}>Assinatura técnica</div>
                <div className="fs-mon-premium__sig-row">
                  <span>Responsável</span>
                  <span>{normalized.tecnico}</span>
                </div>
                {normalized.crea && (
                  <div className="fs-mon-premium__sig-row">
                    <span>CREA</span>
                    <span>{normalized.crea}</span>
                  </div>
                )}
                <div className="fs-mon-premium__sig-row">
                  <span>Data</span>
                  <span>{normalized.data || '—'}</span>
                </div>
                <div className="fs-mon-premium__sig-row">
                  <span>Origem dados</span>
                  <span>{relatorioUuid ? 'Aplicativo / link compartilhado' : 'Relatório web'}</span>
                </div>
              </div>
              <p className="fs-mon-premium__disclaimer">
                Relatório técnico gerado na plataforma FortSmart com base nos dados de campo registrados pelo profissional indicado.
                Para defensivos e doses, siga sempre a legislação vigente e parecer técnico presencial.
              </p>
            </aside>
          </div>
        </section>

      <footer className="fs-mon-premium__report-footer no-print">
          <div className="fs-mon-premium__footer-brand">
            <div className="fs-mon-premium__logo" style={{ width: 24, height: 24, borderRadius: 5 }}>
              <svg viewBox="0 0 24 24" style={{ width: 13, height: 13 }}><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-1 15l-4-4 1.4-1.4 2.6 2.6 5.6-5.6L18 10l-7 7z" /></svg>
            </div>
            FortSmart · Inteligência de campo
          </div>
          <span className="fs-mon-premium__footer-meta">
            {normalized.data || '—'} · {normalized.fazenda || 'Propriedade'} · {normalized.safra || 'Safra'}
          </span>
          <div className="fs-mon-premium__footer-actions">
            <button type="button" className="fs-mon-premium__footer-btn" onClick={() => typeof window !== 'undefined' && window.print()}>Imprimir</button>
            <button type="button" className="fs-mon-premium__footer-btn fs-mon-premium__footer-btn--primary" onClick={handleExportPDF}>Exportar PDF</button>
          </div>
      </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="fs-mon-premium__kpi-cell">
      <div className="fs-mon-premium__kpi-label">{label}</div>
      <div className="fs-mon-premium__kpi-val">{value}</div>
    </div>
  );
}
