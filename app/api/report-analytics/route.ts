import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { insertReportAnalyticsEvent } from '@/lib/log-report-view-event';

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function clientIp(req: NextRequest): string {
  const xf = req.headers.get('x-forwarded-for');
  if (xf) {
    const first = xf.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function allowRateLimit(ip: string): boolean {
  const now = Date.now();
  let arr = hits.get(ip) ?? [];
  arr = arr.filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return false;
  }
  arr.push(now);
  hits.set(ip, arr);
  return true;
}

type Body = {
  shareToken?: string;
  eventType?: string;
  module?: string;
};

/**
 * POST { shareToken, eventType: 'download' | 'share' | 'quality_check', module? }
 * Valida token na tabela relatorios e grava ai_report_events (service role).
 */
export async function POST(req: NextRequest) {
  if (!allowRateLimit(clientIp(req))) {
    return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const token = typeof body.shareToken === 'string' ? body.shareToken.trim() : '';
  const eventType =
    body.eventType === 'download' || body.eventType === 'share' || body.eventType === 'quality_check'
      ? body.eventType
      : null;
  const module = typeof body.module === 'string' && body.module.trim() ? body.module.trim() : 'relatorio_web';

  if (!token || !eventType) {
    return NextResponse.json({ ok: false, error: 'missing_fields' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, error: 'server_misconfigured' }, { status: 503 });
  }

  try {
    const { data: row, error: qErr } = await admin
      .from('relatorios')
      .select('id, owner_firebase_uid, is_public, share_expires_at')
      .eq('share_token', token)
      .maybeSingle();

    if (qErr) {
      console.warn('[report-analytics] query:', qErr.message);
      return NextResponse.json({ ok: false, error: 'query_failed' }, { status: 500 });
    }
    if (!row?.id) {
      return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
    }

    const isPublic = row.is_public !== false;
    const exp = row.share_expires_at ? new Date(row.share_expires_at as string) : null;
    if (!isPublic || (exp && exp < new Date())) {
      return NextResponse.json({ ok: false, error: 'unavailable' }, { status: 403 });
    }

    const ownerUid = String(row.owner_firebase_uid ?? '').trim();
    const metricUserId = ownerUid.length > 0 ? ownerUid : 'anonymous_viewer';

    await insertReportAnalyticsEvent({
      client: admin,
      reportId: String(row.id),
      userId: metricUserId,
      module,
      eventType,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.warn('[report-analytics] exception:', e);
    return NextResponse.json({ ok: false, error: 'internal' }, { status: 500 });
  }
}
