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
import { formatPercent2, formatDecimal2 } from '@/utils/format';
import ReportHeader from './ReportHeader';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

const cardStyle = {
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #E2E8F0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
};

const sectionTitleStyle = {
  padding: '14px 20px',
  background: 'linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%)',
  borderBottom: '1px solid #E2E8F0',
  fontSize: 11,
  fontWeight: 700,
  color: '#475569',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
};

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
    return {
      nivel: (x.nivel as Recomendacao['nivel']) ?? 'MONITORAR',
      organismo: (x.organismo != null && String(x.organismo).trim()) ? String(x.organismo).trim() : '—',
      tipo: (x.tipo as Recomendacao['tipo']) ?? 'praga',
      produto: (x.produto != null && String(x.produto).trim()) ? String(x.produto).trim() : '',
      dose: (x.dose != null && String(x.dose).trim()) ? String(x.dose).trim() : '',
      acao: typeof x.acao === 'string' ? x.acao : '—',
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
};

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
      relatorio.fazenda ?? relatorio.nome_fazenda ?? prop?.fazenda ?? prop?.nome ?? meta?.fazenda ?? ''
    ).trim() || 'Fazenda';
    const safra = String(relatorio.safra ?? meta?.safra ?? '').trim() || '—';
    const dataRaw = relatorio.data ?? meta?.dataGeracao ?? '';
    const data = typeof dataRaw === 'string' ? dataRaw : (dataRaw != null ? String(dataRaw) : '');
    const tecnico = String(
      relatorio.tecnico ?? relatorio.agronomo ?? meta?.tecnico ?? meta?.agronomo ?? 'FortSmart Agro'
    ).trim() || 'FortSmart Agro';
    const crea = String(
      relatorio.crea ?? relatorio.tecnico_crea ?? meta?.tecnicoCrea ?? meta?.crea ?? prop?.crea ?? ''
    ).trim() || undefined;
    const talhoesRaw = Array.isArray(relatorio.talhoes) ? relatorio.talhoes : [];
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

  const municipio = (relatorio.propriedade as Record<string, unknown> | undefined)?.municipio ?? (relatorio.propriedade as Record<string, unknown> | undefined)?.municipio ?? '';
  const estado = (relatorio.propriedade as Record<string, unknown> | undefined)?.estado ?? '';

  const metricasTalhao = primeiroTalhao ? calcularMetricasTalhao(primeiroTalhao) : null;
  const topPragas = metricasTalhao?.top5Infestacoes ?? [];
  const recomendacoesTalhao = primeiroTalhao?.recomendacoes ?? [];

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
      const manejo = (typeof rec?.acao === 'string' ? rec.acao.trim() : '') || (inf.percentual >= 25 ? 'Monitorar e retornar em 3–7 dias.' : 'Acompanhamento semanal.');
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

  const [galeriaModal, setGaleriaModal] = useState<{ url: string; descricao?: string } | null>(null);
  const imagens = (relatorio.imagens ?? []) as Array<{ url?: string; descricao?: string }>;

  if (!primeiroTalhao) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>
        Nenhum talhão disponível para exibir o relatório fitossanitário.
      </div>
    );
  }

  const areaTotal = normalized.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0);
  const circumference = 2 * Math.PI * 44;
  const strokeDashoffset = circumference - (riscoNum / 100) * circumference;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #F1F5F9 0%, #E2E8F0 100%)', paddingBottom: 60 }}>
      <div id="relatorio-fitossanitario-content" className="relatorio-fitossanitario-pdf" style={{ maxWidth: 920, margin: '0 auto', padding: '24px 20px 0' }}>
        <ReportHeader
          relatorio={normalized}
          onExportPDF={handleExportPDF}
          hideExcel
          origemDados={relatorioUuid ? 'app' : undefined}
        />

        {/* Título e breadcrumb */}
        <div className="pdf-keep-together" style={{ ...cardStyle, padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 6 }}>
            {normalized.fazenda} › {primeiroTalhao.nome} › Relatório Técnico
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1E293B', margin: 0, letterSpacing: '-0.02em' }}>
            Relatório de Monitoramento Fitossanitário
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 8, marginBottom: 0 }}>
            Emitido em {normalized.data} · {normalized.tecnico}{normalized.crea ? ` · ${normalized.crea}` : ''}
          </p>
        </div>

        {/* Hero: cultura, safra, local, área, estádio, DAE */}
        <div style={{ ...cardStyle, padding: 16, marginBottom: 20, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
            {primeiroTalhao.cultura} — Safra {normalized.safra}
          </span>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            {municipio && estado ? `${String(municipio)} · ${String(estado)}` : (municipio ? String(municipio) : estado ? String(estado) : '—')}
          </span>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            {primeiroTalhao.area_ha > 0 ? `${formatDecimal2(primeiroTalhao.area_ha)} ha` : '—'} · {primeiroTalhao.nome}
          </span>
          <span style={{ fontSize: 13, color: '#64748B' }}>
            {(primeiroTalhao.estagio || (fenologiaGlobal?.estadio ?? '')) && (primeiroTalhao.dae != null || fenologiaGlobal?.dae != null)
              ? `${String(primeiroTalhao.estagio || (fenologiaGlobal?.estadio ?? ''))} — ${String((primeiroTalhao.dae ?? fenologiaGlobal?.dae) ?? '')} DAE`
              : String(primeiroTalhao.estagio || (fenologiaGlobal?.estadio ?? '—'))}
          </span>
          {primeiroTalhao.variedade && (
            <span style={{ fontSize: 12, color: '#94A3B8' }}>Híbrido: {primeiroTalhao.variedade}</span>
          )}
        </div>

        {/* Gauge de risco + próxima visita */}
        <div className="pdf-keep-together" style={{ ...cardStyle, overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 24, alignItems: 'center', padding: 24, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 100, height: 100 }}>
                <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx={50} cy={50} r={44} fill="none" stroke="#E2E8F0" strokeWidth={8} />
                  <circle
                    cx={50}
                    cy={50}
                    r={44}
                    fill="none"
                    stroke={riscoNum < 25 ? '#2E7D32' : riscoNum < 50 ? '#F59E0B' : riscoNum < 75 ? '#E65100' : '#C62828'}
                    strokeWidth={8}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#1E293B' }}>
                  {riscoNum}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Risco {riscoLabel}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Próxima visita: —</div>
              </div>
            </div>
            <div style={{ minWidth: 0 }} />
            <div style={{ fontSize: 12, color: '#64748B' }}>
              {reportId && <span style={{ fontWeight: 600, color: '#475569' }}>{reportId}</span>}
            </div>
          </div>
        </div>

        <div className="pdf-keep-together" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Propriedade */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Propriedade</div>
            <div style={{ padding: 20, display: 'grid', gap: 12 }}>
              <Row2 label="Fazenda" value={normalized.fazenda} />
              <Row2 label="Município" value={municipio && estado ? `${String(municipio)} — ${String(estado)}` : String(municipio || estado || '—')} />
              <Row2 label="Área total" value={areaTotal > 0 ? `${formatDecimal2(areaTotal)} ha` : '—'} />
              <Row2 label="Talhão" value={`${primeiroTalhao.nome}${primeiroTalhao.area_ha > 0 ? ` (${formatDecimal2(primeiroTalhao.area_ha)} ha)` : ''}`} />
              <Row2 label="Solo" value="—" />
              <Row2 label="Irrigação" value="—" />
              <Row2 label="Cultura anterior" value="—" />
            </div>
          </div>

          {/* Mapa: polígono real do talhão + pontos georreferenciados (clique no alfinete = card com detalhes) */}
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Polígono real do talhão · Pontos georreferenciados</div>
            <div style={{ height: 260 }}>
              <MapaInterativo pontos={primeiroTalhao.pontos} poligono={primeiroTalhao.poligono_geojson} talhaoId={primeiroTalhao.id} />
            </div>
          </div>
        </div>

        {/* Ciclo da cultura + Visita de monitoramento + Clima */}
        <div className="pdf-keep-together" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Ciclo da Cultura</div>
            <div style={{ padding: 20, display: 'grid', gap: 10 }}>
              <Row2 label="Safra" value={normalized.safra} />
              <Row2 label="Cultura" value={primeiroTalhao.cultura} />
              <Row2 label="Híbrido" value={primeiroTalhao.variedade ?? '—'} />
              <Row2 label="Data de semeadura" value="—" />
              <Row2 label="Data de emergência" value="—" />
              <Row2 label="DAE" value={primeiroTalhao.dae != null ? `${primeiroTalhao.dae} dias` : '—'} />
              <Row2 label="Estádio fenológico" value={primeiroTalhao.estagio ?? '—'} />
            </div>
          </div>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Visita de Monitoramento</div>
            <div style={{ padding: 20, display: 'grid', gap: 10 }}>
              <Row2 label="Método" value="Zigue-Zague" />
              <Row2 label="Pontos amostrados" value={String(metricasTalhao?.totalPontos ?? metricasGlobais?.totalPontos ?? '—')} />
              <Row2 label="Temperatura" value={primeiroTalhao.condicoes_climaticas?.temperatura != null ? `${primeiroTalhao.condicoes_climaticas.temperatura}°C` : '—'} />
              <Row2 label="Umidade relativa" value={primeiroTalhao.condicoes_climaticas?.umidade != null ? `${primeiroTalhao.condicoes_climaticas.umidade}%` : '—'} />
            </div>
          </div>
          <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>Condições Climáticas Recentes</div>
            <div style={{ padding: 20, display: 'grid', gap: 10 }}>
              <Row2 label="Chuva (7 dias)" value={primeiroTalhao.condicoes_climaticas?.chuva ?? '—'} />
              <Row2 label="Umidade do ar" value={primeiroTalhao.condicoes_climaticas?.umidade != null ? `${primeiroTalhao.condicoes_climaticas.umidade}%` : '—'} />
              <Row2 label="Temperatura máx." value={primeiroTalhao.condicoes_climaticas?.temperatura != null ? `${primeiroTalhao.condicoes_climaticas.temperatura}°C` : '—'} />
            </div>
          </div>
        </div>

        {/* Observações */}
        {observacoes && (
          <div className="pdf-keep-together" style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>Observações gerais</div>
            <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{observacoes}</p>
          </div>
        )}

        {/* Análise de pragas - cards com imagem por ocorrência, recomendação (produto/dose/manejo) */}
        <div className="pdf-keep-together" style={{ ...cardStyle, overflow: 'hidden', marginBottom: 20 }}>
          <div style={sectionTitleStyle}>Análise de Pragas</div>
          <div style={{ padding: 20 }}>
            {pragasComRecomendacao.length === 0 ? (
              <p style={{ fontSize: 13, color: '#64748B', margin: 0 }}>Nenhuma praga ou doença registrada nesta visita.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {pragasComRecomendacao.map((p, idx) => {
                  const sev = p.severidadeMedia;
                  const cor = severidadeColor(sev);
                  const labelSev = severidadeLabel(sev);
                  return (
                    <div key={idx} className="pdf-keep-together" style={{ border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ padding: '14px 18px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{p.nome}</div>
                          <div style={{ fontSize: 12, color: '#64748B' }}>{TIPO_LABEL[p.tipo]} · Distribuição nos pontos amostrados</div>
                        </div>
                        <span style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, background: `${cor}18`, color: cor }}>{labelSev}</span>
                      </div>
                      <div style={{ padding: 18, display: 'grid', gridTemplateColumns: p.imagem ? '100px 1fr' : '1fr', gap: 18, alignItems: 'start' }}>
                        {p.imagem && (
                          <div style={{ flexShrink: 0, position: 'relative', width: 100, height: 80 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imagem} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #E2E8F0', display: 'block' }} />
                            <button
                              type="button"
                              className="no-print"
                              onClick={() => setGaleriaModal({ url: p.imagem!, descricao: `${p.nome} — ${TIPO_LABEL[p.tipo]}` })}
                              style={{ position: 'absolute', inset: 0, padding: 0, border: 'none', cursor: 'pointer', background: 'transparent', borderRadius: 8 }}
                              aria-label={`Ampliar imagem ${p.nome}`}
                            />
                            <div className="no-print" style={{ fontSize: 10, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>Clique para zoom</div>
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: p.observacao ? 12 : 0 }}>
                            <div>
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>méd./ponto</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{p.quantidadeMedia != null ? formatDecimal2(p.quantidadeMedia) : '—'}</div>
                            </div>
                            <div>
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>plantas afetadas</div>
                              <div style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>{p.percentual}%</div>
                            </div>
                          </div>
                          {p.observacao && (
                            <div style={{ marginBottom: 12 }}>
                              <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>dano observado</div>
                              <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>{p.observacao}</div>
                            </div>
                          )}
                          <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, color: '#166534', fontWeight: 700, marginBottom: 6, letterSpacing: '0.03em' }}>Recomendação (1 produto por ocorrência)</div>
                            <div style={{ fontSize: 12, color: '#14532d', lineHeight: 1.5 }}>
                              <span style={{ fontWeight: 600 }}>Produto:</span> {String(p.produto)} · <span style={{ fontWeight: 600 }}>Dose:</span> {String(p.dose)}
                            </div>
                            <div style={{ fontSize: 12, color: '#166534', marginTop: 4 }}><span style={{ fontWeight: 600 }}>Manejo:</span> {p.manejo}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Avaliação de risco e decisão */}
        <div className="pdf-keep-together" style={{ ...cardStyle, overflow: 'hidden', marginBottom: 20 }}>
          <div style={sectionTitleStyle}>Avaliação de Risco e Suporte à Decisão</div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 6 }}>Score de Risco Global</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#1E293B' }}>{riscoNum}</div>
              <div style={{ fontSize: 14, color: '#475569', marginTop: 4 }}>Risco {riscoLabel} — Prioridade: {riscoNum >= 50 ? 'Monitorar' : 'Acompanhar'}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600, marginBottom: 6 }}>Decisão recomendada</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1B5E20' }}>{riscoNum >= 50 ? 'Monitorar' : riscoNum >= 25 ? 'Acompanhar' : 'Controle adequado'}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Próxima visita técnica: —</div>
            </div>
          </div>
        </div>

        {/* Inteligência de dados (alertas) */}
        {alertas.length > 0 && (
          <div className="pdf-keep-together" style={{ ...cardStyle, overflow: 'hidden', marginBottom: 20 }}>
            <div style={sectionTitleStyle}>Inteligência de Dados</div>
            <ul style={{ margin: 0, padding: '16px 24px 24px', paddingLeft: 20, fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
              {alertas.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Galeria */}
        {imagens.length > 0 && (
          <div className="pdf-keep-together" style={{ ...cardStyle, padding: 24, marginBottom: 20 }}>
            <div style={{ ...sectionTitleStyle, margin: '-24px -24px 20px -24px', padding: '14px 24px', borderRadius: '12px 12px 0 0' }}>Registros fotográficos</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16 }}>
              {imagens.filter(img => img.url).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setGaleriaModal({ url: img.url!, descricao: img.descricao })}
                  style={{ padding: 0, border: '1px solid #E2E8F0', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', background: 'transparent' }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.descricao ?? `Foto ${i + 1}`} style={{ width: '100%', height: 140, objectFit: 'cover' }} />
                </button>
              ))}
            </div>
            {galeriaModal && (
              <div
                onClick={() => setGaleriaModal(null)}
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}
              >
                <div onClick={e => e.stopPropagation()} style={{ maxWidth: '95vw', maxHeight: '95vh' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={galeriaModal.url} alt={galeriaModal.descricao ?? 'Foto'} style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }} />
                  {galeriaModal.descricao && <div style={{ color: '#fff', marginTop: 12, textAlign: 'center' }}>{galeriaModal.descricao}</div>}
                </div>
              </div>
            )}
          </div>
        )}

        <footer style={{ textAlign: 'center', padding: '32px 24px', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#64748B', background: '#fff', borderRadius: 12, marginTop: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          <strong style={{ color: '#475569' }}>FortSmart Agro</strong> · Relatório de Monitoramento Fitossanitário · {normalized.data} · {normalized.tecnico}
        </footer>
      </div>
    </div>
  );
}

function Row2({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
      <span style={{ fontSize: 12, color: '#64748B' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', textAlign: 'right' }}>{value || '—'}</span>
    </div>
  );
}
