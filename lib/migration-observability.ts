/**
 * Telemetria unificada da migração Supabase → Postgres (leitura híbrida, auditoria, cutover).
 * Server-only; nunca enviar PII (apenas prefixo de token).
 */

export type MigrationLogPayload = {
  event: string;
  /** Prefixo do share_token (ex.: 8 chars + …) */
  token_prefix?: string;
  origem?: 'postgres' | 'supabase' | 'none';
  /** Indica se houve intento de Postgres e fallback ao Supabase */
  fallback_from_postgres?: boolean;
  postgres_http_status?: number | null;
  postgres_error?: string | null;
  postgres_failure_class?:
    | 'timeout'
    | 'connection_refused'
    | 'dns_error'
    | 'http_5xx'
    | 'http_4xx'
    | 'invalid_payload'
    | null;
  /** Circuit breaker: não chamou a API (backoff ativo). */
  circuit_open?: boolean;
  supabase_mode?: 'admin' | 'anon' | null;
  /** Auditoria: comparativo Postgres vs Supabase (modo FORTSMART_RELATORIO_AUDIT_COMPARE) */
  audit?: {
    match: 'ok' | 'dados_diverge' | 'schema_diverge' | 'id_diverge' | 'supabase_missing' | 'compare_error';
    detail?: string;
  };
  /** Micro-cache: último resultado foi `not_found` para este token. */
  negative_cache_hit?: boolean;
  tipo_key?: string;
  schema_version_key?: string;
  [k: string]: unknown;
};

/**
 * Estrutura fixa no stdout para agregação futura (Datadog, etc.).
 */
export function logMigration(payload: MigrationLogPayload): void {
  console.info('[fortsmart-reports][migracao]', payload);
}

export function makeTokenPrefix(token: string): string {
  const t = String(token ?? '').trim();
  if (t.length <= 8) return t + '…';
  return t.slice(0, 8) + '…';
}
