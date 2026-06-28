import type {
  TechnicalVisitAction,
  TechnicalVisitOccurrence,
  TechnicalVisitRecommendation,
  TechnicalVisitReport,
  TechnicalVisitSeverity,
} from './technicalVisitReport.types';

export type NormalizedAssessment = {
  generalStatus: string;
  generalStatusTone: 'success' | 'warning' | 'danger' | 'neutral';
  risk: string;
  riskTone: 'success' | 'warning' | 'danger' | 'neutral';
  urgency: string;
  urgencyTone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  mainProblem: string;
  probableCause: string;
  conduct: string;
  nextEvaluation: string;
  nextAction: string;
  mainFactor: string;
  hasCriticalOccurrence: boolean;
  hasAnyOccurrence: boolean;
};

function norm(value?: string): string {
  return (value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function isHealthyLabel(value?: string): boolean {
  const raw = norm(value);
  return (
    !raw ||
    raw.includes('saudavel') ||
    raw.includes('sem ocorrencia') ||
    raw.includes('nenhum') ||
    raw.includes('nao aplicavel') ||
    raw.includes('ok') ||
    raw.includes('normal')
  );
}

function countBySeverity(occurrences: TechnicalVisitOccurrence[]): Record<TechnicalVisitSeverity, number> {
  const counts: Record<TechnicalVisitSeverity, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
    unknown: 0,
  };
  for (const occ of occurrences) {
    counts[occ.severityTone] += 1;
  }
  return counts;
}

function resolveMainFactor(occurrences: TechnicalVisitOccurrence[]): string {
  if (occurrences.length === 0) return 'Nenhum fator crítico identificado';
  const first = occurrences[0];
  const type = first.type?.trim();
  if (type) return type.charAt(0).toUpperCase() + type.slice(1);
  return first.name;
}

function resolveMainProblem(report: TechnicalVisitReport, counts: Record<TechnicalVisitSeverity, number>): string {
  const fromDiag = report.diagnosis?.mainProblem?.trim();
  if (fromDiag && !isHealthyLabel(fromDiag)) return fromDiag;
  if (report.occurrences.length === 0) return 'Sem ocorrência crítica registrada';
  if (counts.critical > 0 || counts.high > 0) {
    const critical = report.occurrences.find((o) => o.severityTone === 'critical' || o.severityTone === 'high');
    return critical?.name ?? report.occurrences[0].name;
  }
  if (counts.medium > 0) return `Presença de ${report.occurrences[0].name} em nível de atenção`;
  return report.occurrences[0]?.name ?? 'Ocorrências leves registradas';
}

export function normalizeAgronomicAssessment(report: TechnicalVisitReport): NormalizedAssessment {
  const counts = countBySeverity(report.occurrences);
  const hasCriticalOccurrence = counts.critical > 0 || counts.high > 0;
  const hasAnyOccurrence = report.occurrences.length > 0;
  const mainProblem = resolveMainProblem(report, counts);
  const healthy = !hasAnyOccurrence && isHealthyLabel(mainProblem);

  let generalStatus = 'Saudável';
  let generalStatusTone: NormalizedAssessment['generalStatusTone'] = 'success';
  if (counts.critical > 0) {
    generalStatus = 'Crítico';
    generalStatusTone = 'danger';
  } else if (counts.high > 0 || counts.medium > 0) {
    generalStatus = 'Atenção';
    generalStatusTone = 'warning';
  } else if (hasAnyOccurrence) {
    generalStatus = 'Monitoramento';
    generalStatusTone = 'warning';
  }

  let risk = healthy ? 'Baixo' : 'Moderado';
  let riskTone: NormalizedAssessment['riskTone'] = healthy ? 'success' : 'warning';
  if (counts.critical > 0) {
    risk = 'Alto';
    riskTone = 'danger';
  } else if (counts.high > 0) {
    risk = 'Alto';
    riskTone = 'danger';
  } else if (counts.medium > 0) {
    risk = 'Moderado';
    riskTone = 'warning';
  } else if (!hasAnyOccurrence) {
    risk = 'Baixo';
    riskTone = 'success';
  }

  const rawRisk = norm(report.diagnosis?.risk);
  if (rawRisk && !healthy) {
    if (rawRisk.includes('alt') || rawRisk.includes('crit')) {
      risk = 'Alto';
      riskTone = 'danger';
    } else if (rawRisk.includes('med') || rawRisk.includes('mod')) {
      risk = 'Moderado';
      riskTone = 'warning';
    } else if (rawRisk.includes('baix')) {
      risk = 'Baixo';
      riskTone = 'success';
    } else if (!isHealthyLabel(report.diagnosis?.risk)) {
      risk = report.diagnosis!.risk!;
    }
  }

  if (healthy && (rawRisk.includes('med') || rawRisk.includes('mod') || rawRisk.includes('alt'))) {
    risk = 'Baixo';
    riskTone = 'success';
  }

  let urgency = healthy ? 'Rotina' : 'Programada';
  let urgencyTone: NormalizedAssessment['urgencyTone'] = healthy ? 'success' : 'info';
  if (counts.critical > 0) {
    urgency = 'Imediata';
    urgencyTone = 'danger';
  } else if (counts.high > 0) {
    urgency = 'Alta';
    urgencyTone = 'warning';
  }

  const rawUrgency = norm(report.diagnosis?.urgency);
  if (rawUrgency && !healthy) {
    if (rawUrgency.includes('imedi')) {
      urgency = 'Imediata';
      urgencyTone = 'danger';
    } else if (rawUrgency.includes('program')) {
      urgency = 'Programada';
      urgencyTone = 'info';
    } else if (rawUrgency.includes('rotin')) {
      urgency = 'Rotina';
      urgencyTone = 'success';
    } else if (!isHealthyLabel(report.diagnosis?.urgency)) {
      urgency = report.diagnosis!.urgency!;
    }
  }

  let probableCause = report.diagnosis?.probableCause?.trim() ?? '';
  if (!probableCause || isHealthyLabel(probableCause)) {
    probableCause = healthy
      ? 'Não aplicável'
      : hasCriticalOccurrence
        ? 'Pressão fitossanitária associada ao histórico e condições da área'
        : 'Pressão localizada associada ao histórico da área';
  }

  let conduct = report.recommendations[0]?.text?.trim() ?? '';
  if (!conduct) {
    conduct = healthy
      ? 'Manter monitoramento preventivo'
      : hasCriticalOccurrence
        ? 'Executar plano de ação e reavaliar no prazo indicado'
        : 'Reavaliar em 3 a 5 dias ou aplicar conforme nível de controle';
  }

  const nextEvaluation = healthy ? 'Conforme evolução fenológica (7 a 10 dias)' : 'Conforme prazo do plano de ação';
  const nextAction = healthy
    ? 'Manter monitoramento preventivo e reavaliar conforme estádio fenológico'
    : report.actions[0]?.action ?? conduct;

  return {
    generalStatus,
    generalStatusTone,
    risk,
    riskTone,
    urgency,
    urgencyTone,
    mainProblem,
    probableCause,
    conduct,
    nextEvaluation,
    nextAction,
    mainFactor: resolveMainFactor(report.occurrences),
    hasCriticalOccurrence,
    hasAnyOccurrence,
  };
}

export function buildExecutiveSummary(report: TechnicalVisitReport, assessment: NormalizedAssessment): string {
  const plot = report.plotName !== 'Não informado' ? report.plotName : 'talhão monitorado';
  const crop = report.cropName ? `, cultura ${report.cropName}` : '';
  const season = report.seasonName ? `, safra ${report.seasonName}` : '';
  const area = report.areaHa ? `, com área monitorada de ${report.areaHa}` : '';

  if (!assessment.hasAnyOccurrence && !assessment.hasCriticalOccurrence) {
    return `Visita técnica realizada no talhão ${plot}${crop}${season}${area}. Não foram registradas ocorrências críticas no momento da avaliação. Recomenda-se manter o acompanhamento preventivo conforme estádio fenológico, histórico da área e condições climáticas.`;
  }

  return `Visita técnica realizada no talhão ${plot}${crop}${season}${area}, com identificação de ${assessment.mainProblem}. O risco agronômico foi classificado como ${assessment.risk.toLowerCase()}, com urgência ${assessment.urgency.toLowerCase()}. Recomenda-se executar o plano de ação descrito neste relatório.`;
}

export function buildTechnicalConclusion(report: TechnicalVisitReport, assessment: NormalizedAssessment): string {
  if (report.conclusion?.trim()) return report.conclusion.trim();

  const plot = report.plotName !== 'Não informado' ? report.plotName : 'talhão monitorado';

  if (!assessment.hasAnyOccurrence && !assessment.hasCriticalOccurrence) {
    return `Com base nas informações registradas durante a visita técnica, o talhão ${plot} não apresentou ocorrência crítica no momento da avaliação. Recomenda-se manter o acompanhamento preventivo e realizar nova vistoria conforme evolução fenológica da cultura, histórico da área e condições climáticas.`;
  }

  return `Com base nas informações registradas durante a visita técnica, o talhão ${plot} apresentou ${assessment.mainProblem}, classificado com risco ${assessment.risk.toLowerCase()}. Recomenda-se seguir o plano de ação descrito neste relatório e realizar nova avaliação no prazo indicado.`;
}

export function buildRecommendationsFallback(report: TechnicalVisitReport): TechnicalVisitRecommendation[] {
  if (report.recommendations.length > 0) return report.recommendations;
  return [
    {
      text: 'Sem recomendação corretiva imediata. Manter monitoramento preventivo e reavaliar conforme janela técnica da cultura.',
      priority: 'Baixa',
      deadline: 'Próxima janela de avaliação',
      responsible: report.technicianName,
    },
  ];
}

export function buildPreventiveActionPlan(report: TechnicalVisitReport): TechnicalVisitAction[] {
  if (report.actions.length > 0) return report.actions;
  return [
    {
      action: 'Manter monitoramento preventivo do talhão',
      priority: 'Média',
      deadline: 'Próxima janela de avaliação',
      responsible: report.technicianName ?? 'Responsável técnico',
      status: 'Programado',
      source: 'Plano preventivo automático',
    },
  ];
}

export const EMPTY_STATES = {
  fieldConditions:
    'Condições de campo não informadas nesta visita. Recomenda-se registrar clima, umidade, estádio da cultura e observações operacionais nas próximas avaliações para melhorar a rastreabilidade técnica.',
  occurrences:
    'Não foram registradas ocorrências técnicas críticas nesta visita. A área permanece em acompanhamento preventivo, principalmente em bordaduras, reboleiras e áreas com histórico de pressão fitossanitária.',
  actionPlan:
    'Nenhum plano corretivo foi definido porque não foram identificados fatores críticos no momento da vistoria. Recomenda-se nova avaliação dentro da janela técnica da cultura.',
  photos:
    'Esta visita não possui fotos georreferenciadas anexadas. Recomenda-se registrar imagens de sintomas, pragas, doenças, plantas daninhas, bordaduras e pontos representativos nas próximas visitas.',
  mapNoPoints:
    'Nenhum ponto técnico georreferenciado foi registrado nesta visita. O mapa apresenta o limite operacional do talhão.',
  mapNoData: 'Esta visita não possui dados georreferenciados registrados para exibição cartográfica.',
} as const;
