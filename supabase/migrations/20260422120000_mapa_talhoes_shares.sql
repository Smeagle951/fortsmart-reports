-- Links curtos para o mapa web de talhões (/mapa-talhoes/m/:id).
-- A API Next.js usa SUPABASE_SERVICE_ROLE_KEY (bypass de RLS).
-- Aplicar no SQL Editor do Supabase (projeto dos relatórios) ou: supabase db push

CREATE TABLE IF NOT EXISTS public.mapa_talhoes_shares (
  id text PRIMARY KEY,
  geojson jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mapa_talhoes_shares_expires_at ON public.mapa_talhoes_shares (expires_at);

ALTER TABLE public.mapa_talhoes_shares ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.mapa_talhoes_shares IS 'Snapshots GeoJSON para URLs curtas do visualizador mapa-talhões (FortSmart).';
