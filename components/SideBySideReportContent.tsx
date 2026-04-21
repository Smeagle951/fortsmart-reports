'use client';

import React from 'react';
import RelatorioLadoALadoDashboard from '@/components/lado_a_lado/RelatorioLadoALadoDashboard';
import PremiumReport from '@/components/lado_a_lado/premium/PremiumReport';
import type { DecisionLayerJson } from '@/lib/decisionLayer';

export type MarketReferenceJson = {
  schemaVersion?: number;
  culture?: string;
  cultureKey?: string;
  region?: string | null;
  price_sack_brl?: number;
  kg_per_sack?: number;
  updated_at?: string;
  source?: string;
  economicEngineVersion?: number;
};

export type EconomicTimelineJson = {
  schemaVersion?: number;
  economicEngineVersion?: number;
  methodology?: string;
  sides?: Array<{
    side?: string;
    points?: Array<{
      daa?: number;
      date?: string;
      eventCostBrlHa?: number | null;
      costAccumulatedBrlHa?: number;
      applicationId?: string;
    }>;
  }>;
};

/** Linha de custo por subárea publicada pelo app (`custos[]`). */
export type SubareaCostLineWeb = {
  tipo?: string;
  descricao?: string;
  valor_por_ha?: number;
  area_ha?: number;
  valor_total?: number;
  tratamento?: string;
  subarea_nome?: string;
  subarea_id?: string;
};

/** Evolução vs visita anterior (`evolucao`). */
export type EvolucaoVisitasWeb = {
  disponivel?: boolean;
  avaliacao_anterior_id?: string;
  melhoria?: boolean;
  sanidade_delta?: number;
  vigor_delta?: number;
  dae_atual?: number;
  dae_anterior?: number;
  sanidade_media_atual?: number;
  vigor_media_atual?: number;
  sanidade_media_anterior?: number;
  vigor_media_anterior?: number;
};
import type {
  ColheitaJson,
  CustoJson,
  EconomiaJson,
  ExperimentDesignJson,
  PlantEvaluationMetricJson,
  ReportApplicationEventV2Json,
  ReportPhotoWeb,
  TreatmentProtocolJson,
} from '@/types/side-by-side-report';

export type {
  ColheitaJson,
  CustoJson,
  EconomiaJson,
  ExperimentDesignJson,
  PlantEvaluationMetricJson,
  ReportApplicationEventV2Json,
  ReportPhotoWeb,
  TreatmentProtocolJson,
} from '@/types/side-by-side-report';

export type SideBySideReportData = {
  tipo: string;
  schemaVersion?: string;
  meta?: {
    reportId?: string;
    createdAt?: string;
    appVersion?: string;
    generatedBy?: { name?: string; role?: string };
  };
  branding?: {
    title?: string;
    subtitle?: string;
    /** `premium` (padrão): narrativa executiva. `dashboard`: layout técnico completo anterior. */
    reportLayout?: 'premium' | 'dashboard';
  };
  farm?: {
    farmName?: string;
    owner?: string;
    city?: string;
    state?: string;
    culture?: string;
    season?: string;
    fieldName?: string;
    areaHa?: number;
    objective?: string;
    empresa?: string;
  };
  sideA?: SideData;
  sideB?: SideData;
  conclusion?: {
    summary?: string;
    /** Linha curta para o herói (publicado pelo app / DTO). */
    headline?: string;
    /** Manejo favorecido — só exibido se vier no JSON (`conclusion.winner`). */
    winner?: 'A' | 'B';
    recommendations?: string[];
    signature?: { name?: string; crea?: string; city?: string };
  };
  coleta?: {
    ensaioName?: string;
    dataPlantio?: string;
    dae?: number;
    dap?: number;
    estadio?: string;
    espacamento?: number;
    populacaoAlvo?: number;
    pointCount?: number;
  };
  points?: Array<{ name?: string; indexNo?: number; status?: string }>;
  phenology?: {
    sideA?: { estadio?: string; vigor?: string; uniformidade?: string; observacao?: string };
    sideB?: { estadio?: string; vigor?: string; uniformidade?: string; observacao?: string };
  };
  diagnostics?: {
    standLoss?: number;
    standImpactScHa?: number;
    recommendations?: string[];
  };
  diagnosis?: {
    problemaPrincipal?: string;
    problemasSecundarios?: string[];
    causaProvavel?: string;
    urgencia?: string;
    planoAcao?: string;
  };
  ocorrencias?: Array<{
    tipo?: string;
    nomeAlvo?: string;
    incidenciaPct?: number;
    severidade?: string;
    recomendacao?: string;
  }>;
  aplicacoes?: Array<{
    data?: string;
    tipo?: string;
    produtos?: string;
    classe?: string;
    doseResumo?: string;
  }>;
  /** Execuções V2 — chave JSON `applications` */
  applications?: ReportApplicationEventV2Json[];
  /** Protocolo planejado — chave JSON `treatment_protocol` */
  treatment_protocol?: TreatmentProtocolJson;
  resumo?: {
    statusConcluida?: boolean;
    conclusaoCurta?: string;
    numOcorrencias?: number;
    numAplicacoes?: number;
  };
  colheita?: ColheitaJson | null;
  custo?: CustoJson | null;
  economia?: EconomiaJson | null;
  products_result?: Record<string, unknown>[] | null;
  criteriosEstatistica?: Array<{
    criterio?: string;
    unidade?: string;
    mediaA?: number;
    mediaB?: number;
    dpA?: number;
    dpB?: number;
    cvPctA?: number;
    cvPctB?: number;
    diferencaIndicativa?: boolean;
    estabilidadeDpDiff?: number;
    notaRegra?: string;
  }>;
  /** Motor multifator + ROI + métricas — publicado pelo app (`decision_layer`). */
  decision_layer?: DecisionLayerJson | null;
  /** Preço/kg saca efetivos e metadados — `market_reference`. */
  market_reference?: MarketReferenceJson | null;
  /** Custo acumulado por DAA — `economic_timeline`. */
  economic_timeline?: EconomicTimelineJson | null;
  /** Custos detalhados por subárea — `custos`. */
  custos?: SubareaCostLineWeb[];
  /** Comparação com visita anterior — `evolucao`. */
  evolucao?: EvolucaoVisitasWeb;
  /** Amostras brutas por planta (exportação / arquivo) — `plant_samples`. */
  plant_samples?: Array<Record<string, unknown>>;
  /** Amostras por planta agregadas A vs B — `plant_evaluation`. */
  plant_evaluation?: {
    metrics?: PlantEvaluationMetricJson[];
    sampleSize?: { A?: number; B?: number };
    source?: string;
  } | null;
  /** Planejamento experimental — chave JSON `experiment_design` (mapa versionado no app). */
  experiment_design?: ExperimentDesignJson | null;
  /** Layout de coleta (`paired_points` | `parcel_per_treatment` | …) — pode vir na raiz do export. */
  collection_layout?: string | null;
  /**
   * Módulos de coleta em campo por ponto/lado — chave JSON `field_collection_modules` (schema V1 do app).
   */
  field_collection_modules?: {
    schema_version?: number;
    module_labels?: Record<string, string>;
    points?: Array<{
      point_id?: string;
      index?: number;
      status?: string;
      sides?: Record<string, Record<string, unknown>>;
    }>;
  } | null;
  /** Texto do agrônomo para o comparativo A/B (opcional, preenchido no app). */
  comparativo_intro?: string | null;
};

type SideData = {
  label?: string;
  name?: string;
  code?: string;
  kpis?: {
    avgHeightCm?: number;
    leafCount?: number;
    finalPopulationPlHa?: number;
    estimatedYieldKgHa?: number;
    rootRating?: { label?: string; score?: number; max?: number };
    vigorRating?: { label?: string; score?: number; max?: number };
    profundidadeRaizCm?: number;
    pesoRaizG?: number;
    estandeEfetivo?: number;
    eficienciaPct?: number;
    /** Controle de daninhas (%), quando enviado explicitamente pelo app/mapper. */
    controleDaninhasPct?: number;
    /** Vigor da cultura em % (0–100), quando enviado explicitamente (alternativa a vigorRating). */
    vigorCulturaPct?: number;
    /** Fitotoxidez em escala (ex.: 0–10), quando enviado pelo app/mapper. */
    fitotoxidez?: { score?: number; max?: number };
    coberturaAplicacaoPct?: number;
    rebrotaPct?: number;
    /** 0–100, calculado no app a partir dos KPIs coletados (DTO `performanceScore`). */
    performanceScore?: number;
  };
  soilCompaction?: string;
  observations?: string[];
  photos?: ReportPhotoWeb[];
};

interface SideBySideReportContentProps {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
}

export default function SideBySideReportContent({ data, reportId, shareToken }: SideBySideReportContentProps) {
  if (data.branding?.reportLayout === 'dashboard') {
    return <RelatorioLadoALadoDashboard data={data} reportId={reportId} shareToken={shareToken} />;
  }
  return <PremiumReport data={data} reportId={reportId} shareToken={shareToken} />;
}
