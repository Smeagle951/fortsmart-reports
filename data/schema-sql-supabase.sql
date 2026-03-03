-- ==============================================================
-- FortSmart Enterprise — SQL Schema V2
-- Banco: Supabase (PostgreSQL 15+)
-- Data: 2026-03-03
-- Versão: 2.0.0
--
-- ESTRATÉGIA:
--   - Colunas fixas para campos de alta frequência (queries rápidas / índices)
--   - JSONB para módulos dinâmicos (plantio, visitaTecnica, colheita, analytics)
--   - RLS básico por fazenda
--   - GIN index em JSONB para queries analíticas
--   - time-series em tabela separada para dashboard / BI
-- ==============================================================

-- ------------------------------------------------------------
-- EXTENSÕES
-- ------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- full-text search em nomes

-- ------------------------------------------------------------
-- TABELA PRINCIPAL: relatorios_v2
-- Armazena todo documento V2 de forma unificada
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relatorios_v2 (
  -- Identidade
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id           TEXT UNIQUE NOT NULL,          -- ID do core.reportId (app)
  report_type         TEXT NOT NULL                  -- 'plantio' | 'visita_tecnica' | 'colheita'
                        CHECK (report_type IN ('plantio', 'visita_tecnica', 'colheita')),
  version             INTEGER NOT NULL DEFAULT 1,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft', 'published', 'archived')),

  -- Propriedade e talhão (colunas fixas para filtro rápido)
  fazenda_id          TEXT,
  fazenda_nome        TEXT,
  municipio           TEXT,
  estado              CHAR(2),
  proprietario_nome   TEXT,

  talhao_id           TEXT NOT NULL,
  talhao_nome         TEXT,
  cultura             TEXT,
  area_ha             NUMERIC(10, 2),
  data_plantio        DATE,
  safra               TEXT,

  -- Contexto safra (colunas fixas mais consultadas)
  hibrido             TEXT,
  espacamento_cm      NUMERIC(6, 1),
  populacao_alvo_ha   INTEGER,

  -- Gerado por
  gerado_por_user_id  TEXT,
  gerado_por_nome     TEXT,
  gerado_por_crea     TEXT,
  gerado_por_role     TEXT,

  -- Indicadores principais (colunas fixas para dashboard/ranking)
  iat                 NUMERIC(5, 1),   -- Índice Agronômico do Talhão (0-100)
  iqi                 NUMERIC(5, 1),   -- Índice de Qualidade de Implantação
  score_sanitario     NUMERIC(5, 1),   -- Score Sanitário (0-100)
  score_geral         NUMERIC(5, 1),   -- Score Consolidado (0-100)
  risco_atual         TEXT CHECK (risco_atual IN ('baixo', 'medio', 'alto')),
  tendencia           TEXT CHECK (tendencia IN ('estavel', 'melhora', 'piora')),

  -- Hash de integridade
  hash_integridade    TEXT,

  -- Timestamps
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at        TIMESTAMPTZ,

  -- Módulos dinâmicos em JSONB
  modulo_plantio          JSONB,   -- modulos.plantio completo
  modulo_visita_tecnica   JSONB,   -- modulos.visitaTecnica completo
  modulo_colheita         JSONB,   -- modulos.colheita (futuro)
  indicadores             JSONB,   -- indicadores (incluindo itemsIAT)
  analytics               JSONB,   -- analytics (comparativo, previsão)
  mapa                    JSONB,   -- geodata + marcadores + heatmap
  anexos                  JSONB,   -- imagens + documentos
  assinatura              JSONB,   -- assinatura técnica
  auditoria               JSONB,   -- histórico de versões + log
  
  -- Payload completo para auditoria e export
  payload_completo        JSONB    -- documento V2 completo
);

COMMENT ON TABLE public.relatorios_v2 IS 'Relatórios FortSmart V2 — schema unificado enterprise. Módulos dinâmicos em JSONB.';

-- ------------------------------------------------------------
-- TABELA: indicadores_historico (time-series)
-- Permite gráfico de evolução dos índices por talhão/safra
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.indicadores_historico (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relatorio_id    UUID REFERENCES public.relatorios_v2(id) ON DELETE CASCADE,
  talhao_id       TEXT NOT NULL,
  safra           TEXT,
  report_type     TEXT,
  data_referencia DATE NOT NULL,   -- data do relatório
  dae             INTEGER,         -- dias após emergência

  -- Scores snapshot
  iat             NUMERIC(5, 1),
  iqi             NUMERIC(5, 1),
  score_sanitario NUMERIC(5, 1),
  score_geral     NUMERIC(5, 1),
  risco_atual     TEXT,

  -- Dados chave de plantio (snapshot para trending)
  populacao_real_ha     INTEGER,
  percentual_alvo_pct   NUMERIC(5, 1),
  cv_percentual         NUMERIC(5, 1),
  estande_classificacao TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.indicadores_historico IS 'Série histórica de indicadores por talhão — base para gráficos de evolução e BI.';

-- ------------------------------------------------------------
-- TABELA: relatorios_imagens (normalizada)
-- Permite queries diretas nas imagens (galeria, busca por categoria)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relatorios_imagens (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relatorio_id    UUID REFERENCES public.relatorios_v2(id) ON DELETE CASCADE,
  talhao_id       TEXT,
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  legenda         TEXT,
  categoria       TEXT CHECK (categoria IN ('fenologia', 'praga', 'doenca', 'daninha', 'estande', 'equipamento', 'geral')),
  data_foto       DATE,
  lat             NUMERIC(10, 7),
  lng             NUMERIC(10, 7),
  suporta_zoom    BOOLEAN DEFAULT TRUE,
  ordem           INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.relatorios_imagens IS 'Imagens dos relatórios V2 — normalizada para galeria e zoom.';

-- ------------------------------------------------------------
-- TABELA: relatorios_marcadores (mapa)
-- Marcadores do mapa normalizados para queries geoespaciais
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relatorios_marcadores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relatorio_id    UUID REFERENCES public.relatorios_v2(id) ON DELETE CASCADE,
  talhao_id       TEXT,
  tipo            TEXT CHECK (tipo IN ('praga', 'doenca', 'daninha', 'fenologia', 'estande', 'coleta')),
  titulo          TEXT,
  descricao       TEXT,
  severidade      TEXT CHECK (severidade IN ('baixa', 'media', 'alta')),
  lat             NUMERIC(10, 7),
  lng             NUMERIC(10, 7),
  data_marcador   DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.relatorios_marcadores IS 'Marcadores de campo dos relatórios V2 — base para mapa e heatmap.';

-- ------------------------------------------------------------
-- ÍNDICES
-- ------------------------------------------------------------

-- Índices para filtros de dashboard
CREATE INDEX IF NOT EXISTS idx_rel_v2_talhao        ON public.relatorios_v2 (talhao_id);
CREATE INDEX IF NOT EXISTS idx_rel_v2_fazenda       ON public.relatorios_v2 (fazenda_id);
CREATE INDEX IF NOT EXISTS idx_rel_v2_safra         ON public.relatorios_v2 (safra);
CREATE INDEX IF NOT EXISTS idx_rel_v2_status        ON public.relatorios_v2 (status);
CREATE INDEX IF NOT EXISTS idx_rel_v2_report_type   ON public.relatorios_v2 (report_type);
CREATE INDEX IF NOT EXISTS idx_rel_v2_created_at    ON public.relatorios_v2 (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rel_v2_risco         ON public.relatorios_v2 (risco_atual);
CREATE INDEX IF NOT EXISTS idx_rel_v2_iat           ON public.relatorios_v2 (iat DESC);

-- GIN indexes para queries analíticas no JSONB (busca dentro dos módulos)
CREATE INDEX IF NOT EXISTS idx_rel_v2_modulo_plantio_gin      ON public.relatorios_v2 USING GIN (modulo_plantio);
CREATE INDEX IF NOT EXISTS idx_rel_v2_modulo_vt_gin           ON public.relatorios_v2 USING GIN (modulo_visita_tecnica);
CREATE INDEX IF NOT EXISTS idx_rel_v2_indicadores_gin         ON public.relatorios_v2 USING GIN (indicadores);
CREATE INDEX IF NOT EXISTS idx_rel_v2_mapa_gin                ON public.relatorios_v2 USING GIN (mapa);
CREATE INDEX IF NOT EXISTS idx_rel_v2_payload_gin             ON public.relatorios_v2 USING GIN (payload_completo jsonb_path_ops);

-- Índice time-series
CREATE INDEX IF NOT EXISTS idx_ind_hist_talhao_data  ON public.indicadores_historico (talhao_id, data_referencia DESC);
CREATE INDEX IF NOT EXISTS idx_ind_hist_safra        ON public.indicadores_historico (safra);

-- Full-text search em nomes de fazenda/talhão
CREATE INDEX IF NOT EXISTS idx_rel_v2_fazenda_trgm   ON public.relatorios_v2 USING GIN (fazenda_nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_rel_v2_talhao_trgm    ON public.relatorios_v2 USING GIN (talhao_nome gin_trgm_ops);

-- Imagens
CREATE INDEX IF NOT EXISTS idx_img_relatorio         ON public.relatorios_imagens (relatorio_id);
CREATE INDEX IF NOT EXISTS idx_img_categoria         ON public.relatorios_imagens (categoria);

-- Marcadores
CREATE INDEX IF NOT EXISTS idx_marc_relatorio        ON public.relatorios_marcadores (relatorio_id);
CREATE INDEX IF NOT EXISTS idx_marc_tipo             ON public.relatorios_marcadores (tipo);

-- ------------------------------------------------------------
-- TRIGGER: updated_at automático
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_relatorios_v2_updated_at ON public.relatorios_v2;
CREATE TRIGGER trg_relatorios_v2_updated_at
  BEFORE UPDATE ON public.relatorios_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------
-- VIEWS DE APOIO
-- ------------------------------------------------------------

-- View: resumo de talhões com último IAT (para ranking/dashboard)
CREATE OR REPLACE VIEW public.vw_ranking_talhoes AS
SELECT
  talhao_id,
  talhao_nome,
  cultura,
  safra,
  MAX(iat)         AS iat_ultimo,
  MAX(iqi)         AS iqi_ultimo,
  MAX(score_geral) AS score_ultimo,
  COUNT(*)         AS total_relatorios,
  MAX(created_at)  AS ultimo_relatorio
FROM public.relatorios_v2
WHERE status = 'published'
GROUP BY talhao_id, talhao_nome, cultura, safra
ORDER BY score_ultimo DESC NULLS LAST;

COMMENT ON VIEW public.vw_ranking_talhoes IS 'Ranking de talhões por score consolidado — base para dashboard principal.';

-- View: dashboard safra (sumário por safra)
CREATE OR REPLACE VIEW public.vw_dashboard_safra AS
SELECT
  safra,
  funicultura.cultura,
  COUNT(DISTINCT talhao_id)  AS total_talhoes,
  COUNT(*)                   AS total_relatorios,
  ROUND(AVG(iat), 1)         AS iat_medio,
  ROUND(AVG(score_sanitario), 1) AS score_sanitario_medio,
  COUNT(*) FILTER (WHERE risco_atual = 'alto')  AS talhoes_risco_alto,
  COUNT(*) FILTER (WHERE risco_atual = 'medio') AS talhoes_risco_medio,
  COUNT(*) FILTER (WHERE risco_atual = 'baixo') AS talhoes_risco_baixo
FROM public.relatorios_v2,
LATERAL (SELECT cultura) AS funicultura(cultura)
WHERE status = 'published'
GROUP BY safra, funicultura.cultura
ORDER BY safra DESC;

COMMENT ON VIEW public.vw_dashboard_safra IS 'Sumário por safra/cultura — overview do dashboard principal.';

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.relatorios_v2     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.indicadores_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_imagens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatorios_marcadores ENABLE ROW LEVEL SECURITY;

-- Política básica: usuário autenticado pode ver relatórios da sua fazenda
-- ADAPTAR conforme lógica de permissões do app (por uso do auth.uid() + fazenda_id)
CREATE POLICY "relatorios_v2_auth_read"
  ON public.relatorios_v2
  FOR SELECT
  TO authenticated
  USING (true); -- Substituir por: fazenda_id = (SELECT fazenda_id FROM users WHERE id = auth.uid())

CREATE POLICY "relatorios_v2_auth_insert"
  ON public.relatorios_v2
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "relatorios_v2_auth_update"
  ON public.relatorios_v2
  FOR UPDATE
  TO authenticated
  USING (gerado_por_user_id = auth.uid()::text);

-- Políticas das tabelas auxiliares
CREATE POLICY "imagens_auth_read"   ON public.relatorios_imagens    FOR SELECT TO authenticated USING (true);
CREATE POLICY "imagens_auth_insert" ON public.relatorios_imagens    FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "marc_auth_read"      ON public.relatorios_marcadores FOR SELECT TO authenticated USING (true);
CREATE POLICY "marc_auth_insert"    ON public.relatorios_marcadores FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "hist_auth_read"      ON public.indicadores_historico FOR SELECT TO authenticated USING (true);
CREATE POLICY "hist_auth_insert"    ON public.indicadores_historico FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------
-- EXEMPLOS DE QUERIES ANALÍTICAS (referência)
-- ------------------------------------------------------------

-- Ranking de talhões por IAT na safra atual:
-- SELECT * FROM vw_ranking_talhoes WHERE safra = '2025/26' ORDER BY iat_ultimo DESC;

-- Buscar pragas específicas em JSONB:
-- SELECT talhao_nome, modulo_visita_tecnica -> 'fitossanidade' -> 'pragas' AS pragas
-- FROM relatorios_v2
-- WHERE modulo_visita_tecnica @? '$.fitossanidade.pragas[*] ? (@.severidade == "alta")';

-- Talhões com CV% acima de 25% no plantio:
-- SELECT talhao_nome, (modulo_plantio -> 'plantabilidade' -> 'cvPercentual')::numeric AS cv
-- FROM relatorios_v2
-- WHERE report_type = 'plantio'
--   AND (modulo_plantio -> 'plantabilidade' -> 'cvPercentual')::numeric > 25
-- ORDER BY cv DESC;

-- Evolução do IAT por talhão (time-series):
-- SELECT data_referencia, iat, score_sanitario
-- FROM indicadores_historico
-- WHERE talhao_id = 'talhao-uuid-16' AND safra = '2025/26'
-- ORDER BY data_referencia;
