import fs from 'fs';
import path from 'path';
import { NivelClassificacao, NivelRecomendacao, Recomendacao, TipoOrganismo } from './types/monitoring';

// ─── Classificação por severidade ─────────────────────────────────────────────
export function classificarSeveridade(severidade: number): NivelClassificacao {
    if (severidade < 10) return 'CONTROLADO';
    if (severidade < 25) return 'ATENCAO';
    if (severidade < 40) return 'ALTO_RISCO';
    return 'CRITICO';
}

export function nivelRecomendacao(severidade: number): NivelRecomendacao {
    if (severidade >= 40) return 'ACAO_IMEDIATA';
    if (severidade >= 25) return 'ALTO_RISCO';
    if (severidade >= 10) return 'MONITORAR';
    return 'PREVENTIVO';
}

function getProdutoPadrao(tipo: TipoOrganismo) {
    if (tipo === 'praga') return { produto: 'Inseticida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Realizar controle conforme receituário agronômico' };
    if (tipo === 'doenca') return { produto: 'Fungicida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Aplicar fungicida conforme receituário agronômico' };
    return { produto: 'Herbicida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Aplicar herbicida conforme receituário agronômico' };
}

// Cache em memória para não ficar lendo disco toda hora (útil para Supabase/API repetida)
const jsonCache: Record<string, any> = {};

function carregarCatalogoCultura(cultura: string) {
    if (!cultura) return null;

    // Normaliza cultura para combinar com os nomes de arquivos (ex: "soja", "milho", "cana_acucar")
    let cultNorm = cultura.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ /g, '_')
        .replace(/-/g, '_');

    // Nomes excepcionais se existirem
    if (cultNorm === 'cana_de_acucar') cultNorm = 'cana_acucar';

    if (jsonCache[cultNorm]) return jsonCache[cultNorm];

    try {
        const filePath = path.join(process.cwd(), 'data', 'organismos', `organismos_${cultNorm}.json`);
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf-8');
            const data = JSON.parse(raw);
            if (data && data.organismos) {
                jsonCache[cultNorm] = data;
                return data;
            }
        }
    } catch (err) {
        console.warn(`[recommendations] Falha ao carregar catálogo para ${cultura}:`, err);
    }

    return null;
}

// ─── Motor principal de recomendações ─────────────────────────────────────────
export function gerarRecomendacoes(
    pontos: { identificador: string; infestacoes: { tipo: TipoOrganismo; nome: string; severidade: number }[] }[],
    cultura: string
): Recomendacao[] {
    // 1. Carrega o banco JSON da cultura
    const catalogo = carregarCatalogoCultura(cultura);

    // 2. Agrupar por organismo (nome normalizado) e acumular pontos + severidade
    const mapa: Record<string, {
        tipo: TipoOrganismo;
        nome: string;
        severidades: number[];
        pontos: string[];
    }> = {};

    for (const ponto of pontos) {
        for (const inf of ponto.infestacoes) {
            const key = inf.nome.toLowerCase().trim();
            if (!mapa[key]) {
                mapa[key] = { tipo: inf.tipo, nome: inf.nome, severidades: [], pontos: [] };
            }
            mapa[key].severidades.push(inf.severidade);
            if (!mapa[key].pontos.includes(ponto.identificador)) {
                mapa[key].pontos.push(ponto.identificador);
            }
        }
    }

    // 3. Gerar 1 recomendação por organismo único cruzando com o catálogo
    const recomendacoes: Recomendacao[] = Object.values(mapa).map(({ tipo, nome, severidades, pontos: pts }) => {
        const severidadeMedia = severidades.reduce((a, b) => a + b, 0) / severidades.length;
        const key = nome.toLowerCase().trim();

        // Determina o dicionário severidade key ('baixo', 'medio', 'alto', 'critico')
        let sevKey = 'baixo';
        if (severidadeMedia >= 10) sevKey = 'medio';
        if (severidadeMedia >= 25) sevKey = 'alto';
        if (severidadeMedia >= 40) sevKey = 'critico';

        let dadosProduto = getProdutoPadrao(tipo);

        // Se temos catálogo JSON
        if (catalogo && catalogo.organismos) {
            // Busca o organismo pelo nome (ignorando maiúsculas e espaços)
            const orgData = catalogo.organismos.find((o: any) => o.nome.toLowerCase().trim() === key || (o.nome_cientifico && o.nome_cientifico.toLowerCase().trim() === key));

            if (orgData) {
                // Tenta extrair a recomendação do JSON
                let recommendedAction = orgData.acao ?? orgData.observacoes ?? 'Controle recomendado conforme bula';
                if (orgData.severidade && orgData.severidade[sevKey] && orgData.severidade[sevKey].acao) {
                    recommendedAction = orgData.severidade[sevKey].acao;
                }

                let recommendedProduct = dadosProduto.produto;
                let recommendedDose = dadosProduto.dose;

                // Se tiver manejo químico, pega a primeira opção
                if (orgData.manejo_quimico && orgData.manejo_quimico.length > 0) {
                    const ch = orgData.manejo_quimico[0]; // ex: "Clorantraniliprole (IRAC 28) - 0,15-0,25 L/ha"
                    const parts = ch.split(' - ');
                    if (parts.length > 1) {
                        recommendedProduct = parts[0];
                        recommendedDose = parts[1];
                    } else {
                        recommendedProduct = ch;
                    }
                }

                dadosProduto = {
                    produto: recommendedProduct,
                    dose: recommendedDose,
                    acao: recommendedAction
                };
            }
        }

        return {
            nivel: nivelRecomendacao(severidadeMedia),
            organismo: nome,
            tipo,
            produto: dadosProduto.produto,
            dose: dadosProduto.dose,
            acao: dadosProduto.acao,
            pontos: pts,
            severidade: Math.round(severidadeMedia),
        };
    });

    // Ordenar por nível de urgência
    const ordem: NivelRecomendacao[] = ['ACAO_IMEDIATA', 'ALTO_RISCO', 'MONITORAR', 'PREVENTIVO'];
    return recomendacoes.sort((a, b) => ordem.indexOf(a.nivel) - ordem.indexOf(b.nivel));
}
