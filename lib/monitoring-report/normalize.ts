import type {
  CondicoesClimaticas,
  GeoJSONPolygon,
  Infestacao,
  PontoMonitoramento,
  Recomendacao,
  RelatorioMonitoramento,
  Talhao,
  TipoOrganismo,
} from '@/lib/types/monitoring';

export type MonitoringValueSource = 'payload' | 'derived' | 'not_informed';

export interface MonitoringFieldAvailability {
  area: MonitoringValueSource;
  temperatura: MonitoringValueSource;
  umidade: MonitoringValueSource;
  chuva: MonitoringValueSource;
}

export interface NormalizedInfestacao extends Infestacao {
  quantidadeInformada: boolean;
  severidadeInformada: boolean;
}

export interface NormalizedPontoMonitoramento extends PontoMonitoramento {
  infestacoes: NormalizedInfestacao[];
}

export interface NormalizedTalhao extends Talhao {
  pontos: NormalizedPontoMonitoramento[];
  disponibilidade: MonitoringFieldAvailability;
}

export interface NormalizedMonitoringReport
  extends Omit<RelatorioMonitoramento, 'talhoes'> {
  talhoes: NormalizedTalhao[];
}

export type PayloadMonitoramento = Record<string, unknown> & {
  tipo?: string;
  propriedade?: Record<string, unknown>;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  crea?: string;
  talhoes?: Record<string, unknown>[];
  metricas?: Record<string, unknown>;
  estande?: Record<string, unknown>;
  cv?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  observacoes?: string | null;
  alertas?: string[] | null;
  imagens?: Array<{
    url?: string;
    descricao?: string;
    categoria?: string;
    data?: string;
    ponto?: string;
    organismo?: string;
  }>;
  consultoria?: { nome?: string; logo?: string };
  organismos_contexto?: Array<Record<string, unknown>>;
  dados_plantio?: Record<string, unknown> | null;
  modulo_plantio?: Record<string, unknown>;
};

function hasValue(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

function finiteNumber(value: unknown): number | null {
  if (!hasValue(value)) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function firstFinite(...values: unknown[]): number | null {
  for (const value of values) {
    const number = finiteNumber(value);
    if (number !== null) return number;
  }
  return null;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (hasValue(value)) return String(value).trim();
  }
  return '';
}

function normalizeTipo(value: unknown): TipoOrganismo {
  const normalized = String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  if (normalized.includes('doenc') || normalized.includes('disease')) {
    return 'doenca';
  }
  if (
    normalized.includes('daninh') ||
    normalized.includes('weed') ||
    normalized.includes('invasive')
  ) {
    return 'daninha';
  }
  return 'praga';
}

function defaultPolygon(pontos: PontoMonitoramento[]): GeoJSONPolygon {
  const valid = pontos.filter(
    (ponto) =>
      Number.isFinite(ponto.lat) &&
      Number.isFinite(ponto.lng) &&
      ponto.lat >= -90 &&
      ponto.lat <= 90 &&
      ponto.lng >= -180 &&
      ponto.lng <= 180,
  );
  if (valid.length === 0) {
    return {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [] },
    };
  }

  const latitudes = valid.map((ponto) => ponto.lat);
  const longitudes = valid.map((ponto) => ponto.lng);
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);
  const pad = 0.0001;

  return {
    type: 'Feature',
    properties: { source: 'derived', sourceModules: ['monitoramento'] },
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

function normalizeInfestacao(
  raw: Record<string, unknown>,
  pointIndex: number,
  infestationIndex: number,
): NormalizedInfestacao {
  const quantidade = finiteNumber(raw.quantidade);
  const severidade = finiteNumber(raw.severidade);
  const image = firstText(
    raw.imagem,
    raw.url,
    raw.foto_url,
    raw.foto_path,
    raw.image_url,
    Array.isArray(raw.foto_paths) ? raw.foto_paths[0] : null,
  );

  return {
    id: firstText(raw.id) || `inf-${pointIndex}-${infestationIndex}`,
    tipo: normalizeTipo(raw.tipo),
    nome: firstText(raw.nome) || 'Não informado',
    terco: firstText(raw.terco) || 'Não informado',
    quantidade,
    // O número continua compatível com os componentes legados; a flag impede
    // que o relatório profissional apresente ausência como zero real.
    severidade: severidade ?? 0,
    severidadeInformada: severidade !== null,
    quantidadeInformada: quantidade !== null,
    observacao: firstText(raw.observacao) || undefined,
    imagem: image || undefined,
  };
}

function normalizePoint(
  raw: Record<string, unknown>,
  pointIndex: number,
): NormalizedPontoMonitoramento {
  const infestacoesRaw = Array.isArray(raw.infestacoes)
    ? raw.infestacoes
    : [];
  return {
    id: firstText(raw.id) || `p-${pointIndex}`,
    identificador:
      firstText(raw.identificador, raw.codigo, raw.nome) ||
      `P${pointIndex + 1}`,
    lat: firstFinite(raw.lat, raw.latitude) ?? 0,
    lng: firstFinite(raw.lng, raw.longitude) ?? 0,
    infestacoes: infestacoesRaw
      .filter(
        (value): value is Record<string, unknown> =>
          value !== null && typeof value === 'object',
      )
      .map((infestacao, index) =>
        normalizeInfestacao(infestacao, pointIndex, index),
      ),
  };
}

function normalizeRecommendation(raw: Record<string, unknown>): Recomendacao {
  const nivel = firstText(raw.nivel) as Recomendacao['nivel'];
  return {
    nivel: ['ACAO_IMEDIATA', 'ALTO_RISCO', 'MONITORAR', 'PREVENTIVO'].includes(
      nivel,
    )
      ? nivel
      : 'MONITORAR',
    organismo: firstText(raw.organismo) || 'Não informado',
    tipo: normalizeTipo(raw.tipo),
    produto: firstText(raw.produto),
    dose: firstText(raw.dose),
    acao: firstText(raw.acao),
    pontos: Array.isArray(raw.pontos)
      ? raw.pontos.map(String).filter(Boolean)
      : [],
    severidade: finiteNumber(raw.severidade) ?? 0,
    prazo: firstText(raw.prazo, raw.janela, raw.janela_recomendada) || undefined,
    evidencia: firstText(raw.evidencia, raw.fonte, raw.justificativa) || undefined,
  };
}

export function normalizeMonitoringPlot(
  raw: Record<string, unknown>,
): NormalizedTalhao {
  const rawTalhao =
    raw.talhao !== null && typeof raw.talhao === 'object'
      ? (raw.talhao as Record<string, unknown>)
      : undefined;
  const detalhes =
    raw.detalhes !== null && typeof raw.detalhes === 'object'
      ? (raw.detalhes as Record<string, unknown>)
      : undefined;
  const area = firstFinite(
    raw.area_ha,
    raw.area,
    raw.areaHa,
    raw.area_hectares,
    raw.hectares,
    raw.superficie_ha,
    raw.superficie,
    raw.tamanho_ha,
    rawTalhao?.area_ha,
    rawTalhao?.area,
    rawTalhao?.area_hectares,
    rawTalhao?.hectares,
    detalhes?.area_ha,
    detalhes?.area,
    detalhes?.area_hectares,
  );
  const pontos = (Array.isArray(raw.pontos) ? raw.pontos : [])
    .filter(
      (value): value is Record<string, unknown> =>
        value !== null && typeof value === 'object',
    )
    .map(normalizePoint);

  const polygonRaw = (raw.poligono_geojson ??
    raw.poligono ??
    raw.polygon ??
    raw.geometry ??
    raw.geojson) as GeoJSONPolygon | undefined;
  const polygonValid =
    polygonRaw?.type === 'Feature' &&
    polygonRaw.geometry?.type === 'Polygon' &&
    Array.isArray(polygonRaw.geometry.coordinates);

  const climateRaw =
    raw.condicoes_climaticas !== null &&
    typeof raw.condicoes_climaticas === 'object'
      ? (raw.condicoes_climaticas as Record<string, unknown>)
      : undefined;
  const temperatura = finiteNumber(climateRaw?.temperatura);
  const umidade = finiteNumber(climateRaw?.umidade);
  const chuva = firstText(climateRaw?.chuva);
  const hasClimate =
    temperatura !== null || umidade !== null || chuva.length > 0;
  const condicoes: CondicoesClimaticas | undefined = hasClimate
    ? {
        temperatura: temperatura ?? 0,
        umidade: umidade ?? 0,
        chuva,
      }
    : undefined;

  const estandeRaw =
    raw.estande !== null && typeof raw.estande === 'object'
      ? (raw.estande as Record<string, unknown>)
      : undefined;
  const population = firstFinite(
    estandeRaw?.plantasPorMetro,
    estandeRaw?.populacao,
  );
  const fallbackId =
    firstText(raw.nome, raw.cultura)
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'sem-id';

  return {
    id: firstText(raw.id) || `talhao-${fallbackId}`,
    nome: firstText(raw.nome) || 'Talhão não identificado',
    cultura: firstText(raw.cultura) || 'Não informado',
    area_ha: area ?? 0,
    variedade: firstText(raw.variedade) || undefined,
    estagio: firstText(raw.estagio, raw.estadio) || undefined,
    dae: finiteNumber(raw.dae) ?? undefined,
    populacao_estande: population ?? undefined,
    poligono_geojson: polygonValid ? polygonRaw : defaultPolygon(pontos),
    pontos,
    condicoes_climaticas: condicoes,
    recomendacoes: (Array.isArray(raw.recomendacoes)
      ? raw.recomendacoes
      : []
    )
      .filter(
        (value): value is Record<string, unknown> =>
          value !== null && typeof value === 'object',
      )
      .map(normalizeRecommendation),
    disponibilidade: {
      area: area === null ? 'not_informed' : 'payload',
      temperatura: temperatura === null ? 'not_informed' : 'payload',
      umidade: umidade === null ? 'not_informed' : 'payload',
      chuva: chuva.length === 0 ? 'not_informed' : 'payload',
    },
  };
}

export function normalizeMonitoringReport(
  relatorio: PayloadMonitoramento,
): NormalizedMonitoringReport {
  const propriedade =
    relatorio.propriedade !== null &&
    typeof relatorio.propriedade === 'object'
      ? relatorio.propriedade
      : undefined;
  const meta =
    relatorio.meta !== null && typeof relatorio.meta === 'object'
      ? (relatorio.meta as Record<string, unknown>)
      : undefined;

  const consultoriaNome = firstText(relatorio.consultoria?.nome);

  return {
    fazenda: firstText(
      relatorio.fazenda,
      relatorio.nome_fazenda,
      relatorio.fazenda_nome,
      propriedade?.fazenda,
      propriedade?.nome,
      relatorio.nomeFazenda,
      meta?.fazenda,
    ),
    safra: firstText(relatorio.safra, meta?.safra),
    data: firstText(relatorio.data, meta?.dataGeracao),
    tecnico:
      firstText(
        relatorio.tecnico,
        relatorio.agronomo,
        relatorio.nome_tecnico,
        relatorio.nome_agronomo,
        relatorio.tecnicoNome,
        propriedade?.tecnico,
        propriedade?.agronomo,
        meta?.tecnico,
        meta?.agronomo,
      ) || 'Não informado',
    crea:
      firstText(
        relatorio.crea,
        relatorio.tecnico_crea,
        relatorio.crea_tecnico,
        relatorio.creaAgronomo,
        meta?.tecnicoCrea,
        meta?.crea,
        propriedade?.crea,
      ) || undefined,
    talhoes: (Array.isArray(relatorio.talhoes) ? relatorio.talhoes : [])
      .filter(
        (value): value is Record<string, unknown> =>
          value !== null && typeof value === 'object',
      )
      .map(normalizeMonitoringPlot),
    consultoria: consultoriaNome
      ? {
          nome: consultoriaNome,
          logoUrl: firstText(relatorio.consultoria?.logo) || undefined,
        }
      : undefined,
  };
}
