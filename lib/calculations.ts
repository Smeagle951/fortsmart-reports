import { MetricasPonto, MetricasTalhao, NivelClassificacao, Talhao, TipoOrganismo } from './types/monitoring';

export function classificarNivel(severidade: number): NivelClassificacao {
    if (severidade < 10) return 'CONTROLADO';
    if (severidade < 25) return 'ATENCAO';
    if (severidade < 40) return 'ALTO_RISCO';
    return 'CRITICO';
}

export function calcularMetricasTalhao(talhao: Talhao): MetricasTalhao {
    const totalPontos = talhao.pontos.length;
    const pontosComInfestacao = talhao.pontos.filter(p => p.infestacoes.length > 0).length;

    let totalOcorrencias = 0;
    let somaSeveridades = 0;
    let numSeveridades = 0;
    let totalPragas = 0;
    let totalDoencas = 0;
    let totalDaninhas = 0;

    // Mapa nome→contagem de pontos com aquele organismo
    const contagemOrganismo: Record<string, { count: number; tipo: TipoOrganismo }> = {};

    for (const ponto of talhao.pontos) {
        for (const inf of ponto.infestacoes) {
            totalOcorrencias++;
            somaSeveridades += inf.severidade;
            numSeveridades++;

            if (inf.tipo === 'praga') totalPragas++;
            if (inf.tipo === 'doenca') totalDoencas++;
            if (inf.tipo === 'daninha') totalDaninhas++;

            const key = inf.nome;
            if (!contagemOrganismo[key]) contagemOrganismo[key] = { count: 0, tipo: inf.tipo };
            contagemOrganismo[key].count++;
        }
    }

    const severidadeMedia = numSeveridades > 0 ? somaSeveridades / numSeveridades : 0;
    const indiceOcorrencia = totalPontos > 0 ? (pontosComInfestacao / totalPontos) * 100 : 0;
    const total = totalPragas + totalDoencas + totalDaninhas || 1;

    const pragas_pct = Math.round((totalPragas / total) * 100);
    const doencas_pct = Math.round((totalDoencas / total) * 100);
    const daninhas_pct = Math.round((totalDaninhas / total) * 100);

    // Top 5 infestações por índice de ocorrência
    const entries = Object.entries(contagemOrganismo);
    const top5Infestacoes = entries.length > 0
        ? entries
            .map(([nome, { count, tipo }]) => ({
                nome,
                tipo,
                percentual: Math.round((count / totalPontos) * 100),
            }))
            .sort((a, b) => b.percentual - a.percentual)
            .slice(0, 5)
        : [];

    return {
        totalPontos,
        pontosComInfestacao,
        totalOcorrencias,
        indiceOcorrencia: Math.round(indiceOcorrencia),
        severidadeMedia: Math.round(severidadeMedia),
        classificacao: classificarNivel(severidadeMedia),
        pragas_pct,
        doencas_pct,
        daninhas_pct,
        top5Infestacoes,
    };
}

export function calcularMetricasPorPonto(talhao: Talhao): MetricasPonto[] {
    return talhao.pontos.map(ponto => {
        const numOcorrencias = ponto.infestacoes.length;
        const severidadeMedia = numOcorrencias > 0
            ? ponto.infestacoes.reduce((s, i) => s + i.severidade, 0) / numOcorrencias
            : 0;

        return {
            pontoId: ponto.id,
            identificador: ponto.identificador,
            numOcorrencias,
            severidadeMedia: Math.round(severidadeMedia),
            classificacao: classificarNivel(severidadeMedia),
        };
    });
}

export function corClassificacao(nivel: NivelClassificacao): string {
    switch (nivel) {
        case 'CONTROLADO': return '#2E7D32';
        case 'ATENCAO': return '#F9A825';
        case 'ALTO_RISCO': return '#E65100';
        case 'CRITICO': return '#C62828';
    }
}

export function labelClassificacao(nivel: NivelClassificacao): string {
    switch (nivel) {
        case 'CONTROLADO': return 'Controlado';
        case 'ATENCAO': return 'Atenção';
        case 'ALTO_RISCO': return 'Alto Risco';
        case 'CRITICO': return 'Crítico';
    }
}
