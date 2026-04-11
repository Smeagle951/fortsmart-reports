/**
 * Extrai séries temporais do payload VT para gráficos (Recharts).
 * Aceita vários formatos legados / V2 em `contextoSafra` e `fenologia.historico`.
 */

export type ProdutividadePontoSerie = {
  label: string;
  potencial: number | null;
  estimativa: number | null;
};

function pickNum(obj: Record<string, unknown>, keys: string[]): number | null {
  for (const k of keys) {
    const v = obj[k];
    if (v == null) continue;
    const n = Number(String(v).replace(',', '.'));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function rowLabel(obj: Record<string, unknown>, index: number): string {
  const d = obj.data ?? obj.dataRegistro ?? obj.dataVisita ?? obj.mes ?? obj.periodo ?? obj.referencia;
  if (d != null && String(d).trim()) {
    const s = String(d).trim();
    return s.length > 14 ? s.slice(0, 14) + '…' : s;
  }
  return `${index + 1}`;
}

function mapRowsToSerie(rows: Record<string, unknown>[]): ProdutividadePontoSerie[] {
  return rows.map((row, i) => ({
    label: rowLabel(row, i),
    potencial: pickNum(row, ['potencialScHa', 'potencial', 'potencial_sc_ha', 'metaScHa', 'potencialDeclaradoScHa']),
    estimativa: pickNum(row, [
      'estimativaAtualScHa',
      'estimativa',
      'estimativa_sc_ha',
      'atualScHa',
      'scHa',
      'estimativaDeclaradaScHa',
      'valorScHa',
    ]),
  }));
}

function tryArray(arr: unknown): ProdutividadePontoSerie[] | null {
  if (!Array.isArray(arr) || arr.length < 2) return null;
  const rows = arr.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x));
  if (rows.length < 2) return null;
  const pts = mapRowsToSerie(rows).filter((p) => p.potencial != null || p.estimativa != null);
  return pts.length >= 2 ? pts : null;
}

const CTX_SERIE_KEYS = [
  'historicoProdutividade',
  'serieProdutividade',
  'evolucaoEstimativa',
  'snapshotsProdutividade',
  'historicoEstimativa',
  'historicoScHa',
  'evolucaoScHa',
  'serieEstimativa',
];

/**
 * ≥2 pontos com pelo menos um valor numérico (potencial ou estimativa) por linha.
 */
export function extractProdutividadeSerie(relatorio: Record<string, unknown>): ProdutividadePontoSerie[] | null {
  const ctx = relatorio.contextoSafra;
  if (ctx != null && typeof ctx === 'object' && !Array.isArray(ctx)) {
    const c = ctx as Record<string, unknown>;
    for (const key of CTX_SERIE_KEYS) {
      const got = tryArray(c[key]);
      if (got) return got;
    }
    for (const [k, v] of Object.entries(c)) {
      if (!/historico|evolucao|serie|snapshots/i.test(k)) continue;
      const got = tryArray(v);
      if (got) return got;
    }
  }

  const fen = relatorio.fenologia;
  if (fen != null && typeof fen === 'object' && !Array.isArray(fen)) {
    const got = tryArray((fen as Record<string, unknown>).historico);
    if (got) return got;
  }

  return null;
}

export type IndicadorDeltaPonto = { alvo: string; deltaPct: number };

/** Barras de Δ% por alvo (inteligência estratégica). */
export function extractIndicadoresDeltaSerie(relatorio: Record<string, unknown>): IndicadorDeltaPonto[] | null {
  const intel = relatorio.inteligencia_estrategica;
  if (intel == null || typeof intel !== 'object') return null;
  const evo = (intel as Record<string, unknown>).evolucaoIndicadores;
  if (!Array.isArray(evo) || evo.length === 0) return null;
  const out: IndicadorDeltaPonto[] = [];
  for (const row of evo) {
    if (row == null || typeof row !== 'object' || Array.isArray(row)) continue;
    const r = row as Record<string, unknown>;
    if (r.deltaPct == null) continue;
    const n = Number(r.deltaPct);
    if (!Number.isFinite(n)) continue;
    out.push({ alvo: String(r.alvo ?? r.nome ?? 'Alvo').trim() || 'Alvo', deltaPct: n });
  }
  return out.length > 0 ? out : null;
}
