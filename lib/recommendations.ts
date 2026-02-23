import { NivelClassificacao, NivelRecomendacao, Recomendacao, TipoOrganismo } from '../types/monitoring';

// ─── Banco de produtos por organismo ──────────────────────────────────────────
// Cada organismo tem: produto, dose, e ação técnica recomendada
const PRODUTOS_POR_ORGANISMO: Record<string, {
    produto: string;
    dose: string;
    acao: string;
}> = {
    // PRAGAS
    'lagarta-alfinete': { produto: 'Intrepid 240 SC', dose: '200 mL/ha', acao: 'Aplicar inseticida em estádio V3–V5, cobrindo ponteiro' },
    'lagarta do cartucho': { produto: 'Ampligo 150 ZC', dose: '250 mL/ha', acao: 'Aplicar no ponteiro em infestação inicial' },
    'lagarta falsa medideira': { produto: 'Nomolt 150 SC', dose: '250 mL/ha', acao: 'Aplicar ao 1º instar, evitando chuva por 4h' },
    'percevejo marrom': { produto: 'Engeo Pleno SC', dose: '150 mL/ha', acao: 'Controle químico direcionado ao ponteiro' },
    'percevejo': { produto: 'Engeo Pleno SC', dose: '150 mL/ha', acao: 'Controle químico direcionado à vagem em enchimento' },
    'pulgão': { produto: 'Actara 250 WG', dose: '100 g/ha', acao: 'Aplicar ao detectar colônias no ponteiro' },
    'cigarrinha': { produto: 'Decis 25 EC', dose: '400 mL/ha', acao: 'Aplicar ao amanhecer, em alta infestação' },
    'tripes': { produto: 'Trike 480 EC', dose: '600 mL/ha', acao: 'Aplicar na floração com alta umidade relativa' },
    'mosca branca': { produto: 'Neoron 500 CE', dose: '500 mL/ha', acao: 'Aplicar em rotação; evitar resistência' },
    'spodoptera': { produto: 'Certero 480 SC', dose: '65 mL/ha', acao: 'Aplicar no 1º instar, nas horas frescas' },

    // DOENÇAS
    'ferrugem asiática': { produto: 'Opera Ultra EC', dose: '0,75 L/ha', acao: 'Aplicar fungicida sistêmico preventivo/curativo em até 3 dias' },
    'ferrugem': { produto: 'Opera Ultra EC', dose: '0,75 L/ha', acao: 'Aplicar fungicida sistêmico; repetir em 14 dias se necessário' },
    'mancha alvo': { produto: 'Priori Xtra SC', dose: '300 mL/ha', acao: 'Aplicar no início dos sintomas, associado a óleo mineral' },
    'antracnose': { produto: 'Comet 200 EC', dose: '300 mL/ha', acao: 'Aplicar de forma preventiva em período chuvoso' },
    'oídio': { produto: 'Sphere Max SC', dose: '300 mL/ha', acao: 'Aplicar ao primeiro sinal, repetir em 10–14 dias' },
    'cercosporiose': { produto: 'Artea 325 SC', dose: '300 mL/ha', acao: 'Aplicar preventivamente na abertura floral' },
    'míldio': { produto: 'Aliette 800 WG', dose: '200 g/ha', acao: 'Aplicar até 48h após detecção; incluir espalhante adesivo' },
    'soja louca': { produto: 'Vertimec 18 CE', dose: '250 mL/ha', acao: 'Controle do vetor (ácaro branco); aplicar 2× em 7 dias' },
    'podridão de colmo': { produto: 'Derosal Plus SC', dose: '1,5 L/ha', acao: 'Aplicar via sulco no plantio ou raiz; evitar estresse hídrico' },
    'sclerotinia': { produto: 'Folicur 200 EC', dose: '0,5 L/ha', acao: 'Aplicar preventivamente no R1–R2 (floração)' },

    // PLANTAS DANINHAS
    'buva': { produto: 'Roundup Original DI', dose: '2,0 L/ha', acao: 'Aplicar em pré-emergência ou plantas jovens; rotacionar mecanismo de ação' },
    'capim colchão': { produto: 'Select 240 EC', dose: '600 mL/ha', acao: 'Aplicar de 3 a 5 folhas do capim' },
    'capim braquiária': { produto: 'Fusilade Flex 125 EW', dose: '1,0 L/ha', acao: 'Aplicar no perfilhamento; evitar chuva em 4h' },
    'corda de viola': { produto: 'Cobra 240 EC', dose: '500 mL/ha', acao: 'Aplicar com alto volume de calda (200 L/ha)' },
    'tiririca': { produto: 'Basagran 600 EC', dose: '1,5 L/ha', acao: 'Aplicar de 3 a 5 folhas; não misturar com graminicidas' },
    'amendoim bravo': { produto: 'Pivot H 100 SL', dose: '600 mL/ha', acao: 'Aplicar em pós-emergência da lavoura e da planta daninha' },
    'picão preto': { produto: 'Classic 250 WG', dose: '50 g/ha', acao: 'Aplicar no início do desenvolvimento; usar espalhante adesivo' },
};

// Produto padrão caso o organismo não esteja no banco
function getProdutoPadrao(tipo: TipoOrganismo) {
    if (tipo === 'praga') return { produto: 'Inseticida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Realizar controle conforme receituário agronômico' };
    if (tipo === 'doenca') return { produto: 'Fungicida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Aplicar fungicida conforme receituário agronômico' };
    return { produto: 'Herbicida recomendado (consultar eng. agrônomo)', dose: 'consultar bula', acao: 'Aplicar herbicida conforme receituário agronômico' };
}

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

// ─── Motor principal de recomendações ─────────────────────────────────────────
// Recebe os pontos de um talhão e gera 1 recomendação por organismo único
export function gerarRecomendacoes(
    pontos: { identificador: string; infestacoes: { tipo: TipoOrganismo; nome: string; severidade: number }[] }[]
): Recomendacao[] {
    // Agrupar por organismo (nome normalizado) e acumular pontos + severidade
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

    // Gerar 1 recomendação por organismo único
    const recomendacoes: Recomendacao[] = Object.values(mapa).map(({ tipo, nome, severidades, pontos: pts }) => {
        const severidadeMedia = severidades.reduce((a, b) => a + b, 0) / severidades.length;
        const key = nome.toLowerCase().trim();
        const dadosProduto = PRODUTOS_POR_ORGANISMO[key] ?? getProdutoPadrao(tipo);

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
