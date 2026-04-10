import type { FeatureCollection, Feature, Point } from 'geojson';

/** Métricas de validação da coleta (compliance solo), preenchidas pelo app no `meta`. */
export type ColetaValidacaoMeta = {
  pontos_total?: number;
  pontos_gps_valido?: number;
  pontos_gps_invalido?: number;
  precisao_gps_media_m?: number | null;
  distancia_media_vizinho_m?: number | null;
  cobertura_area_pct?: number | null;
  area_talhao_ha?: number | null;
  area_envoltoria_pontos_ha?: number | null;
  criterio_precisao_max_m?: number | null;
};

export type AmostragemSoloPayload = {
  /** 2 = metadados de campanha (empresa/usuário) persistidos no app; 1 ou ausente = legado. */
  schemaVersion?: number;
  meta?: Record<string, unknown> & { coleta_validacao?: ColetaValidacaoMeta };
  talhoes?: Array<{ id?: string; nome?: string }>;
  observacoes?: AmostragemObservacao[];
  geojson?: FeatureCollection;
  talhoes_geojson?: FeatureCollection;
  rota_geojson?: FeatureCollection;
  /** Isolinhas premium (IDW + marching squares no app). */
  premium?: {
    isolines?: boolean;
    isolines_geojson?: FeatureCollection;
  };
};

/** Leitura de penetrômetro serializada pelo app (Flutter). */
export type AmostragemLeitura = {
  reading_order?: number;
  raw_value?: number;
  unit?: string;
  cone_diameter_mm?: number;
  cone_area_mm2?: number;
  ci_mpa?: number | null;
  penetration_speed?: number;
  operator_name?: string;
  equipment_id?: string;
};

export type AmostragemObservacao = {
  id?: string;
  numero?: number;
  lat?: number;
  lng?: number;
  profundidade?: string | null;
  compactacao?: number | null;
  classificacao?: string;
  talhao_id?: string | null;
  /** Nome do talhão resolvido no app (SQLite); preferir na UI em relação a só o id. */
  talhao_nome?: string | null;
  obs?: string | null;
  imagem_url?: string | null;
  point_id?: number;
  depth_id?: number | null;
  point_name?: string | null;
  sample_code?: string | null;
  altitude_m?: number | null;
  gps_accuracy_m?: number | null;
  gps_provider?: string | null;
  quantidade?: number | null;
  tipo_penetrometro?: string | null;
  peso_martelo_kg?: number | null;
  altura_queda_cm?: number | null;
  numero_impactos?: number | null;
  profundidade_atingida_cm?: number | null;
  moisture_percent?: number | null;
  bulk_density?: number | null;
  depth_top_cm?: number | null;
  depth_bottom_cm?: number | null;
  leituras?: AmostragemLeitura[];
  /** Evidência de subamostragem por ponto (compliance). */
  subsamples_count?: number;
  subsamples?: Array<{ lat: number; lng: number }>;
};

export function isAmostragemSoloPayload(raw: Record<string, unknown>): boolean {
  return raw.tipo === 'amostragem_solo';
}

/** Garante FeatureCollection: usa geojson embutido ou monta a partir de observacoes. */
export function getFeatureCollection(payload: AmostragemSoloPayload): FeatureCollection {
  const existing = payload.geojson;
  if (existing && existing.type === 'FeatureCollection' && Array.isArray(existing.features)) {
    return existing;
  }
  const obs = payload.observacoes ?? [];
  const features: Feature[] = [];
  for (const o of obs) {
    if (o.lat == null || o.lng == null) continue;
    const geom: Point = { type: 'Point', coordinates: [o.lng, o.lat] };
    features.push({
      type: 'Feature',
      geometry: geom,
      properties: {
        id: o.id ?? String(o.numero ?? ''),
        numero: o.numero,
        profundidade: o.profundidade ?? '',
        compactacao: o.compactacao ?? null,
        classificacao: o.classificacao ?? 'Indefinido',
        talhao_id: o.talhao_id ?? '',
        ...(o.talhao_nome != null && o.talhao_nome !== '' ? { talhao_nome: o.talhao_nome } : {}),
        obs: o.obs ?? '',
        point_id: o.point_id,
        depth_id: o.depth_id,
        ...(o.point_name != null && o.point_name !== '' ? { point_name: o.point_name } : {}),
        ...(o.sample_code != null && o.sample_code !== '' ? { sample_code: o.sample_code } : {}),
        ...(o.moisture_percent != null ? { moisture_percent: o.moisture_percent } : {}),
        ...(o.bulk_density != null ? { bulk_density: o.bulk_density } : {}),
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
