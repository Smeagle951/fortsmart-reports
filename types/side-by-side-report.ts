/** Contrato alinhado ao JSON de SideBySideReportDTO.toJson() / publishAvaliacaoLadoALado */

export type ReportApplicationProductV2Json = {
  nomeComercial?: string;
  nomeAtivo?: string;
  classe?: string;
  dose?: number;
  unidade?: string;
  custoHa?: number;
  linkedProtocolItemId?: string;
};

export type ReportApplicationEventV2Json = {
  id?: string;
  side: 'A' | 'B';
  scope?: string;
  point_ids?: string[];
  date?: string;
  daa?: number;
  stage?: string;
  type?: string;
  responsible?: string;
  /** Observações do técnico por aplicação (app / SQLite `notes`). */
  notes?: string;
  climate?: {
    temperature?: number;
    humidity?: number;
    wind?: string | number;
    derivaRisco?: string;
  };
  applicationTech?: {
    bico?: string;
    vazao?: number;
    pressao?: number;
  };
  products?: ReportApplicationProductV2Json[];
};

export type TreatmentProtocolProductJson = {
  name: string;
  active_ingredient?: string;
  dose?: string | number;
  dose_value?: number;
  dose_unit?: string;
  cost_per_ha?: number;
  id?: string;
  category?: string;
  notes?: string;
};

export type TreatmentProtocolSideJson = {
  side: 'A' | 'B';
  name: string;
  description?: string;
  objective?: string;
  expected_result?: string;
  /** Testemunha / controle — chave JSON `is_control_side` (export Flutter). */
  is_control_side?: boolean;
  products?: TreatmentProtocolProductJson[];
};

export type TreatmentProtocolJson = {
  kind?: string;
  note?: string;
  sides?: TreatmentProtocolSideJson[];
};

export type CustoBySideJson = {
  side: 'A' | 'B';
  sideName?: string;
  totalCost?: number;
  costPerHa?: number;
  source?: string;
  currency?: string;
  items?: Record<string, unknown>[];
};

export type CustoJson = {
  by_side: CustoBySideJson[];
  deltaCostPerHa_B_vs_A?: number;
};

export type ColheitaSideJson = {
  side: 'A' | 'B';
  sideName?: string;
  yieldKgHa?: number;
  yieldScHa?: number;
  areaHa?: number;
  [key: string]: unknown;
};

export type ColheitaJson = {
  kgPerSack?: number;
  sides?: ColheitaSideJson[];
};

export type EconomiaJson = {
  preco_saca_brl?: number;
  fonte_preco?: string;
};

export type ReportPhotoWeb = {
  caption?: string;
  /** URL pública após upload (ex.: Supabase Storage). */
  url?: string;
  /** Payload direto do DTO Flutter antes ou sem Storage (`imageBase64Jpg`). */
  imageBase64Jpg?: string;
  category?: string;
  hotspots?: Array<{
    xPct: number;
    yPct: number;
    label?: string;
    detail?: string;
    /** `antes` | `depois` — momento relativo à aplicação (app). */
    applicationMoment?: string;
  }>;
};

/** Chaves alinhadas a `ExperimentDesignV1.toJson()` + overlay de exportação (`evaluation_export_service`). */
export type ExperimentDesignJson = {
  schema_version?: number;
  delineamento?: string;
  numero_tratamentos?: number;
  numero_repeticoes?: number;
  tamanho_parcela_m2?: number;
  area_util_m2?: number;
  bordadura_metros?: number;
  croqui_attachment_uri?: string;
  data_plantio?: string;
  data_emergencia?: string;
  data_inicio_avaliacao?: string;
  latitude_centroide?: number;
  longitude_centroide?: number;
  cultivar_hibrido?: string;
  cultura_outro?: string;
  objective_codes?: string[];
  objective_notes?: string;
  property_label?: string;
  talhao_area_ha?: number;
  technician_crea?: string;
  technician_company?: string;
  evaluation_title?: string;
  evaluation_type?: string;
  culture?: string;
  season?: string;
  objective_text?: string;
  municipality_uf?: string;
  technician_name?: string;
  technician_role?: string;
  soy_maturity_group?: string;
};

export type PlantEvaluationMetricJson = {
  key?: string;
  label?: string;
  unit?: string;
  meanA?: number;
  meanB?: number;
  diffAbs?: number;
  diffPct?: number;
  winner?: 'A' | 'B' | 'tie' | string;
};

// Extensão V1: `decision_layer.fortsmart_ai` é tipado em `lib/decisionLayer.ts`
// e consumido via `SideBySideReportData.decision_layer`.

/** Avaliações sequenciais por DAA (opcional — futuro publish / retrocompatível). */
export type DaaAssessmentJson = {
  evaluation_id?: string;
  side?: 'A' | 'B';
  daa?: number;
  date?: string;
  stage?: string;
  notes?: string;
  criteria?: Array<{ key?: string; label?: string; value_a?: number; value_b?: number }>;
  medias?: Record<string, unknown>;
  scores?: Record<string, unknown>;
};
