/**
 * Contrato do payload de visita técnica no viewer web.
 * Ficheiro separado para evitar import circular: filhos não devem importar RelatorioVisitaTecnicaContent só por causa deste tipo.
 */
/** Ponto no snapshot (coordenadas + mídia; `localPath` quando só existe ficheiro no dispositivo). */
export type VisitaSnapshotPontoGeo = Record<string, unknown> & {
  latitude?: number;
  longitude?: number;
  lat?: number;
  lng?: number;
  lon?: number;
  descricao?: string;
  titulo?: string;
  tipo?: string;
  imagem?: string;
  localPath?: string;
  data?: string;
};

/** Snapshot canónico v2 (espelha o contrato Flutter `visita_snapshot`). */
export type VisitaSnapshotCanonico = {
  visita_id?: string;
  data?: string;
  talhao?: string;
  cultura?: string;
  dae?: number;
  condicoes_momento?: Record<string, unknown>;
  contexto_safra?: Record<string, unknown>;
  pragas_doencas?: Array<Record<string, unknown>>;
  desvios?: Array<Record<string, unknown>>;
  aplicacoes_prescricoes?: Array<Record<string, unknown>>;
  pontos_georreferenciados?: VisitaSnapshotPontoGeo[];
  diagnostico_final?: Record<string, unknown>;
  plano_acao?: Array<Record<string, unknown>>;
  evolucao?: Record<string, unknown>;
};

/** Métricas oficiais de conclusão quando emitidas pelo app (Fase B). */
export type ConclusaoMetricasVisita = {
  score: number;
  variacao: number;
};

export type PayloadVisitaTecnica = Record<string, unknown> & {
  tipo?: string;
  /** Payload v2 para UI SaaS / timeline / comparativo */
  visita_snapshot?: VisitaSnapshotCanonico;
  /** Alias do app (mesmo conteúdo que `visita_snapshot`); o normalizador replica em `visita_snapshot` se só existir aqui. */
  visita?: VisitaSnapshotCanonico;
  /** Snapshot completo da visita anterior (opcional; mesmo formato que visita_snapshot). */
  visita_snapshot_anterior?: VisitaSnapshotCanonico;
  /** Score e variação oficiais (opcional); se ausente, o viewer deriva heurística. */
  conclusao_metricas?: ConclusaoMetricasVisita;
  meta?: Record<string, unknown>;
  propriedade?: Record<string, unknown>;
  talhoes?: Record<string, unknown>[];
  contextoSafra?: Record<string, unknown>;
  populacao?: Record<string, unknown>;
  fazenda?: string;
  safra?: string;
  data?: string;
  tecnico?: string;
  aplicacoes?: Array<{
    tipo?: string;
    data?: string;
    produto?: string;
    dose?: string;
    unidade?: string;
    classe?: string;
    status?: string;
    alvo?: string;
    talhaoId?: string;
    talhaoNome?: string;
    aplicacaoId?: string;
    responsavel?: string;
    tipoOperacao?: string;
    areaTrabalhoHa?: number;
    volumeLHa?: number;
    quantidade?: number;
    quantidadePorTanque?: number;
    grupoQuimico?: string;
    intervaloSeguranca?: string;
    custoUnitario?: number;
    custoPorHa?: number;
    custoTotal?: number;
    observacoes?: string;
  }>;
  diagnostico?: Record<string, unknown> & {
    origem?: 'final' | 'consolidado' | 'automatico';
  };
  /** Séries por visita da safra (gráficos / narrativa) */
  evolucao?: {
    produtividade_delta_pct?: number[];
    pragas_pressao?: string[];
    tendencia?: string;
    visitas?: Array<Record<string, unknown>>;
  };
  planoAcao?: {
    objetivoManejo?: string;
    acoes?: Array<{
      prioridade?: string;
      acao?: string;
      prazo?: string;
      produto?: string;
      dose?: string;
      momento?: string;
      objetivoTecnico?: string;
    }>;
  };
  conclusao?: string;
  pragas?: Record<string, unknown>[];
  condicoes?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  mapa?: Record<string, unknown>;
  imagens?: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  /** nome, crea, cidade, dataAssinatura, e opcionalmente URL da imagem (url, urlAssinatura, imagemUrl, etc.) */
  assinaturaTecnica?: Record<string, unknown>;
  consultoria?: { nome?: string };
  inteligencia_estrategica?: Record<string, unknown>;
  produtividade?: Record<string, unknown> | null;
  inteligencia_agronomica?: Record<string, unknown>;
  checklist?: Record<string, unknown>;
  desvios?: Record<string, unknown>[];
};
