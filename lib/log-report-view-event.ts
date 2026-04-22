import type { SupabaseClient } from '@supabase/supabase-js';

/** Métricas de produto em `ai_report_events` (não são dataset IA). */
export type ReportAnalyticsEventType = 'view' | 'download' | 'share' | 'quality_check';

/**
 * Insere linha em `public.ai_report_events`. Falhas só em log.
 */
export async function insertReportAnalyticsEvent(opts: {
  client: SupabaseClient;
  reportId: string;
  userId: string;
  module: string;
  eventType: ReportAnalyticsEventType;
}): Promise<void> {
  try {
    const { error } = await opts.client.from('ai_report_events').insert({
      user_id: opts.userId,
      report_id: opts.reportId,
      event_type: opts.eventType,
      module: opts.module.slice(0, 120),
    });
    if (error) {
      console.warn('[fortsmart-reports] ai_report_events', opts.eventType, ':', error.message);
    }
  } catch (e) {
    console.warn('[fortsmart-reports] ai_report_events exception:', e);
  }
}

/**
 * Métrica de produto: visualização pública do relatório (/r/[token]).
 * Não duplica payload no dataset IA.
 */
export async function insertReportViewEvent(opts: {
  client: SupabaseClient;
  reportId: string;
  userId: string;
  module: string;
}): Promise<void> {
  await insertReportAnalyticsEvent({
    client: opts.client,
    reportId: opts.reportId,
    userId: opts.userId,
    module: opts.module,
    eventType: 'view',
  });
}
