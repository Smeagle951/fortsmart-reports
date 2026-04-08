/**
 * Normaliza o payload do relatório de visita técnica.
 * Aceita V1 (flat) e V2 (core + modulos.visitaTecnica.*) e retorna
 * um objeto flat compatível com RelatorioVisitaTecnicaContent.
 */

type UnknownRecord = Record<string, unknown>;

export function normalizeRelatorioVisitaTecnica(raw: UnknownRecord): UnknownRecord {
    // ─── V2 bridge ────────────────────────────────────────────────
    const core = (raw.core ?? {}) as UnknownRecord;
    const modVT = ((raw.modulos as UnknownRecord)?.visitaTecnica ?? {}) as UnknownRecord;
    const indicadores = (raw.indicadores ?? {}) as UnknownRecord;
    const assinaturaV2 = (raw.assinatura ?? {}) as UnknownRecord;
    const anexos = (raw.anexos ?? {}) as UnknownRecord;
    const mapaV2 = (raw.mapa ?? {}) as UnknownRecord;

    const isV2 = Object.keys(core).length > 0 || Object.keys(modVT).length > 0;

    // ─── Normalização crítica: garantir talhoes como array ─────────────────────
    // Se vier talhao (objeto singular) mas não talhoes (array), converter
    if (!isV2 && raw.talhao && !raw.talhoes) {
        const normalized = { ...raw };
        normalized.talhoes = [raw.talhao];
        return normalized;
    }

    if (!isV2) return raw; // V1 passthrough — sem modificação

    // modulos.visitaTecnica sub-objects
    const evolFeno = (modVT.evolucaoFenologica ?? {}) as UnknownRecord;
    const medCrescimento = (evolFeno.medicoesCrescimento ?? {}) as UnknownRecord;
    const condCampo = (evolFeno.condicoesCampo ?? {}) as UnknownRecord;
    const estandeDens = (evolFeno.estandeEDensidade ?? {}) as UnknownRecord;
    const fito = (modVT.fitossanidade ?? {}) as UnknownRecord;
    const planoAcaoV2 = (modVT.planoAcao ?? {}) as UnknownRecord;
    const diagnosticoV2 = (modVT.diagnostico ?? {}) as UnknownRecord;
    const aplicacoesV2 = Array.isArray(modVT.aplicacoesRealizadas) ? modVT.aplicacoesRealizadas as UnknownRecord[] : [];

    // Flatten pragas + doenças + daninhas → V1 pragas[]
    const pragasV2 = Array.isArray(fito.pragas) ? (fito.pragas as UnknownRecord[]).map((p) => ({ ...p, tipo: 'praga' })) : [];
    const doencasV2 = Array.isArray(fito.doencas) ? (fito.doencas as UnknownRecord[]).map((d) => ({ ...d, tipo: 'doença' })) : [];
    const danV2 = Array.isArray(fito.daninhas) ? (fito.daninhas as UnknownRecord[]).map((d) => ({ ...d, tipo: 'daninha', nome: d.especie ?? d.nome, alvo: d.especie ?? d.nome })) : [];
    const pragasMerged = [...pragasV2, ...doencasV2, ...danV2];

    // V2 mapa marcadores → pontos no mapa
    const mapaMarcadores = Array.isArray(mapaV2.marcadores) ? mapaV2.marcadores : undefined;
    const mapaOut: UnknownRecord = {
        ...(mapaV2.geodata as UnknownRecord ?? {}),
        polygon: ((mapaV2.geodata as UnknownRecord)?.polygon as unknown),
        pontos: mapaMarcadores,
        ...mapaV2,
    };

    // V2 imagens from anexos.imagens, normalize field names
    const imagensRaw = Array.isArray(anexos.imagens) ? (anexos.imagens as UnknownRecord[]) : [];
    // RelatorioVisitaTecnicaContent expects: url, descricao, categoria, data
    const imagens = imagensRaw.map((img) => ({
        ...img,
        descricao: img.legenda ?? img.descricao,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        categoria: img.categoria,
        data: img.data,
    }));

    // ─── Normalização crítica para V2: garantir arrays ───────────────────────────
    const normalizedV2 = { ...raw };

    // Garantir talhoes como array (se vier talhao singular)
    if (!normalizedV2.talhoes && normalizedV2.talhao) {
        normalizedV2.talhoes = [normalizedV2.talhao];
    }

    // Garantir imagens como array
    if (!Array.isArray(normalizedV2.imagens) && normalizedV2.imagens) {
        normalizedV2.imagens = [];
    }

    // Garantir pragas como array
    if (!Array.isArray(normalizedV2.pragas) && normalizedV2.pragas) {
        normalizedV2.pragas = [];
    }

    // Garantir aplicacoes como array
    if (!Array.isArray(normalizedV2.aplicacoes) && normalizedV2.aplicacoes) {
        normalizedV2.aplicacoes = [];
    }

    return {
        // Preserve all normalized V2 fields
        ...normalizedV2,

        // ── meta fields ──
        meta: normalizedV2.meta ?? {
            id: core.reportId,
            dataGeracao: core.createdAt ?? core.publishedAt,
            tecnico: (core.generatedBy as UnknownRecord)?.nome,
            tecnicoCrea: (core.generatedBy as UnknownRecord)?.crea,
            safra: (normalizedV2.talhao as UnknownRecord)?.safra ?? (normalizedV2.contextoSafra as UnknownRecord)?.safra,
            versao: core.version ?? 2,
            status: core.status ?? 'published',
        },

        // ── fenologia: from evolucaoFenologica ──
        fenologia: raw.fenologia ?? {
            estadio: evolFeno.estagioFenologico,
            estagio: evolFeno.estagioFenologico,
            dae: evolFeno.dae ?? (raw.contextoSafra as UnknownRecord)?.dae,
            dap: (raw.contextoSafra as UnknownRecord)?.dap,
            altura: medCrescimento.alturaCm,
            folhas: medCrescimento.numeroFolhas,
            nos: medCrescimento.numeroNos,
            observacoes: evolFeno.observacoes,
            historico: [],
        },

        // ── populacao: from estandeEDensidade ──
        populacao: raw.populacao ?? (Object.keys(estandeDens).length > 0 ? {
            plantasHa: estandeDens.estandePlantasHa,
            eficienciaPct: estandeDens.percentualSanidade,
            situacao: estandeDens.percentualFalhas != null
                ? `${100 - Number(estandeDens.percentualFalhas)}% sanidade`
                : undefined,
        } : undefined),

        // ── condicoes: from condicoesCampo ──
        condicoes: raw.condicoes ?? (Object.keys(condCampo).length > 0 ? {
            temperatura: condCampo.temperaturaMediaC,
            umidade: condCampo.umidadeRelativaPct,
            sintomas: condCampo.sintomasObservados,
            presencaPragas: condCampo.presencaPragas,
            presencaDoencas: condCampo.presencaDoencas,
        } : {}),

        // ── pragas: merged from fitossanidade ──
        pragas: (raw.pragas as unknown[] | undefined)?.length ? raw.pragas : (pragasMerged.length > 0 ? pragasMerged : undefined),

        // ── aplicacoes: from aplicacoesRealizadas ──
        aplicacoes: (raw.aplicacoes as unknown[] | undefined)?.length ? raw.aplicacoes : aplicacoesV2,

        // ── diagnostico ──
        diagnostico: raw.diagnostico ?? (Object.keys(diagnosticoV2).length > 0 ? diagnosticoV2 : undefined),

        // ── planoAcao ──
        planoAcao: raw.planoAcao ?? (Object.keys(planoAcaoV2).length > 0 ? planoAcaoV2 : undefined),

        // ── conclusao: from assinatura.conclusao ──
        conclusao: raw.conclusao ?? assinaturaV2.conclusao,

        // ── assinaturaTecnica ──
        assinaturaTecnica: raw.assinaturaTecnica ?? (assinaturaV2.nome ? {
            nome: assinaturaV2.nome,
            crea: assinaturaV2.crea,
            dataAssinatura: assinaturaV2.dataAssinatura ?? assinaturaV2.data,
            cidade: assinaturaV2.cidade,
        } : undefined),

        // ── mapa ──
        mapa: raw.mapa ? mapaOut : undefined,

        // ── imagens ──
        imagens: (raw.imagens as unknown[] | undefined)?.length ? raw.imagens : (imagens.length > 0 ? imagens : undefined),

        // ── indicadores → indiceAgronomicoTalhao ──
        indiceAgronomicoTalhao: raw.indiceAgronomicoTalhao ?? (indicadores.scoreGeral != null ? {
            valor: indicadores.indiceAgronomicoTalhao ?? indicadores.scoreGeral,
            maximo: 100,
            status: indicadores.riscoAtual === 'baixo' ? 'Saudável' : 'Atenção',
            itens: Array.isArray(indicadores.itemsIAT) ? indicadores.itemsIAT : [],
        } : undefined),
    };
}
