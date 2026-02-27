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

export interface Recomendacao {
    nivel: NivelRecomendacao;
    organismo: string;
    tipo: TipoOrganismo;
    produto: string;
    dose: string;
    acao: string;
    pontos: string[];  // quais pontos têm essa ocorrência
    severidade: number;
}
