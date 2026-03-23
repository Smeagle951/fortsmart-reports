/** Alinhado ao app Flutter: soil_sampling_mpa_classification.dart */
export function classifyMpaForWeb(mpa: number | null | undefined): string {
  if (mpa == null || !Number.isFinite(mpa)) return 'Indefinido';
  if (mpa > 3) return 'Crítica';
  if (mpa > 2) return 'Alta';
  if (mpa > 1) return 'Moderada';
  return 'Baixa';
}
