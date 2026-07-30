import {
  classificarNivel,
  labelClassificacao,
} from '@/lib/calculations';
import type {
  NivelClassificacao,
  OrganismoContextoWeb,
  Recomendacao,
  TipoOrganismo,
} from '@/lib/types/monitoring';
import type {
  MonitoringValueSource,
  NormalizedInfestacao,
  NormalizedMonitoringReport,
  NormalizedTalhao,
} from './normalize';

export interface NullableMetric<T> {
  value: T | null;
  source: MonitoringValueSource;
}

export interface MonitoringOccurrenceRow {
  organismo: string;
  tipo: TipoOrganismo;
  pontosAfetados: number;
  frequencia: number | null;
  quantidadeMedia: number | null;
  severidadeMedia: number | null;
  classificacao: NivelClassificacao | null;
  pointIds: string[];
}

export interface MonitoringPlotAssessment {
  talhao: NormalizedTalhao;
  totalPontos: number;
  pontosComOcorrencia: number;
  indiceOcorrencia: number | null;
  totalOcorrencias: number;
  severidadeMedia: number | null;
  classificacao: NivelClassificacao | null;
  ocorrencias: MonitoringOccurrenceRow[];
  principalOcorrencia: MonitoringOccurrenceRow | null;
}

export interface MonitoringOverview {
  areaMonitorada: NullableMetric<number>;
  talhoesAvaliados: number;
  pontosAmostrados: number;
  ocorrenciasRegistradas: number;
  severidadeMedia: NullableMetric<number>;
  talhoesCriticos: number;
  talhoesAltoRisco: number;
  talhoesAtencao: number;
  talhoesControlados: number;
  talhoesSemDados: number;
  diagnostic: string;
}

export interface MonitoringPriorityAction {
  id: string;
  priority: NivelClassificacao | 'MONITORAR';
  priorityLabel: string;
  talhaoId: string;
  talhaoNome: string;
  organismo: string;
  evidencia: string | null;
  conduta: string | null;
  produto: string | null;
  dose: string | null;
  prazo: string | null;
  points: string[];
}

export interface MonitoringReportImage {
  url: string;
  descricao?: string;
  categoria?: string;
  data?: string;
  ponto?: string;
  organismo?: string;
  talhaoId?: string;
}

const RISK_ORDER: Record<NivelClassificacao, number> = {
  CRITICO: 0,
  ALTO_RISCO: 1,
  ATENCAO: 2,
  CONTROLADO: 3,
};

function cleanText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  if (!text || text === '—' || text === '-') return null;
  return text;
}

export function formatNullableMetric(
  value: number | null | undefined,
  formatter: (number: number) => string,
): string {
  return value !== null && value !== undefined && Number.isFinite(value)
    ? formatter(value)
    : '—';
}

function informedSeverity(infestacao: NormalizedInfestacao): number | null {
  if (infestacao.severidadeInformada === false) return null;
  return Number.isFinite(infestacao.severidade)
    ? infestacao.severidade
    : null;
}

export function buildOccurrenceRows(
  talhao: NormalizedTalhao,
): MonitoringOccurrenceRow[] {
  const grouped = new Map<
    string,
    {
      organismo: string;
      tipo: TipoOrganismo;
      points: Set<string>;
      quantities: number[];
      severities: number[];
    }
  >();

  for (const point of talhao.pontos) {
    for (const infestation of point.infestacoes) {
      const key = `${infestation.tipo}:${infestation.nome
        .trim()
        .toLocaleLowerCase('pt-BR')}`;
      const group = grouped.get(key) ?? {
        organismo: infestation.nome,
        tipo: infestation.tipo,
        points: new Set<string>(),
        quantities: [],
        severities: [],
      };
      group.points.add(point.identificador);
      if (
        infestation.quantidadeInformada !== false &&
        infestation.quantidade !== null &&
        Number.isFinite(infestation.quantidade)
      ) {
        group.quantities.push(infestation.quantidade);
      }
      const severity = informedSeverity(infestation);
      if (severity !== null) group.severities.push(severity);
      grouped.set(key, group);
    }
  }

  return [...grouped.values()]
    .map((group): MonitoringOccurrenceRow => {
      const severidadeMedia =
        group.severities.length > 0
          ? group.severities.reduce((sum, value) => sum + value, 0) /
            group.severities.length
          : null;
      return {
        organismo: group.organismo,
        tipo: group.tipo,
        pontosAfetados: group.points.size,
        frequencia:
          talhao.pontos.length > 0
            ? (group.points.size / talhao.pontos.length) * 100
            : null,
        quantidadeMedia:
          group.quantities.length > 0
            ? group.quantities.reduce((sum, value) => sum + value, 0) /
              group.quantities.length
            : null,
        severidadeMedia,
        classificacao:
          severidadeMedia === null ? null : classificarNivel(severidadeMedia),
        pointIds: [...group.points],
      };
    })
    .sort((a, b) => {
      if (a.frequencia !== b.frequencia) {
        return (b.frequencia ?? -1) - (a.frequencia ?? -1);
      }
      return (b.severidadeMedia ?? -1) - (a.severidadeMedia ?? -1);
    });
}

export function assessMonitoringPlot(
  talhao: NormalizedTalhao,
): MonitoringPlotAssessment {
  const occurrences = talhao.pontos.flatMap((point) => point.infestacoes);
  const severities = occurrences
    .map(informedSeverity)
    .filter((value): value is number => value !== null);
  const severidadeMedia =
    severities.length > 0
      ? severities.reduce((sum, value) => sum + value, 0) / severities.length
      : occurrences.length === 0 && talhao.pontos.length > 0
        ? 0
        : null;
  const pontosComOcorrencia = talhao.pontos.filter(
    (point) => point.infestacoes.length > 0,
  ).length;
  const occurrenceRows = buildOccurrenceRows(talhao);

  return {
    talhao,
    totalPontos: talhao.pontos.length,
    pontosComOcorrencia,
    indiceOcorrencia:
      talhao.pontos.length > 0
        ? (pontosComOcorrencia / talhao.pontos.length) * 100
        : null,
    totalOcorrencias: occurrences.length,
    severidadeMedia,
    classificacao:
      severidadeMedia === null ? null : classificarNivel(severidadeMedia),
    ocorrencias: occurrenceRows,
    principalOcorrencia: occurrenceRows[0] ?? null,
  };
}

export function sortPlotsByRisk(
  talhoes: NormalizedTalhao[],
): MonitoringPlotAssessment[] {
  return talhoes
    .map(assessMonitoringPlot)
    .sort((a, b) => {
      const aRank =
        a.classificacao === null ? 4 : RISK_ORDER[a.classificacao];
      const bRank =
        b.classificacao === null ? 4 : RISK_ORDER[b.classificacao];
      if (aRank !== bRank) return aRank - bRank;
      if (a.severidadeMedia !== b.severidadeMedia) {
        return (b.severidadeMedia ?? -1) - (a.severidadeMedia ?? -1);
      }
      return a.talhao.nome.localeCompare(b.talhao.nome, 'pt-BR');
    });
}

export function buildMonitoringOverview(
  report: NormalizedMonitoringReport,
): MonitoringOverview {
  const assessments = report.talhoes.map(assessMonitoringPlot);
  const informedAreas = report.talhoes
    .filter((talhao) => talhao.disponibilidade.area !== 'not_informed')
    .map((talhao) => talhao.area_ha);
  const severities = assessments
    .map((assessment) => assessment.severidadeMedia)
    .filter((value): value is number => value !== null);
  const count = (level: NivelClassificacao) =>
    assessments.filter((assessment) => assessment.classificacao === level)
      .length;
  const talhoesCriticos = count('CRITICO');
  const talhoesAltoRisco = count('ALTO_RISCO');
  const talhoesAtencao = count('ATENCAO');
  const talhoesControlados = count('CONTROLADO');
  const talhoesSemDados = assessments.filter(
    (assessment) => assessment.classificacao === null,
  ).length;
  const requiresAction = talhoesCriticos + talhoesAltoRisco;
  const monitored = talhoesAtencao + talhoesControlados;

  let diagnostic: string;
  if (report.talhoes.length === 0) {
    diagnostic = 'Situação geral: nenhum talhão informado neste relatório.';
  } else {
    const parts: string[] = [];
    if (requiresAction > 0) {
      parts.push(
        `${requiresAction} ${requiresAction === 1 ? 'talhão exige' : 'talhões exigem'} intervenção`,
      );
    }
    if (monitored > 0) {
      parts.push(
        `${monitored} ${monitored === 1 ? 'deve' : 'devem'} permanecer em monitoramento`,
      );
    }
    if (talhoesSemDados > 0) {
      parts.push(
        `${talhoesSemDados} ${talhoesSemDados === 1 ? 'não possui' : 'não possuem'} dados suficientes para classificação`,
      );
    }
    diagnostic = `Situação geral: ${parts.join(' e ') || 'dados insuficientes para classificação'}.`;
  }

  return {
    areaMonitorada: {
      value:
        informedAreas.length > 0
          ? informedAreas.reduce((sum, area) => sum + area, 0)
          : null,
      source: informedAreas.length > 0 ? 'derived' : 'not_informed',
    },
    talhoesAvaliados: report.talhoes.length,
    pontosAmostrados: assessments.reduce(
      (sum, assessment) => sum + assessment.totalPontos,
      0,
    ),
    ocorrenciasRegistradas: assessments.reduce(
      (sum, assessment) => sum + assessment.totalOcorrencias,
      0,
    ),
    severidadeMedia: {
      value:
        severities.length > 0
          ? severities.reduce((sum, severity) => sum + severity, 0) /
            severities.length
          : null,
      source: severities.length > 0 ? 'derived' : 'not_informed',
    },
    talhoesCriticos,
    talhoesAltoRisco,
    talhoesAtencao,
    talhoesControlados,
    talhoesSemDados,
    diagnostic,
  };
}

function recommendationPriority(
  recommendation: Recomendacao,
): NivelClassificacao | 'MONITORAR' {
  if (recommendation.nivel === 'ACAO_IMEDIATA') return 'CRITICO';
  if (recommendation.nivel === 'ALTO_RISCO') return 'ALTO_RISCO';
  if (recommendation.nivel === 'PREVENTIVO') return 'CONTROLADO';
  return 'MONITORAR';
}

function priorityRank(
  priority: NivelClassificacao | 'MONITORAR',
): number {
  if (priority === 'MONITORAR') return 3;
  return RISK_ORDER[priority];
}

export function buildPriorityActions(
  assessments: MonitoringPlotAssessment[],
): MonitoringPriorityAction[] {
  const actions: MonitoringPriorityAction[] = [];

  for (const assessment of assessments) {
    for (const [index, recommendation] of (
      assessment.talhao.recomendacoes ?? []
    ).entries()) {
      const conduta = cleanText(recommendation.acao);
      const produto = cleanText(recommendation.produto);
      const dose = cleanText(recommendation.dose);
      const prazo = cleanText(recommendation.prazo);
      const explicitEvidence = cleanText(recommendation.evidencia);
      const organismo = cleanText(recommendation.organismo);

      // Não cria linha artificial quando o payload não registrou conduta,
      // produto, dose, prazo ou evidência.
      if (!conduta && !produto && !dose && !prazo && !explicitEvidence) {
        continue;
      }

      const matchingOccurrence = assessment.ocorrencias.find(
        (occurrence) =>
          organismo !== null &&
          occurrence.organismo.localeCompare(organismo, 'pt-BR', {
            sensitivity: 'base',
          }) === 0,
      );
      const points =
        recommendation.pontos.length > 0
          ? recommendation.pontos
          : matchingOccurrence?.pointIds ?? [];
      const evidence =
        explicitEvidence ??
        (points.length > 0
          ? `Registro nos pontos ${points.join(', ')}`
          : matchingOccurrence?.frequencia !== null &&
              matchingOccurrence?.frequencia !== undefined
            ? `Ocorrência em ${matchingOccurrence.frequencia.toLocaleString(
                'pt-BR',
                { maximumFractionDigits: 1 },
              )}% dos pontos avaliados`
            : null);
      const priority = recommendationPriority(recommendation);

      actions.push({
        id: `${assessment.talhao.id}-${index}`,
        priority,
        priorityLabel:
          priority === 'MONITORAR'
            ? 'Monitorar'
            : labelClassificacao(priority),
        talhaoId: assessment.talhao.id,
        talhaoNome: assessment.talhao.nome,
        organismo: organismo ?? 'Não informado',
        evidencia: evidence,
        conduta,
        produto,
        dose,
        prazo,
        points,
      });
    }
  }

  return actions.sort(
    (a, b) =>
      priorityRank(a.priority) - priorityRank(b.priority) ||
      a.talhaoNome.localeCompare(b.talhaoNome, 'pt-BR'),
  );
}

function normalizeImageKey(url: string): string {
  return url
    .trim()
    .replace(/[?#].*$/, '')
    .replace(/\/+$/, '')
    .toLocaleLowerCase('pt-BR');
}

export function deduplicateReportImages(
  images: MonitoringReportImage[],
): MonitoringReportImage[] {
  const seen = new Set<string>();
  const unique: MonitoringReportImage[] = [];
  for (const image of images) {
    const url = cleanText(image.url);
    if (!url) continue;
    const key = normalizeImageKey(url);
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push({ ...image, url });
  }
  return unique;
}

export function collectPlotImages(
  assessment: MonitoringPlotAssessment,
): MonitoringReportImage[] {
  return deduplicateReportImages(
    assessment.talhao.pontos.flatMap((point) =>
      point.infestacoes
        .filter((infestation) => cleanText(infestation.imagem) !== null)
        .map((infestation) => ({
          url: infestation.imagem!,
          descricao: infestation.observacao,
          categoria: infestation.tipo,
          ponto: point.identificador,
          organismo: infestation.nome,
          talhaoId: assessment.talhao.id,
        })),
    ),
  );
}

export function buildTechnicalConclusion(
  report: NormalizedMonitoringReport,
  assessments: MonitoringPlotAssessment[],
  overview: MonitoringOverview,
  actions: MonitoringPriorityAction[],
  technicalObservation?: string | null,
): string[] {
  const observation = cleanText(technicalObservation);
  const opening = [
    `Foram avaliados ${overview.pontosAmostrados} pontos em ${overview.talhoesAvaliados} ${overview.talhoesAvaliados === 1 ? 'talhão' : 'talhões'}`,
    overview.areaMonitorada.value !== null
      ? `, abrangendo ${overview.areaMonitorada.value.toLocaleString('pt-BR', {
          minimumFractionDigits: 1,
          maximumFractionDigits: 2,
        })} ha`
      : '',
    '.',
  ].join('');

  const paragraphs = [opening];
  if (observation) {
    paragraphs.push(observation);
  } else {
    const leading = assessments
      .filter((assessment) => assessment.principalOcorrencia !== null)
      .sort(
        (a, b) =>
          (b.principalOcorrencia?.frequencia ?? -1) -
          (a.principalOcorrencia?.frequencia ?? -1),
      )[0];
    if (leading?.principalOcorrencia) {
      const occurrence = leading.principalOcorrencia;
      const frequency =
        occurrence.frequencia === null
          ? 'frequência não informada'
          : `${occurrence.frequencia.toLocaleString('pt-BR', {
              maximumFractionDigits: 1,
            })}% dos pontos avaliados`;
      paragraphs.push(
        `${leading.talhao.nome} apresentou a maior frequência registrada, com destaque para ${occurrence.organismo} em ${frequency}.`,
      );
    } else if (overview.pontosAmostrados > 0) {
      paragraphs.push(
        'Não foram registradas ocorrências nos pontos apresentados neste relatório; a informação se limita às amostras avaliadas.',
      );
    } else {
      paragraphs.push(
        'Não há pontos amostrados suficientes para elaborar uma conclusão agronômica.',
      );
    }
  }

  const firstAction = actions.find((action) => action.conduta);
  if (firstAction?.conduta) {
    const conduct = firstAction.conduta.replace(/[.!?]+$/, '');
    const pointText =
      firstAction.points.length > 0
        ? ` nos pontos ${firstAction.points.join(', ')}`
        : '';
    const deadlineText = firstAction.prazo
      ? ` no prazo ${firstAction.prazo}`
      : '';
    paragraphs.push(
      `Conduta registrada: ${conduct}${pointText}${deadlineText}.`,
    );
  }

  return paragraphs.slice(0, 3);
}

export interface NdeComparison {
  canCompare: boolean;
  observed: number | null;
  reference: number | null;
  ratio: number | null;
  message: string;
}

export function assessNdeComparison(
  row: OrganismoContextoWeb,
): NdeComparison {
  const reference =
    row.referenciaNde !== null &&
    row.referenciaNde !== undefined &&
    Number.isFinite(row.referenciaNde)
      ? row.referenciaNde
      : null;
  const unit = cleanText(row.referenciaNdeUnidade);
  const normalizedUnit = unit?.toLocaleLowerCase('pt-BR') ?? '';
  const isDensityUnit =
    normalizedUnit.includes('/m²') ||
    normalizedUnit.includes('/m2') ||
    normalizedUnit.includes('m-2');
  const observed =
    isDensityUnit &&
    row.densidadeIndM2 !== null &&
    row.densidadeIndM2 !== undefined &&
    Number.isFinite(row.densidadeIndM2)
      ? row.densidadeIndM2
      : null;
  const canCompare =
    reference !== null && reference > 0 && observed !== null && unit !== null;

  return {
    canCompare,
    observed,
    reference,
    ratio: canCompare ? observed / reference : null,
    message: canCompare
      ? 'Comparação calculada com leitura e referência de unidade compatível.'
      : 'Dados insuficientes para comparar com o nível de dano econômico.',
  };
}
