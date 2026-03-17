import type { RelatorioMonitoramento } from '../types/monitoring';

/**
 * Estrutura vazia quando não há dados reais (Supabase ou SQLite).
 * Usado em vez de mock para que a UI mostre "Nenhum relatório" em vez de dados falsos.
 */
export const emptyRelatorio: RelatorioMonitoramento = {
  fazenda: '',
  safra: '',
  data: '',
  tecnico: '',
  talhoes: [],
};
