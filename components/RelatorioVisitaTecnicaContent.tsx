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
  Scale,
  Sprout,
} from 'lucide-react';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import Mapa from '@/components/Mapa';
import { formatDate } from '@/utils/format';

import { postReportAnalytics } from '@/lib/report-analytics-client';
import { coerceVisitaObjectArray } from '@/lib/visita-tecnica/coerceVisitaPayload';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';
import { buildVtHeroNarrative } from '@/lib/visita-tecnica/buildVtDecisionNarrative';
import { extractProdutividadeSerie } from '@/lib/visita-tecnica/extractVtChartSeries';
import TabelaTecnicaCampos from './visita_tecnica/TabelaTecnicaCampos';
import OcorrenciasPragasVT from './visita_tecnica/sections/OcorrenciasPragasVT';
import InteligenciaEstrategicaVisitaVT from './visita_tecnica/sections/InteligenciaEstrategicaVisitaVT';
import { labelCiclo } from '@/lib/visita-tecnica/label-utils';
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
import dp from './visita_tecnica/decision-premium.module.css';
import mc from './visita_tecnica/vt-mobile-collapsible.module.css';
import VtBlocoImpactoProdutivo from './visita_tecnica/VtBlocoImpactoProdutivo';
import VtDecisionHero from './visita_tecnica/VtDecisionHero';
import VtGraficoTendenciasDecisao from './visita_tecnica/VtGraficoTendenciasDecisao';
import VtHistoricoFenologia from './visita_tecnica/VtHistoricoFenologia';
import VtInteligenciaNarrativa from './visita_tecnica/VtInteligenciaNarrativa';
import VtMobileCollapsibleDetails from './visita_tecnica/VtMobileCollapsibleDetails';
import VtNarrativaDiagnostico from './visita_tecnica/VtNarrativaDiagnostico';
import VtPragasBarras from './visita_tecnica/VtPragasBarras';
import RelatorioSideBySide from './visita_tecnica/RelatorioSideBySide';
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

  const visitaSnapshot =
    relatorio.visita_snapshot != null && typeof relatorio.visita_snapshot === 'object'
      ? relatorio.visita_snapshot
      : undefined;
  const pontosGeoSnap = Array.isArray(visitaSnapshot?.pontos_georreferenciados)
    ? visitaSnapshot.pontos_georreferenciados
    : [];

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
    const fromMapa = mapped.filter(Boolean) as PontoMapa[];
    if (fromMapa.length > 0) return fromMapa;

    return pontosGeoSnap
      .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object' && !Array.isArray(p))
      .map((p) => {
        const lat = Number(p.latitude ?? p.lat);
        const lng = Number(p.longitude ?? p.lng ?? p.lon);
        if (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
        const desc = p.descricao != null ? String(p.descricao) : undefined;
        return {
          latitude: lat,
          longitude: lng,
          titulo: desc,
          descricao: desc,
          data: p.data != null ? String(p.data) : undefined,
        };
      })
      .filter(Boolean) as PontoMapa[];
  }, [mapa.pontos, pontosGeoSnap]);

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
  const pontosTableRows = useMemo((): Record<string, unknown>[] => {
    const fromMapa = Array.isArray(mapa.pontos) ? (mapa.pontos as Record<string, unknown>[]) : [];
    if (pontosGeoSnap.length === 0) return fromMapa;
    return pontosGeoSnap.map((p) => {
      const rec = p as Record<string, unknown>;
      const lat = rec.latitude ?? rec.lat;
      const lng = rec.longitude ?? rec.lng ?? rec.lon;
      return {
        ...rec,
        latitude: lat,
        longitude: lng,
        lat,
        lng,
        titulo: rec.titulo ?? rec.descricao,
        tipo: rec.tipo ?? 'visita_snapshot',
      };
    });
  }, [pontosGeoSnap, mapa.pontos]);
  const hasPontosGeoTable = useMemo(() => {
    return pontosTableRows.some((p) => {
      const lat = p.latitude ?? p.lat;
      const lng = p.longitude ?? p.lng ?? p.lon;
      return lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
    });
  }, [pontosTableRows]);
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

  const vtProductivity = useMemo(() => {
    const ctx = contextoSafra;
    if (!ctx || typeof ctx !== 'object') {
      return {
        showCard: false,
        potencial: undefined as string | undefined,
        estimativa: undefined as string | undefined,
        nota: undefined as string | undefined,
      };
    }
    const pot = ctx.potencialScHa != null ? String(ctx.potencialScHa).trim() : '';
    const est = ctx.estimativaAtualScHa != null ? String(ctx.estimativaAtualScHa).trim() : '';
    const nota = ctx.notaMetodoEstimativa != null ? String(ctx.notaMetodoEstimativa).trim() : '';
    const showCard = pot.length > 0 || est.length > 0 || nota.length > 0;
    return {
      showCard,
      potencial: pot.length > 0 ? pot : undefined,
      estimativa: est.length > 0 ? est : undefined,
      nota: nota.length > 0 ? nota : undefined,
    };
  }, [contextoSafra]);

  const heroModel = useMemo(() => {
    const rel = relatorio as Record<string, unknown>;
    const areaN = talhao?.area != null ? Number(talhao.area) : NaN;
    const fen =
      (fenologia?.estadio ?? fenologia?.estagio) != null
        ? String(fenologia.estadio ?? fenologia.estagio)
        : undefined;
    return buildVtHeroNarrative(rel, decisaoInput, {
      fazenda,
      talhaoNome: talhao?.nome != null ? String(talhao.nome) : undefined,
      cultura: talhao?.cultura != null ? String(talhao.cultura) : undefined,
      areaHa: !Number.isNaN(areaN) ? areaN : undefined,
      fenologiaEstagio: fen,
      potencialSc: vtProductivity.potencial,
      estimativaSc: vtProductivity.estimativa,
    });
  }, [relatorio, decisaoInput, fazenda, talhao, fenologia, vtProductivity]);

  const showDeckProdutividadeSlide =
    vtProductivity.showCard && (!vtProductivity.potencial || !vtProductivity.estimativa);

  const serieProdutividadeVt = useMemo(
    () => extractProdutividadeSerie(relatorio as Record<string, unknown>),
    [relatorio],
  );

  const historicoFenologiaRows = useMemo(() => {
    const h = fenologia?.historico;
    if (!Array.isArray(h)) return [];
    return h.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x));
  }, [fenologia]);

  const contextoSafraLinhas = useMemo(() => {
    if (!contextoSafra || typeof contextoSafra !== 'object') return [];
    const ctx = contextoSafra;
    const rows = [
      { campo: 'Material / Variedade', valor: ctx.materialVariedade != null ? String(ctx.materialVariedade) : undefined },
      { campo: 'Empresa', valor: ctx.empresa != null ? String(ctx.empresa) : undefined },
      { campo: 'Espaçamento', valor: ctx.espacamentoCm != null ? `${ctx.espacamentoCm} cm` : undefined },
      {
        campo: 'População alvo',
        valor: ctx.populacaoAlvoPlHa != null ? `${Number(ctx.populacaoAlvoPlHa).toLocaleString('pt-BR')} plantas/ha` : undefined,
      },
      { campo: 'DAP', valor: ctx.dap != null ? String(ctx.dap) : undefined },
      { campo: 'DAE', valor: ctx.dae != null ? String(ctx.dae) : undefined },
      { campo: 'Potencial (sc/ha)', valor: ctx.potencialScHa != null ? String(ctx.potencialScHa) : undefined },
      { campo: 'Estimativa atual (sc/ha)', valor: ctx.estimativaAtualScHa != null ? String(ctx.estimativaAtualScHa) : undefined },
      { campo: 'Nota método estimativa', valor: ctx.notaMetodoEstimativa != null ? String(ctx.notaMetodoEstimativa) : undefined },
      { campo: 'Ciclo da cultivar', valor: ctx.cicloCultivar != null ? labelCiclo(ctx.cicloCultivar) : undefined },
      { campo: 'Tecnologia sementes', valor: ctx.tecnologiaSementes != null ? String(ctx.tecnologiaSementes) : undefined },
      {
        campo: 'Resist. ferrugem / nematóide / lagarta',
        valor:
          ctx.resistFerrugem != null || ctx.resistNematoide != null || ctx.resistLagarta != null
            ? [
                ctx.resistFerrugem != null ? `Ferrugem: ${ctx.resistFerrugem === true || ctx.resistFerrugem === 1 ? 'Sim' : 'Não'}` : null,
                ctx.resistNematoide != null ? `Nematóide: ${ctx.resistNematoide === true || ctx.resistNematoide === 1 ? 'Sim' : 'Não'}` : null,
                ctx.resistLagarta != null ? `Lagarta: ${ctx.resistLagarta === true || ctx.resistLagarta === 1 ? 'Sim' : 'Não'}` : null,
              ]
                .filter(Boolean)
                .join(' · ') || undefined
            : undefined,
      },
    ];
    if (!vtProductivity.showCard) return rows;
    return rows.filter(
      (l) =>
        l.campo !== 'Potencial (sc/ha)' &&
        l.campo !== 'Estimativa atual (sc/ha)' &&
        l.campo !== 'Nota método estimativa',
    );
  }, [contextoSafra, vtProductivity.showCard]);

  const hasContextoSafraSlide = useMemo(
    () => contextoSafraLinhas.some((l) => l.valor != null && String(l.valor).trim() !== ''),
    [contextoSafraLinhas],
  );

  return (
    <div className={dp.pagePremium} style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div className={`no-print ${deck.stickyToolbar}`}>
        <div className={deck.stickyToolbarBrand}>
          <FortSmartLogo size={36} />
          <span className={deck.stickyToolbarTitle}>Relatório de visita técnica</span>
        </div>
        <div className={deck.stickyToolbarActions}>
          <button type="button" onClick={handleShare} className={deck.stickyBtnGhost}>
            Compartilhar link
          </button>
          <button type="button" onClick={handleExportPDF} className={deck.stickyBtnSolid}>
            Baixar PDF
          </button>
        </div>
      </div>

      <div
        id="relatorio-visita-tecnica-content"
        className={`relatorio-editorial ${deck.deck}`}
        style={{ maxWidth: 1160, margin: '0 auto', padding: '28px 24px 32px' }}
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

        <RelatorioSideBySide
          relatorio={relatorio}
          talhaoNome={talhao?.nome != null ? String(talhao.nome) : undefined}
          culturaNome={talhao?.cultura != null ? String(talhao.cultura) : undefined}
          dataRelatorio={data ? formatDate(data) || data : undefined}
          onPhotoClick={(url) => {
            const i = imagens.findIndex((x) => (x.url ?? '').trim() === url.trim());
            if (i >= 0) setLightboxIndex(i);
          }}
        />

        <div className={deck.cardGrid}>
          <div className={`${deck.cardSpanFull} ${dp.cockpitStack}`}>
            <VtDecisionHero model={heroModel} />
            <VtBlocoImpactoProdutivo
              potencial={vtProductivity.potencial}
              estimativa={vtProductivity.estimativa}
              frase={heroModel.impactoFrase}
              notaMetodo={vtProductivity.nota}
              seriePontos={serieProdutividadeVt}
            />
            <VtGraficoTendenciasDecisao relatorio={relatorio as Record<string, unknown>} />
            {diagnostico ? <VtNarrativaDiagnostico diagnostico={diagnostico} /> : null}
            <VtInteligenciaNarrativa relatorio={relatorio as Record<string, unknown>} />
          </div>

        {hasMapa ? (
          <VtDeckSlide detail icon={MapPinned} spanFull kicker="Geodata" title="Mapa do talhão e pontos georreferenciados">
            <div style={{ marginBottom: pontosForMap.length > 0 ? 20 : 0 }}>
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
            {hasPontosGeoTable ? (
              <>
                <div className={deck.reportCardKicker} style={{ marginBottom: 10 }}>
                  Coordenadas dos pontos (WGS84)
                </div>
                <VtPontosGeorefTable pontos={pontosTableRows} />
              </>
            ) : null}
          </VtDeckSlide>
        ) : (
          <VtDeckSlide detail icon={MapPinned} spanFull kicker="Geodata" title="Mapa do talhão e pontos georreferenciados">
            <p className={deck.emptyHint}>
              Sem polígono ou pontos com coordenadas neste relatório. No app, associe GPS aos registros (fenologia, pragas, ocorrências) ou carregue o perímetro do talhão.
            </p>
          </VtDeckSlide>
        )}

        <VtDeckSlide detail icon={Home} kicker="Identificação" title="Dados da propriedade e do talhão">
            <TabelaTecnicaCampos
              linhas={[
                { campo: 'Fazenda', valor: fazenda !== 'Fazenda' ? fazenda : undefined },
                { campo: 'Produtor', valor: proprietario },
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

        {hasContextoSafraSlide && (
          <VtDeckSlide detail icon={Sprout} kicker="Planeamento agrícola" title="Contexto da safra">
            <TabelaTecnicaCampos linhas={contextoSafraLinhas} />
          </VtDeckSlide>
        )}

        {showDeckProdutividadeSlide && (
          <VtDeckSlide detail icon={Scale} spanFull kicker="Produção" title="Estimativa de produtividade">
            <div className={deck.prodHighlightGrid}>
              <div className={deck.prodHighlightBox}>
                <div className={deck.prodHighlightLabel}>Potencial</div>
                <div className={deck.prodHighlightValue}>
                  {vtProductivity.potencial ?? '—'}
                  <span className={deck.prodHighlightUnit}>sc/ha</span>
                </div>
              </div>
              <div className={deck.prodHighlightBox}>
                <div className={deck.prodHighlightLabel}>Estimativa atual</div>
                <div className={deck.prodHighlightValue}>
                  {vtProductivity.estimativa ?? '—'}
                  <span className={deck.prodHighlightUnit}>sc/ha</span>
                </div>
              </div>
            </div>
            {vtProductivity.nota != null ? (
              <p className={deck.prodNota}>
                <strong style={{ color: 'var(--vt-forest)' }}>Método / observação:</strong> {vtProductivity.nota}
              </p>
            ) : null}
          </VtDeckSlide>
        )}

        <VtDeckSlide detail icon={ClipboardCheck} kicker="Roteiro" title="Checklist da visita">
          <VtChecklistBlock checklist={checklist} />
        </VtDeckSlide>

        {visitaSnapshot == null ? (
          <VtDeckSlide detail icon={CloudSun} kicker="Ambiente" title="Condições do momento">
            <VtCondicoesMomentBlock
              condicoes={condicoes}
              amostragem={
                condicoes.amostragem != null && typeof condicoes.amostragem === 'object'
                  ? (condicoes.amostragem as Record<string, unknown>)
                  : undefined
              }
            />
          </VtDeckSlide>
        ) : null}

        {/* 3. Desenvolvimento da Cultura — tabela técnica */}
        {(fenologia?.estadio != null || fenologia?.estagio != null || fenologia?.dataUltimaAvaliacao != null || fenologia?.ultimaAvaliacaoDias != null || populacao?.plantasHa != null || populacao?.plantasPorMetro != null || populacao?.eficienciaPct != null || populacao?.situacao != null) && (
          <VtDeckSlide detail icon={Leaf} kicker="Cultura" title="Fenologia e desenvolvimento">
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

        {pragas.length === 0 ? (
          <VtDeckSlide detail icon={Bug} spanFull kicker="Fitossanidade" title="Pragas, doenças e daninhas">
            <p className={deck.emptyHint}>Nenhum alvo fitossanitário registrado nesta visita.</p>
          </VtDeckSlide>
        ) : (
          <div className={deck.cardSpanFull}>
            <VtPragasBarras pragas={pragas} />
            {visitaSnapshot == null ? (
              <div className={dp.detailsZone} style={{ marginTop: '1.5rem', paddingTop: '1.25rem' }}>
                <div className={dp.detailsZoneLabel}>Registro técnico detalhado</div>
                <p className={mc.hintMobileOnly}>No celular, use o botão abaixo para abrir a tabela completa (PDF e telas largas mostram tudo automaticamente).</p>
                <VtMobileCollapsibleDetails
                  panelId="vt-pragas-tabela-detalhe"
                  labelExpandir="Mostrar tabela técnica completa"
                  labelRecolher="Ocultar tabela técnica"
                >
                  <OcorrenciasPragasVT pragas={pragas} embedded />
                </VtMobileCollapsibleDetails>
              </div>
            ) : (
              <p className={deck.emptyHint} style={{ marginTop: '1rem' }}>
                Detalhe fitossanitário por espécie está no comparativo lado a lado acima.
              </p>
            )}
          </div>
        )}

        <div className={deck.cardSpanFull}>
          <DiagnosticoEPlanoAcao diagnostico={diagnostico} planoAcao={planoAcao} omitDiagnosticoResumo />
        </div>

        {visitaSnapshot == null ? (
          <VtDeckSlide detail icon={AlertTriangle} variant="warning" spanFull kicker="Não conformidades" title="Desvios e anomalias">
            <VtDesviosBlock desvios={desvios} />
          </VtDeckSlide>
        ) : null}

        {aplicacoes.length === 0 ? (
          <VtDeckSlide detail icon={Droplets} spanFull kicker="Operações" title="Aplicações e prescrições">
            <p className={deck.emptyHint}>
              Nenhuma prescrição ou operação ligada ao talhão incluída neste relatório. As prescrições do módulo Premium e as operações registradas na visita aparecem aqui.
            </p>
          </VtDeckSlide>
        ) : visitaSnapshot != null ? (
          <div className={deck.cardSpanFull}>
            <p className={deck.emptyHint} style={{ marginTop: 0 }}>
              Aplicações e prescrições do snapshot estão no comparativo acima (somente leitura).
            </p>
          </div>
        ) : (
          <div className={deck.cardSpanFull}>
            <AplicacoesRealizadasVT aplicacoes={aplicacoes} />
          </div>
        )}

        <div className={deck.cardSpanFull}>
          <InteligenciaEstrategicaVisitaVT produtividade={produtividadePayload} inteligenciaEstrategica={inteligenciaEstrategica} />
        </div>

        <div className={`${deck.cardSpanFull} ${dp.detailsZone}`}>
          <div className={dp.detailsZoneLabel}>Detalhamento técnico</div>
          <VtMobileCollapsibleDetails
            panelId="vt-detalhe-motor-painel"
            labelExpandir="Mostrar motor de decisão e painel executivo"
            labelRecolher="Ocultar motor e painel"
          >
            <DecisaoAgronomicaVT input={decisaoInput} />
            <div style={{ marginTop: '1rem' }}>
              <InteligenciaAgronomicaPanel relatorio={relatorio as Record<string, unknown>} variant="executiveBrief" />
            </div>
          </VtMobileCollapsibleDetails>
        </div>

        {historicoFenologiaRows.length > 0 ? (
          <div className={deck.cardSpanFull}>
            <VtHistoricoFenologia itens={historicoFenologiaRows} />
          </div>
        ) : null}

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
