import { ResearchProReportPayload } from '../types/research-report';

export const mockResearchProData: ResearchProReportPayload = {
    core: {
        report_id: "FS-RP-2026-001",
        token: "abc123mocktoken",
        report_type: "RESEARCH_PRO",
        status: "finalizado",
        gerado_em: "2026-03-04"
    },
    cabecalho: {
        empresa: "FortSmart Research",
        fazenda: "Fazenda Modelo",
        municipio: "Primavera do Leste",
        estado: "MT",
        cultura: "Soja",
        cultivar: "M6410 IPRO",
        area_total_ha: 5.04,
        data_plantio: "2025-11-13",
        populacao_planejada: 320000,
        responsavel: "Eng. Agr. João Silva"
    },
    resumo_executivo: {
        parcelas: 24,
        blocos: 4,
        programas: 6,
        cv_percentual: 6.9,
        melhor_programa: "Bayer Produtor 1",
        produtividade_max: 4.68
    },
    ambiente: {
        solo: "Latossolo Vermelho",
        textura: "Argiloso",
        ph: 5.6,
        mo: 3.2,
        chuva_total_mm: 820,
        temperatura_media: 27
    },
    delineamento: {
        tipo: "DBC",
        descricao: "Delineamento em blocos casualizados",
        blocos: 4,
        repeticoes: 4,
        parcelas_por_bloco: 6,
        area_parcela_m2: 12
    },
    programas_manejo: [
        {
            id: "P1",
            empresa: "Bayer",
            nome: "Bayer Produtor 1",
            categoria: "empresa",
            aplicacoes: [
                {
                    ordem: 1,
                    dae: 28,
                    estagio: "V4",
                    produtos: [
                        {
                            nome: "Fox Xpro",
                            dose: 0.4,
                            unidade: "L/ha",
                            classe: "fungicida"
                        }
                    ]
                }
            ]
        },
        {
            id: "P2",
            empresa: "Syngenta",
            nome: "Syngenta Padrão",
            categoria: "empresa",
            aplicacoes: [
                {
                    ordem: 1,
                    dae: 30,
                    estagio: "V4",
                    produtos: [
                        {
                            nome: "Aproach Prima",
                            dose: 0.3,
                            unidade: "L/ha",
                            classe: "fungicida"
                        }
                    ]
                }
            ]
        },
        {
            id: "P3",
            empresa: "FortSmart",
            nome: "Testemunha (Sem Fungicida)",
            categoria: "testemunha",
            aplicacoes: []
        }
    ],
    avaliacoes: [
        {
            variavel: "Produtividade",
            unidade: "t/ha",
            dae: 135,
            dados: [
                { parcela: "B1P1", programa: "Bayer Produtor 1", valor: 4.72 },
                { parcela: "B1P2", programa: "Syngenta Padrão", valor: 4.50 },
                { parcela: "B1P3", programa: "Testemunha (Sem Fungicida)", valor: 2.10 },
                { parcela: "B2P1", programa: "Bayer Produtor 1", valor: 4.60 },
                { parcela: "B2P2", programa: "Syngenta Padrão", valor: 4.55 },
                { parcela: "B2P3", programa: "Testemunha (Sem Fungicida)", valor: 2.05 }
            ]
        }
    ],
    estatistica: {
        variaveis: [
            {
                nome: "Produtividade",
                unidade: "t/ha",
                anova: {
                    f_calculado: 8.32,
                    p_value: 0.0003,
                    significativo: true
                },
                cv_percentual: 6.9,
                tukey: [
                    { programa: "Bayer Produtor 1", media: 4.68, grupo: "A" },
                    { programa: "Syngenta Padrão", media: 4.52, grupo: "AB" },
                    { programa: "Testemunha (Sem Fungicida)", media: 2.07, grupo: "C" }
                ],
                dms: 0.28
            }
        ]
    },
    croqui: {
        blocos: [
            {
                bloco: 1,
                parcelas: [
                    { id: "B1P1", programa: "Bayer Produtor 1", linha: 1, coluna: 1 },
                    { id: "B1P2", programa: "Syngenta Padrão", linha: 1, coluna: 2 },
                    { id: "B1P3", programa: "Testemunha (Sem Fungicida)", linha: 1, coluna: 3 }
                ]
            },
            {
                bloco: 2,
                parcelas: [
                    { id: "B2P1", programa: "Bayer Produtor 1", linha: 2, coluna: 1 },
                    { id: "B2P2", programa: "Syngenta Padrão", linha: 2, coluna: 2 },
                    { id: "B2P3", programa: "Testemunha (Sem Fungicida)", linha: 2, coluna: 3 }
                ]
            }
        ]
    },
    galeria: [
        {
            url: "https://images.unsplash.com/photo-1595183427244-31ea81e4b3e3?q=80&w=2670&auto=format&fit=crop",
            dae: 45,
            parcela: "B1P2",
            descricao: "Avaliação de ferrugem severa na testemunha",
            gps: { lat: -15.55, lon: -54.29 }
        }
    ],
    conclusao: {
        texto: "O programa Bayer Produtor 1 apresentou superioridade estatística na produtividade quando comparado à testemunha, e ligeiro ganho numérico sobre o padrão Syngenta, com alta proteção contra fungos foliares e ferrugem asiática.",
        recomendacao: "Indicado para regiões com alta pressão de ferrugem asiática."
    },
    assinatura: {
        responsavel: "João Silva",
        registro: "CREA 123456",
        empresa: "FortSmart Agro",
        data: "2026-03-04"
    }
};
