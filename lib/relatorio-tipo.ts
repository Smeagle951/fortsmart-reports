/**
 * Chaves lógicas para cutover e métricas (não é validação de negócio).
 */

export function extractRelatorioTipoKey(dados: unknown): string {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return 'unknown';
  const o = dados as Record<string, unknown>;
  const t = o.tipo ?? o.tipoRelatorio ?? o.tipo_relatorio;
  if (t != null && String(t).trim() !== '') return String(t);
  return 'unknown';
}

/** Versão de payload quando existir (p.ex. v2, schema). */
export function extractRelatorioVersionKey(dados: unknown): string {
  if (!dados || typeof dados !== 'object' || Array.isArray(dados)) return '—';
  const o = dados as Record<string, unknown>;
  const v = o.versao ?? o.version ?? o.schemaVersion ?? o.schema_version;
  if (v != null && String(v).trim() !== '') return String(v);
  return '—';
}
