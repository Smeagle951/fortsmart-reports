import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  resolveFortsmartSupabaseAnonKey,
  resolveFortsmartSupabaseUrl,
} from './fortsmart-supabase-defaults';

/**
 * Cliente Supabase anon (browser ou server).
 */
const supabaseUrl = resolveFortsmartSupabaseUrl();
const supabaseKey = resolveFortsmartSupabaseAnonKey();

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })
    : null;
