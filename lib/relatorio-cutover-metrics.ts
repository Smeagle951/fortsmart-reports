/**
 * Contadores in-process: disponibilidade (leitura), consistência (audit), cutover por tipo.
 */

import { logMigration } from '@/lib/migration-observability';
import { getPostgresCircuitDebugSnapshot } from '@/lib/postgres-circuit-breaker';

let totalRequests = 0;
let postgresHits = 0;
let supabaseHits = 0;
let circuitSkips = 0;

let auditTotal = 0;
let auditOk = 0;

const perTipo = new Map<string, { total: number; pg: number }>();

const MIN_SAMPLE = 50;
const CUTOVER_RATE = 0.95;
const MIN_AUDIT_SAMPLE = 30;
const CONSISTENCY_TARGET = 0.99;
const LOG_EVERY = 200;
const MIN_PER_TIPO_SAMPLE = 20;
const PER_TIPO_TARGET = 0.95;

function maybeLogProgress(): void {
  if (totalRequests === 0 || totalRequests % LOG_EVERY !== 0) return;
  logMigration({
    event: 'cutover_metrics',
    ...getRelatorioReadCutoverSnapshot(),
  });
}

export function recordRelatorioReadHybrid(p: {
  origem: 'postgres' | 'supabase' | 'none';
  circuitSkipped: boolean;
  /** Para `per_tipo` — extraído de `dados.tipo` quando disponível. */
  tipoKey?: string;
}): void {
  totalRequests += 1;
  if (p.circuitSkipped) circuitSkips += 1;
  if (p.origem === 'postgres') postgresHits += 1;
  if (p.origem === 'supabase') supabaseHits += 1;

  const tk = p.tipoKey ?? 'unknown';
  let e = perTipo.get(tk);
  if (!e) {
    e = { total: 0, pg: 0 };
    perTipo.set(tk, e);
  }
  e.total += 1;
  if (p.origem === 'postgres') e.pg += 1;

  maybeLogProgress();
}

export function recordRelatorioAuditCompare(match: 'ok' | 'dados_diverge' | 'schema_diverge' | 'other'): void {
  auditTotal += 1;
  if (match === 'ok') auditOk += 1;
}

export function getRelatorioReadCutoverSnapshot(): {
  total_requests: number;
  postgres_hits: number;
  supabase_hits: number;
  circuit_skips: number;
  postgres_success_rate: number;
  audit_total: number;
  audit_ok: number;
  /** `audit_ok / audit_total` ou `null` se sem amostras de audit. */
  compare_success_rate: number | null;
  /** Heurística global (não substitui análise operacional). */
  cutover_ready_candidate: boolean;
  /** Disponibilidade global ok E consistência ok (quando há audits suficientes). */
  cutover_ready_strict: boolean;
  /** Por `tipo` de relatório (evita cutover global quando um tipo ainda falha). */
  cutover_by_tipo: Record<
    string,
    { sample: number; postgres_success_rate: number; cutover_ready_candidate: boolean }
  >;
  circuit: ReturnType<typeof getPostgresCircuitDebugSnapshot>;
} {
  const pgRate = totalRequests > 0 ? postgresHits / totalRequests : 0;
  const compareRate = auditTotal > 0 ? auditOk / auditTotal : null;

  const availabilityOk = totalRequests >= MIN_SAMPLE && pgRate >= CUTOVER_RATE;
  const consistencyOk =
    auditTotal >= MIN_AUDIT_SAMPLE && compareRate != null && compareRate >= CONSISTENCY_TARGET;
  const consistencyUnknown = auditTotal < MIN_AUDIT_SAMPLE;

  const cutover_by_tipo: Record<
    string,
    { sample: number; postgres_success_rate: number; cutover_ready_candidate: boolean }
  > = {};
  for (const [k, v] of perTipo) {
    const r = v.total > 0 ? v.pg / v.total : 0;
    cutover_by_tipo[k] = {
      sample: v.total,
      postgres_success_rate: r,
      cutover_ready_candidate: v.total >= MIN_PER_TIPO_SAMPLE && r >= PER_TIPO_TARGET,
    };
  }

  let allTypesReady = true;
  for (const v of Object.values(cutover_by_tipo)) {
    if (v.sample >= MIN_PER_TIPO_SAMPLE && !v.cutover_ready_candidate) {
      allTypesReady = false;
      break;
    }
  }

  return {
    total_requests: totalRequests,
    postgres_hits: postgresHits,
    supabase_hits: supabaseHits,
    circuit_skips: circuitSkips,
    postgres_success_rate: pgRate,
    audit_total: auditTotal,
    audit_ok: auditOk,
    compare_success_rate: compareRate,
    cutover_ready_candidate: availabilityOk && (consistencyUnknown ? true : consistencyOk) && allTypesReady,
    cutover_ready_strict: availabilityOk && !consistencyUnknown && consistencyOk && allTypesReady,
    cutover_by_tipo,
    circuit: getPostgresCircuitDebugSnapshot(),
  };
}

export function getCutoverHeuristics(): {
  min_sample: number;
  target_rate: number;
  min_audit: number;
  consistency_target: number;
} {
  return {
    min_sample: MIN_SAMPLE,
    target_rate: CUTOVER_RATE,
    min_audit: MIN_AUDIT_SAMPLE,
    consistency_target: CONSISTENCY_TARGET,
  };
}
