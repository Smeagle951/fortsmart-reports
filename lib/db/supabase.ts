import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase anon (browser ou server).
 * Usa SOMENTE variáveis de ambiente — sem fallbacks hardcoded.
 * Local: configure em .env.local | Vercel: Settings → Environment Variables.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;
