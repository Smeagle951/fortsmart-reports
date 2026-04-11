import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/admin/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const admin = createAdminClient();
    const { error } = await admin.schema('ai').rpc('refresh_scenario_learning');
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
