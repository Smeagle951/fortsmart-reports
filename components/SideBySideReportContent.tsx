'use client';

import React from 'react';
import RelatorioLadoALadoDashboard from '@/components/lado_a_lado/RelatorioLadoALadoDashboard';
import type {
  ColheitaJson,
  CustoJson,
  EconomiaJson,
  ReportApplicationEventV2Json,
  ReportPhotoWeb,
  TreatmentProtocolJson,
} from '@/types/side-by-side-report';

export type {
  ColheitaJson,
  CustoJson,
  EconomiaJson,
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
  branding?: { title?: string; subtitle?: string };
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
  return <RelatorioLadoALadoDashboard data={data} reportId={reportId} shareToken={shareToken} />;
}
