/**
 * Projeto Supabase oficial do FortSmart Agro (mesmo do app Flutter `assets/.env`).
 * A chave anon é pública por design (RLS); use env na Vercel para override.
 */
export const FORTSMART_SUPABASE_URL_DEFAULT =
  'https://qnujboesewzikwypidja.supabase.co';

/** Anon key — já empacotada no app mobile; só lê relatórios com is_public=true via RLS. */
export const FORTSMART_SUPABASE_ANON_KEY_DEFAULT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWpib2VzZXd6aWt3eXBpZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NTM4NjcsImV4cCI6MjA4NzAyOTg2N30.fR2dlKaDUCYZfxQWLH2FNk1gQx-Cn_rwqCu0biYNM98';

export function resolveFortsmartSupabaseUrl(): string {
  return (
    process.env.URL_SUPABASE?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim() ||
    FORTSMART_SUPABASE_URL_DEFAULT
  );
}

export function resolveFortsmartSupabaseAnonKey(): string {
  return (
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    FORTSMART_SUPABASE_ANON_KEY_DEFAULT
  );
}

/** Service role: aceita nomes usados no painel Vercel/Supabase. */
export function resolveFortsmartSupabaseServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    ''
  );
}

export function hasFortsmartSupabaseConfig(): boolean {
  const url = resolveFortsmartSupabaseUrl();
  const anon = resolveFortsmartSupabaseAnonKey();
  const service = resolveFortsmartSupabaseServiceRoleKey();
  return url.length > 0 && (anon.length > 0 || service.length > 0);
}
