'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import Mapa from '@/components/Mapa';
import { formatDate } from '@/utils/format';

import { postReportAnalytics } from '@/lib/report-analytics-client';
import TabelaTecnicaCampos from './visita_tecnica/TabelaTecnicaCampos';
import OcorrenciasPragasVT from './visita_tecnica/sections/OcorrenciasPragasVT';
import InteligenciaEstrategicaVisitaVT from './visita_tecnica/sections/InteligenciaEstrategicaVisitaVT';
import { labelMetodoAmostragem, labelCiclo } from '@/lib/visita-tecnica/label-utils';
import DiagnosticoEPlanoAcao from './visita_tecnica/sections/DiagnosticoEPlanoAcao';
import DecisaoAgronomicaVT from './visita_tecnica/sections/DecisaoAgronomicaVT';
import AplicacoesRealizadasVT from './visita_tecnica/sections/AplicacoesRealizadasVT';
import FotografiasEAutoriaVT from './visita_tecnica/sections/FotografiasEAutoriaVT';

const MapaTalhaoDynamic = dynamic(() => import('@/components/MapaTalhaoDynamic'), { ssr: false });

export type PayloadVisitaTecnica = Record<string, unknown> & {
  tipo?: string;
  meta?: Record<string, unknown>;
  propriedade?: Record<string, unknown>;
  talhao?: Record<string, unknown>;
  contextoSafra?: Record<string, unknown>;
  populacao?: Record<string, unknown>;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  aplicacoes?: Array<{
    tipo?: string;
    data?: string;
    produto?: string;
    dose?: string;
    unidade?: string;
    classe?: string;
    status?: string;
    alvo?: string;
    talhaoId?: string;
    talhaoNome?: string;
    aplicacaoId?: string;
    responsavel?: string;
    tipoOperacao?: string;
    areaTrabalhoHa?: number;
    volumeLHa?: number;
    quantidade?: number;
    quantidadePorTanque?: number;
    grupoQuimico?: string;
    intervaloSeguranca?: string;
    custoUnitario?: number;
    custoPorHa?: number;
    custoTotal?: number;
    observacoes?: string;
  }>;
  diagnostico?: Record<string, unknown>;
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
  pragas?: Record<string, unknown>[];
  condicoes?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  mapa?: Record<string, unknown>;
  imagens?: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  assinaturaTecnica?: Record<string, unknown>;
  consultoria?: { nome?: string };
  /** Bloco gerado pelo app FortSmart (inteligência estratégica) */
  inteligencia_estrategica?: Record<string, unknown>;
  produtividade?: Record<string, unknown> | null;
};

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
  const talhao = (relatorio.talhao != null && typeof relatorio.talhao === 'object') ? (relatorio.talhao as Record<string, unknown>) : {};
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
  const pragas = (relatorio.pragas ?? []) as Record<string, unknown>[];
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
  const imagens = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
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

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', paddingBottom: 80 }}>
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

      <div id="relatorio-visita-tecnica-content" className="relatorio-editorial" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Título do relatório */}
        <header style={{ marginBottom: 28, paddingBottom: 20, borderBottom: '2px solid #e2e8f0' }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#14532d', margin: 0, letterSpacing: '-0.02em' }}>
            Relatório Técnico de Visita
          </h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 8, marginBottom: 0 }}>
            {fazenda}{talhao?.nome ? ` · ${String(talhao.nome)}` : ''}
            {talhao?.cultura ? ` · ${String(talhao.cultura)}` : ''}
            {safra ? ` · Safra ${safra}` : ''}
            {data ? ` · ${formatDate(data) || data}` : ''}
            {tecnico ? ` · Técnico: ${tecnico}` : ''}
          </p>
          {(condicoes?.temperatura != null || condicoes?.umidade != null || condicoes?.vento != null) && (
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, marginBottom: 0 }}>
              Clima no registro:
              {condicoes?.temperatura != null && ` ${condicoes.temperatura} °C`}
              {condicoes?.umidade != null && ` · Umidade ${condicoes.umidade}%`}
              {condicoes?.vento != null && ` · Vento ${String(condicoes.vento)}`}
            </p>
          )}
        </header>

        <DecisaoAgronomicaVT input={decisaoInput} />

        {/* 1. Dados da Propriedade — tabela técnica */}
        <section className="section-block">
          <div className="section-block__title">Dados da Propriedade</div>
          <div className="section-block__body">
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
          </div>
        </section>

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
          <section className="section-block">
            <div className="section-block__title">Contexto da Safra</div>
            <div className="section-block__body">
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
            </div>
          </section>
        )}

        {/* 3. Desenvolvimento da Cultura — tabela técnica */}
        {(fenologia?.estadio != null || fenologia?.estagio != null || fenologia?.dataUltimaAvaliacao != null || fenologia?.ultimaAvaliacaoDias != null || populacao?.plantasHa != null || populacao?.plantasPorMetro != null || populacao?.eficienciaPct != null || populacao?.situacao != null) && (
          <section className="section-block">
            <div className="section-block__title">Desenvolvimento da Cultura</div>
            <div className="section-block__body">
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
            </div>
          </section>
        )}

        {/* Condições de campo — opcional, só se houver dados */}
        {(condicoes?.temperatura != null ||
          condicoes?.umidade != null ||
          condicoes?.vento != null ||
          condicoes?.soloUmidade != null ||
          condicoes?.vigorCultura != null ||
          amostragem?.metodo != null ||
          amostragem?.nPlantasAvaliadas != null ||
          amostragem?.nPontosColetados != null ||
          amostragem?.raioAmostraM != null) && (
          <section className="section-block">
            <div className="section-block__title">Condições de Campo</div>
            <div className="section-block__body">
              <TabelaTecnicaCampos
                linhas={[
                  { campo: 'Temperatura', valor: condicoes?.temperatura != null ? `${condicoes.temperatura} °C` : undefined },
                  { campo: 'Umidade', valor: condicoes?.umidade != null ? `${condicoes.umidade}%` : undefined },
                  { campo: 'Vento', valor: condicoes?.vento != null ? String(condicoes.vento) : undefined },
                  { campo: 'Nebulosidade', valor: condicoes?.nebulosidade != null ? String(condicoes.nebulosidade) : undefined },
                  { campo: 'Solo / Umidade', valor: condicoes?.soloUmidade != null ? String(condicoes.soloUmidade) : undefined },
                  { campo: 'Palhada', valor: condicoes?.palhada != null ? String(condicoes.palhada) : undefined },
                  { campo: 'Compactação', valor: condicoes?.compactacao != null ? String(condicoes.compactacao) : undefined },
                  { campo: 'Vigor da cultura', valor: condicoes?.vigorCultura != null ? String(condicoes.vigorCultura) : undefined },
                  { campo: 'Uniformidade', valor: condicoes?.uniformidade != null ? String(condicoes.uniformidade) : undefined },
                  { campo: 'Sintomas', valor: condicoes?.sintomas != null ? String(condicoes.sintomas) : undefined },
                  { campo: 'Método de amostragem', valor: amostragem?.metodo != null ? labelMetodoAmostragem(amostragem.metodo) : undefined },
                  { campo: 'Nº plantas avaliadas', valor: amostragem?.nPlantasAvaliadas != null ? String(amostragem.nPlantasAvaliadas) : undefined },
                  { campo: 'Nº pontos coletados', valor: amostragem?.nPontosColetados != null ? String(amostragem.nPontosColetados) : undefined },
                  { campo: 'Raio da amostra (m)', valor: amostragem?.raioAmostraM != null ? String(amostragem.raioAmostraM) : undefined },
                ]}
              />
            </div>
          </section>
        )}

        <InteligenciaEstrategicaVisitaVT produtividade={produtividadePayload} inteligenciaEstrategica={inteligenciaEstrategica} />

        {/* 4. Mapa do talhão */}
        {hasMapa && (
          <section className="section-block">
            <div className="section-block__title">Mapa do Talhão</div>
            <div className="section-block__body" style={{ padding: 24 }}>
              {useRealMap ? (
                <MapaTalhaoDynamic
                  polygon={polygonForMap && polygonForMap.length >= 3 ? polygonForMap : undefined}
                  pontos={pontosForMap}
                  hideSectionTitle
                />
              ) : (
                <Mapa
                  mapa={{
                      viewBox: mapa.viewBox ?? '0 0 400 300',
                    path: mapa.path ?? undefined,
                    pontos: (mapa.pontos ?? []).map((p: any, i: number) => ({
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
          </section>
        )}

        {/* 5. Monitoramento Fitossanitário */}
        <OcorrenciasPragasVT pragas={pragas} />

        <DiagnosticoEPlanoAcao diagnostico={diagnostico} planoAcao={planoAcao} />

        <AplicacoesRealizadasVT aplicacoes={aplicacoes} />

        <FotografiasEAutoriaVT
          imagens={imagens}
          assinatura={assinatura}
          conclusao={conclusao}
          setLightboxIndex={setLightboxIndex}
        />

        <footer style={{ textAlign: 'center', padding: '36px 0', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
          {relatorio.consultoria?.nome || 'FortSmart Agro'} · Relatório de Visita Técnica · {data} · {tecnico}
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
