import { createClient } from '@supabase/supabase-js';

// Chaves da Vercel (se disponíveis) ou chaves locais
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qnujboesewzikwypidja.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFudWpib2VzZXd6aWt3eXBpZGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTI2NzQ0ODUsImV4cCI6MjAyODI1MDQ4NX0.EwjsfU6lFq9Lbr5rn2TYnPWF45T_WHj6uq52-5oAPAE';

// Cria uma única instância (singleton)
export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false,
    }
});
