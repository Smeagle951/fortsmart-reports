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
