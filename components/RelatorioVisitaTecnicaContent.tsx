'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  AlertTriangle,
  Bug,
  ClipboardCheck,
  CloudSun,
  Droplets,
  Home,
  Leaf,
  MapPinned,
  Sprout,
} from 'lucide-react';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import Mapa from '@/components/Mapa';
import { formatDate } from '@/utils/format';

import { postReportAnalytics } from '@/lib/report-analytics-client';
import { coerceVisitaObjectArray } from '@/lib/visita-tecnica/coerceVisitaPayload';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';
import TabelaTecnicaCampos from './visita_tecnica/TabelaTecnicaCampos';
import OcorrenciasPragasVT from './visita_tecnica/sections/OcorrenciasPragasVT';
import InteligenciaEstrategicaVisitaVT from './visita_tecnica/sections/InteligenciaEstrategicaVisitaVT';
import { labelMetodoAmostragem, labelCiclo } from '@/lib/visita-tecnica/label-utils';
import DiagnosticoEPlanoAcao from './visita_tecnica/sections/DiagnosticoEPlanoAcao';
import DecisaoAgronomicaVT from './visita_tecnica/sections/DecisaoAgronomicaVT';
import AplicacoesRealizadasVT from './visita_tecnica/sections/AplicacoesRealizadasVT';
import FotografiasEAutoriaVT from './visita_tecnica/sections/FotografiasEAutoriaVT';
import MapaTalhaoClientMount from './visita_tecnica/MapaTalhaoClientMount';
import {
  VtChecklistBlock,
  VtCondicoesMomentBlock,
  VtDeckSlide,
  VtDesviosBlock,
  VtPontosGeorefTable,
} from './visita_tecnica/VisitaTecnicaDeckBlocks';
import deck from './visita_tecnica/visita-tecnica-deck.module.css';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

export type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

interface RelatorioVisitaTecnicaContentProps {
  relatorio: PayloadVisitaTecnica;
  reportId?: string;
  relatorioUuid?: string;
  /** Token da rota `/r/[token]` — métricas `download` / `share` em `ai_report_events`. */
  shareToken?: string;
}

export default function RelatorioVisitaTecnicaContent({ relatorio, reportId, relatorioUuid, shareToken }: RelatorioVisitaTecnicaContentProps) {
  const meta = (relatorio.meta != null && typeof relatorio.meta === 'object') ? (relatorio.meta as Record<string, unknown>) : {};
  const prop = (relatorio.propriedade != null && typeof relatorio.propriedade === 'object') ? (relatorio.propriedade as Record<string, unknown>) : {};
  const talhoesList = Array.isArray((relatorio as Record<string, unknown>).talhoes)
    ? ((relatorio as Record<string, unknown>).talhoes as unknown[])
    : [];
  const primeiroTalhao =
    talhoesList[0] != null && typeof talhoesList[0] === 'object' && !Array.isArray(talhoesList[0])
      ? (talhoesList[0] as Record<string, unknown>)
      : {};
  /** Dados do primeiro talhão vêm só de `talhoes[0]` (a rota /r normaliza e remove `talhao` na raiz). */
  const talhao = primeiroTalhao;
  const contextoSafra = (relatorio.contextoSafra != null && typeof relatorio.contextoSafra === 'object') ? (relatorio.contextoSafra as Record<string, unknown>) : undefined;
  const populacao = (relatorio.populacao != null && typeof relatorio.populacao === 'object') ? (relatorio.populacao as Record<string, unknown>) : undefined;
  const assinatura = (relatorio.assinaturaTecnica != null && typeof relatorio.assinaturaTecnica === 'object') ? (relatorio.assinaturaTecnica as Record<string, unknown>) : undefined;

  const fazenda = String(relatorio.fazenda ?? prop?.fazenda ?? 'Fazenda').trim() || 'Fazenda';
  const safra = String(relatorio.safra ?? meta?.safra ?? '').trim();
  const data = String(relatorio.data ?? meta?.dataGeracao ?? '').trim();
  const tecnico = String(relatorio.tecnico ?? meta?.tecnico ?? 'FortSmart Agro').trim() || 'FortSmart Agro';
  const tecnicoCrea = (meta?.tecnicoCrea ?? prop?.tecnicoCrea) != null ? String(meta?.tecnicoCrea ?? prop?.tecnicoCrea) : undefined;
  const municipio = prop?.municipio != null ? String(prop.municipio) : undefined;
  const estado = prop?.estado != null ? String(prop.estado) : undefined;
  const proprietario = prop?.proprietario != null ? String(prop.proprietario) : undefined;

  const aplicacoesRaw = relatorio.aplicacoes ?? [];
  const aplicacoes = (Array.isArray(aplicacoesRaw) ? aplicacoesRaw : []).map((a: any) => ({
    tipo: a.tipo ?? a.tipoAplicacao ?? '—',
    data: a.data ?? '—',
    produto: a.produto ?? a.produtoNome ?? '—',
    dose: a.dose != null ? String(a.dose) : undefined,
    unidade: a.unidade ?? 'L/ha',
    classe: a.classe ?? a.classeToxicologica ?? '—',
    status: a.status ?? '—',
    alvo: a.alvo ?? a.target ?? a.alvoBiologico ?? '—',
    talhaoId: a.talhaoId,
    talhaoNome: a.talhaoNome,
    aplicacaoId: a.aplicacaoId ?? a.prescricaoId,
    responsavel: a.responsavel,
    tipoOperacao: a.tipoOperacao,
    areaTrabalhoHa: a.areaTrabalhoHa,
    volumeLHa: a.volumeLHa,
    quantidade: a.quantidade,
    quantidadePorTanque: a.quantidadePorTanque,
    grupoQuimico: a.grupoQuimico,
    intervaloSeguranca: a.intervaloSeguranca,
    custoUnitario: a.custoUnitario,
    custoPorHa: a.custoPorHa,
    custoTotal: a.custoTotal,
    observacoes: a.observacoes,
  })) as NonNullable<PayloadVisitaTecnica['aplicacoes']>;
  const diagnostico = relatorio.diagnostico as Record<string, unknown> | undefined;
  const planoAcao = relatorio.planoAcao;
  const conclusao = relatorio.conclusao as string | undefined;
  const pragas = coerceVisitaObjectArray(relatorio.pragas);
  const desvios = coerceVisitaObjectArray((relatorio as Record<string, unknown>).desvios);
  const checklist = relatorio.checklist as Record<string, unknown> | undefined;
  const condicoes = (relatorio.condicoes ?? {}) as Record<string, unknown>;
  const amostragem =
    condicoes.amostragem != null && typeof condicoes.amostragem === 'object'
      ? (condicoes.amostragem as Record<string, unknown>)
      : undefined;
  const inteligenciaEstrategica =
    relatorio.inteligencia_estrategica != null && typeof relatorio.inteligencia_estrategica === 'object'
      ? (relatorio.inteligencia_estrategica as Record<string, unknown>)
      : undefined;
  const produtividadePayload =
    relatorio.produtividade != null && typeof relatorio.produtividade === 'object'
      ? (relatorio.produtividade as Record<string, unknown>)
      : undefined;
  const fenologia = (relatorio.fenologia ?? {}) as Record<string, unknown>;
  const imagens = coerceVisitaObjectArray(relatorio.imagens) as Array<{
    url?: string;
    descricao?: string;
    categoria?: string;
    data?: string;
  }>;
  const imagensFenologia = imagens.filter((img) => (img.categoria ?? '').toLowerCase() === 'fenologia');
  const mapa = (relatorio.mapa ?? {}) as Record<string, unknown> & {
    viewBox?: string;
    path?: string;
    polygon?: number[][] | string;
    pontos?: Array<Record<string, unknown> & { x?: number; y?: number; index?: number; severidade?: string; titulo?: string; descricao?: string; data?: string; latitude?: number; longitude?: number; lat?: number; lng?: number }>;
  };

  const polygonForMap = useMemo(() => {
    let raw: string | number[][] | undefined = mapa.polygon;
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw) as number[][]; } catch { return undefined; }
    }
    if (!Array.isArray(raw) || raw.length < 3) return undefined;
    const out: [number, number][] = [];
    for (const c of raw) {
      if (Array.isArray(c) && c.length >= 2) {
        const a = Number(c[0]);
        const b = Number(c[1]);
        if (!Number.isNaN(a) && !Number.isNaN(b)) {
          const lat = Math.abs(a) <= 90 && Math.abs(b) <= 180 ? a : b;
          const lng = Math.abs(a) <= 90 && Math.abs(b) <= 180 ? b : a;
          if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) out.push([lat, lng]);
        }
      } else if (c && typeof c === 'object' && !Array.isArray(c)) {
        const lat = Number((c as Record<string, unknown>).lat ?? (c as Record<string, unknown>).latitude);
        const lng = Number((c as Record<string, unknown>).lng ?? (c as Record<string, unknown>).longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) out.push([lat, lng]);
      }
    }
    return out.length >= 3 ? out : undefined;
  }, [mapa.polygon]);
  type PontoMapa = { latitude: number; longitude: number; id?: string; titulo?: string; descricao?: string; estagio?: string; data?: string };
  const pontosForMap = useMemo((): PontoMapa[] => {
    const pts = mapa.pontos ?? [];
    if (!Array.isArray(pts)) return [];
    const mapped = pts.map((p: Record<string, unknown>) => {
      const lat = (p.latitude ?? p.lat) as number | undefined;
      const lng = (p.longitude ?? p.lng) as number | undefined;
      if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
      return {
        latitude: lat,
        longitude: lng,
        id: p.id != null || p.index != null ? String(p.id ?? p.index) : undefined,
        titulo: p.titulo != null ? String(p.titulo) : undefined,
        descricao: [p.titulo, p.descricao].filter(Boolean).join(' — ') || (p.descricao != null ? String(p.descricao) : undefined),
        estagio: p.estagio != null ? String(p.estagio) : undefined,
        data: p.data != null ? String(p.data) : undefined,
      };
    });
    return mapped.filter(Boolean) as PontoMapa[];
  }, [mapa.pontos]);

  const hasValidPolygon = (polygonForMap?.length ?? 0) >= 3;
  const hasValidGeoPontos = pontosForMap.length > 0;
  const hasPolygonOrGeoPontos = hasValidPolygon || hasValidGeoPontos;
  const hasMapa = hasPolygonOrGeoPontos || (mapa.path != null && String(mapa.path).trim() !== '') || (Array.isArray(mapa.pontos) && mapa.pontos.length > 0);
  const useRealMap = hasValidPolygon || hasValidGeoPontos;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const decisaoInput = useMemo(
    () => ({
      pragas,
      diagnostico,
      fenologia,
      populacao,
      condicoes,
    }),
    [pragas, diagnostico, fenologia, populacao, condicoes],
  );

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const fireShareMetric = () => {
      if (shareToken?.trim()) {
        void postReportAnalytics({
          shareToken: shareToken.trim(),
          eventType: 'share',
          module: 'visita_tecnica',
        });
      }
    };
    try {
      if (navigator.share && url) {
        await navigator.share({
          title: 'FortSmart — Relatório de visita técnica',
          text: `Relatório técnico: ${fazenda}${talhao?.nome ? ` · ${String(talhao.nome)}` : ''}`,
          url,
        });
        fireShareMetric();
        return;
      }
    } catch {
      /* cancelado ou indisponível */
    }
    try {
      if (url && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
        alert('Link copiado para a área de transferência.');
        fireShareMetric();
      }
    } catch {
      /* ignore */
    }
  }, [fazenda, talhao, shareToken]);

  const handleExportPDF = useCallback(async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const el = document.getElementById('relatorio-visita-tecnica-content');
    if (!el) return;
    setLightboxIndex(null);
    const safeFazenda = (fazenda || 'Relatorio').replace(/\s/g, '_');
    const safeData = (data || '').replace(/\//g, '-').replace(/\s/g, '_') || 'data';
    document.body.classList.add('exporting-pdf');
    try {
      await html2pdf().set({
        margin: [10, 10, 10, 10],
        filename: `FortSmart_Visita_Tecnica_${safeFazenda}_${safeData}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }).from(el).save();
      if (shareToken?.trim()) {
        void postReportAnalytics({
          shareToken: shareToken.trim(),
          eventType: 'download',
          module: 'visita_tecnica',
        });
      }
    } finally {
      document.body.classList.remove('exporting-pdf');
    }
  }, [fazenda, data, shareToken]);

  const lightboxImg = lightboxIndex !== null && imagens[lightboxIndex]?.url
    ? imagens[lightboxIndex]
    : null;

  const pontosMapaRows = Array.isArray(mapa.pontos) ? (mapa.pontos as Record<string, unknown>[]) : [];
  const reportKey =
    [reportId, relatorioUuid, meta.id, meta.relatorioId, meta.uuid]
      .map((x) => (x != null ? String(x).trim() : ''))
      .find((s) => s.length > 0) ?? '';
  const versaoRel =
    meta.versao != null
      ? String(meta.versao)
      : meta.version != null
        ? String(meta.version)
        : meta.appVersion != null
          ? String(meta.appVersion)
          : '';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f2eb', paddingBottom: 80 }}>
      {/* Barra fixa: Baixar PDF */}
      <div
        className="no-print"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'linear-gradient(180deg, #14532d 0%, #166534 100%)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FortSmartLogo size={36} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.95)' }}>Relatório de Visita Técnica</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: '12px 20px',
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.5)',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Compartilhar link
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            style={{
              padding: '12px 24px',
              background: '#fff',
              color: '#166534',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            Baixar PDF
          </button>
        </div>
      </div>

      <div
        id="relatorio-visita-tecnica-content"
        className={`relatorio-editorial ${deck.deck}`}
        style={{ maxWidth: 920, margin: '0 auto', padding: '28px 24px 32px' }}
      >
        <header className={deck.reportHeader}>
          <h1 className={deck.reportHeaderTitle}>Relatório de visita técnica agronômica</h1>
          <div className={deck.reportHeaderLogo}>
            <FortSmartLogo size={44} />
          </div>
        </header>

        <div className={deck.metaStrip} role="group" aria-label="Metadados do relatório">
          <div className={deck.metaCell}>
            <div className={deck.metaCellLabel}>Relatório e data</div>
            <div className={deck.metaCellValue}>{reportKey || '—'}</div>
            <div className={deck.metaCellMuted}>{data ? formatDate(data) || data : 'Data não informada'}</div>
          </div>
          <div className={deck.metaCell}>
            <div className={deck.metaCellLabel}>Técnico e registro</div>
            <div className={deck.metaCellValue}>{tecnico}</div>
            <div className={deck.metaCellMuted}>
              {tecnicoCrea ? `CREA ${tecnicoCrea}` : 'CREA não informado'}
              {versaoRel ? ` · Versão ${versaoRel}` : ''}
            </div>
          </div>
          <div className={deck.metaCell}>
            <div className={deck.metaCellLabel}>Safra e propriedade</div>
            <div className={deck.metaCellValue}>{safra || '—'}</div>
            <div className={deck.metaCellMuted}>
              {[fazenda !== 'Fazenda' ? fazenda : null, talhao?.nome != null ? String(talhao.nome) : null]
                .filter(Boolean)
                .join(' · ') || '—'}
            </div>
          </div>
        </div>

        <div className={deck.cardGrid}>
          <div className={deck.cardSpanFull}>
            <InteligenciaAgronomicaPanel relatorio={relatorio as Record<string, unknown>} variant="executiveBrief" />
          </div>

          <div className={deck.cardSpanFull}>
            <DecisaoAgronomicaVT input={decisaoInput} />
          </div>

        <VtDeckSlide icon={Home} kicker="Identificação" title="Dados da propriedade e do talhão">
            <TabelaTecnicaCampos
              linhas={[
                { campo: 'Fazenda', valor: fazenda !== 'Fazenda' ? fazenda : undefined },
                { campo: 'Município', valor: municipio },
                { campo: 'Estado', valor: estado },
                { campo: 'Talhão', valor: talhao?.nome != null ? String(talhao.nome) : undefined },
                { campo: 'Cultura', valor: talhao?.cultura != null ? String(talhao.cultura) : undefined },
                { campo: 'Área', valor: talhao?.area != null ? `${Number(talhao.area).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ha` : undefined },
                { campo: 'Safra', valor: safra || undefined },
                { campo: 'Data do relatório', valor: data ? formatDate(data) || data : undefined },
                { campo: 'Responsável técnico', valor: tecnicoCrea ? `${tecnico} · CREA ${tecnicoCrea}` : tecnico },
              ]}
            />
        </VtDeckSlide>

        {/* 2. Contexto da Safra — tabela técnica (só renderiza se houver dados) */}
        {(contextoSafra?.materialVariedade != null ||
          contextoSafra?.empresa != null ||
          contextoSafra?.espacamentoCm != null ||
          contextoSafra?.populacaoAlvoPlHa != null ||
          contextoSafra?.dap != null ||
          contextoSafra?.dae != null ||
          contextoSafra?.potencialScHa != null ||
          contextoSafra?.estimativaAtualScHa != null ||
          contextoSafra?.notaMetodoEstimativa != null ||
          contextoSafra?.cicloCultivar != null ||
          contextoSafra?.tecnologiaSementes != null ||
          contextoSafra?.resistFerrugem != null ||
          contextoSafra?.resistNematoide != null ||
          contextoSafra?.resistLagarta != null) && (
          <VtDeckSlide icon={Sprout} kicker="Planeamento agrícola" title="Contexto da safra">
              <TabelaTecnicaCampos
                linhas={[
                  { campo: 'Material / Variedade', valor: contextoSafra?.materialVariedade != null ? String(contextoSafra.materialVariedade) : undefined },
                  { campo: 'Empresa', valor: contextoSafra?.empresa != null ? String(contextoSafra.empresa) : undefined },
                  { campo: 'Espaçamento', valor: contextoSafra?.espacamentoCm != null ? `${contextoSafra.espacamentoCm} cm` : undefined },
                  { campo: 'População alvo', valor: contextoSafra?.populacaoAlvoPlHa != null ? `${Number(contextoSafra.populacaoAlvoPlHa).toLocaleString('pt-BR')} plantas/ha` : undefined },
                  { campo: 'DAP', valor: contextoSafra?.dap != null ? String(contextoSafra.dap) : undefined },
                  { campo: 'DAE', valor: contextoSafra?.dae != null ? String(contextoSafra.dae) : undefined },
                  { campo: 'Potencial (sc/ha)', valor: contextoSafra?.potencialScHa != null ? String(contextoSafra.potencialScHa) : undefined },
                  { campo: 'Estimativa atual (sc/ha)', valor: contextoSafra?.estimativaAtualScHa != null ? String(contextoSafra.estimativaAtualScHa) : undefined },
                  { campo: 'Nota método estimativa', valor: contextoSafra?.notaMetodoEstimativa != null ? String(contextoSafra.notaMetodoEstimativa) : undefined },
                  { campo: 'Ciclo da cultivar', valor: contextoSafra?.cicloCultivar != null ? labelCiclo(contextoSafra.cicloCultivar) : undefined },
                  { campo: 'Tecnologia sementes', valor: contextoSafra?.tecnologiaSementes != null ? String(contextoSafra.tecnologiaSementes) : undefined },
                  {
                    campo: 'Resist. ferrugem / nematóide / lagarta',
                    valor:
                      contextoSafra?.resistFerrugem != null ||
                      contextoSafra?.resistNematoide != null ||
                      contextoSafra?.resistLagarta != null
                        ? [
                            contextoSafra?.resistFerrugem != null ? `Ferrugem: ${contextoSafra.resistFerrugem === true || contextoSafra.resistFerrugem === 1 ? 'Sim' : 'Não'}` : null,
                            contextoSafra?.resistNematoide != null ? `Nematóide: ${contextoSafra.resistNematoide === true || contextoSafra.resistNematoide === 1 ? 'Sim' : 'Não'}` : null,
                            contextoSafra?.resistLagarta != null ? `Lagarta: ${contextoSafra.resistLagarta === true || contextoSafra.resistLagarta === 1 ? 'Sim' : 'Não'}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || undefined
                        : undefined,
                  },
                ]}
              />
          </VtDeckSlide>
        )}

        <VtDeckSlide icon={ClipboardCheck} kicker="Roteiro" title="Checklist da visita">
          <VtChecklistBlock checklist={checklist} />
        </VtDeckSlide>

        <VtDeckSlide icon={CloudSun} kicker="Ambiente" title="Condições do momento">
          <VtCondicoesMomentBlock
            condicoes={condicoes}
            amostragem={
              condicoes.amostragem != null && typeof condicoes.amostragem === 'object'
                ? (condicoes.amostragem as Record<string, unknown>)
                : undefined
            }
          />
        </VtDeckSlide>

        {/* 3. Desenvolvimento da Cultura — tabela técnica */}
        {(fenologia?.estadio != null || fenologia?.estagio != null || fenologia?.dataUltimaAvaliacao != null || fenologia?.ultimaAvaliacaoDias != null || populacao?.plantasHa != null || populacao?.plantasPorMetro != null || populacao?.eficienciaPct != null || populacao?.situacao != null) && (
          <VtDeckSlide icon={Leaf} kicker="Cultura" title="Fenologia e desenvolvimento">
              <TabelaTecnicaCampos
                linhas={[
                  { campo: 'Estágio atual', valor: (fenologia?.estadio ?? fenologia?.estagio) != null ? String(fenologia.estadio ?? fenologia.estagio) : undefined },
                  { campo: 'Última avaliação', valor: fenologia?.dataUltimaAvaliacao != null ? formatDate(String(fenologia.dataUltimaAvaliacao)) || String(fenologia.dataUltimaAvaliacao) : undefined },
                  { campo: 'Dias desde avaliação', valor: fenologia?.ultimaAvaliacaoDias != null ? String(fenologia.ultimaAvaliacaoDias) : undefined },
                  { campo: 'Plantas por hectare', valor: populacao?.plantasHa != null ? Number(populacao.plantasHa).toLocaleString('pt-BR') : undefined },
                  { campo: 'Plantas por metro', valor: populacao?.plantasPorMetro != null ? Number(populacao.plantasPorMetro) : undefined },
                  { campo: 'Eficiência de estande', valor: populacao?.eficienciaPct != null ? `${Number(populacao.eficienciaPct)}%` : undefined },
                  { campo: 'Situação', valor: populacao?.situacao != null ? String(populacao.situacao) : undefined },
                ]}
              />
          </VtDeckSlide>
        )}

        {/* Mapa + pontos georreferenciados */}
        {hasMapa ? (
          <VtDeckSlide icon={MapPinned} spanFull kicker="Geodata" title="Mapa do talhão e pontos georreferenciados">
            <div style={{ marginBottom: pontosMapaRows.length > 0 ? 20 : 0 }}>
              {useRealMap ? (
                <MapaTalhaoClientMount
                  polygon={polygonForMap && polygonForMap.length >= 3 ? polygonForMap : undefined}
                  pontos={pontosForMap}
                  hideSectionTitle
                />
              ) : (
                <Mapa
                  mapa={{
                    viewBox: mapa.viewBox ?? '0 0 400 300',
                    path: mapa.path ?? undefined,
                    pontos: (Array.isArray(mapa.pontos) ? mapa.pontos : []).map((p: any, i: number) => ({
                      x: p.x ?? 0,
                      y: p.y ?? 0,
                      index: p.index ?? i + 1,
                      severidade: p.severidade,
                      descricao: [p.titulo, p.descricao].filter(Boolean).join(' — ') || p.descricao,
                      data: p.data,
                    })),
                  }}
                  relatorioId={relatorioUuid || reportId}
                  className="relatorio--visita-tecnica"
                />
              )}
            </div>
            {pontosMapaRows.length > 0 ? (
              <>
                <div className={deck.reportCardKicker} style={{ marginBottom: 10 }}>
                  Coordenadas dos pontos (WGS84)
                </div>
                <VtPontosGeorefTable pontos={pontosMapaRows} />
              </>
            ) : null}
          </VtDeckSlide>
        ) : (
          <VtDeckSlide icon={MapPinned} spanFull kicker="Geodata" title="Mapa do talhão e pontos georreferenciados">
            <p className={deck.emptyHint}>
              Sem polígono ou pontos com coordenadas neste relatório. No app, associe GPS aos registros (fenologia, pragas, ocorrências) ou carregue o perímetro do talhão.
            </p>
          </VtDeckSlide>
        )}

        {pragas.length === 0 ? (
          <VtDeckSlide icon={Bug} spanFull kicker="Fitossanidade" title="Pragas, doenças e daninhas">
            <p className={deck.emptyHint}>Nenhum alvo fitossanitário registrado nesta visita.</p>
          </VtDeckSlide>
        ) : (
          <div className={deck.cardSpanFull}>
            <OcorrenciasPragasVT pragas={pragas} />
          </div>
        )}

        <VtDeckSlide icon={AlertTriangle} variant="warning" spanFull kicker="Não conformidades" title="Desvios e anomalias">
          <VtDesviosBlock desvios={desvios} />
        </VtDeckSlide>

        <div className={deck.cardSpanFull}>
          <DiagnosticoEPlanoAcao diagnostico={diagnostico} planoAcao={planoAcao} />
        </div>

        {aplicacoes.length === 0 ? (
          <VtDeckSlide icon={Droplets} spanFull kicker="Operações" title="Aplicações e prescrições">
            <p className={deck.emptyHint}>
              Nenhuma prescrição ou operação ligada ao talhão incluída neste relatório. As prescrições do módulo Premium e as operações registradas na visita aparecem aqui.
            </p>
          </VtDeckSlide>
        ) : (
          <div className={deck.cardSpanFull}>
            <AplicacoesRealizadasVT aplicacoes={aplicacoes} />
          </div>
        )}

        <div className={deck.cardSpanFull}>
          <InteligenciaEstrategicaVisitaVT produtividade={produtividadePayload} inteligenciaEstrategica={inteligenciaEstrategica} />
        </div>

        <div className={deck.cardSpanFull}>
          <FotografiasEAutoriaVT
            imagens={imagens}
            assinatura={assinatura}
            conclusao={conclusao}
            setLightboxIndex={setLightboxIndex}
          />
        </div>
        </div>

        <footer className={deck.reportFooter}>
          <span>
            {relatorio.consultoria?.nome || 'FortSmart Agro'} — relatório de visita técnica · {data ? formatDate(data) || data : '—'} · {tecnico}
          </span>
          <FortSmartLogo size={32} />
        </footer>
      </div>

      {/* Modal zoom da imagem */}
      {lightboxImg?.url && (
        <ModalImagem
          src={lightboxImg.url}
          descricao={lightboxImg.descricao}
          data={lightboxImg.data}
          onClose={() => setLightboxIndex(null)}
          onPrev={
            imagens.length > 1
              ? () => setLightboxIndex((prev) => (prev === null ? null : prev === 0 ? imagens.length - 1 : prev - 1))
              : undefined
          }
          onNext={
            imagens.length > 1
              ? () => setLightboxIndex((prev) => (prev === null ? null : prev === imagens.length - 1 ? 0 : prev + 1))
              : undefined
          }
        />
      )}
    </div>
  );
}
