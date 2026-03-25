/**
 * Garante array para dados vindos do Supabase / app (versões antigas podem mandar objeto/null).
 * Evita ".map is not a function" em relatórios pontuais com JSON inconsistente.
 */
export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}
