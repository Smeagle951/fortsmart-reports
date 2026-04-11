/**
 * Garante array para dados vindos do Supabase / app (versões antigas podem mandar objeto/null).
 * Evita ".map is not a function" em relatórios pontuais com JSON inconsistente.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/**
 * Lista de textos para UI (recomendações, bullets). Aceita string única, array de strings
 * ou array de objetos com texto/descricao (payloads Flutter/legados).
 */
export function asStringList(value: unknown): string[] {
  if (value == null) return [];
  if (typeof value === 'string') {
    const t = value.trim();
    return t ? [t] : [];
  }
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (item == null) continue;
    if (typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean') {
      const s = String(item).trim();
      if (s) out.push(s);
      continue;
    }
    if (typeof item === 'object') {
      const o = item as Record<string, unknown>;
      const raw = o.texto ?? o.descricao ?? o.text ?? o.titulo ?? o.recommendation;
      if (raw != null && String(raw).trim() !== '') {
        out.push(String(raw).trim());
      }
    }
  }
  return out;
}
