/**
 * Migração controlada: GET relatório por token — Postgre (API Node) primeiro, fallback Supabase.
 * Half-open + backoff, micro-cache de not_found, audit com schema + dados, cutover por tipo.
 */

import { resolveFortsmartApiBase } from '@/lib/fortsmart-api-base';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { logMigration, makeTokenPrefix } from '@/lib/migration-observability';
import {
  evaluatePostgresFetch,
  notifyPostgresHttpResult,
  notifyPostgresTransportFailure,
} from '@/lib/postgres-circuit-breaker';
import { recordRelatorioReadHybrid, recordRelatorioAuditCompare } from '@/lib/relatorio-cutover-metrics';
import { peekTokenNotFoundCached, setTokenNotFoundCached } from '@/lib/relatorio-not-found-cache';
import { stringifyRelatorioDataForCompare } from '@/lib/normalize-relatorio-data';
import { relatorioSchemaHash } from '@/lib/relatorio-schema-hash';
import { extractRelatorioTipoKey, extractRelatorioVersionKey } from '@/lib/relatorio-tipo';
import {
  getRelatorioByShareToken,
  tokenLooksLikeRowIdUuid,
  type RelatorioRow,
} from '@/lib/supabase';

export type RelatorioDataOrigem = 'postgres' | 'supabase';

export type PostgresFailureClass =
  | 'timeout'
  | 'connection_refused'
  | 'dns_error'
  | 'http_5xx'
  | 'http_4xx'
  | 'invalid_payload';

export type RelatorioByTokenContract = {
  id: string;
  share_token: string;
  dados: Record<string, unknown>;
  created_at: string;
  origem: RelatorioDataOrigem;
};

export type SupabaseAccessMode = 'admin' | 'anon';

export type GetRelatorioByTokenHybridOk = {
  ok: true;
  row: RelatorioRow;
  origem: RelatorioDataOrigem;
  supabaseMode: SupabaseAccessMode | null;
  postgresHttpStatus: number | null;
  postgresError?: string;
  circuitSkipped?: boolean;
  negativeCacheHit?: boolean;
};

export type GetRelatorioByTokenHybridErr = {
  ok: false;
  reason: 'not_found' | 'postgres_forbidden' | 'invalid_token';
  postgresHttpStatus: number | null;
  postgresError?: string;
  postgresFailureClass?: PostgresFailureClass;
  circuitSkipped?: boolean;
  /** Hit no micro-cache de `not_found` (não bateu em Postgres/Supabase neste request). */
  negativeCacheHit?: boolean;
};

export type GetRelatorioByTokenHybridResult = GetRelatorioByTokenHybridOk | GetRelatorioByTokenHybridErr;

function parsePayload(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

function normalizeRowDadosFields(r: RelatorioRow & { json_data?: unknown; dados_json?: unknown }): RelatorioRow {
  const raw = r.dados ?? r.json_data ?? r.dados_json;
  if (!r.dados && raw != null) {
    const parsed = parsePayload(raw);
    if (parsed) r.dados = parsed;
  }
  return r;
}

function mapPostgresApiBodyToRow(data: Record<string, unknown>): RelatorioRow | null {
  const id = String(data.id ?? '');
  if (!id) return null;
  const ext = data as { json_data?: unknown; dados_json?: unknown };
  let dados: unknown = data.dados;
  if (dados == null || typeof dados !== 'object' || Array.isArray(dados)) {
    const p = parsePayload(dados ?? ext.json_data ?? ext.dados_json);
    if (!p) return null;
    dados = p;
  }
  return normalizeRowDadosFields({
    id,
    owner_firebase_uid: String(data.owner_firebase_uid ?? ''),
    app_id: data.app_id != null ? String(data.app_id) : undefined,
    device_id: data.device_id as string | null | undefined,
    share_token: data.share_token != null ? String(data.share_token) : undefined,
    is_public: data.is_public !== false,
    share_expires_at: (data.share_expires_at as string) ?? null,
    titulo: data.titulo != null ? String(data.titulo) : null,
    dados: dados as Record<string, unknown>,
    json_data: ext.json_data as Record<string, unknown> | undefined,
    created_at: data.created_at as string | undefined,
    updated_at: data.updated_at as string | undefined,
  });
}

function getPostgresFetchTimeoutMs(): number {
  const raw = process.env.FORTSMART_POSTGRES_FETCH_TIMEOUT_MS;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 500 && n <= 120_000) return Math.floor(n);
  return 8000;
}

function classifyFetchException(e: unknown): { status: number; error: string; failureClass: PostgresFailureClass } {
  const msg = e instanceof Error ? e.message : String(e);
  const name = e instanceof Error ? e.name : '';
  const s = (msg + ' ' + name).toLowerCase();
  if (e instanceof Error && (e.name === 'AbortError' || /aborted|timeout/i.test(msg))) {
    return { status: 504, error: msg || 'timeout', failureClass: 'timeout' };
  }
  if (s.includes('econnrefused') || s.includes('connection refused') || s.includes('connect econnrefused')) {
    return { status: 503, error: msg, failureClass: 'connection_refused' };
  }
  if (s.includes('enotfound') || s.includes('getaddrinfo') || s.includes('name not resolved') || s.includes('eai_again')) {
    return { status: 503, error: msg, failureClass: 'dns_error' };
  }
  if (s.includes('etimedout') || s.includes('timed out') || s.includes('socket')) {
    return { status: 504, error: msg, failureClass: 'timeout' };
  }
  return { status: 503, error: msg, failureClass: 'connection_refused' };
}

function classForHttpError(status: number, bodyErr: string): PostgresFailureClass {
  if (status === 400 || (status >= 401 && status <= 499)) {
    if (bodyErr === 'invalid_api_payload' || bodyErr === 'map_row_failed') return 'invalid_payload';
    return 'http_4xx';
  }
  if (status >= 500) return 'http_5xx';
  return 'http_4xx';
}

function shouldRunAuditSample(): boolean {
  if (process.env.FORTSMART_RELATORIO_AUDIT_COMPARE !== '1') return false;
  const raw = process.env.FORTSMART_RELATORIO_AUDIT_SAMPLE_RATE;
  const n = raw != null && raw !== '' ? Number(raw) : 0.1;
  const rate = Number.isFinite(n) && n > 0 && n <= 1 ? n : 0.1;
  return Math.random() < rate;
}

function schedulePostgresVsSupabaseAudit(token: string, postgresRow: RelatorioRow): void {
  if (!shouldRunAuditSample()) return;
  const prefix = makeTokenPrefix(token);
  void (async () => {
    try {
      const { row: legacy, via } = await loadRelatorioFromSupabaseLegacy(token);
      if (!legacy) {
        recordRelatorioAuditCompare('other');
        logMigration({
          event: 'audit_compare',
          token_prefix: prefix,
          origem: 'postgres',
          audit: { match: 'supabase_missing' },
        });
        return;
      }
      if (postgresRow.id !== legacy.id) {
        recordRelatorioAuditCompare('other');
        logMigration({
          event: 'audit_compare',
          token_prefix: prefix,
          origem: 'postgres',
          audit: {
            match: 'id_diverge',
            detail: `postgres_id=${postgresRow.id} supabase_id=${legacy.id}`,
          },
        });
        return;
      }
      const hPg = relatorioSchemaHash(postgresRow.dados);
      const hSb = relatorioSchemaHash(legacy.dados);
      if (hPg !== hSb) {
        recordRelatorioAuditCompare('schema_diverge');
        logMigration({
          event: 'audit_compare',
          token_prefix: prefix,
          origem: 'postgres',
          supabase_mode: via,
          audit: {
            match: 'schema_diverge',
            detail: `schema_pg=${hPg} schema_sb=${hSb} tipo=${extractRelatorioTipoKey(postgresRow.dados)} v=${extractRelatorioVersionKey(postgresRow.dados)}`,
          },
        });
        return;
      }
      const a = stringifyRelatorioDataForCompare(postgresRow.dados);
      const b = stringifyRelatorioDataForCompare(legacy.dados);
      if (a !== b) {
        recordRelatorioAuditCompare('dados_diverge');
        logMigration({
          event: 'audit_compare',
          token_prefix: prefix,
          origem: 'postgres',
          supabase_mode: via,
          audit: { match: 'dados_diverge' },
        });
        return;
      }
      recordRelatorioAuditCompare('ok');
      logMigration({
        event: 'audit_compare',
        token_prefix: prefix,
        origem: 'postgres',
        supabase_mode: via,
        audit: { match: 'ok' },
      });
    } catch (e) {
      recordRelatorioAuditCompare('other');
      const m = e instanceof Error ? e.message : String(e);
      logMigration({
        event: 'audit_compare',
        token_prefix: prefix,
        audit: { match: 'compare_error', detail: m },
      });
    }
  })();
}

async function tryLoadFromPostgresApi(
  token: string,
  isHalfOpenProbe: boolean,
): Promise<{
  row: RelatorioRow | null;
  status: number;
  error?: string;
  failureClass?: PostgresFailureClass;
}> {
  const meta = { isHalfOpenProbe };
  const base = resolveFortsmartApiBase();
  const url = `${base}/relatorios/${encodeURIComponent(token.trim())}`;
  const ms = getPostgresFetchTimeoutMs();
  let signal: AbortSignal;
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    signal = AbortSignal.timeout(ms);
  } else {
    const c = new AbortController();
    setTimeout(() => c.abort(), ms);
    signal = c.signal;
  }
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal,
      cache: 'no-store',
    });
    const status = res.status;
    let body: unknown = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      notifyPostgresHttpResult(status, meta);
      const err =
        body && typeof body === 'object' && 'error' in body
          ? String((body as { error?: unknown }).error ?? res.statusText)
          : res.statusText;
      return { row: null, status, error: err, failureClass: classForHttpError(status, err) };
    }
    const obj = body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
    if (!obj || obj.ok !== true || obj.data == null || typeof obj.data !== 'object') {
      notifyPostgresHttpResult(200, meta);
      return { row: null, status: 200, error: 'invalid_api_payload', failureClass: 'invalid_payload' };
    }
    const row = mapPostgresApiBodyToRow(obj.data as Record<string, unknown>);
    if (!row) {
      notifyPostgresHttpResult(200, meta);
      return { row: null, status: 200, error: 'map_row_failed', failureClass: 'invalid_payload' };
    }
    if (row.is_public === false) {
      notifyPostgresHttpResult(200, meta);
      return { row: null, status: 403, error: 'not_public', failureClass: 'http_4xx' };
    }
    if (row.share_expires_at && new Date(row.share_expires_at) < new Date()) {
      notifyPostgresHttpResult(200, meta);
      return { row: null, status: 403, error: 'share_expired', failureClass: 'http_4xx' };
    }
    notifyPostgresHttpResult(200, meta);
    return { row, status: 200 };
  } catch (e) {
    notifyPostgresTransportFailure(meta);
    const c = classifyFetchException(e);
    return { row: null, status: c.status, error: c.error, failureClass: c.failureClass };
  }
}

async function loadRelatorioFromSupabaseLegacy(
  token: string,
): Promise<{ row: RelatorioRow | null; via: SupabaseAccessMode | null }> {
  let row: RelatorioRow | null = null;
  let via: SupabaseAccessMode | null = null;
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      try {
        const t = token.trim();
        let { data, error } = await supabaseAdmin
          .from('relatorios')
          .select('*')
          .eq('share_token', t)
          .maybeSingle();
        if (!data && !error && tokenLooksLikeRowIdUuid(t)) {
          const byId = await supabaseAdmin.from('relatorios').select('*').eq('id', t).maybeSingle();
          data = byId.data;
          error = byId.error;
          if (data) {
            console.log(
              '[fortsmart-reports] getRelatorioByTokenHybrid supabase admin: resolvido por id (compat); prefira share_token na URL',
            );
          }
        }
        if (error) {
          console.warn('[fortsmart-reports] getRelatorioByTokenHybrid supabase admin error:', error.message);
        } else if (data) {
          if (data.is_public !== false && (!data.share_expires_at || new Date(data.share_expires_at) >= new Date())) {
            const r = data as RelatorioRow & { json_data?: unknown; dados_json?: unknown };
            row = normalizeRowDadosFields(r);
            via = 'admin';
          } else {
            console.warn(
              '[fortsmart-reports] getRelatorioByTokenHybrid supabase: registro ignorado is_public / expiração',
              data.is_public,
              data.share_expires_at,
            );
          }
        }
      } catch (queryErr: unknown) {
        const m = queryErr instanceof Error ? queryErr.message : String(queryErr);
        console.error('[fortsmart-reports] getRelatorioByTokenHybrid supabase admin query falhou:', m);
      }
    } else {
      console.warn('[fortsmart-reports] getRelatorioByTokenHybrid supabaseAdmin null (SERVICE_ROLE / URL?)');
    }

    if (!row) {
      row = await getRelatorioByShareToken(token);
      if (row) via = 'anon';
      console.log(
        '[fortsmart-reports] getRelatorioByTokenHybrid fallback anon:',
        row ? 'encontrado' : 'não encontrado',
      );
    }
  } catch (fallbackErr: unknown) {
    const m = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
    console.error('[fortsmart-reports] getRelatorioByTokenHybrid getRelatorioByShareToken falhou:', m);
  }
  return { row, via };
}

export async function getRelatorioByTokenHybrid(token: string): Promise<GetRelatorioByTokenHybridResult> {
  const raw = String(token ?? '').trim();
  if (!raw) {
    return { ok: false, reason: 'invalid_token', postgresHttpStatus: null };
  }

  if (peekTokenNotFoundCached(raw)) {
    const snap = { origem: 'none' as const, circuitSkipped: false, tipoKey: 'unknown' as const };
    recordRelatorioReadHybrid(snap);
    logMigration({
      event: 'hybrid_load',
      token_prefix: makeTokenPrefix(raw),
      origem: 'none',
      negative_cache_hit: true,
    });
    return {
      ok: false,
      reason: 'not_found',
      postgresHttpStatus: null,
      postgresError: 'negative_not_found_cache',
      negativeCacheHit: true,
    };
  }

  const postgresFirst = process.env.FORTSMART_RELATORIO_POSTGRES_FIRST !== '0';
  let postgresHttpStatus: number | null = null;
  let postgresError: string | undefined;
  let postgresFailureClass: PostgresFailureClass | undefined;
  let attemptedPostgres = false;
  let fallbackFromPostgres = false;
  let circuitSkipped = false;
  const tipoFrom = (r: RelatorioRow) => extractRelatorioTipoKey(r.dados);

  if (postgresFirst) {
    const cfe = evaluatePostgresFetch();
    if (!cfe.allow) {
      circuitSkipped = true;
      attemptedPostgres = false;
      fallbackFromPostgres = true;
      postgresError = 'circuit_open';
      logMigration({
        event: 'hybrid_load',
        token_prefix: makeTokenPrefix(raw),
        origem: 'none',
        circuit_open: true,
        postgres_error: 'circuit_open',
      });
    } else {
      attemptedPostgres = true;
      const pg = await tryLoadFromPostgresApi(raw, cfe.isHalfOpenProbe);
      postgresHttpStatus = pg.status;
      postgresError = pg.error;
      postgresFailureClass = pg.failureClass;
      if (pg.row) {
        schedulePostgresVsSupabaseAudit(raw, pg.row);
        const tk = tipoFrom(pg.row);
        logMigration({
          event: 'hybrid_load',
          token_prefix: makeTokenPrefix(raw),
          origem: 'postgres',
          fallback_from_postgres: false,
          postgres_http_status: postgresHttpStatus,
          tipo_key: tk,
        });
        recordRelatorioReadHybrid({ origem: 'postgres', circuitSkipped: false, tipoKey: tk });
        return {
          ok: true,
          row: pg.row,
          origem: 'postgres',
          supabaseMode: null,
          postgresHttpStatus,
          circuitSkipped: false,
        };
      }
      if (pg.status === 403) {
        recordRelatorioReadHybrid({ origem: 'none', circuitSkipped: false, tipoKey: 'unknown' });
        logMigration({
          event: 'hybrid_load',
          token_prefix: makeTokenPrefix(raw),
          origem: 'none',
          fallback_from_postgres: false,
          postgres_http_status: postgresHttpStatus,
          postgres_error: postgresError ?? null,
          postgres_failure_class: 'http_4xx',
        });
        return {
          ok: false,
          reason: 'postgres_forbidden',
          postgresHttpStatus,
          postgresError,
          postgresFailureClass: 'http_4xx',
          circuitSkipped: false,
        };
      }
      fallbackFromPostgres = true;
    }
  }

  const { row, via } = await loadRelatorioFromSupabaseLegacy(raw);
  if (!row) {
    setTokenNotFoundCached(raw);
    const snap = { origem: 'none' as const, circuitSkipped, tipoKey: 'unknown' as const };
    recordRelatorioReadHybrid(snap);
    logMigration({
      event: 'hybrid_load',
      token_prefix: makeTokenPrefix(raw),
      origem: 'none',
      fallback_from_postgres: attemptedPostgres && fallbackFromPostgres,
      circuit_open: circuitSkipped,
      postgres_http_status: postgresHttpStatus,
      postgres_error: postgresError ?? null,
      postgres_failure_class: postgresFailureClass ?? null,
    });
    return {
      ok: false,
      reason: 'not_found',
      postgresHttpStatus,
      postgresError,
      postgresFailureClass,
      circuitSkipped,
    };
  }

  const tk = tipoFrom(row);
  recordRelatorioReadHybrid({ origem: 'supabase', circuitSkipped, tipoKey: tk });
  logMigration({
    event: 'hybrid_load',
    token_prefix: makeTokenPrefix(raw),
    origem: 'supabase',
    fallback_from_postgres: attemptedPostgres && fallbackFromPostgres,
    circuit_open: circuitSkipped,
    postgres_http_status: postgresHttpStatus,
    postgres_error: postgresError ?? null,
    postgres_failure_class: postgresFailureClass ?? null,
    supabase_mode: via,
    tipo_key: tk,
    schema_version_key: extractRelatorioVersionKey(row.dados),
  });
  return {
    ok: true,
    row,
    origem: 'supabase',
    supabaseMode: via,
    postgresHttpStatus,
    postgresError,
    circuitSkipped,
  };
}

export function toRelatorioByTokenContract(
  row: RelatorioRow,
  origem: RelatorioDataOrigem,
): RelatorioByTokenContract | null {
  const dados = row.dados;
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return null;
  const id = String(row.id ?? '');
  const st = String(row.share_token ?? '');
  if (!id || !st) return null;
  const created = row.created_at ?? new Date(0).toISOString();
  return {
    id,
    share_token: st,
    dados,
    created_at: created,
    origem,
  };
}

export { getRelatorioReadCutoverSnapshot, getCutoverHeuristics } from '@/lib/relatorio-cutover-metrics';
