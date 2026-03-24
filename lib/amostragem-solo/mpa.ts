/** Alinhado ao app Flutter: soil_sampling_mpa_classification.dart */
export function classifyMpaForWeb(mpa: number | null | undefined): string {
  if (mpa == null || !Number.isFinite(mpa)) return 'Indefinido';
  if (mpa > 3) return 'Crítica';
  if (mpa > 2) return 'Alta';
  if (mpa > 1) return 'Moderada';
  return 'Baixa';
}

/** Faixas exibidas na legenda do relatório (mesma lógica que classifyMpaForWeb). */
export const IC_LEGEND_ROWS: ReadonlyArray<{
  classificacao: string;
  descricao: string;
  faixaMpa: string;
  color: string;
}> = [
  { classificacao: 'Crítica', descricao: 'Restrição crítica', faixaMpa: 'IC > 3 MPa', color: '#dc2626' },
  { classificacao: 'Alta', descricao: 'Restrição alta', faixaMpa: 'IC > 2 e ≤ 3 MPa', color: '#ea580c' },
  { classificacao: 'Moderada', descricao: 'Restrição moderada', faixaMpa: 'IC > 1 e ≤ 2 MPa', color: '#ca8a04' },
  { classificacao: 'Baixa', descricao: 'Baixa restrição', faixaMpa: 'IC ≤ 1 MPa', color: '#16a34a' },
];
