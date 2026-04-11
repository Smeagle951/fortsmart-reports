/**
 * Utility functions for labeling visita técnica fields.
 * Separated to avoid circular dependencies with components.
 */

export function labelMetodoAmostragem(v: unknown): string {
  const s = String(v ?? '').trim();
  const map: Record<string, string> = {
    aleatorio: 'Aleatório',
    zigue_zague: 'Zigue-zague',
    ponto_fixo: 'Ponto fixo',
    grid: 'Grid',
  };
  return map[s] || s || '—';
}

export function labelTendencia(t: unknown): string {
  const s = String(t ?? '');
  const map: Record<string, string> = {
    crescimento_acelerado: 'Crescimento acelerado',
    crescimento: 'Em alta',
    queda: 'Em queda',
    estavel: 'Estável',
    severidade_apenas: 'Severidade (ordinal)',
    sem_historico: 'Primeiro registro',
  };
  return map[s] || s || '—';
}

export function labelCausa(c: unknown): string {
  const s = String(c ?? '').trim();
  const map: Record<string, string> = {
    clima: 'Clima',
    manejo: 'Manejo',
    solo: 'Solo',
    genetica: 'Genética',
    operacional: 'Operacional',
    desconhecido: 'Desconhecido',
  };
  return map[s] || s || '—';
}

export function labelCiclo(c: unknown): string {
  const s = String(c ?? '').trim();
  const map: Record<string, string> = {
    precoce: 'Precoce',
    medio: 'Médio',
    tardio: 'Tardio',
  };
  return map[s] || s || '—';
}
