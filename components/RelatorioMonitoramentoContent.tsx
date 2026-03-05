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
import ReportHeader from './ReportHeader';
import TalhaoBloco from './TalhaoBloco';

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
};

const sectionTitleStyle = {
  padding: '16px 24px',
  background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
  borderBottom: '1px solid #E2E8F0',
  fontSize: 12,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

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
};

interface RelatorioMonitoramentoContentProps {
  relatorio: PayloadMonitoramento;
  reportId?: string;
  relatorioUuid?: string;
}

export default function RelatorioMonitoramentoContent({ relatorio, reportId, relatorioUuid }: RelatorioMonitoramentoContentProps) {
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
    }).from(el).save();
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

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)', paddingBottom: 60 }}>
      <nav className="nav-lateral no-print" aria-hidden="true">
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

      <div id="relatorio-monitoramento-content" style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px 0' }}>
        <ReportHeader relatorio={normalized} onExportPDF={handleExportPDF} hideExcel origemDados={relatorioUuid ? 'app' : undefined} />

        {(metricas || estande || cv || fenologia || observacoes || (alertas && alertas.length > 0)) && (
          <div style={{ ...cardStyle, marginBottom: 28, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>
              Resumo do monitoramento
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
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
            {observacoes && (
              <div style={{ padding: '0 24px 20px' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 6, letterSpacing: '0.03em' }}>Observações</div>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{observacoes}</div>
              </div>
            )}
            {alertas && alertas.length > 0 && (
              <div style={{ padding: '0 24px 24px' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 8, letterSpacing: '0.03em' }}>Alertas</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B45309', lineHeight: 1.8 }}>
                  {alertas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {normalized.talhoes.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 28, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>
              Resumo dos talhões
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Talhão</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Área (ha)</th>
                  <th style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Índice</th>
                  <th style={{ padding: '14px 24px', textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {normalized.talhoes.map(t => {
                  const m = calcularMetricasTalhao(t);
                  const cor = corClassificacao(m.classificacao);
                  const areaStr = t.area_ha != null && Number(t.area_ha) > 0 ? formatDecimal2(t.area_ha) : '—';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid #E2E8F0' }}>
                        <a href={`#talhao-${t.id}`} onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: '#1B5E20', fontWeight: 600, textDecoration: 'none' }}>
                          {t.nome}
                        </a>
                      </td>
                      <td style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontVariantNumeric: 'tabular-nums' }}>{areaStr}</td>
                      <td style={{ padding: '14px 24px', textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: cor, fontVariantNumeric: 'tabular-nums' }}>{formatPercent2(m.indiceOcorrencia)}</td>
                      <td style={{ padding: '14px 24px', borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: `${cor}18`, color: cor }}>{labelClassificacao(m.classificacao)}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: '14px 24px', fontWeight: 700 }}>Total</td>
                  <td style={{ padding: '14px 24px', textAlign: 'right', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0) > 0 ? formatDecimal2(normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0)) : '—'}</td>
                  <td colSpan={2} style={{ padding: '14px 24px' }} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {normalized.talhoes.map((talhao, idx) => (
          <TalhaoBloco key={talhao.id} talhao={talhao} index={idx + 1} total={normalized.talhoes.length} data={normalized.data} />
        ))}

        {imagens.length > 0 && (
          <div style={{ ...cardStyle, padding: 24, marginBottom: 28 }}>
            <div style={{ ...sectionTitleStyle, margin: '-24px -24px 20px -24px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', borderRadius: '12px 12px 0 0' }}>
              Galeria de fotos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {imagens.map((img, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  {img.url && (
                    <button
                      type="button"
                      onClick={() => setGaleriaModal({ url: img.url!, descricao: img.descricao })}
                      style={{ display: 'block', width: '100%', padding: 0, border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'transparent', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt={img.descricao ?? `Foto ${i + 1}`} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                    </button>
                  )}
                  {img.descricao && <figcaption style={{ fontSize: 12, color: '#64748B', marginTop: 8, lineHeight: 1.4 }}>{img.descricao}</figcaption>}
                </figure>
              ))}
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
          </div>
        )}

        <footer style={{
          textAlign: 'center',
          padding: '40px 24px',
          borderTop: '1px solid #E2E8F0',
          fontSize: 12,
          color: '#64748B',
          background: '#fff',
          borderRadius: 12,
          marginTop: 8,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <strong style={{ color: '#475569' }}>FortSmart Agro</strong> · Relatório de monitoramento · {normalized.data} · {normalized.tecnico}
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: '12px 16px', background: '#FAFBFC', borderRadius: 10, border: '1px solid #F1F5F9' }}>
      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
