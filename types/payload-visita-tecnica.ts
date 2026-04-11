/**
 * Contrato do payload de visita técnica no viewer web.
 * Ficheiro separado para evitar import circular: filhos não devem importar RelatorioVisitaTecnicaContent só por causa deste tipo.
 */
export type PayloadVisitaTecnica = Record<string, unknown> & {
  tipo?: string;
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
  diagnostico?: Record<string, unknown>;
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
  assinaturaTecnica?: Record<string, unknown>;
  consultoria?: { nome?: string };
  inteligencia_estrategica?: Record<string, unknown>;
  produtividade?: Record<string, unknown> | null;
  inteligencia_agronomica?: Record<string, unknown>;
  checklist?: Record<string, unknown>;
  desvios?: Record<string, unknown>[];
};
