/**
 * Normaliza o payload do relatório de plantio para o formato esperado pelos componentes.
 * Aceita tanto camelCase (web/app) quanto snake_case (API/legado) e garante
 * DAE, DAP, Estádio e Data do plantio vindos de contextoSafra, evolucaoCultura, fenologia ou estande.
 */

type UnknownRecord = Record<string, unknown>;

function getNum(v: unknown): number | undefined {
  if (v == null) return undefined;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function getStr(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === 'string') return v.trim() || undefined;
  return String(v).trim() || undefined;
}

function getArr<T>(v: unknown, mapItem: (x: unknown) => T | null): T[] {
  if (!Array.isArray(v)) return [];
  const out: T[] = [];
  for (const item of v) {
    const m = mapItem(item);
    if (m != null) out.push(m);
  }
  return out;
}

export function normalizeRelatorioPlantio(raw: UnknownRecord): UnknownRecord {
  const talhao = (raw.talhao ?? raw.talhão) as UnknownRecord | undefined;
  const contextoSafra = (raw.contextoSafra ?? raw.contexto_safra) as UnknownRecord | undefined;
  const evolucaoCultura = (raw.evolucaoCultura ?? raw.evolucao_cultura) as UnknownRecord | undefined;
  const fenologia = (raw.fenologia) as UnknownRecord | undefined;
  const estande = (raw.estande) as UnknownRecord | undefined;
  const plantabilidade = (raw.plantabilidade) as UnknownRecord | undefined;
  const populacao = (raw.populacao) as UnknownRecord | undefined;

  const talhaoNorm: UnknownRecord = {
    ...(typeof talhao === 'object' && talhao !== null ? talhao : {}),
    id: getStr(talhao?.id),
    nome: getStr(talhao?.nome),
    cultura: getStr(talhao?.cultura),
    area: getNum(talhao?.area),
    dataPlantio: getStr(talhao?.dataPlantio ?? (talhao as UnknownRecord)?.data_plantio),
  };

  const registrosEstande = Array.isArray(estande?.registros) ? estande.registros as UnknownRecord[] : [];
  const ultimoEstande = registrosEstande.length > 0 ? registrosEstande[registrosEstande.length - 1] : undefined;

  const dae =
    getNum(contextoSafra?.dae) ??
    getNum(evolucaoCultura?.dae ?? (evolucaoCultura as UnknownRecord)?.dias_apos_emergencia) ??
    getNum(fenologia?.dae ?? (fenologia as UnknownRecord)?.dias_apos_emergencia) ??
    getNum(ultimoEstande?.dae ?? (ultimoEstande as UnknownRecord)?.dias_apos_emergencia);

  const dap =
    getNum(contextoSafra?.dap) ??
    getNum(evolucaoCultura?.dap ?? (evolucaoCultura as UnknownRecord)?.dias_apos_plantio) ??
    getNum(fenologia?.dap ?? (fenologia as UnknownRecord)?.dias_apos_plantio) ??
    getNum(ultimoEstande?.dap ?? (ultimoEstande as UnknownRecord)?.dias_apos_plantio);

  const estadio =
    getStr(evolucaoCultura?.estadioAtual ?? (evolucaoCultura as UnknownRecord)?.estadio_atual) ??
    getStr(fenologia?.estadio ?? (fenologia as UnknownRecord)?.estagio ?? (fenologia as UnknownRecord)?.estagio_fenologico);

  const dataPlantioStr =
    getStr(talhaoNorm.dataPlantio) ??
    getStr(contextoSafra?.dataPlantio ?? (contextoSafra as UnknownRecord)?.data_plantio);

  const contextoSafraNorm: UnknownRecord = {
    ...(typeof contextoSafra === 'object' && contextoSafra !== null ? contextoSafra : {}),
    espacamentoCm: getNum(contextoSafra?.espacamentoCm ?? (contextoSafra as UnknownRecord)?.espacamento_cm),
    populacaoAlvoPlHa: getNum(contextoSafra?.populacaoAlvoPlHa ?? (contextoSafra as UnknownRecord)?.populacao_alvo_pl_ha),
    dae,
    dap,
    dataPlantio: dataPlantioStr,
  };

  const evolucaoCulturaNorm: UnknownRecord = {
    ...(typeof evolucaoCultura === 'object' && evolucaoCultura !== null ? evolucaoCultura : {}),
    estadioAtual: estadio ?? getStr(evolucaoCultura?.estadioAtual ?? (evolucaoCultura as UnknownRecord)?.estadio_atual),
    estadioPrevisto: getStr(evolucaoCultura?.estadioPrevisto ?? (evolucaoCultura as UnknownRecord)?.estadio_previsto),
    somaTermica: getNum(evolucaoCultura?.somaTermica ?? (evolucaoCultura as UnknownRecord)?.soma_termica),
    atrasoFenologico: getNum(evolucaoCultura?.atrasoFenologico ?? (evolucaoCultura as UnknownRecord)?.atraso_fenologico),
    dae: dae ?? getNum(evolucaoCultura?.dae),
    dap: dap ?? getNum(evolucaoCultura?.dap),
  };

  const fenologiaNorm: UnknownRecord = {
    ...(typeof fenologia === 'object' && fenologia !== null ? fenologia : {}),
    estadio: estadio ?? getStr(fenologia?.estadio ?? (fenologia as UnknownRecord)?.estagio),
    estagio: getStr((fenologia as UnknownRecord)?.estagio_fenologico),
    dae: dae ?? getNum(fenologia?.dae),
    dap: dap ?? getNum(fenologia?.dap),
  };

  const linhaRaw = plantabilidade?.linha ?? (plantabilidade as UnknownRecord)?.linha;
  const linha = getArr(linhaRaw, (p) => {
    if (p == null || typeof p !== 'object') return null;
    const o = p as UnknownRecord;
    const tipo = getStr(o.tipo);
    if (!tipo) return null;
    return { tipo, posicao: getNum(o.posicao) } as unknown as { tipo: string; posicao?: number };
  });

  const espacamentosRaw = plantabilidade?.espacamentosIndividuais ?? (plantabilidade as UnknownRecord)?.espacamentos_individuais;
  const espacamentosIndividuais = getArr(espacamentosRaw, (e) => {
    if (e == null || typeof e !== 'object') return null;
    const o = e as UnknownRecord;
    const tipo = getStr(o.tipo);
    if (!tipo) return null;
    return { cm: getNum(o.cm), tipo } as unknown as { cm?: number; tipo: string };
  });

  const plantabilidadeNorm: UnknownRecord = {
    ...(typeof plantabilidade === 'object' && plantabilidade !== null ? plantabilidade : {}),
    espacamentoIdealCm: getNum(plantabilidade?.espacamentoIdealCm ?? (plantabilidade as UnknownRecord)?.espacamento_ideal_cm),
    espacamentoRealCm: getNum(plantabilidade?.espacamentoRealCm ?? (plantabilidade as UnknownRecord)?.espacamento_real_cm),
    cvPercentual: getNum(plantabilidade?.cvPercentual ?? (plantabilidade as UnknownRecord)?.cv_percentual ?? (plantabilidade as UnknownRecord)?.coeficiente_variacao),
    duplasPct: getNum(plantabilidade?.duplasPct ?? (plantabilidade as UnknownRecord)?.duplas_pct),
    triplasPct: getNum(plantabilidade?.triplasPct ?? (plantabilidade as UnknownRecord)?.triplas_pct),
    falhasPct: getNum(plantabilidade?.falhasPct ?? (plantabilidade as UnknownRecord)?.falhas_pct),
    okPct: getNum(plantabilidade?.okPct ?? (plantabilidade as UnknownRecord)?.ok_pct),
    indicePlantabilidade: getNum(plantabilidade?.indicePlantabilidade ?? (plantabilidade as UnknownRecord)?.indice_plantabilidade),
    linha: linha.length > 0 ? linha : (Array.isArray(plantabilidade?.linha) ? plantabilidade.linha : []),
    espacamentosIndividuais: espacamentosIndividuais.length > 0 ? espacamentosIndividuais : (Array.isArray(plantabilidade?.espacamentosIndividuais) ? plantabilidade.espacamentosIndividuais : Array.isArray((plantabilidade as UnknownRecord)?.espacamentos_individuais) ? (plantabilidade as UnknownRecord).espacamentos_individuais : []),
  };

  const estandeNorm: UnknownRecord =
    typeof estande === 'object' && estande !== null
      ? {
          ...estande,
          registros: Array.isArray(estande.registros)
            ? (estande.registros as UnknownRecord[]).map((r) => ({
                ...r,
                data: getStr(r.data ?? (r as UnknownRecord).data_avaliacao) ?? r.data,
                plantasPorMetro: getNum(r.plantasPorMetro ?? (r as UnknownRecord).plantas_por_metro),
                plantasHa: getNum(r.plantasHa ?? (r as UnknownRecord).plantas_ha),
                dae: getNum(r.dae ?? (r as UnknownRecord).dias_apos_emergencia),
                dap: getNum(r.dap ?? (r as UnknownRecord).dias_apos_plantio),
              }))
            : estande.registros,
        }
      : {};

  return {
    ...raw,
    talhao: { ...talhaoNorm, dataPlantio: dataPlantioStr ?? talhaoNorm.dataPlantio },
    contextoSafra: contextoSafraNorm,
    evolucaoCultura: evolucaoCulturaNorm,
    fenologia: fenologiaNorm,
    plantabilidade: plantabilidadeNorm,
    estande: Object.keys(estandeNorm).length > 0 ? estandeNorm : raw.estande,
    populacao: populacao ?? raw.populacao,
  };
}
