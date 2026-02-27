/**
 * Cliente Supabase server-only com SERVICE_ROLE (sem singleton).
 * RLS é ignorado — use apenas em rotas server-side (App Router pages, API routes).
 * Sem cache/singleton para garantir correto funcionamento em serverless (Vercel).
 *
 * ⚠️ NUNCA importe este arquivo em componentes com "use client" ou no browser.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.URL_SUPABASE ||
    '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceRoleKey) {
    console.warn('[fortsmart-reports] getSupabaseAdmin: SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurado.');
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
