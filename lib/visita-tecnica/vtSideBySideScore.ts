/**
 * Score derivado para o relatório side-by-side (Fase A).
 * Se existir `conclusao_metricas` no payload (Fase B), o viewer deve preferir esse valor.
 */

export type VtScoreInput = {
  snapshot?: Record<string, unknown> | null;
  diagnostico?: Record<string, unknown> | null;
  /** visita_snapshot.evolucao.comparativo ou equivalente */
  comparativoMelhora?: boolean | null;
  /** Último delta de produtividade da série raiz `evolucao.produtividade_delta_pct` */
  prodDeltaPctLast?: number | null;
};

export type VtScoreResult = {
  score: number;
  variacao: number;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function severidadeRank(s: string): number {
  const x = s.toLowerCase();
  if (x.includes('alt') || x.includes('crít') || x.includes('crit')) return 3;
  if (x.includes('méd') || x.includes('med')) return 2;
  if (x.includes('baix')) return 1;
  return 0;
}

function riscoPenalty(risco: string): number {
  const x = risco.toLowerCase();
  if (x.includes('baix')) return 0;
  if (x.includes('méd') || x.includes('med')) return 10;
  if (x.includes('alt') || x.includes('crít') || x.includes('crit')) return 22;
  return 5;
}

/**
 * Heurística estável (sem aleatoriedade) para exibir gauge e delta vs visita anterior.
 */
export function calcularScoreVisitaTecnica(input: VtScoreInput): VtScoreResult {
  const snap = input.snapshot ?? undefined;
  const pragas = Array.isArray(snap?.pragas_doencas)
    ? (snap.pragas_doencas as Record<string, unknown>[])
    : [];
  const desvios = Array.isArray(snap?.desvios) ? (snap.desvios as Record<string, unknown>[]) : [];
  const plano = Array.isArray(snap?.plano_acao) ? (snap.plano_acao as Record<string, unknown>[]) : [];

  const diagFinal = snap?.diagnostico_final != null && typeof snap.diagnostico_final === 'object'
    ? (snap.diagnostico_final as Record<string, unknown>)
    : undefined;
  const riscoStr = String(diagFinal?.risco ?? input.diagnostico?.nivelRisco ?? '').trim();

  let score = 78;
  score -= riscoPenalty(riscoStr);

  let peak = 0;
  for (const p of pragas) {
    peak = Math.max(peak, severidadeRank(String(p.severidade ?? '')));
  }
  score -= peak * 6;
  score -= Math.min(18, pragas.length * 2);
  score -= Math.min(15, desvios.length * 4);
  score += Math.min(8, plano.filter((a) => String(a.acao ?? '').trim().length > 0).length * 2);

  score = clamp(Math.round(score), 38, 96);

  let variacao = 0;
  if (input.comparativoMelhora === true) variacao = 7;
  else if (input.comparativoMelhora === false) variacao = -6;
  if (input.prodDeltaPctLast != null && !Number.isNaN(Number(input.prodDeltaPctLast))) {
    const d = Number(input.prodDeltaPctLast);
    if (d > 2) variacao += 2;
    else if (d < -2) variacao -= 2;
  }
  variacao = clamp(variacao, -12, 12);

  return { score, variacao };
}
