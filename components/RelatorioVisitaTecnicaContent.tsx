'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import Mapa from '@/components/Mapa';

import HeaderVisitaTecnica from './visita_tecnica/sections/HeaderVisitaTecnica';
import DashboardResumoVT from './visita_tecnica/sections/DashboardResumoVT';
import IdentificacaoEContexto from './visita_tecnica/sections/IdentificacaoEContexto';
import FenologiaEEstandeVT from './visita_tecnica/sections/FenologiaEEstandeVT';
import CondicoesCampoVT from './visita_tecnica/sections/CondicoesCampoVT';
import OcorrenciasPragasVT from './visita_tecnica/sections/OcorrenciasPragasVT';
import DiagnosticoEPlanoAcao from './visita_tecnica/sections/DiagnosticoEPlanoAcao';
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
    acoes?: Array<{ prioridade?: string; acao?: string; prazo?: string }>;
  };
  conclusao?: string;
  pragas?: Record<string, unknown>[];
  condicoes?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  mapa?: Record<string, unknown>;
  imagens?: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  assinaturaTecnica?: Record<string, unknown>;
};

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  function MetaItem({ label, value }: { label: string; value: string }) {
    return (
      <div>
        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{value}</div>
      </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{value}</div>
    </div>
  );
}

const categoriaLabel: Record<string, string> = {
  fenologia: 'Fenologia',
  praga: 'Praga',
  doença: 'Doença',
  doenca: 'Doença',
  daninha: 'Planta daninha',
  operacao: 'Operação',
  desvio: 'Desvio',
  evidencia: 'Evidência',
};

interface RelatorioVisitaTecnicaContentProps {
  relatorio: PayloadVisitaTecnica;
  reportId?: string;
  relatorioUuid?: string;
}

export default function RelatorioVisitaTecnicaContent({ relatorio, reportId, relatorioUuid }: RelatorioVisitaTecnicaContentProps) {
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

  const handleExportPDF = useCallback(async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const el = document.getElementById('relatorio-visita-tecnica-content');
    if (!el) return;
    setLightboxIndex(null);
    const safeFazenda = (fazenda || 'Relatorio').replace(/\s/g, '_');
    const safeData = (data || '').replace(/\//g, '-').replace(/\s/g, '_') || 'data';
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `FortSmart_Visita_Tecnica_${safeFazenda}_${safeData}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(el).save();
  }, [fazenda, data]);

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

      <div id="relatorio-visita-tecnica-content" style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 0' }}>

        <HeaderVisitaTecnica
          relatorio={relatorio}
          fazenda={fazenda}
          safra={safra}
          data={data}
          tecnico={tecnico}
          tecnicoCrea={tecnicoCrea}
          municipio={municipio}
          estado={estado}
          proprietario={proprietario}
        />

        <DashboardResumoVT
          relatorio={relatorio}
          talhao={talhao}
          fenologia={fenologia}
          populacao={populacao}
          diagnostico={diagnostico}
          pragasCount={pragas.length}
        />

        <IdentificacaoEContexto talhao={talhao} contextoSafra={contextoSafra} />

        <FenologiaEEstandeVT
          fenologia={fenologia}
          contextoSafra={contextoSafra}
          populacao={populacao}
          imagensFenologia={imagensFenologia}
          imagensTotais={imagens}
          setLightboxIndex={setLightboxIndex}
        />

        <CondicoesCampoVT condicoes={condicoes} />

        {/* Mapa do talhão — mapa real (MapTiler) com polígono e alfinetes, ou fallback SVG */}
        {hasMapa && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Geomonitoramento da Visita</div>
            <div style={{ padding: 24 }}>
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
