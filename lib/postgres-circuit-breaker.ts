/**
 * Circuit breaker in-process: closed → open → **half-open (1 probe)** → closed.
 * Backoff progressivo: base × 2^failureStreak (com teto) após falhas 5xx / transporte.
 * Serverless: uma instância = um estado; requisições concorrentes na half-open:
 * a primeira inicia o probe, as outras aguardam (skip) até o notify.
 */

type CircuitState = 'closed' | 'open' | 'half_open';

let state: CircuitState = 'closed';
let openUntil = 0;
let failureStreak = 0;
/** Na half-open, true = há um `fetch` em curso (bloqueia outros até `notify*`). */
let halfOpenProbeInFlight = false;

function getBaseWindowMs(): number {
  const raw = process.env.FORTSMART_POSTGRES_CIRCUIT_OPEN_MS;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 1_000 && n <= 300_000) return Math.floor(n);
  return 10_000;
}

function getMaxBackoffMs(): number {
  const raw = process.env.FORTSMART_POSTGRES_CIRCUIT_MAX_BACKOFF_MS;
  const n = raw != null && raw !== '' ? Number(raw) : NaN;
  if (Number.isFinite(n) && n >= 5_000 && n <= 600_000) return Math.floor(n);
  return 120_000;
}

function nextOpenDurationMs(): number {
  const base = getBaseWindowMs();
  const e = Math.min(failureStreak, 10);
  return Math.min(base * Math.pow(2, e), getMaxBackoffMs());
}

/**
 * @returns `allow: false` — não chamar a API (circuito aberto e probe outro em voo, ou janela open ativa).
 * @returns `isHalfOpenProbe: true` — único pedido de teste após a janela; deve passar a `tryLoad` → `notify*`.
 */
export function evaluatePostgresFetch(): { allow: boolean; isHalfOpenProbe: boolean } {
  const now = Date.now();
  if (state === 'closed') {
    return { allow: true, isHalfOpenProbe: false };
  }
  if (state === 'open') {
    if (now < openUntil) {
      return { allow: false, isHalfOpenProbe: false };
    }
    state = 'half_open';
  }
  if (state === 'half_open') {
    if (halfOpenProbeInFlight) {
      return { allow: false, isHalfOpenProbe: false };
    }
    halfOpenProbeInFlight = true;
    return { allow: true, isHalfOpenProbe: true };
  }
  return { allow: true, isHalfOpenProbe: false };
}

function finishHalfOpenProbe(_success: boolean): void {
  halfOpenProbeInFlight = false;
}

/** Resposta HTTP recebida (incl. 4xx = backend acessível). */
export function notifyPostgresHttpResult(status: number, meta: { isHalfOpenProbe: boolean }): void {
  const probe = meta.isHalfOpenProbe;
  if (probe) {
    finishHalfOpenProbe(status < 500);
  }
  if (status < 500) {
    state = 'closed';
    openUntil = 0;
    failureStreak = 0;
    return;
  }
  failureStreak += 1;
  state = 'open';
  openUntil = Date.now() + nextOpenDurationMs();
}

/** Timeout, DNS, ECONNREFUSED, etc. */
export function notifyPostgresTransportFailure(meta: { isHalfOpenProbe: boolean }): void {
  if (meta.isHalfOpenProbe) {
    finishHalfOpenProbe(false);
  }
  failureStreak += 1;
  state = 'open';
  openUntil = Date.now() + nextOpenDurationMs();
}

/** Debug / com `with_cutover=1`. */
export function getPostgresCircuitDebugSnapshot(): {
  state: CircuitState;
  open_until_ms: number;
  failure_streak: number;
  half_open_probe_in_flight: boolean;
} {
  return {
    state,
    open_until_ms: openUntil,
    failure_streak: failureStreak,
    half_open_probe_in_flight: halfOpenProbeInFlight,
  };
}
