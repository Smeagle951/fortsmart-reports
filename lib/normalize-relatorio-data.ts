/**
 * Normalização profunda de payloads de relatório para comparação (Postgres vs Supabase).
 * - Omite chaves com `undefined`
 * - `null` mantém-se; valores vazios de string → tratamento explícito
 * - Números em string finitos → número
 * - Arrays só de primitivos → ordenados para comparação estável
 * - Objectos: chaves ordenadas, recursivo
 * - `Date` → ISO
 * - `BigInt` → string
 */

function normalizeRelatorioDataImpl(data: unknown, depth: number): unknown {
  if (depth > 80) return '[depth_exceeded]';
  if (data === undefined) return null;
  if (data === null) return null;
  if (typeof data === 'bigint') return String(data);
  if (data instanceof Date) return data.toISOString();
  if (typeof data === 'string') {
    const t = data.trim();
    if (t === 'true') return true;
    if (t === 'false') return false;
    if (t === '' || t === 'null') return null;
    if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(t)) {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
    }
    return t;
  }
  if (typeof data === 'number') {
    return Number.isFinite(data) ? data : null;
  }
  if (typeof data === 'boolean') return data;
  if (Array.isArray(data)) {
    const norm = data.map((x) => normalizeRelatorioDataImpl(x, depth + 1));
    const allPrimitive = norm.every(
      (x) => x === null || ['string', 'number', 'boolean'].includes(typeof x),
    );
    if (allPrimitive) {
      return (norm as (string | number | boolean | null)[]).slice().sort((a, b) => {
        if (a === b) return 0;
        return String(a).localeCompare(String(b), 'pt', { numeric: true });
      });
    }
    return norm;
  }
  if (typeof data === 'object' && data !== null) {
    const o = data as Record<string, unknown>;
    const keys = Object.keys(o).sort();
    const out: Record<string, unknown> = {};
    for (const k of keys) {
      const v = o[k];
      if (v === undefined) continue;
      out[k] = normalizeRelatorioDataImpl(v, depth + 1);
    }
    return out;
  }
  return data;
}

/**
 * Estrutura canónica para diff entre origens (não muta o input).
 */
export function normalizeRelatorioData(data: unknown): unknown {
  return normalizeRelatorioDataImpl(data, 0);
}

/**
 * Comparação estável: normaliza e serializa.
 */
export function stringifyRelatorioDataForCompare(data: unknown): string {
  try {
    return JSON.stringify(normalizeRelatorioData(data));
  } catch {
    return '';
  }
}
