export type ResearchProReportCore = {
    report_id: string;
    token: string;
    report_type: 'RESEARCH_PRO';
    status: 'planejado' | 'em_andamento' | 'finalizado' | 'cancelado';
    gerado_em: string;
};

export type ResearchProReportCabecalho = {
    empresa: string;
    fazenda: string;
    municipio: string;
    estado: string;
    cultura: string;
    cultivar: string;
    area_total_ha: number;
    data_plantio: string;
    populacao_planejada: number;
    responsavel: string;
};

export type ResearchProReportResumoExecutivo = {
    parcelas: number;
    blocos: number;
    programas: number;
    cv_percentual: number;
    melhor_programa: string;
    produtividade_max: number;
};

export type ResearchProReportAmbiente = {
    solo: string;
    textura: string;
    ph: number;
    mo: number;
    chuva_total_mm: number;
    temperatura_media: number;
};

export type ResearchProReportDelineamento = {
    tipo: string;
    descricao: string;
    blocos: number;
    repeticoes: number;
    parcelas_por_bloco: number;
    area_parcela_m2: number;
};

export type ResearchProReportProgramaAplicacaoProduto = {
    nome: string;
    dose: number;
    unidade: string;
    classe: string;
};

export type ResearchProReportProgramaAplicacao = {
    ordem: number;
    dae: number;
    estagio: string;
    produtos: ResearchProReportProgramaAplicacaoProduto[];
};

export type ResearchProReportProgramaManejo = {
    id: string;
    empresa: string;
    nome: string;
    categoria: string;
    aplicacoes: ResearchProReportProgramaAplicacao[];
};

export type ResearchProReportAvaliacaoDado = {
    parcela: string;
    programa: string;
    valor: number;
};

export type ResearchProReportAvaliacao = {
    variavel: string;
    unidade: string;
    dae?: number;
    dados: ResearchProReportAvaliacaoDado[];
};

export type ResearchProReportTukeyGrupo = {
    programa: string;
    media: number;
    grupo: string;
};

export type ResearchProReportEstatisticaVariavelAnova = {
    f_calculado: number;
    p_value: number;
    significativo: boolean;
};

export type ResearchProReportEstatisticaVariavel = {
    nome: string;
    unidade: string;
    anova: ResearchProReportEstatisticaVariavelAnova;
    cv_percentual: number;
    tukey: ResearchProReportTukeyGrupo[];
    dms: number;
};

export type ResearchProReportEstatistica = {
    variaveis: ResearchProReportEstatisticaVariavel[];
};

export type ResearchProReportCroquiParcela = {
    id: string;
    programa: string;
    linha: number;
    coluna: number;
};

export type ResearchProReportCroquiBloco = {
    bloco: number;
    parcelas: ResearchProReportCroquiParcela[];
};

export type ResearchProReportCroqui = {
    blocos: ResearchProReportCroquiBloco[];
};

export type ResearchProReportGaleriaItem = {
    url: string;
    dae: number;
    parcela: string;
    descricao: string;
    gps?: {
        lat: number;
        lon: number;
    };
};

export type ResearchProReportConclusao = {
    texto: string;
    recomendacao: string;
};

export type ResearchProReportAssinatura = {
    responsavel: string;
    registro: string;
    empresa: string;
    data: string;
};

export type ResearchProReportPayload = {
    core: ResearchProReportCore;
    cabecalho: ResearchProReportCabecalho;
    resumo_executivo: ResearchProReportResumoExecutivo;
    ambiente: ResearchProReportAmbiente;
    delineamento: ResearchProReportDelineamento;
    programas_manejo: ResearchProReportProgramaManejo[];
    avaliacoes: ResearchProReportAvaliacao[];
    estatistica: ResearchProReportEstatistica;
    croqui: ResearchProReportCroqui;
    galeria: ResearchProReportGaleriaItem[];
    conclusao: ResearchProReportConclusao;
    assinatura: ResearchProReportAssinatura;
};
