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
  /** JSON do relatório (coluna `dados` ou `json_data` no Supabase). */
  dados: Record<string, unknown>;
  json_data?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};

/** UUID v4 (também usado como `relatorios.id`). Permite fallback na rota /r/[token]. */
const ROW_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function tokenLooksLikeRowIdUuid(token: string): boolean {
  return ROW_ID_UUID_RE.test(String(token ?? '').trim());
}

function finalizePublicRelatorioRow(data: unknown): RelatorioRow | null {
  if (data == null || typeof data !== 'object') return null;
  const rowData = data as Record<string, unknown>;
  if (rowData.is_public === false) return null;
  const exp = rowData.share_expires_at;
  if (typeof exp === 'string' && exp.length > 0 && new Date(exp) < new Date()) {
    return null;
  }
  const row = data as RelatorioRow & {
    json_data?: Record<string, unknown>;
    dados_json?: Record<string, unknown>;
  };
  if (!row.dados) row.dados = row.json_data ?? row.dados_json ?? {};
  return row;
}

/**
 * Busca relatório por share_token (rota pública /r/[token]).
 * Se não achar e o segmento da URL for um UUID, tenta `relatorios.id` (links que copiaram o id da linha em vez do share_token).
 * No servidor usa service_role se disponível (evita 404 por RLS/env); senão usa anon.
 * Só retorna se is_public != false e token não expirado.
 */
export async function getRelatorioByShareToken(token: string): Promise<RelatorioRow | null> {
  const serviceClient = getSupabaseService();
  const anonClient = getSupabase();
  const client = serviceClient ?? anonClient;
  if (!client) {
    console.error('[fortsmart-reports] getRelatorioByShareToken: nenhum cliente Supabase. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY na Vercel.');
    return null;
  }
  const raw = String(token ?? '').trim();
  if (!raw) return null;

  let { data, error } = await client
    .from('relatorios')
    .select('*')
    .eq('share_token', raw)
    .maybeSingle();

  if (error) {
    console.error('[fortsmart-reports] getRelatorioByShareToken:', error.message, 'token=', raw.slice(0, 8) + '…');
    return null;
  }

  if (!data && tokenLooksLikeRowIdUuid(raw)) {
    const second = await client.from('relatorios').select('*').eq('id', raw).maybeSingle();
    data = second.data;
    error = second.error;
    if (error) {
      console.error('[fortsmart-reports] getRelatorioByShareToken (fallback id):', error.message);
      return null;
    }
    if (data) {
      console.log('[fortsmart-reports] getRelatorioByShareToken: encontrado por id (use share_token no link quando possível)');
    }
  }

  if (!data) {
    console.warn(
      '[fortsmart-reports] getRelatorioByShareToken: nenhum registro para',
      raw.slice(0, 8) + '…',
      '(share_token nem id)',
    );
    return null;
  }

  return finalizePublicRelatorioRow(data);
}

/**
 * Busca relatório por ID (rota privada /relatorio/[id]).
 * Deve ser chamada apenas no server com owner_firebase_uid validado (API route com service_role).
 */
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

  if (error) {
    console.error('[fortsmart-reports] getRelatorioByIdForOwner:', error.message);
    return null;
  }
  return data as any as RelatorioRow;
}

/**
 * URL pública de um arquivo no bucket relatorios.
 * Estrutura: relatorios/{relatorioId}/logo.png | mapa.svg | foto1.jpg
 */
export function getStoragePublicUrl(relatorioId: string, path: string): string {
  const client = getSupabase();
  if (!client) return '';
  const { data } = client.storage.from('relatorios').getPublicUrl(`${relatorioId}/${path}`);
  return data.publicUrl;
}
