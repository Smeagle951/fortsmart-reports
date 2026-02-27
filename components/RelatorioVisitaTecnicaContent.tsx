'use client';

import React, { useState, useCallback } from 'react';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import Mapa from '@/components/Mapa';

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
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

const sectionTitleStyle: React.CSSProperties = {
  padding: '16px 24px',
  background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
  borderBottom: '1px solid #BBF7D0',
  fontSize: 15,
  fontWeight: 700,
  color: '#166534',
  letterSpacing: '-0.01em',
};

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
    polygon?: number[][];
    pontos?: Array<Record<string, unknown> & { x?: number; y?: number; index?: number; severidade?: string; titulo?: string; descricao?: string; data?: string }>;
  };
  const hasMapa = (mapa.path != null && String(mapa.path).trim() !== '') || (Array.isArray(mapa.pontos) && mapa.pontos.length > 0);

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
        {/* Cabeçalho do relatório */}
        <header style={{ ...cardStyle, marginBottom: 28, overflow: 'hidden' }}>
          <div style={{ height: 4, background: 'linear-gradient(90deg, #166534 0%, #22c55e 100%)' }} />
          <div style={{ padding: 28, display: 'flex', alignItems: 'flex-start', flexWrap: 'wrap', gap: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FortSmartLogo size={56} />
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#14532d', letterSpacing: '-0.03em' }}>FortSmart Agro</div>
                <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 4 }}>
                  Relatório Agronômico · Visita Técnica
                </div>
              </div>
            </div>
            <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 24, minWidth: 260 }}>
              <MetaItem label="Fazenda" value={fazenda} />
              <MetaItem label="Safra" value={safra} />
              <MetaItem label="Data da visita" value={data} />
              <MetaItem label="Técnico responsável" value={tecnicoCrea ? `${tecnico} · ${tecnicoCrea}` : tecnico} />
              {municipio && (estado || proprietario) && (
                <MetaItem label="Propriedade" value={[municipio, estado, proprietario].filter(Boolean).join(' · ')} />
              )}
            </div>
          </div>
        </header>

        {/* 1. Identificação: Talhão e cultura */}
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
          <div style={sectionTitleStyle}>1. Identificação do talhão</div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
            <Row label="Talhão" value={String(talhao.nome ?? talhao.numero ?? '—')} />
            <Row label="Cultura" value={String(talhao.cultura ?? '—')} />
            {talhao.area != null && <Row label="Área (ha)" value={String(talhao.area)} />}
            {talhao.dataPlantio != null && <Row label="Data do plantio" value={String(talhao.dataPlantio)} />}
          </div>
        </section>

        {/* 2. Contexto da safra (material, espaçamento, população alvo, DAE/DAP) */}
        {contextoSafra && (contextoSafra.materialVariedade != null || contextoSafra.dae != null || contextoSafra.espacamentoCm != null) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>2. Contexto da safra</div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
              {contextoSafra.materialVariedade != null && <Row label="Material / Variedade" value={String(contextoSafra.materialVariedade)} />}
              {contextoSafra.empresa != null && <Row label="Empresa" value={String(contextoSafra.empresa)} />}
              {contextoSafra.espacamentoCm != null && <Row label="Espaçamento (cm)" value={String(contextoSafra.espacamentoCm)} />}
              {contextoSafra.populacaoAlvoPlHa != null && <Row label="População alvo (pl/ha)" value={String(contextoSafra.populacaoAlvoPlHa)} />}
              {contextoSafra.dae != null && <Row label="DAE" value={String(contextoSafra.dae)} />}
              {contextoSafra.dap != null && <Row label="DAP" value={String(contextoSafra.dap)} />}
            </div>
          </section>
        )}

        {/* 3. Fenologia e estande */}
        {(fenologia.estadio != null || fenologia.estagio != null || populacao?.plantasHa != null || populacao?.eficienciaPct != null || (Array.isArray(fenologia.historico) && (fenologia.historico as unknown[]).length > 0) || imagensFenologia.length > 0) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>3. Fenologia e estande</div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
              {(fenologia.estadio ?? fenologia.estagio) != null && (
                <Row label="Estádio fenológico" value={String(fenologia.estadio ?? fenologia.estagio ?? '—')} />
              )}
              {(fenologia.dae ?? contextoSafra?.dae) != null && <Row label="DAE" value={String(fenologia.dae ?? contextoSafra?.dae ?? '—')} />}
              {(fenologia.dap ?? contextoSafra?.dap) != null && <Row label="DAP" value={String(fenologia.dap ?? contextoSafra?.dap ?? '—')} />}
              {populacao?.plantasHa != null && <Row label="Plantas/ha" value={String(populacao.plantasHa)} />}
              {populacao?.plantasPorMetro != null && <Row label="Plantas/m" value={String(populacao.plantasPorMetro)} />}
              {populacao?.eficienciaPct != null && <Row label="Eficiência" value={`${Number(populacao.eficienciaPct)}%`} />}
              {populacao?.situacao != null && <Row label="Situação estande" value={String(populacao.situacao)} />}
            </div>
            {imagensFenologia.length > 0 && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>Registros fotográficos — Fenologia</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  {imagensFenologia.map((img, idx) => {
                    const globalIndex = imagens.findIndex((i) => i.url === img.url);
                    const src = img.url;
                    if (!src) return null;
                    return (
                      <button
                        key={`fenologia-${idx}`}
                        type="button"
                        onClick={() => setLightboxIndex(globalIndex >= 0 ? globalIndex : 0)}
                        style={{
                          display: 'block',
                          padding: 0,
                          margin: 0,
                          border: '1px solid #E2E8F0',
                          borderRadius: 8,
                          overflow: 'hidden',
                          background: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                          width: 100,
                          height: 100,
                          flexShrink: 0,
                        }}
                      >
                        <img
                          src={src}
                          alt={img.descricao ?? `Fenologia ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </button>
                    );
                  })}
                </div>
                {imagensFenologia.some((img) => img.descricao) && (
                  <div style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
                    {imagensFenologia.map((img, i) => (img.descricao ? <div key={i} style={{ marginBottom: 4 }}>{img.descricao}</div> : null))}
                  </div>
                )}
              </div>
            )}
            {Array.isArray(fenologia.historico) && (fenologia.historico as Array<{ estagio?: string; data?: string; observacoes?: string }>).length > 0 && (
              <div style={{ padding: '0 24px 24px', borderTop: '1px solid #E2E8F0', marginTop: 8, paddingTop: 16 }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Histórico fenológico</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                  {(fenologia.historico as Array<{ estagio?: string; data?: string; observacoes?: string }>).slice(0, 10).map((h, i) => (
                    <li key={i} style={{ marginBottom: 4 }}>
                      {[h.estagio, h.data, h.observacoes].filter(Boolean).join(' · ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* 4. Condições de campo */}
        {(condicoes.temperatura != null || condicoes.umidade != null || condicoes.vento != null || condicoes.soloUmidade != null || condicoes.vigorCultura != null) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>4. Condições de campo</div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
              {condicoes.temperatura != null && <Row label="Temperatura" value={`${condicoes.temperatura} °C`} />}
              {condicoes.umidade != null && <Row label="Umidade" value={`${condicoes.umidade}%`} />}
              {condicoes.vento != null && <Row label="Vento" value={String(condicoes.vento)} />}
              {condicoes.nebulosidade != null && <Row label="Nebulosidade" value={String(condicoes.nebulosidade)} />}
              {condicoes.soloUmidade != null && <Row label="Solo" value={String(condicoes.soloUmidade)} />}
              {condicoes.palhada != null && <Row label="Palhada" value={String(condicoes.palhada)} />}
              {condicoes.compactacao != null && <Row label="Compactação" value={String(condicoes.compactacao)} />}
              {condicoes.vigorCultura != null && <Row label="Vigor" value={String(condicoes.vigorCultura)} />}
              {condicoes.uniformidade != null && <Row label="Uniformidade" value={String(condicoes.uniformidade)} />}
              {condicoes.sintomas != null && <Row label="Sintomas" value={String(condicoes.sintomas)} />}
            </div>
          </section>
        )}

        {/* 4.5 Mapa do talhão — polígono e pontos georreferenciados (ocorrências, desvios, fenologia) */}
        {hasMapa && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Mapa do talhão — pontos georreferenciados</div>
            <div style={{ padding: 24 }}>
              <Mapa
                mapa={{
                  viewBox: mapa.viewBox ?? '0 0 400 300',
                  path: mapa.path ?? undefined,
                  pontos: (mapa.pontos ?? []).map((p: { x?: number; y?: number; index?: number; severidade?: string; titulo?: string; descricao?: string; data?: string }, i: number) => ({
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
            </div>
          </section>
        )}

        {/* 5. Aplicações realizadas (Prescrição Premium / visita) — sempre exibida */}
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
          <div style={sectionTitleStyle}>5. Aplicações realizadas</div>
          {aplicacoes.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 640 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Data</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Tipo</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Produto</th>
                    <th style={{ padding: 14, textAlign: 'right', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Dose</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Classe</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Alvo</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {aplicacoes.map((a, i) => {
                    const classe = String(a.classe ?? '—');
                    const badgeClasse =
                      classe.toLowerCase().includes('herbicida') ? { bg: '#DCFCE7', color: '#166534' } :
                      classe.toLowerCase().includes('inseticida') ? { bg: '#FEF3C7', color: '#B45309' } :
                      classe.toLowerCase().includes('fungicida') ? { bg: '#DBEAFE', color: '#1D4ED8' } :
                      { bg: '#F1F5F9', color: '#475569' };
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>{String(a.data ?? '—')}</td>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>{String(a.tipo ?? '—')}</td>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>{String(a.produto ?? '—')}</td>
                        <td style={{ padding: 14, textAlign: 'right', borderBottom: '1px solid #E2E8F0', color: '#334155' }}>
                          {a.dose != null ? `${a.dose}${a.unidade ? ` ${a.unidade}` : ''}` : '—'}
                        </td>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0' }}>
                          <span style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: badgeClasse.bg, color: badgeClasse.color }}>
                            {classe}
                          </span>
                        </td>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>{String(a.alvo ?? '—')}</td>
                        <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>{String(a.status ?? '—')}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 24, color: '#64748B', fontSize: 14 }}>
              Nenhuma aplicação registrada nesta visita.
            </div>
          )}
        </section>

        {/* 6. Pragas e doenças observadas */}
        {pragas.length > 0 && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>6. Pragas e doenças observadas</div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Tipo</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Alvo / Nome</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Incidência</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Severidade</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Situação</th>
                    <th style={{ padding: 14, textAlign: 'left', fontWeight: 700, color: '#475569', borderBottom: '2px solid #E2E8F0' }}>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {pragas.map((p, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>{String(p.tipo ?? '—')}</td>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', fontWeight: 600, color: '#334155' }}>{String(p.nome ?? p.alvo ?? '—')}</td>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>{String(p.incidencia ?? '—')}</td>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#64748B' }}>{String(p.severidade ?? '—')}</td>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#334155' }}>{String(p.situacao ?? '—')}</td>
                      <td style={{ padding: 14, borderBottom: '1px solid #E2E8F0', color: '#64748B', maxWidth: 220 }}>{String(p.observacoes ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* 7. Diagnóstico */}
        {diagnostico && (diagnostico.problemaPrincipal != null || diagnostico.causaProvavel != null || (Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0)) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>7. Diagnóstico</div>
            <div style={{ padding: 24, display: 'grid', gap: 16 }}>
              {diagnostico.problemaPrincipal != null && String(diagnostico.problemaPrincipal).trim() && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Problema principal</div>
                  <div style={{ fontSize: 15, color: '#334155', lineHeight: 1.5 }}>{String(diagnostico.problemaPrincipal)}</div>
                </div>
              )}
              {diagnostico.causaProvavel != null && String(diagnostico.causaProvavel).trim() && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Causa provável</div>
                  <div style={{ fontSize: 14, color: '#475569', lineHeight: 1.5 }}>{String(diagnostico.causaProvavel)}</div>
                </div>
              )}
              {(diagnostico.nivelRisco != null || diagnostico.urgenciaAcao != null) && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                  {diagnostico.nivelRisco != null && <Row label="Nível de risco" value={String(diagnostico.nivelRisco)} />}
                  {diagnostico.urgenciaAcao != null && <Row label="Urgência de ação" value={String(diagnostico.urgenciaAcao)} />}
                </div>
              )}
              {Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Recomendações</div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                    {(diagnostico.recomendacoes as string[]).map((r, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 8. Plano de ação */}
        {planoAcao && (planoAcao.objetivoManejo != null || (Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0)) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>8. Plano de ação</div>
            <div style={{ padding: 24 }}>
              {planoAcao.objetivoManejo != null && String(planoAcao.objetivoManejo).trim() && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>Objetivo de manejo</div>
                  <div style={{ fontSize: 15, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{String(planoAcao.objetivoManejo)}</div>
                </div>
              )}
              {Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' }}>Ações</div>
                  <ol style={{ margin: 0, paddingLeft: 22, fontSize: 14, color: '#334155', lineHeight: 1.6 }}>
                    {planoAcao.acoes.map((a, i) => (
                      <li key={i} style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 600 }}>{String(a.acao ?? '—')}</span>
                        {(a.prioridade != null || a.prazo != null) && (
                          <span style={{ fontSize: 12, color: '#64748B', marginLeft: 8 }}>
                            {[a.prioridade && `Prioridade ${a.prioridade}`, a.prazo].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 9. Conclusão do consultor */}
        {conclusao != null && String(conclusao).trim() && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
              color: '#fff',
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: '-0.01em',
            }}>
              9. Conclusão do consultor
            </div>
            <div style={{ padding: 24, fontSize: 15, color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {conclusao}
            </div>
          </section>
        )}

        {/* 10. Registros fotográficos (com zoom ao clicar) */}
        {imagens.length > 0 && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>10. Registros fotográficos</div>
            <div style={{ padding: 24 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                {imagens.map((img, i) => {
                  const src = img.url;
                  if (!src) return null;
                  const cat = (img.categoria ?? '').toLowerCase();
                  const catLabel = categoriaLabel[cat] || cat || 'Registro';
                  return (
                    <figure key={i} style={{ margin: 0 }}>
                      <button
                        type="button"
                        onClick={() => setLightboxIndex(i)}
                        style={{
                          display: 'block',
                          width: '100%',
                          padding: 0,
                          margin: 0,
                          border: '1px solid #E2E8F0',
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: '#fff',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                        }}
                      >
                        <img
                          src={src}
                          alt={img.descricao ?? `Foto ${i + 1}`}
                          style={{ width: '100%', height: 160, objectFit: 'cover' }}
                        />
                        <span style={{
                          display: 'block',
                          padding: '8px 12px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#166534',
                          background: '#F0FDF4',
                          textTransform: 'uppercase',
                        }}>
                          {catLabel}
                        </span>
                      </button>
                      {img.descricao && (
                        <figcaption style={{ fontSize: 12, color: '#64748B', marginTop: 8, padding: '0 4px' }}>
                          {img.descricao}
                        </figcaption>
                      )}
                      {img.data && (
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>{img.data}</div>
                      )}
                    </figure>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Assinatura técnica */}
        {assinatura && (assinatura.nome != null || assinatura.crea != null) && (
          <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: 24, borderTop: '1px dashed #E2E8F0', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Assinatura técnica</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{String(assinatura.nome ?? '—')}</div>
              {assinatura.crea != null && <div style={{ fontSize: 13, color: '#64748B' }}>CREA {String(assinatura.crea)}</div>}
              {assinatura.dataAssinatura != null && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4 }}>{String(assinatura.dataAssinatura)}</div>}
              {assinatura.cidade != null && <div style={{ fontSize: 12, color: '#94A3B8' }}>{String(assinatura.cidade)}</div>}
            </div>
          </section>
        )}

        <footer style={{ textAlign: 'center', padding: '36px 0', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
          FortSmart Agro · Relatório de Visita Técnica · {data} · {tecnico}
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
