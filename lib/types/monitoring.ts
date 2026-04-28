export type TipoOrganismo = 'praga' | 'doenca' | 'daninha';

export type NivelClassificacao = 'CONTROLADO' | 'ATENCAO' | 'ALTO_RISCO' | 'CRITICO';

export type NivelRecomendacao = 'ACAO_IMEDIATA' | 'ALTO_RISCO' | 'MONITORAR' | 'PREVENTIVO';

export interface Infestacao {
    id: string;
    tipo: TipoOrganismo;
    nome: string;
    terco: string;           // Baixeiro | Médio | Ponteiro
    quantidade: number | null;
    severidade: number;      // 0–100
    observacao?: string;
    imagem?: string;         // URL ou path
}

export interface PontoMonitoramento {
    id: string;
    identificador: string;   // P1, P2, ...
    lat: number;
    lng: number;
    infestacoes: Infestacao[];
}

export interface CondicoesClimaticas {
    temperatura: number;
    umidade: number;
    chuva: string;           // 'Sem Chuva' | 'Chuva Fraca' | 'Chuva'
}

export interface Talhao {
    id: string;
    nome: string;
    cultura: string;
    area_ha: number;
    variedade?: string;
    estagio?: string;        // Ex: R1, V4...
    dae?: number;            // Dias após emergência
    populacao_estande?: number;  // plantas/ha ou plantas/m conforme origem
    poligono_geojson: GeoJSONPolygon;
    pontos: PontoMonitoramento[];
    condicoes_climaticas?: CondicoesClimaticas;
    recomendacoes?: Recomendacao[];
}

export interface GeoJSONPolygon {
    type: 'Feature';
    properties?: Record<string, unknown>;
    geometry: {
        type: 'Polygon';
        coordinates: number[][][];
    };
}

export interface RelatorioMonitoramento {
    fazenda: string;
    safra: string;
    data: string;
    tecnico: string;
    crea?: string;
    talhoes: Talhao[];
    /** Dados da consultoria (nome e logo) para o cabeçalho do relatório */
    consultoria?: { nome: string; logoUrl?: string };
}

// Tipos de saída de cálculos
export interface MetricasTalhao {
    totalPontos: number;
    pontosComInfestacao: number;
    totalOcorrencias: number;
    indiceOcorrencia: number;       // %
    severidadeMedia: number;        // %
    classificacao: NivelClassificacao;
    pragas_pct: number;
    doencas_pct: number;
    daninhas_pct: number;
    top5Infestacoes: { nome: string; percentual: number; tipo: TipoOrganismo }[];
}

export interface MetricasPonto {
    pontoId: string;
    identificador: string;
    numOcorrencias: number;
    severidadeMedia: number;
    classificacao: NivelClassificacao;
}

/** Pacote espelhado do app (monitoring_card_data_service + motor v2). */
export type FortsmartIaRelatorio = {
    dosesDefensivos?: Record<string, Record<string, unknown>>;
    manejoQuimico?: string[];
    manejoBiologico?: string[];
    manejoCultural?: string[];
    motorV2?: Record<string, unknown> | null;
};

export interface Recomendacao {
    nivel: NivelRecomendacao;
    organismo: string;
    tipo: TipoOrganismo;
    produto: string;
    dose: string;
    acao: string;
    pontos: string[];  // quais pontos têm essa ocorrência
    severidade: number;
    fortsmartIa?: FortsmartIaRelatorio;
}

/**
 * NDE e texto de dano (catálogo decision_engine) + leitura real de monitoramento / histórico económico.
 * Emitido por publishMonitoramento (app) como `organismos_contexto`.
 */
export interface OrganismoContextoWeb {
    nome: string;
    organismEngineId?: string;
    nomeCientifico?: string;
    referenciaNde?: number;
    referenciaNdeUnidade?: string;
    estagioNde?: string;
    perdaUnidadeTexto?: string;
    custoIntervencaoRefHa?: number;
    janelaHorasRef?: number;
    fatorFenologicoAplicavel?: number;
    observacaoCatalogo?: string;
    fonte?: string;
    /** Região dos parâmetros (ex.: DEFAULT) */
    paramsRegionId?: string;
    /** UF da propriedade, quando conhecida */
    propriedadeUf?: string;
    pontosAfetados?: number;
    frequencia?: number;
    totalOcorrencias?: number;
    quantidadeMedia?: number;
    severidadeMedia?: number;
    nivelRiscoIndicado?: string;
    densidadeIndM2?: number;
    perdaBrlHa?: number;
    roiMultiplo?: number;
    janelaHoras?: number;
    scoreCriticidade?: number;
    confidencePercent?: number;
    /** Sem linha resolvida no catálogo / fallback */
    usandoParametrosGenericos?: boolean;

    /** Interpretação agronômica (catálogo JSON + ratio leitura/NDE ou severidade) */
    interpretacaoTipo?: 'praga' | 'doenca';
    interpretacaoEscala?: string;
    interpretacaoCategoria?: string;
    interpretacaoTexto?: string;
    interpretacaoRatioNde?: number;
    interpretacaoPercentualAcimaNde?: number;
    interpretacaoJanelaRecomendada?: string;
    interpretacaoUrgencia?: string;
    interpretacaoNotaOperacional?: string;
}
