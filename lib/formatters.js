/**
 * Formatadores para exibição no relatório (datas, números, área).
 */

export function formatDate(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function formatArea(ha) {
  if (ha == null || ha === '') return '—';
  const n = Number(ha);
  if (Number.isNaN(n)) return String(ha);
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ha`;
}

export function formatNumber(value, options = {}) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return n.toLocaleString('pt-BR', {
    minimumFractionDigits: options.decimals ?? 0,
    maximumFractionDigits: options.decimals ?? 0,
    ...options,
  });
}

export function formatPercent(value) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function situacaoLabel(situacao) {
  const s = (situacao || '').toLowerCase();
  if (s === 'ok' || s === 'baixa') return 'OK';
  if (s === 'monitorar' || s === 'media') return 'Monitorar';
  if (s === 'atenção' || s === 'atencao' || s === 'alta' || s === 'critica') return 'Atenção';
  return situacao || '—';
}

export function situacaoCssClass(situacao) {
  const s = (situacao || '').toLowerCase();
  if (s === 'ok' || s === 'baixa') return 'status-ok';
  if (s === 'monitorar' || s === 'media') return 'status-monitorar';
  if (s === 'atenção' || s === 'atencao' || s === 'alta' || s === 'critica') return 'status-atencao';
  return 'status-ok';
}
