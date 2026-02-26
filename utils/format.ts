/**
 * Formatadores para exibição no relatório.
 */
export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return String(isoString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return String(isoString);
  }
}

export function formatNumber(
  value: number | string | null | undefined,
  options: { decimals?: number } = {}
): string {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: options.decimals ?? 0,
    maximumFractionDigits: options.decimals ?? 2,
  });
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function situacaoLabel(situacao: string | null | undefined): string {
  const s = (situacao || '').toLowerCase();
  if (s === 'ok' || s === 'baixa') return 'OK';
  if (s === 'monitorar' || s === 'media') return 'Monitorar';
  if (s === 'atenção' || s === 'atencao' || s === 'alta' || s === 'critica') return 'Atenção';
  return situacao || '—';
}

export function situacaoCssClass(situacao: string | null | undefined): string {
  const s = (situacao || '').toLowerCase();
  if (s === 'ok' || s === 'baixa') return 'status-ok';
  if (s === 'monitorar' || s === 'media') return 'status-monitorar';
  if (s === 'atenção' || s === 'atencao' || s === 'alta' || s === 'critica') return 'status-atencao';
  return 'status-ok';
}
