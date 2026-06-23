/**
 * Cliente Supabase server-only com SERVICE_ROLE (sem singleton).
 * RLS é ignorado — use apenas em rotas server-side (App Router pages, API routes).
 * Sem cache/singleton para garantir correto funcionamento em serverless (Vercel).
 *
 * ⚠️ NUNCA importe este arquivo em componentes com "use client" ou no browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  resolveFortsmartSupabaseServiceRoleKey,
  resolveFortsmartSupabaseUrl,
} from './fortsmart-supabase-defaults';

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = resolveFortsmartSupabaseUrl();
  const serviceRoleKey = resolveFortsmartSupabaseServiceRoleKey();
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[fortsmart-reports] getSupabaseAdmin: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.');
    return null;
  }
  try {
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });
  } catch (e) {
    console.error('[fortsmart-reports] getSupabaseAdmin: falha ao criar cliente:', e);
    return null;
  }
}
