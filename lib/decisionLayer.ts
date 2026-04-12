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
