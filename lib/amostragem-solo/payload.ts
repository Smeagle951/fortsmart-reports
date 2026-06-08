import type { FeatureCollection, Feature, Point } from 'geojson';

export type AmostragemSoloPayload = {
  /** 2 = metadados de campanha (empresa/usuário) persistidos no app; 1 ou ausente = legado. */
  schemaVersion?: number;
  meta?: Record<string, unknown>;
  talhoes?: Array<{ id?: string; nome?: string }>;
  sample_points?: AmostragemSamplePoint[];
  observacoes?: AmostragemObservacao[];
  soil_ndvi_layers?: SoilNdviLayerPayload[];
  /** Alertas de diagnóstico rápido de campo (mobile, offline). */
  soil_field_alerts?: SoilFieldAlertPayload[];
  geojson?: FeatureCollection;
  talhoes_geojson?: FeatureCollection;
  rota_geojson?: FeatureCollection;
  /** Isolinhas premium (IDW + marching squares no app). */
  premium?: {
    isolines?: boolean;
    isolines_geojson?: FeatureCollection;
  };
};

export type AmostragemSamplePoint = {
  id?: number;
  campaign_id?: number;
  lat?: number;
  lng?: number;
  ndvi_layer_id?: string | null;
  ndvi_value?: number | null;
  ndvi_class?: string | null;
  ndvi_image_date?: string | null;
};

export type SoilFieldAlertPayload = {
  id: string;
  farm_id: string;
  plot_id: string;
  campaign_id: string;
  ndvi_layer_id?: string | null;
  latitude: number;
  longitude: number;
  ndvi_value?: number | null;
  ndvi_class?: string | null;
  alert_level: 'red' | 'orange' | string;
  area_ha?: number | null;
  image_date?: string | null;
  evidences?: FieldAlertEvidencePayload[];
  hypotheses?: FieldAlertHypothesisPayload[];
  main_hypothesis?: FieldAlertHypothesisPayload | null;
  recommended_actions?: string[];
  created_at?: string | null;
  updated_at?: string | null;
  synced?: boolean | number;
};

export type FieldAlertEvidencePayload = {
  id: string;
  type: string;
  label: string;
  description?: string | null;
  severity?: string;
  confidence?: number;
  source_module?: string | null;
  distance_meters?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string | null;
  raw_data?: Record<string, unknown> | null;
};

export type FieldAlertHypothesisPayload = {
  id: string;
  title: string;
  description?: string | null;
  category?: string;
  confidence?: string;
  confidence_score?: number;
  evidence_ids?: string[];
  recommended_actions?: string[];
  disclaimer?: string;
};

export type SoilNdviLayerPayload = {
  id: string;
  farm_id: string;
  plot_id: string;
  campaign_id?: string | null;
  source: string;
  image_date: string;
  cloud_coverage?: number | null;
  resolution_m?: number | null;
  ndvi_mean?: number | null;
  ndvi_min?: number | null;
  ndvi_max?: number | null;
  very_low_percent?: number | null;
  low_percent?: number | null;
  medium_percent?: number | null;
  high_percent?: number | null;
  preview_url?: string | null;
  tile_url?: string | null;
  raster_url?: string | null;
  local_preview_path?: string | null;
  local_tile_path?: string | null;
  is_active?: boolean | number;
  created_at?: string | null;
  updated_at?: string | null;
  synced?: boolean | number;
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
  ndvi_layer_id?: string | null;
  ndvi_value?: number | null;
  ndvi_class?: string | null;
  ndvi_image_date?: string | null;
  leituras?: AmostragemLeitura[];
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
        ...(o.ndvi_layer_id != null && o.ndvi_layer_id !== '' ? { ndvi_layer_id: o.ndvi_layer_id } : {}),
        ...(o.ndvi_value != null ? { ndvi_value: o.ndvi_value } : {}),
        ...(o.ndvi_class != null && o.ndvi_class !== '' ? { ndvi_class: o.ndvi_class } : {}),
        ...(o.ndvi_image_date != null && o.ndvi_image_date !== '' ? { ndvi_image_date: o.ndvi_image_date } : {}),
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
