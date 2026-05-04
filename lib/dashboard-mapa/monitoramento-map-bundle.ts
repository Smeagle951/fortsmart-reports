/**
 * Constrói FeatureCollection + pins do mapa a partir do **mesmo JSON persistido pelo app** (ex. `relatorios.dados` no SQL),
 * espelhando a lógica do relatório web de monitoramento. **Fonte de verdade: SQL do app**, não ficheiros no cloud.
 *
 * Imagens: `resolveReportPhotoSrc` — campos do payload (URL, base64, paths de storage ligados ao registo), paridade com `/r/[token]`.
 * **R2 / cloud** reserva-se a **GeoJSON/KML** e afins; não assumir fotos de monitoramento a partir do bucket geográfico.
 */

import type { Feature, FeatureCollection, Polygon } from 'geojson';

import { calcularMetricasTalhao } from '@/lib/calculations';
import { resolveReportPhotoSrc } from '@/lib/resolveReportPhotoSrc';
import type {
  GeoJSONPolygon,
  Infestacao,
  NivelRecomendacao,
  PontoMonitoramento,
  Recomendacao,
  Talhao,
  TipoOrganismo,
} from '@/lib/types/monitoring';

import type { DashboardMonitorEvent, MapEventPinKind, PropertyAlert } from './types';

/** Mesma regra que `/r/[token]` para rotear monitoramento. */
export function isMonitoramentoPayloadForMap(r: Record<string, unknown>): boolean {
  const core = r.core as Record<string, unknown> | undefined;
  const reportTypeV2 = typeof core?.reportType === 'string' ? core.reportType : undefined;
  const tipo = (r.tipo as string | undefined) ?? reportTypeV2;
  const tipoRelatorio = (r.tipoRelatorio as string | undefined) ?? reportTypeV2;
  const isMonTipo = tipo === 'monitoramento' || tipoRelatorio === 'monitoramento';
  const talhoesArray = Array.isArray(r.talhoes)
    ? r.talhoes
    : r.talhao != null && typeof r.talhao === 'object'
      ? [r.talhao]
      : [];
  const hasTalhoesValid =
    talhoesArray.length > 0 && talhoesArray.every((t: unknown) => t != null && typeof t === 'object');
  return isMonTipo && hasTalhoesValid;
}

function safeNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeTipoFromPayload(t: unknown): TipoOrganismo {
  const s = String(t ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (s.includes('doenc')) return 'doenca';
  if (s.includes('daninh')) return 'daninha';
  if (['praga', 'doenca', 'daninha'].includes(String(t ?? '').toLowerCase())) {
    return String(t).toLowerCase() as TipoOrganismo;
  }
  return 'praga';
}

function defaultPolygon(pontos: PontoMonitoramento[]): GeoJSONPolygon {
  if (pontos.length === 0) {
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[-48, -16], [-47.9, -16], [-47.9, -15.9], [-48, -15.9], [-48, -16]]] },
    };
  }
  let minLat = pontos[0].lat;
  let maxLat = pontos[0].lat;
  let minLng = pontos[0].lng;
  let maxLng = pontos[0].lng;
  for (const p of pontos) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const pad = 0.0001;
  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [minLng - pad, minLat - pad],
          [maxLng + pad, minLat - pad],
          [maxLng + pad, maxLat + pad],
          [minLng - pad, maxLat + pad],
          [minLng - pad, minLat - pad],
        ],
      ],
    },
  };
}

/** Paridade com `normalizeTalhao` em RelatorioMonitoramentoContent — manter sincronizado. */
export function normalizeTalhaoForMap(raw: Record<string, unknown>): Talhao {
  const pontosRaw = Array.isArray(raw.pontos) ? raw.pontos : [];
  const pontos: PontoMonitoramento[] = pontosRaw
    .filter((p): p is Record<string, unknown> => p != null && typeof p === 'object')
    .map((p, i) => {
      const infRaw = Array.isArray(p.infestacoes) ? p.infestacoes : [];
      const infestacoes: Infestacao[] = infRaw
        .filter((inf): inf is Record<string, unknown> => inf != null && typeof inf === 'object')
        .map((inf, j) => ({
          id: String(inf.id ?? `inf-${i}-${j}`),
          tipo: normalizeTipoFromPayload(inf.tipo),
          nome: String(inf.nome ?? '—'),
          terco: String(inf.terco ?? 'Médio'),
          quantidade: inf.quantidade != null ? safeNum(inf.quantidade) : null,
          severidade: safeNum(inf.severidade ?? 0),
          observacao: inf.observacao != null && String(inf.observacao) ? String(inf.observacao) : undefined,
          imagem: (() => {
            const v = inf.imagem ?? inf.url ?? inf.foto_url ?? inf.foto_path ?? inf.image_url;
            if (v != null && String(v).trim()) return String(v).trim();
            const paths = inf.foto_paths;
            if (Array.isArray(paths) && paths.length > 0 && paths[0] != null && String(paths[0]).trim())
              return String(paths[0]).trim();
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

  const poligonoRaw = (raw.poligono_geojson ??
    raw.poligono ??
    raw.polygon ??
    raw.geometry ??
    raw.geojson) as GeoJSONPolygon | undefined | null;
  const poligono =
    poligonoRaw &&
    poligonoRaw.type === 'Feature' &&
    poligonoRaw.geometry?.type === 'Polygon' &&
    Array.isArray(poligonoRaw.geometry?.coordinates)
      ? poligonoRaw
      : defaultPolygon(pontos);

  const cond = raw.condicoes_climaticas as Record<string, unknown> | undefined;
  const condicoes_climaticas = cond
    ? {
        temperatura: Number(cond.temperatura ?? 0),
        umidade: Number(cond.umidade ?? 0),
        chuva: (cond.chuva as string) ?? 'Sem Chuva',
      }
    : undefined;

  const recRaw = (raw.recomendacoes ?? []) as Array<Record<string, unknown>>;
  const recomendacoes: Recomendacao[] = recRaw.map((r: Record<string, unknown>) => ({
    nivel: (r.nivel as NivelRecomendacao) ?? 'MONITORAR',
    organismo: r.organismo != null && String(r.organismo).trim() ? String(r.organismo).trim() : '—',
    tipo: (r.tipo as TipoOrganismo) ?? 'praga',
    produto: r.produto != null && String(r.produto).trim() ? String(r.produto).trim() : '',
    dose: r.dose != null && String(r.dose).trim() ? String(r.dose).trim() : '',
    acao: typeof r.acao === 'string' ? r.acao : String(r.acao ?? '—'),
    pontos: Array.isArray(r.pontos) ? (r.pontos as string[]) : [],
    severidade: typeof r.severidade === 'number' ? r.severidade : 0,
  }));

  const rawTalhao = raw.talhao != null && typeof raw.talhao === 'object' ? (raw.talhao as Record<string, unknown>) : null;
  const rawDetalhes = raw.detalhes != null && typeof raw.detalhes === 'object' ? (raw.detalhes as Record<string, unknown>) : null;
  const areaHa = safeNum(
    raw.area_ha ??
      raw.area ??
      raw.areaHa ??
      raw.area_hectares ??
      raw.hectares ??
      raw.superficie_ha ??
      raw.superficie ??
      raw.tamanho_ha ??
      rawTalhao?.area_ha ??
      rawTalhao?.area ??
      rawTalhao?.area_hectares ??
      rawTalhao?.hectares ??
      rawDetalhes?.area_ha ??
      rawDetalhes?.area ??
      rawDetalhes?.area_hectares ??
      0,
  );
  const dae = raw.dae != null ? safeNum(raw.dae) : undefined;
  const estandeRaw = raw.estande != null && typeof raw.estande === 'object' ? (raw.estande as Record<string, unknown>) : undefined;
  const populacaoEstande =
    estandeRaw?.plantasPorMetro != null
      ? safeNum(estandeRaw.plantasPorMetro)
      : estandeRaw?.populacao != null
        ? safeNum(estandeRaw.populacao)
        : undefined;

  return {
    id: String(raw.id ?? 't1'),
    nome: String(raw.nome ?? 'Talhão'),
    cultura: String(raw.cultura ?? '—'),
    area_ha: Number.isFinite(areaHa) ? areaHa : 0,
    variedade: raw.variedade != null && String(raw.variedade) ? String(raw.variedade) : undefined,
    estagio: raw.estagio != null && String(raw.estagio) ? String(raw.estagio) : undefined,
    dae: dae != null && Number.isFinite(dae) ? dae : undefined,
    populacao_estande: populacaoEstande != null && Number.isFinite(populacaoEstande) ? populacaoEstande : undefined,
    poligono_geojson: poligono,
    pontos,
    condicoes_climaticas,
    recomendacoes,
  };
}

export type MonitoramentoMapDisplayMeta = {
  fazenda: string;
  safra: string;
  data: string;
  tecnico: string;
  usuario: string;
  crea?: string;
};

export function extractMonitoramentoMapMeta(relatorio: Record<string, unknown>): MonitoramentoMapDisplayMeta {
  const prop =
    relatorio.propriedade != null && typeof relatorio.propriedade === 'object'
      ? (relatorio.propriedade as Record<string, unknown>)
      : undefined;
  const meta = relatorio.meta != null && typeof relatorio.meta === 'object' ? (relatorio.meta as Record<string, unknown>) : undefined;

  const fazenda = String(
    relatorio.fazenda ??
      relatorio.nome_fazenda ??
      relatorio.fazenda_nome ??
      prop?.fazenda ??
      prop?.nome ??
      (relatorio as Record<string, unknown>).nomeFazenda ??
      prop?.nome_fazenda ??
      meta?.fazenda ??
      '',
  ).trim();

  const usuario = String(
    relatorio.usuario ??
      relatorio.nome_usuario ??
      (relatorio as Record<string, unknown>).nomeUsuario ??
      (relatorio as Record<string, unknown>).userName ??
      prop?.usuario ??
      prop?.nome_usuario ??
      prop?.nomeUsuario ??
      prop?.responsavel ??
      prop?.nome_responsavel ??
      meta?.usuario ??
      meta?.nome_usuario ??
      '',
  ).trim();

  const safra = String(relatorio.safra ?? meta?.safra ?? '').trim();
  const dataRaw = relatorio.data ?? meta?.dataGeracao ?? '';
  const data = typeof dataRaw === 'string' ? dataRaw : dataRaw != null ? String(dataRaw) : '';

  const tecnico = String(
    relatorio.tecnico ??
      relatorio.agronomo ??
      relatorio.nome_tecnico ??
      relatorio.nome_agronomo ??
      (relatorio as Record<string, unknown>).tecnicoNome ??
      prop?.tecnico ??
      prop?.agronomo ??
      prop?.nome_tecnico ??
      meta?.tecnico ??
      meta?.agronomo ??
      meta?.nome_tecnico ??
      '',
  ).trim();

  const crea = String(
    relatorio.crea ??
      relatorio.tecnico_crea ??
      relatorio.crea_tecnico ??
      (relatorio as Record<string, unknown>).creaAgronomo ??
      meta?.tecnicoCrea ??
      meta?.crea ??
      prop?.crea ??
      prop?.tecnico_crea ??
      '',
  ).trim();

  return {
    fazenda,
    safra,
    data,
    tecnico: tecnico || '—',
    usuario: usuario || '—',
    crea: crea || undefined,
  };
}

function pinKindFromInfestacao(tipo: TipoOrganismo, severidade: number): MapEventPinKind {
  if (tipo === 'doenca') return 'disease';
  if (severidade >= 66) return 'pest_high';
  if (severidade >= 33) return 'pest_med';
  return 'normal';
}

function severityFromNumber(sev: number): DashboardMonitorEvent['severity'] {
  if (sev >= 66) return 'alto';
  if (sev >= 33) return 'medio';
  return 'baixo';
}

function eventTypeFromTipo(t: TipoOrganismo): DashboardMonitorEvent['type'] {
  if (t === 'doenca') return 'doenca';
  if (t === 'daninha') return 'praga';
  return 'praga';
}

export type MonitoramentoMapBundle = {
  featureCollection: FeatureCollection;
  events: DashboardMonitorEvent[];
  alerts: PropertyAlert[];
  meta: MonitoramentoMapDisplayMeta;
};

export function buildMonitoramentoMapBundle(relatorio: Record<string, unknown>): MonitoramentoMapBundle | null {
  if (!isMonitoramentoPayloadForMap(relatorio)) return null;

  const meta = extractMonitoramentoMapMeta(relatorio);
  const talhoesRaw = Array.isArray(relatorio.talhoes) ? relatorio.talhoes : [];
  const talhoes = talhoesRaw.map((t: unknown) =>
    normalizeTalhaoForMap(t != null && typeof t === 'object' ? (t as Record<string, unknown>) : {}),
  );

  const features: Feature[] = [];
  for (const t of talhoes) {
    const geom = t.poligono_geojson?.geometry;
    if (geom && geom.type === 'Polygon') {
      features.push({
        type: 'Feature',
        properties: {
          talhao_id: t.id,
          talhao: t.nome,
          cultura: t.cultura,
          material: t.variedade ?? '—',
          area_ha: t.area_ha,
          tipo: 'talhao',
          safra: meta.safra || undefined,
          data_plantio: undefined,
        },
        geometry: geom as Polygon,
      });
    }
  }

  const events: DashboardMonitorEvent[] = [];
  let evIdx = 0;
  for (const t of talhoes) {
    for (const p of t.pontos) {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
      if (p.lat === 0 && p.lng === 0 && p.infestacoes.length === 0) continue;
      for (const inf of p.infestacoes) {
        const photoSrc =
          resolveReportPhotoSrc(inf as unknown as Record<string, unknown>) ??
          (inf.imagem ? resolveReportPhotoSrc(inf.imagem) : undefined) ??
          '';

        const id = `mon-${t.id}-${p.id}-${inf.id}-${evIdx++}`;
        events.push({
          id,
          title: inf.nome,
          talhaoLabel: t.nome,
          areaLabel: `Ponto ${p.identificador}`,
          lat: p.lat,
          lng: p.lng,
          pinKind: pinKindFromInfestacao(inf.tipo, inf.severidade),
          severity: severityFromNumber(inf.severidade),
          type: eventTypeFromTipo(inf.tipo),
          dateIso: meta.data ? meta.data.slice(0, 10) : new Date().toISOString().slice(0, 10),
          evaluator: meta.tecnico,
          observation: inf.observacao ?? `Terço: ${inf.terco}. Severidade: ${inf.severidade}%.`,
          imageUrl: photoSrc,
          specs: [
            { label: 'Talhão', value: t.nome },
            { label: 'Ponto', value: p.identificador },
            { label: 'Cultura', value: t.cultura },
            ...(t.area_ha > 0 ? [{ label: 'Área (ha)', value: String(t.area_ha) }] : []),
            ...(t.variedade ? [{ label: 'Variedade', value: t.variedade }] : []),
          ],
        });
      }
    }
  }

  const alerts: PropertyAlert[] = [];
  let alertI = 0;
  const rawAlerts = relatorio.alertas;
  if (Array.isArray(rawAlerts)) {
    for (const a of rawAlerts) {
      if (a == null) continue;
      const message = String(typeof a === 'string' ? a : (a as Record<string, unknown>).mensagem ?? a).trim();
      if (!message) continue;
      alerts.push({
        id: `a-${alertI++}`,
        message,
        talhaoLabel: meta.fazenda || 'Propriedade',
        tone: 'warning',
      });
    }
  }
  for (const t of talhoes) {
    const c = calcularMetricasTalhao(t).classificacao;
    if (c === 'CRITICO' || c === 'ALTO_RISCO') {
      alerts.push({
        id: `t-${t.id}`,
        message: c === 'CRITICO' ? 'Talhão em situação crítica' : 'Talhão em alto risco',
        talhaoLabel: t.nome,
        tone: c === 'CRITICO' ? 'danger' : 'warning',
      });
    }
  }

  if (features.length === 0) return null;

  return {
    featureCollection: { type: 'FeatureCollection', features },
    events,
    alerts,
    meta,
  };
}
