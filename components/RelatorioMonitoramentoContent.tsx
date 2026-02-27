'use client';

import React, { useMemo } from 'react';
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
  borderRadius: 8,
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
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
          imagem: (inf.imagem != null && String(inf.imagem)) ? String(inf.imagem) : undefined,
        }));
      return {
        id: String(p.id ?? `p-${i}`),
        identificador: String(p.identificador ?? `P${i + 1}`),
        lat: safeNum(p.lat ?? 0),
        lng: safeNum(p.lng ?? 0),
        infestacoes,
      };
    });

  const poligono = raw.poligono_geojson as GeoJSONPolygon | undefined;
  const cond = raw.condicoes_climaticas as Record<string, unknown> | undefined;
  const condicoes_climaticas: CondicoesClimaticas | undefined = cond
    ? { temperatura: Number(cond.temperatura ?? 0), umidade: Number(cond.umidade ?? 0), chuva: (cond.chuva as string) ?? 'Sem Chuva' }
    : undefined;

  const recRaw = (raw.recomendacoes ?? []) as Array<{ acao?: string } | Recomendacao>;
  const recomendacoes: Recomendacao[] = recRaw.map((r: any) => {
    if (r.nivel && r.acao) return r as Recomendacao;
    return {
      nivel: 'MONITORAR',
      organismo: '—',
      tipo: 'praga',
      produto: '',
      dose: '',
      acao: typeof r.acao === 'string' ? r.acao : (r.acao ?? '—'),
      pontos: [],
      severidade: 0,
    };
  });

  const areaHa = safeNum(raw.area_ha ?? raw.area ?? raw.areaHa ?? raw.area_hectares ?? raw.hectares ?? 0);
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
    poligono_geojson: poligono?.type === 'Feature' && poligono?.geometry ? poligono : defaultPolygon(pontos),
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
    const fazenda = String(relatorio.fazenda ?? prop?.fazenda ?? 'Fazenda').trim() || 'Fazenda';
    const safra = String(relatorio.safra ?? meta?.safra ?? '').trim();
    const dataRaw = relatorio.data ?? meta?.dataGeracao ?? '';
    const data = typeof dataRaw === 'string' ? dataRaw : (dataRaw != null ? String(dataRaw) : '');
    const tecnico = String(relatorio.tecnico ?? meta?.tecnico ?? 'FortSmart Agro').trim() || 'FortSmart Agro';
    const talhoesRaw = Array.isArray(relatorio.talhoes) ? relatorio.talhoes : [];
    const talhoes = talhoesRaw.map((t: unknown) => normalizeTalhao(t != null && typeof t === 'object' ? t as Record<string, unknown> : {}));
    return { fazenda, safra, data, tecnico, talhoes };
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

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>
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

      <div id="relatorio-monitoramento-content" style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>
        <ReportHeader relatorio={normalized} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />

        {(metricas || estande || cv || fenologia || observacoes || (alertas && alertas.length > 0)) && (
          <div style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
              Resumo do monitoramento
            </div>
            <div style={{ padding: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {metricas && (
                <>
                  {metricas.totalPontos != null && <Row label="Total de pontos" value={String(metricas.totalPontos)} />}
                  {metricas.totalOcorrencias != null && <Row label="Ocorrências" value={String(metricas.totalOcorrencias)} />}
                  {metricas.nivelRisco != null && <Row label="Nível de risco" value={String(metricas.nivelRisco)} />}
                  {metricas.confiancaDados != null && <Row label="Confiança dos dados" value={formatPercent2(Number(metricas.confiancaDados) * 100)} />}
                  {metricas.severidadeMedia != null && <Row label="Severidade média" value={formatPercent2(Number(metricas.severidadeMedia))} />}
                </>
              )}
              {estande && (estande.populacao != null || estande.plantasPorMetro != null) && (
                <Row label="Estande" value={estande.plantasPorMetro != null ? `${formatDecimal2(Number(estande.plantasPorMetro))} plantas/m` : `${formatDecimal2(Number(estande.populacao))} plantas/ha`} />
              )}
              {cv && (cv.cvPercent != null || cv.cvClassificacao != null) && (
                <Row label="CV" value={typeof cv.cvClassificacao === 'string' ? cv.cvClassificacao : (cv.cvPercent != null ? `${cv.cvPercent}%` : '—')} />
              )}
              {fenologia && (fenologia.estadio || fenologia.dae != null) && (
                <Row label="Fenologia" value={[fenologia.estadio, fenologia.dae != null ? `DAE ${fenologia.dae}` : ''].filter(Boolean).join(' · ') || '—'} />
              )}
            </div>
            {observacoes && (
              <div style={{ padding: '0 20px 16px' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Observações</div>
                <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-wrap' }}>{observacoes}</div>
              </div>
            )}
            {alertas && alertas.length > 0 && (
              <div style={{ padding: '0 20px 20px' }}>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>Alertas</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#B45309' }}>
                  {alertas.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {normalized.talhoes.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 28, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
              Resumo dos talhões
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Talhão</th>
                  <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Área (ha)</th>
                  <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Índice</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {normalized.talhoes.map(t => {
                  const m = calcularMetricasTalhao(t);
                  const cor = corClassificacao(m.classificacao);
                  const areaStr = t.area_ha != null && Number(t.area_ha) > 0 ? formatDecimal2(t.area_ha) : '—';
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12, borderBottom: '1px solid #E2E8F0' }}>
                        <a href={`#talhao-${t.id}`} onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: '#1B5E20', fontWeight: 600, textDecoration: 'none' }}>
                          {t.nome}
                        </a>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>{areaStr}</td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: cor }}>{formatPercent2(m.indiceOcorrencia)}</td>
                      <td style={{ padding: 12, borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${cor}18`, color: cor }}>{labelClassificacao(m.classificacao)}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>Total</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0) > 0 ? formatDecimal2(normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0)) : '—'}</td>
                  <td colSpan={2} style={{ padding: 12 }} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {normalized.talhoes.map((talhao, idx) => (
          <TalhaoBloco key={talhao.id} talhao={talhao} index={idx + 1} total={normalized.talhoes.length} data={normalized.data} />
        ))}

        {imagens.length > 0 && (
          <div style={{ ...cardStyle, padding: 20, marginBottom: 24 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Galeria de fotos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {imagens.map((img, i) => (
                <figure key={i} style={{ margin: 0 }}>
                  {img.url && (
                    <a href={img.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', borderRadius: 8, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
                      <img src={img.url} alt={img.descricao ?? `Foto ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                    </a>
                  )}
                  {img.descricao && <figcaption style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>{img.descricao}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
          FortSmart Agro · Relatório de monitoramento · {normalized.data} · {normalized.tecnico}
        </footer>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{value}</div>
    </div>
  );
}
