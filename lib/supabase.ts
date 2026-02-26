import { createClient } from '@supabase/supabase-js';

/** Cliente anon (browser ou server). Sem singleton para funcionar corretamente em serverless. */
export function getSupabase() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.URL_SUPABASE ||
    '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Cliente service_role (só no server). Sem singleton para funcionar corretamente em serverless. */
export function getSupabaseService() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.URL_SUPABASE ||
    '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export type RelatorioRow = {
  id: string;
  owner_firebase_uid?: string;
  app_id?: string;
  device_id?: string | null;
  share_token?: string | null;
  is_public?: boolean;
  share_expires_at?: string | null;
  titulo?: string | null;
  dados: Record<string, unknown>;
  json_data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

export async function getRelatorioByShareToken(token: string): Promise<RelatorioRow | null> {
  const serviceClient = getSupabaseService();
  const anonClient = getSupabase();
  const client = serviceClient ?? anonClient;
  if (!client) return null;
  const { data, error } = await client
    .from('relatorios')
    .select('*')
    .eq('share_token', token)
    .maybeSingle();
  if (error || !data) return null;
  const rowData = data as any;
  if (rowData.is_public === false) return null;
  if (rowData.share_expires_at && new Date(rowData.share_expires_at) < new Date()) return null;
  const row = data as RelatorioRow & { json_data?: Record<string, unknown>; dados_json?: unknown };
  if (!row.dados) row.dados = (row.json_data ?? row.dados_json ?? {}) as Record<string, unknown>;
  return row;
}

export async function getRelatorioByIdForOwner(
  id: string,
  ownerFirebaseUid: string
): Promise<RelatorioRow | null> {
  const client = getSupabaseService();
  if (!client) return null;
  const { data, error } = await client
    .from('relatorios')
    .select('*')
    .eq('id', id)
    .eq('owner_firebase_uid', ownerFirebaseUid)
    .maybeSingle();
  if (error) return null;
  return data as any as RelatorioRow;
}

export function getStoragePublicUrl(relatorioId: string, path: string): string {
  const client = getSupabase();
  if (!client) return '';
  const { data } = client.storage.from('relatorios').getPublicUrl(`${relatorioId}/${path}`);
  return data.publicUrl;
}
