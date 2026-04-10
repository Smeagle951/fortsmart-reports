import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase com service_role — só em Route Handlers / Server Components.
 */
export function createAdminClient(): SupabaseClient {
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios no servidor');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
