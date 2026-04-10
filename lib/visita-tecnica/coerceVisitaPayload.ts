/**
 * Garante lista de objetos para campos do payload VT que às vezes chegam como
 * mapa (ex.: serialização) ou objeto único — evita crash em .map / for..of.
 */
export function coerceVisitaObjectArray(v: unknown): Record<string, unknown>[] {
  if (v == null) return [];
  if (Array.isArray(v)) {
    return v.filter(
      (x): x is Record<string, unknown> =>
        x != null && typeof x === 'object' && !Array.isArray(x),
    );
  }
  if (typeof v === 'object') {
    const vals = Object.values(v as Record<string, unknown>);
    if (
      vals.length > 0 &&
      vals.every((x) => x != null && typeof x === 'object' && !Array.isArray(x))
    ) {
      return vals as Record<string, unknown>[];
    }
    return [v as Record<string, unknown>];
  }
  return [];
}

function coerceAplicacoesArray(v: unknown): unknown[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v;
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).filter(
      (x) => x != null && typeof x === 'object',
    );
  }
  return [];
}

function coerceStringArrayLoose(v: unknown): string[] {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  if (typeof v === 'object') {
    return Object.values(v as Record<string, unknown>).map((x) =>
      typeof x === 'string' ? x : JSON.stringify(x),
    );
  }
  return [String(v)];
}

/**
 * Garante `talhoes: Record[]` e remove `talhao` singular (legado V1).
 * Evita payload com os dois campos e priorização errada no React.
 */
function normalizeTalhoesRemoveLegacy(raw: Record<string, unknown>, out: Record<string, unknown>): void {
  const singular = raw.talhao;
  const hasSingular = singular != null && typeof singular === 'object' && !Array.isArray(singular);
  let arr = raw.talhoes;
  if (!Array.isArray(arr) || arr.length === 0) {
    arr = hasSingular ? [singular as Record<string, unknown>] : [];
  }
  out.talhoes = (arr as unknown[]).filter(
    (x): x is Record<string, unknown> =>
      x != null && typeof x === 'object' && !Array.isArray(x),
  );
  delete out.talhao;
}

/**
 * Última camada antes do React: corrige formatos que o app/DB enviam como objeto
 * ou tipos mistos (evita crash em .map, .trim, for..of).
 */
export function sanitizeVisitaTecnicaPayload(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...raw };

  normalizeTalhoesRemoveLegacy(raw, out);

  out.pragas = coerceVisitaObjectArray(raw.pragas);
  out.imagens = coerceVisitaObjectArray(raw.imagens);
  out.aplicacoes = coerceAplicacoesArray(raw.aplicacoes) as typeof raw.aplicacoes;

  const intel = raw.inteligencia_agronomica;
  if (intel != null && typeof intel === 'object' && !Array.isArray(intel)) {
    const im = { ...(intel as Record<string, unknown>) };
    if (im.padrao != null && !Array.isArray(im.padrao)) {
      im.padrao = coerceStringArrayLoose(im.padrao);
    }
    out.inteligencia_agronomica = im;
  }

  const mapa = raw.mapa;
  if (mapa != null && typeof mapa === 'object' && !Array.isArray(mapa)) {
    const m = { ...(mapa as Record<string, unknown>) };
    if (m.path != null && typeof m.path !== 'string') m.path = String(m.path);
    if (m.viewBox != null && typeof m.viewBox !== 'string') m.viewBox = String(m.viewBox);
    if (m.pontos != null && !Array.isArray(m.pontos)) {
      m.pontos = coerceVisitaObjectArray(m.pontos) as unknown[];
    }
    out.mapa = m;
  }

  const plano = raw.planoAcao;
  if (plano != null && typeof plano === 'object' && !Array.isArray(plano)) {
    const pm = { ...(plano as Record<string, unknown>) };
    if (pm.acoes != null && !Array.isArray(pm.acoes)) {
      pm.acoes = coerceAplicacoesArray(pm.acoes);
    }
    out.planoAcao = pm;
  }

  const diag = raw.diagnostico;
  if (diag != null && typeof diag === 'object' && !Array.isArray(diag)) {
    const dm = { ...(diag as Record<string, unknown>) };
    if (dm.recomendacoes != null && !Array.isArray(dm.recomendacoes)) {
      dm.recomendacoes = coerceStringArrayLoose(dm.recomendacoes);
    }
    out.diagnostico = dm;
  }

  return out;
}
