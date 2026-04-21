export type DecisionSide = 'A' | 'B';

export type DecisionLayerMetric = {
  key?: string;
  label?: string;
  unit?: string;
  higherIsBetter?: boolean;
  valueA?: number;
  valueB?: number;
  winner?: DecisionSide | 'tie';
  absDiff?: number;
  relativeDiffPct?: number;
};

export type DecisionLayerDataQuality = {
  hasRealHarvest?: boolean;
  usedEstimatedYield?: boolean;
  missingCostData?: boolean;
};

export type RoiSideSnapshot = {
  yieldKgHa?: number;
  yieldSource?: 'harvest' | 'estimated';
  costBrlHa?: number;
  costPerHa?: number;
  costSource?: string;
  revenueBrlHa?: number;
  marginBrlHa?: number;
  roiPct?: number;
};

/** Resumo económico opcional espelhado pelo motor FortSmart (derivado de `roiBySide`). */
export type FortsmartAiEconomicSideBlock = {
  cost?: number;
  margin?: number;
  roiPct?: number;
};

export type FortsmartAiConfidence = {
  score?: number;
  label?: string;
};

export type DecisionLayerJson = {
  schemaVersion?: number;
  economicEngineVersion?: number;
  engineOverallWinner?: DecisionSide | 'tie' | null;
  engineRoiWinner?: DecisionSide | 'tie' | null;
  deltaMarginBrlHa?: number | null;
  metrics?: DecisionLayerMetric[];
  dataQuality?: DecisionLayerDataQuality;
  summaryLines?: string[];
  decisionReasons?: string[];
  weights?: Record<string, number>;
  roiBySide?: Record<string, RoiSideSnapshot>;

  /** FortSmart AI (V1): score/alertas calculados no app, offline. */
  fortsmart_ai?: {
    kb_snapshot?: {
      cultura?: string;
      versao?: string;
      safra?: string;
      fontes?: string[];
      generated_at?: string;
    };
    inputs?: Record<string, unknown>;
    score?: {
      total?: number; // 0–100
      class?: string; // Excelente|Bom|Regular|Ruim|Crítico
    };
    subscores?: Record<string, number>;
    motor_alertas?: Array<{
      id?: string; // ALERTA_D01...
      nivel?: 'info' | 'ok' | 'monitorar' | 'atencao' | 'critico';
      titulo?: string;
      mensagem?: string;
      acao_sugerida?: string[];
      evidencias?: Record<string, unknown>;
    }>;
    /** Linhas de texto explicativas (subscores baixos, fatores de risco da KB, etc.). */
    explanations?: string[];
    /** Confiança agregada 0–1 + rótulo qualitativo. */
    confidence?: FortsmartAiConfidence;
    /** Snapshot só leitura alinhado ao `decision_layer.roiBySide` quando existir. */
    economic?: {
      sides?: Record<string, FortsmartAiEconomicSideBlock>;
    };
    /** Motor quantitativo V2 (curvas, produtividade, interações, regionalização). */
    fortsmart_ai_v2?: {
      kb_v2_loaded?: boolean;
      numeric_model?: {
        culture?: string;
        yield_estimate?: number;
        yield_target?: number;
        yield_gap?: number;
        soil_score?: number;
        nutrition_score?: number;
        climate_score?: number;
        final_score?: number;
        interaction_factor?: number;
        limiting_factors?: string[];
        region?: string | null;
        lime_t_ha?: number;
        recommendations?: string[];
        economic?: {
          revenue?: number;
          roi?: number;
          viable?: boolean;
          cost_brl_ha?: number;
        };
      } | null;
    };
    referencias_usadas?: Array<Record<string, unknown>>;
  };
};

/** Subconjunto do payload do relatório — evita import circular com SideBySideReportContent. */
export type DecisionReportPayload = {
  conclusion?: { winner?: 'A' | 'B' };
  decision_layer?: DecisionLayerJson | null;
};

/**
 * Conflito e alinhamento são sempre derivados no cliente — não usar flags do backend.
 */
export function resolveDecision(data: DecisionReportPayload): {
  final: DecisionSide | 'tie';
  app: DecisionSide | null;
  engine: DecisionSide | 'tie' | null;
  conflict: boolean;
  aligned: boolean;
} {
  const appRaw = data.conclusion?.winner;
  const app: DecisionSide | null = appRaw === 'A' || appRaw === 'B' ? appRaw : null;

  const eng = data.decision_layer?.engineOverallWinner;
  const engine: DecisionSide | 'tie' | null =
    eng === 'A' || eng === 'B' || eng === 'tie' ? eng : null;

  const conflict = Boolean(app && engine && engine !== 'tie' && app !== engine);
  const aligned = !conflict;

  let final: DecisionSide | 'tie' = 'tie';
  if (app) final = app;
  else if (engine && engine !== 'tie') final = engine;

  return { final, app, engine, conflict, aligned };
}

export function formatMetricDeltaLine(
  m: DecisionLayerMetric,
  nameA: string,
  nameB: string,
): string | null {
  const w = m.winner;
  if (w !== 'A' && w !== 'B') return null;
  const label = m.label?.trim() || m.key || 'Indicador';
  const winnerName = w === 'A' ? nameA : nameB;
  const pct = m.relativeDiffPct;
  const abs = m.absDiff;
  const unit = m.unit?.trim() || '';
  if (pct != null && Number.isFinite(pct) && Math.abs(pct) >= 0.05) {
    return `${winnerName} melhor em ${label.toLowerCase()} (${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%)`;
  }
  if (abs != null && Number.isFinite(abs)) {
    const u = unit ? ` ${unit}` : '';
    return `${winnerName} melhor em ${label.toLowerCase()} (${abs >= 0 ? '+' : ''}${abs.toFixed(abs >= 10 ? 0 : 1)}${u})`;
  }
  return `${winnerName} melhor em ${label.toLowerCase()}`;
}
