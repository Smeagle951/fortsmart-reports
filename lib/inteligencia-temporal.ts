/**
 * Inteligência temporal: delta entre snapshots, impacto, confiança e insights automáticos (viewer).
 */

import type { AiIntelligenceSnapshot } from '@/lib/ai-intelligence-snapshot';
import { collectIntelTextForRecurrence, normalizeKey } from '@/lib/ai-intelligence-snapshot';

export type IntelTemporalDelta = {
  score_diff: number;
  situacao_mudou: boolean;
  tendencia_inferida: 'piorando' | 'estavel' | 'melhorando';
  direcao: 'queda' | 'subida' | 'estavel';
  mensagem: string;
};

export type AiTemporalViewerPayload = {
  /** ISO da publicação do relatório anterior usado na comparação */
  previous_report_at: string | null;
  previous_score: number | null;
  current_score: number | null;
  delta: IntelTemporalDelta | null;
  impacto_diff_sc: { diff: number; mensagem: string } | null;
  confianca_trend: { trend: 'aumentando' | 'reduzindo' | 'estavel'; mensagem: string } | null;
  insights: string[];
  dias_desde_anterior: number | null;
};

function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function computeIntelTemporalDelta(
  current: AiIntelligenceSnapshot | null,
  previous: AiIntelligenceSnapshot | null,
): IntelTemporalDelta | null {
  if (!current || !previous) return null;
  const cs = current.score;
  const ps = previous.score;
  if (cs == null || ps == null) return null;

  const scoreDiff = cs - ps;
  const situacaoMudou = normalizeKey(current.situacao) !== normalizeKey(previous.situacao);

  let tendenciaInferida: IntelTemporalDelta['tendencia_inferida'];
  if (scoreDiff < -3) tendenciaInferida = 'piorando';
  else if (scoreDiff > 3) tendenciaInferida = 'melhorando';
  else tendenciaInferida = 'estavel';

  const direcao: IntelTemporalDelta['direcao'] =
    scoreDiff < 0 ? 'queda' : scoreDiff > 0 ? 'subida' : 'estavel';

  const abs = Math.abs(scoreDiff);
  let mensagem: string;
  if (direcao === 'queda') {
    mensagem = `Queda de ${abs} ponto${abs === 1 ? '' : 's'} no score desde a última visita registada.`;
  } else if (direcao === 'subida') {
    mensagem = `Subida de ${abs} ponto${abs === 1 ? '' : 's'} no score desde a última visita registada.`;
  } else {
    mensagem = 'Score estável em relação à última visita registada.';
  }

  return {
    score_diff: scoreDiff,
    situacao_mudou: situacaoMudou,
    tendencia_inferida: tendenciaInferida,
    direcao,
    mensagem,
  };
}

export function computeImpactoDiffSc(
  current: AiIntelligenceSnapshot | null,
  previous: AiIntelligenceSnapshot | null,
): { diff: number; mensagem: string } | null {
  if (!current || !previous) return null;
  const c = current.perda_estimada_sc;
  const p = previous.perda_estimada_sc;
  if (c == null || p == null) return null;
  const diff = Math.round((c - p) * 10) / 10;
  if (diff === 0) {
    return { diff: 0, mensagem: 'Perda estimada (sc/ha) manteve-se igual à visita anterior.' };
  }
  if (diff > 0) {
    return {
      diff,
      mensagem: `Perda estimada aumentou ${Math.abs(diff)} sc/ha face à visita anterior.`,
    };
  }
  return {
    diff,
    mensagem: `Perda estimada reduziu ${Math.abs(diff)} sc/ha face à visita anterior.`,
  };
}

export function computeConfiancaTrend(
  current: AiIntelligenceSnapshot | null,
  previous: AiIntelligenceSnapshot | null,
): { trend: 'aumentando' | 'reduzindo' | 'estavel'; mensagem: string } | null {
  if (!current || !previous) return null;
  const c = current.confianca_score;
  const p = previous.confianca_score;
  if (c == null || p == null) return null;
  const eps = 0.02;
  let trend: 'aumentando' | 'reduzindo' | 'estavel';
  if (c > p + eps) trend = 'aumentando';
  else if (c < p - eps) trend = 'reduzindo';
  else trend = 'estavel';

  const mensagem =
    trend === 'aumentando'
      ? 'Confiança da análise aumentou face à visita anterior (mais dados / coerência).'
      : trend === 'reduzindo'
        ? 'Confiança da análise reduziu face à visita anterior — validar amostragem e consistência.'
        : 'Confiança da análise manteve-se estável face à visita anterior.';

  return { trend, mensagem };
}

function diasEntre(isoA: string | null, isoB: string | null): number | null {
  if (!isoA || !isoB) return null;
  const a = Date.parse(isoA);
  const b = Date.parse(isoB);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.max(0, Math.round(Math.abs(a - b) / 86400000));
}

function lagartaHits(text: string): number {
  if (!text) return 0;
  const x = fold(text);
  let n = 0;
  if (x.includes('lagarta')) n++;
  if (x.includes('spodoptera')) n++;
  if (x.includes('helicoverpa')) n++;
  return n;
}

export function buildAutomaticInsights(input: {
  currentRelatorio: Record<string, unknown>;
  delta: IntelTemporalDelta | null;
  diasDesdeAnterior: number | null;
  previousRelatorio: Record<string, unknown> | null;
}): string[] {
  const out: string[] = [];
  const { delta, diasDesdeAnterior, currentRelatorio, previousRelatorio } = input;

  if (delta) {
    if (delta.score_diff < -10) {
      out.push('Queda significativa de desempenho no índice agronómico — rever manejo e prazos.');
    } else if (delta.score_diff > 10) {
      out.push('Melhoria expressiva no índice agronómico face à visita anterior.');
    }
    if (delta.situacao_mudou) {
      out.push('A classificação da situação alterou-se em relação ao registo anterior.');
    }
    if (delta.tendencia_inferida === 'piorando' && delta.score_diff > -10 && delta.score_diff < 0) {
      out.push('Tendência negativa nas últimas avaliações (queda moderada de score).');
    }
  }

  const curText = collectIntelTextForRecurrence(currentRelatorio);
  const prevText = previousRelatorio ? collectIntelTextForRecurrence(previousRelatorio) : '';
  const lagCur = lagartaHits(curText);
  const lagPrev = lagartaHits(prevText);
  if (lagCur > 0 && lagPrev > 0) {
    out.push('Padrão recorrente associado a lagarta (mencionado nesta e na visita anterior).');
  } else if (lagCur >= 2) {
    out.push('Múltiplas menções a pressão de lagarta no relatório atual — reforçar monitoramento.');
  }

  const iaCur = currentRelatorio.inteligencia_agronomica;
  const risco = fold(
    iaCur && typeof iaCur === 'object'
      ? String((iaCur as Record<string, unknown>).risco ?? '')
      : '',
  );
  if (diasDesdeAnterior != null && diasDesdeAnterior > 7 && risco.includes('alt')) {
    out.push('Intervalo superior a 7 dias entre visitas com risco elevado — considerar resposta mais rápida.');
  }

  return [...new Set(out)];
}

export function buildAiTemporalViewerPayload(input: {
  currentSnapshot: AiIntelligenceSnapshot | null;
  previousSnapshot: AiIntelligenceSnapshot | null;
  previousReportAt: string | null;
  currentReportAt: string | null;
  currentRelatorio: Record<string, unknown>;
  previousRelatorio: Record<string, unknown> | null;
}): AiTemporalViewerPayload {
  const delta = computeIntelTemporalDelta(input.currentSnapshot, input.previousSnapshot);
  const impactoDiff = computeImpactoDiffSc(input.currentSnapshot, input.previousSnapshot);
  const confTrend = computeConfiancaTrend(input.currentSnapshot, input.previousSnapshot);

  const dias =
    input.previousReportAt && input.currentReportAt
      ? diasEntre(input.previousReportAt, input.currentReportAt)
      : input.previousReportAt
        ? diasEntre(input.previousReportAt, new Date().toISOString())
        : null;

  const insights = buildAutomaticInsights({
    currentRelatorio: input.currentRelatorio,
    delta,
    diasDesdeAnterior: dias,
    previousRelatorio: input.previousRelatorio,
  });

  return {
    previous_report_at: input.previousReportAt,
    previous_score: input.previousSnapshot?.score ?? null,
    current_score: input.currentSnapshot?.score ?? null,
    delta,
    impacto_diff_sc: impactoDiff,
    confianca_trend: confTrend,
    insights,
    dias_desde_anterior: dias,
  };
}
