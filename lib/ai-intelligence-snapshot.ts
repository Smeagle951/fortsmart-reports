/**
 * Snapshot canónico para comparação temporal (paridade com `ai_intelligence_snapshot` no JSON).
 */

export type AiIntelligenceSnapshot = {
  score: number | null;
  situacao: string;
  risco: string;
  tendencia: string;
  confianca_score: number | null;
  perda_estimada_sc: number | null;
  timestamp: string | null;
};

function numOrNull(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function strOrEmpty(v: unknown): string {
  return v != null && v !== '' ? String(v) : '';
}

/** Lê `ai_intelligence_snapshot` ou deriva de `inteligencia_agronomica`. */
export function parseAiSnapshotFromRelatorio(r: Record<string, unknown>): AiIntelligenceSnapshot | null {
  const snap = r.ai_intelligence_snapshot;
  if (snap && typeof snap === 'object' && !Array.isArray(snap)) {
    const m = snap as Record<string, unknown>;
    return {
      score: numOrNull(m.score),
      situacao: strOrEmpty(m.situacao),
      risco: strOrEmpty(m.risco),
      tendencia: strOrEmpty(m.tendencia),
      confianca_score: numOrNull(m.confianca_score),
      perda_estimada_sc: numOrNull(m.perda_estimada_sc ?? (m as { perda_evitada_sc?: unknown }).perda_evitada_sc),
      timestamp: m.timestamp != null ? String(m.timestamp) : null,
    };
  }

  const ia = r.inteligencia_agronomica;
  if (!ia || typeof ia !== 'object' || Array.isArray(ia)) return null;
  const intel = ia as Record<string, unknown>;
  const impacto = intel.impacto as Record<string, unknown> | undefined;
  const economia = intel.economia as Record<string, unknown> | undefined;
  const perda =
    numOrNull(impacto?.perda_estimada_sc) ??
    numOrNull(economia?.perda_evitada_sc_ha);

  return {
    score: numOrNull(intel.score),
    situacao: strOrEmpty(intel.situacao),
    risco: strOrEmpty(intel.risco),
    tendencia: strOrEmpty(intel.tendencia),
    confianca_score: numOrNull(intel.confianca_score),
    perda_estimada_sc: perda,
    timestamp: null,
  };
}

export function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .trim();
}

/** Chave do talhão para cruzar histórico (nome). Preferir `talhoes[0]`; `talhao` só legado. */
export function extractTalhaoChave(r: Record<string, unknown>): string | null {
  const th = r.talhoes;
  if (Array.isArray(th) && th[0] != null && typeof th[0] === 'object') {
    const n = (th[0] as Record<string, unknown>).nome;
    if (n != null && String(n).trim() !== '') return normalizeKey(String(n));
  }
  const t = r.talhao;
  if (t && typeof t === 'object') {
    const n = (t as Record<string, unknown>).nome;
    if (n != null && String(n).trim() !== '') return normalizeKey(String(n));
  }
  return null;
}

export function relatorioTipo(r: Record<string, unknown>): string | undefined {
  const core = r.core as Record<string, unknown> | undefined;
  const t = r.tipo ?? core?.reportType ?? core?.report_type;
  return typeof t === 'string' ? t : undefined;
}

/** Texto dos padrões + resumo para heurística de praga recorrente. */
export function collectIntelTextForRecurrence(r: Record<string, unknown>): string {
  const ia = r.inteligencia_agronomica;
  if (!ia || typeof ia !== 'object') return '';
  const intel = ia as Record<string, unknown>;
  const padrao = intel.padrao;
  const resumo = intel.resumo;
  const parts: string[] = [];
  if (typeof resumo === 'string') parts.push(resumo);
  if (Array.isArray(padrao)) {
    for (const p of padrao) {
      if (typeof p === 'string') parts.push(p);
    }
  }
  return parts.join(' ').toLowerCase();
}
