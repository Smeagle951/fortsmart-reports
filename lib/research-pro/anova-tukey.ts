/**
 * Motor de análise estatística para relatório Research Pro.
 * ANOVA DBC (Delineamento em Blocos Casualizados) + Teste de Tukey.
 * Usado no relatório web para gerar estatística a partir dos dados de avaliação.
 */

import type {
  ResearchProReportAvaliacao,
  ResearchProReportAnovaLinha,
  ResearchProReportEstatistica,
  ResearchProReportEstatisticaVariavel,
  ResearchProReportEstatisticaVariavelAnova,
  ResearchProReportTukeyGrupo,
} from '@/types/research-report';

/** Extrai número do bloco do id da parcela (ex: B1P1 -> 1, B2P3 -> 2). */
function extrairBloco(parcela: string): number {
  const m = /B(\d+)/i.exec(parcela);
  return m ? parseInt(m[1], 10) : 1;
}

/** Agrupa dados por (bloco, programa) para DBC. Assume um valor por célula. */
function montarMatrizDbc(
  dados: { parcela: string; programa: string; valor: number }[]
): { blocos: number[]; programas: string[]; valores: Map<string, number> } {
  const blocosSet = new Set<number>();
  const programasSet = new Set<string>();
  const valores = new Map<string, number>();

  for (const d of dados) {
    const bloco = extrairBloco(d.parcela);
    blocosSet.add(bloco);
    programasSet.add(d.programa);
    valores.set(`${bloco}-${d.programa}`, d.valor);
  }

  const blocos = Array.from(blocosSet).sort((a, b) => a - b);
  const programas = Array.from(programasSet);

  return { blocos, programas, valores };
}

/** Soma dos quadrados total. */
function sqTotal(valores: number[], mediaGeral: number): number {
  return valores.reduce((s, y) => s + (y - mediaGeral) ** 2, 0);
}

/** Distribuição F: aproximação do p-value P(F > x) para df1, df2. */
function pValueF(x: number, df1: number, df2: number): number {
  if (x <= 0 || df1 <= 0 || df2 <= 0) return 1;
  if (!Number.isFinite(x) || x > 1e10) return 0;
  // Aproximação via relação com Beta: p = 1 - I_{df2/(df2+df1*x)}(df2/2, df1/2)
  const z = df2 / (df2 + df1 * x);
  return 1 - regularizedBeta(z, df2 / 2, df1 / 2);
}

/** Beta regularizada I_x(a,b) por série (convergente para a,b > 0, 0 <= x <= 1). */
function regularizedBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  // Série de potências (continuação fraca): I_x(a,b) = (x^a / beta(a,b)) * 1F1(a, a+b, x)...
  // Usamos aproximação numérica por integração trapezoidal simples.
  const n = 200;
  let sum = 0;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * x;
    const w = i === 0 || i === n ? 0.5 : 1;
    if (t > 0 && t < 1) {
      sum += w * Math.pow(t, a - 1) * Math.pow(1 - t, b - 1);
    }
  }
  const betaAb = (gamma(a) * gamma(b)) / gamma(a + b);
  return (sum * x) / n / betaAb;
}

function gamma(z: number): number {
  if (z <= 0) return Infinity;
  if (z < 1) return gamma(z + 1) / z;
  if (z > 3) return (z - 1) * gamma(z - 1);
  const g = [1, 1, 2, 6]; // 0!, 1!, 2!, 3!
  const i = Math.floor(z);
  const f = z - i;
  return g[i] * (1 - f) + g[Math.min(i + 1, 3)] * f;
}

/** Valor crítico de Tukey (alpha=0.05) aproximado. k = nº tratamentos, df = GL do erro. */
function tukeyQ(k: number, df: number): number {
  const table: Record<string, number> = {
    '2_5': 3.64, '2_6': 3.46, '2_7': 3.34, '2_8': 3.26, '2_9': 3.2, '2_10': 3.15,
    '2_12': 3.08, '2_15': 3.01, '2_20': 2.95, '2_24': 2.92, '2_30': 2.89,
    '3_5': 4.6, '3_6': 4.34, '3_7': 4.16, '3_8': 4.04, '3_9': 3.95, '3_10': 3.88,
    '3_12': 3.77, '3_15': 3.65, '3_20': 3.58, '3_24': 3.53, '3_30': 3.49,
    '4_5': 5.22, '4_6': 4.9, '4_7': 4.68, '4_8': 4.53, '4_9': 4.41, '4_10': 4.33,
    '4_12': 4.2, '4_15': 4.08, '4_20': 4.0, '4_24': 3.96, '4_30': 3.89,
    '5_5': 5.67, '5_6': 5.3, '5_7': 5.06, '5_8': 4.89, '5_9': 4.76, '5_10': 4.65,
    '5_12': 4.51, '5_15': 4.37, '5_20': 4.28, '5_24': 4.23, '5_30': 4.17,
    '6_6': 5.63, '6_7': 5.36, '6_8': 5.17, '6_9': 5.02, '6_10': 4.91, '6_12': 4.75,
    '6_15': 4.59, '6_20': 4.49, '6_24': 4.45, '6_30': 4.39,
    '7_7': 5.8, '7_8': 5.6, '7_9': 5.43, '7_10': 5.3, '7_12': 5.12, '7_15': 4.96,
    '8_8': 6.0, '8_9': 5.82, '8_10': 5.67, '8_12': 5.47, '8_15': 5.28,
    '9_9': 6.16, '9_10': 6.0, '9_12': 5.79, '9_15': 5.59,
    '10_10': 6.3, '10_12': 6.08, '10_15': 5.86,
  };
  const key = `${k}_${df}`;
  if (table[key] != null) return table[key];
  if (df <= 0) return 4;
  return 2.8 + Math.min(k - 2, 8) * 0.35 + (30 - Math.min(df, 30)) * 0.02;
}

/** ANOVA DBC: retorna SQ, GL, QM, F e p-value para tratamentos. */
function anovaDbc(
  blocos: number[],
  programas: string[],
  valores: Map<string, number>
): { sqTrat: number; sqBloco: number; sqErro: number; sqTot: number; glTrat: number; glBloco: number; glErro: number; glTotal: number; qmErro: number; qmTrat: number; qmBloco: number; fTrat: number; pValue: number } {
  const b = blocos.length;
  const t = programas.length;
  const n = b * t;

  let total = 0;
  const porTrat: Record<string, number> = {};
  const porBloco: Record<number, number> = {};
  programas.forEach((p) => { porTrat[p] = 0; });
  blocos.forEach((bl) => { porBloco[bl] = 0; });

  for (const bl of blocos) {
    for (const pr of programas) {
      const v = valores.get(`${bl}-${pr}`);
      if (v == null) continue;
      total += v;
      porTrat[pr] += v;
      porBloco[bl] += v;
    }
  }

  const mediaGeral = total / n;
  let sqTot = 0;
  for (const bl of blocos) {
    for (const pr of programas) {
      const v = valores.get(`${bl}-${pr}`);
      if (v != null) sqTot += (v - mediaGeral) ** 2;
    }
  }

  const sqTrat = (1 / b) * Object.values(porTrat).reduce((s, y) => s + y * y, 0) - (total * total) / n;
  const sqBloco = (1 / t) * Object.values(porBloco).reduce((s, y) => s + y * y, 0) - (total * total) / n;
  const sqErro = Math.max(0, sqTot - sqTrat - sqBloco);

  const glTrat = t - 1;
  const glBloco = b - 1;
  const glErro = (t - 1) * (b - 1);
  const glTotal = n - 1;
  const qmErro = glErro > 0 ? sqErro / glErro : 0;
  const qmTrat = glTrat > 0 ? sqTrat / glTrat : 0;
  const qmBloco = glBloco > 0 ? sqBloco / glBloco : 0;
  const fTrat = qmErro > 0 ? qmTrat / qmErro : 0;
  const pValue = pValueF(fTrat, glTrat, glErro);

  return { sqTrat, sqBloco, sqErro, sqTot, glTrat, glBloco, glErro, glTotal, qmErro, qmTrat, qmBloco, fTrat, pValue };
}

/** Médias por tratamento. */
function mediasPorPrograma(
  blocos: number[],
  programas: string[],
  valores: Map<string, number>
): { programa: string; media: number }[] {
  const b = blocos.length;
  return programas.map((pr) => {
    let sum = 0;
    let count = 0;
    for (const bl of blocos) {
      const v = valores.get(`${bl}-${pr}`);
      if (v != null) {
        sum += v;
        count++;
      }
    }
    return { programa: pr, media: count > 0 ? sum / count : 0 };
  });
}

/**
 * Atribui grupos Tukey (A, AB, B): médias não significativamente diferentes compartilham letra.
 * Ordena por média decrescente; para cada tratamento, junta letras de todos os anteriores que não diferem dele.
 */
function atribuirGruposTukey(
  medias: { programa: string; media: number }[],
  dms: number
): ResearchProReportTukeyGrupo[] {
  const sorted = [...medias].sort((a, b) => b.media - a.media);
  const n = sorted.length;
  const letras = 'ABCDEFGHIJ';
  const grupos: string[] = new Array(n);
  let proximaLetra = 0;

  for (let i = 0; i < n; i++) {
    const letrasCompatíveis = new Set<string>();
    for (let j = 0; j < i; j++) {
      if (Math.abs(sorted[i].media - sorted[j].media) <= dms && grupos[j])
        letrasCompatíveis.add(grupos[j]);
    }
    if (letrasCompatíveis.size === 0) {
      grupos[i] = letras[proximaLetra++] ?? 'Z';
    } else {
      grupos[i] = Array.from(letrasCompatíveis).sort().join('');
    }
  }

  return sorted.map((m, i) => ({ programa: m.programa, media: m.media, grupo: grupos[i] ?? 'A' }));
}

/**
 * Calcula ANOVA DBC e Tukey para uma variável (uma avaliação).
 */
export function calcularEstatisticaVariavel(avaliacao: ResearchProReportAvaliacao): ResearchProReportEstatisticaVariavel | null {
  const { dados } = avaliacao;
  if (!dados || dados.length < 4) return null;

  const { blocos, programas, valores } = montarMatrizDbc(dados);
  const t = programas.length;
  const b = blocos.length;
  const n = b * t;
  if (n < 4 || t < 2 || b < 2) return null;

  const anovaResult = anovaDbc(blocos, programas, valores);
  const { glTrat, glBloco, glErro, glTotal, sqTrat, sqBloco, sqErro, sqTot, qmTrat, qmBloco, qmErro, fTrat, pValue } = anovaResult;
  const medias = mediasPorPrograma(blocos, programas, valores);
  const mediaGeral = medias.reduce((s, m) => s + m.media, 0) / medias.length;
  const variancia = medias.reduce((s, m) => s + (m.media - mediaGeral) ** 2, 0) / Math.max(medias.length - 1, 1);
  const desvio = Math.sqrt(variancia);
  const cv = mediaGeral !== 0 ? (desvio / mediaGeral) * 100 : 0;
  const dms = Math.sqrt(qmErro / Math.max(b, 1)) * tukeyQ(t, glErro);
  const tukey = atribuirGruposTukey(medias, dms);

  const anova: ResearchProReportEstatisticaVariavelAnova = {
    f_calculado: Math.round(fTrat * 1000) / 1000,
    p_value: Math.round(pValue * 10000) / 10000,
    significativo: pValue < 0.05,
  };

  const anova_tabela: ResearchProReportAnovaLinha[] = [
    { fonte: 'Tratamento', gl: glTrat, sq: Math.round(sqTrat * 1000) / 1000, qm: Math.round(qmTrat * 1000) / 1000, f: Math.round(fTrat * 1000) / 1000, p: Math.round(pValue * 10000) / 10000 },
    { fonte: 'Bloco', gl: glBloco, sq: Math.round(sqBloco * 1000) / 1000, qm: Math.round(qmBloco * 1000) / 1000 },
    { fonte: 'Erro', gl: glErro, sq: Math.round(sqErro * 1000) / 1000, qm: Math.round(qmErro * 1000) / 1000 },
    { fonte: 'Total', gl: glTotal, sq: Math.round(sqTot * 1000) / 1000, qm: 0 },
  ];

  return {
    nome: avaliacao.variavel,
    unidade: avaliacao.unidade ?? '',
    anova,
    cv_percentual: Math.round(cv * 10) / 10,
    tukey,
    dms: Math.round(dms * 1000) / 1000,
    anova_tabela,
  };
}

/**
 * Gera o objeto estatística completo a partir das avaliações.
 * Usado na página do relatório quando o payload tem avaliacoes mas não tem estatistica preenchida.
 */
export function calcularEstatisticaFromAvaliacoes(
  avaliacoes: ResearchProReportAvaliacao[]
): ResearchProReportEstatistica {
  const variaveis: ResearchProReportEstatisticaVariavel[] = [];

  for (const av of avaliacoes || []) {
    const v = calcularEstatisticaVariavel(av);
    if (v) variaveis.push(v);
  }

  return { variaveis };
}
