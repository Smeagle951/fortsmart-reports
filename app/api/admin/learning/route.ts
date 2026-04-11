import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .schema('ai')
      .from('ai_scenario_learning')
      .select('*')
      .order('total_registros', { ascending: false })
      .limit(800);
    if (error) throw error;
    return NextResponse.json({ rows: data ?? [] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, rows: [] }, { status: 200 });
  }
}
