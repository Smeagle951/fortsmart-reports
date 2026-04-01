/**
 * Chamadas do browser para métricas explícitas (download / share).
 * Silencioso em caso de falha de rede.
 */
export async function postReportAnalytics(opts: {
  shareToken: string;
  eventType: 'download' | 'share';
  module: string;
}): Promise<void> {
  const { shareToken, eventType, module } = opts;
  if (!shareToken.trim()) return;
  try {
    await fetch('/api/report-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shareToken: shareToken.trim(),
        eventType,
        module: module.slice(0, 120),
      }),
    });
  } catch {
    /* ignore */
  }
}
