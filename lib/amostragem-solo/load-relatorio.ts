import { getSupabaseAdmin } from '@/lib/supabase-admin';
import type { AmostragemSoloPayload } from './payload';

function parseDados(raw: unknown): Record<string, unknown> | null {
  if (raw == null) return null;
  if (typeof raw === 'object' && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw) as unknown;
      return typeof p === 'object' && p !== null && !Array.isArray(p) ? (p as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Carrega payload amostragem_solo pelo share_token (service role). */
export async function loadAmostragemSoloByShareToken(token: string): Promise<AmostragemSoloPayload | null> {
  if (!token) return null;
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin.from('relatorios').select('*').eq('share_token', token).maybeSingle();
  if (error || !data) return null;
  const row = data as { is_public?: boolean; share_expires_at?: string | null; dados?: unknown; json_data?: unknown };
  if (row.is_public === false) return null;
  if (row.share_expires_at && new Date(row.share_expires_at) < new Date()) return null;
  const dados = parseDados(row.dados ?? row.json_data);
  if (!dados || dados.tipo !== 'amostragem_solo') return null;
  return dados as unknown as AmostragemSoloPayload;
}
