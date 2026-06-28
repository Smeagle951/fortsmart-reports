import type { PayloadVisitaTecnica, VisitaSnapshotPontoGeo } from '@/types/payload-visita-tecnica';
import {
  buildPreventiveActionPlan,
  buildRecommendationsFallback,
  normalizeAgronomicAssessment,
} from './technicalVisitReportNarratives';
import { severityToneFromText } from './vtMapMarkers';
import type {
  TechnicalVisitAction,
  TechnicalVisitDecisionChip,
  TechnicalVisitField,
  TechnicalVisitGeoPoint,
  TechnicalVisitKpi,
  TechnicalVisitOccurrence,
  TechnicalVisitPhoto,
  TechnicalVisitRecommendation,
  TechnicalVisitReport,
  TechnicalVisitSeverity,
  TechnicalVisitTimelineItem,
} from './technicalVisitReport.types';

type AnyRecord = Record<string, unknown>;

const EMPTY = 'Não informado';

function asRecord(value: unknown): AnyRecord {
  return value != null && typeof value === 'object' && !Array.isArray(value) ? (value as AnyRecord) : {};
}

function asArray(value: unknown): AnyRecord[] {
  return Array.isArray(value)
    ? value.filter((item): item is AnyRecord => item != null && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function text(value: unknown): string | undefined {
  if (value == null) return undefined;
  const out = String(value).trim();
  if (!out || out === '—' || out.toLowerCase() === 'null' || out.toLowerCase() === 'undefined') return undefined;
  return out;
}

function numberValue(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const out = Number(value);
  return Number.isFinite(out) ? out : undefined;
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    const out = text(value);
    if (out) return out;
  }
  return undefined;
}

function field(label: string, value: unknown, critical = false): TechnicalVisitField | undefined {
  const out = text(value);
  if (!out && !critical) return undefined;
  return { label, value: out ?? EMPTY };
}

function compactFields(items: Array<TechnicalVisitField | undefined>): TechnicalVisitField[] {
  return items.filter(Boolean) as TechnicalVisitField[];
}

export function formatVisitDate(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
}

function formatDateTime(value: unknown): string | undefined {
  const raw = text(value);
  if (!raw) return undefined;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

export function formatCoordinate(lat: unknown, lng: unknown): string | undefined {
  const la = numberValue(lat);
  const lo = numberValue(lng);
  if (la == null || lo == null) return undefined;
  return `${la.toFixed(6)}, ${lo.toFixed(6)}`;
}

function formatHa(value: unknown): string | undefined {
  const n = numberValue(value);
  if (n == null) return text(value);
  return `${n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })} ha`;
}

export function resolveSeverity(value: unknown): TechnicalVisitSeverity {
  const raw = text(value)?.toLowerCase() ?? '';
  if (raw.includes('critic') || raw.includes('crític') || raw.includes('urgente')) return 'critical';
  if (raw.includes('alta') || raw.includes('alto')) return 'high';
  if (raw.includes('media') || raw.includes('média') || raw.includes('moder')) return 'medium';
  if (raw.includes('baixa') || raw.includes('baixo') || raw.includes('ok')) return 'low';
  return 'unknown';
}

function kpi(label: string, value: unknown, detail?: string, tone: TechnicalVisitKpi['tone'] = 'neutral'): TechnicalVisitKpi | undefined {
  const out = text(value);
  if (!out) return undefined;
  return { label, value: out, detail, tone };
}

function resolvePolygon(mapa: AnyRecord): [number, number][] | undefined {
  let raw = mapa.polygon;
  if (typeof raw === 'string') {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(raw)) return undefined;
  const points: [number, number][] = [];
  for (const item of raw) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const a = numberValue(item[0]);
    const b = numberValue(item[1]);
    if (a == null || b == null) continue;
    const lat = Math.abs(a) <= 90 && Math.abs(b) <= 180 ? a : b;
    const lng = Math.abs(a) <= 90 && Math.abs(b) <= 180 ? b : a;
    if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) points.push([lat, lng]);
  }
  return points.length >= 3 ? points : undefined;
}

function pointFromRecord(record: AnyRecord, index: number, source?: TechnicalVisitGeoPoint['source']): TechnicalVisitGeoPoint | undefined {
  const lat = numberValue(record.latitude ?? record.lat);
  const lng = numberValue(record.longitude ?? record.lng ?? record.lon);
  if (lat == null || lng == null || Math.abs(lat) > 90 || Math.abs(lng) > 180) return undefined;
  const severity = firstText(record.severidade, record.risk_level, record.infestion_level, record.severity);
  const tone = resolveSeverity(severity);
  const severityTone =
    tone === 'unknown' && source && ['mapa', 'snapshot', 'avaliacao'].includes(source) ? 'low' : tone;
  return {
    id: firstText(record.id, record.local_id, record.index) ?? `ponto-${index + 1}`,
    latitude: lat,
    longitude: lng,
    title: firstText(record.titulo, record.title, record.point_code, record.alvo, record.nome, record.descricao),
    description: firstText(record.descricao, record.observacoes, record.observation),
    type: firstText(record.tipo, record.type, record.categoria, record.class_name),
    severity,
    severityTone,
    date: firstText(record.data, record.collected_at, record.created_at),
    imageUrl: firstText(record.imagem, record.url, record.cloud_url),
    recommendation: firstText(record.recomendacao, record.recommendation),
    source,
  };
}

function geoPointKey(point: TechnicalVisitGeoPoint): string {
  return `${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}`;
}

function mergeGeoPoints(lists: TechnicalVisitGeoPoint[][]): TechnicalVisitGeoPoint[] {
  const byKey = new Map<string, TechnicalVisitGeoPoint>();
  const severityRank: Record<TechnicalVisitSeverity, number> = {
    unknown: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  for (const list of lists) {
    for (const point of list) {
      const key = geoPointKey(point);
      const existing = byKey.get(key);
      if (!existing) {
        byKey.set(key, point);
        continue;
      }
      const existingRank = severityRank[existing.severityTone ?? 'unknown'];
      const nextRank = severityRank[point.severityTone ?? 'unknown'];
      if (nextRank > existingRank || (!existing.title && point.title)) {
        byKey.set(key, { ...existing, ...point, id: point.id ?? existing.id });
      }
    }
  }
  return Array.from(byKey.values());
}

function pointsFromOccurrences(occurrences: TechnicalVisitOccurrence[]): TechnicalVisitGeoPoint[] {
  return occurrences
    .filter((occ) => occ.latitude != null && occ.longitude != null)
    .map((occ, index) => ({
      id: occ.id ?? `occ-${index + 1}`,
      latitude: occ.latitude as number,
      longitude: occ.longitude as number,
      title: occ.name,
      description: occ.observation,
      type: occ.type,
      severity: occ.severity,
      severityTone: occ.severityTone,
      recommendation: occ.recommendation,
      source: 'ocorrencia' as const,
    }));
}

function pointsFromPhotos(photos: TechnicalVisitPhoto[]): TechnicalVisitGeoPoint[] {
  return photos
    .filter((photo) => photo.latitude != null && photo.longitude != null)
    .map((photo, index) => ({
      id: `foto-${index + 1}`,
      latitude: photo.latitude as number,
      longitude: photo.longitude as number,
      title: photo.occurrenceName ?? photo.description ?? 'Evidência fotográfica',
      description: photo.description,
      type: photo.category ?? 'foto',
      severityTone: photo.occurrenceName ? severityToneFromText(photo.category) : 'low',
      date: photo.date,
      imageUrl: photo.url,
      source: 'foto' as const,
    }));
}

export function resolveGeoPoints(
  dto: PayloadVisitaTecnica,
  occurrences: TechnicalVisitOccurrence[] = [],
  photos: TechnicalVisitPhoto[] = [],
): TechnicalVisitGeoPoint[] {
  const mapa = asRecord(dto.mapa);
  const fromMap = asArray(mapa.pontos ?? mapa.marcadores).map((p, i) => pointFromRecord(asRecord(p), i, 'mapa')).filter(Boolean) as TechnicalVisitGeoPoint[];

  const snapshot = asRecord(dto.visita_snapshot ?? dto.visita);
  const snapPoints = Array.isArray(snapshot.pontos_georreferenciados)
    ? (snapshot.pontos_georreferenciados as VisitaSnapshotPontoGeo[])
    : [];
  const fromSnapshot = snapPoints.map((p, i) => pointFromRecord(asRecord(p), i, 'snapshot')).filter(Boolean) as TechnicalVisitGeoPoint[];

  const fromPragas = asArray(dto.pragas)
    .map((p, i) => pointFromRecord(asRecord(p), i, 'avaliacao'))
    .filter(Boolean) as TechnicalVisitGeoPoint[];

  return mergeGeoPoints([fromMap, fromSnapshot, fromPragas, pointsFromOccurrences(occurrences), pointsFromPhotos(photos)]);
}

export function resolvePhotos(dto: PayloadVisitaTecnica, points: TechnicalVisitGeoPoint[]): TechnicalVisitPhoto[] {
  const plotName = resolvePlotName(dto);
  return asArray(dto.imagens).map((img, index) => {
    const lat = numberValue(img.latitude);
    const lng = numberValue(img.longitude);
    const linkedPoint = lat == null || lng == null ? points[index] : undefined;
    return {
      url: firstText(img.url, img.cloud_url),
      localPath: firstText(img.localPath, img.local_path),
      description: firstText(img.descricao, img.caption, img.legenda),
      category: firstText(img.categoria, img.category),
      date: firstText(img.data, img.taken_at, linkedPoint?.date, dto.dataVisita, dto.data),
      plotName: firstText(img.talhaoNome, plotName),
      latitude: lat ?? linkedPoint?.latitude,
      longitude: lng ?? linkedPoint?.longitude,
      occurrenceName: firstText(img.ocorrencia, img.occurrenceName),
    };
  });
}

function photosForOccurrence(occurrence: AnyRecord, allPhotos: TechnicalVisitPhoto[]): TechnicalVisitPhoto[] {
  const own = asArray(occurrence.images ?? occurrence.fotos ?? occurrence.photos).map((img) => ({
    url: firstText(img.url, img.cloud_url),
    localPath: firstText(img.localPath, img.local_path, img.path),
    description: firstText(img.descricao, img.caption, img.legenda),
    category: firstText(img.categoria, img.category, occurrence.tipo, occurrence.type),
    date: firstText(img.data, img.taken_at, occurrence.data),
    latitude: numberValue(img.latitude ?? occurrence.latitude),
    longitude: numberValue(img.longitude ?? occurrence.longitude),
    occurrenceName: firstText(occurrence.alvo, occurrence.nome, occurrence.name),
  }));
  if (own.length > 0) return own;
  const name = firstText(occurrence.alvo, occurrence.nome, occurrence.name)?.toLowerCase();
  if (!name) return [];
  return allPhotos.filter((photo) => photo.occurrenceName?.toLowerCase() === name || photo.description?.toLowerCase().includes(name));
}

export function resolveOccurrences(dto: PayloadVisitaTecnica, photos: TechnicalVisitPhoto[]): TechnicalVisitOccurrence[] {
  const pragas = asArray(dto.pragas).map((item): TechnicalVisitOccurrence => {
    const name = firstText(item.alvo, item.nome, item.name, item.targetName) ?? EMPTY;
    const severity = firstText(item.severidade, item.risk_level, item.infestion_level);
    return {
      id: firstText(item.id, item.local_id),
      type: firstText(item.tipo, item.type, item.class_name),
      name,
      incidence: firstText(item.incidencia, item.incidenceDisplay, item.incidence_percent),
      severity,
      severityTone: resolveSeverity(severity),
      status: firstText(item.situacao, item.status),
      priority: firstText(item.prioridade, item.priority),
      risk: firstText(item.nivelRisco, item.risk_level),
      observation: firstText(item.observacoes, item.methodNote, item.observation),
      recommendation: firstText(item.recomendacao, item.shortRecommendation, asRecord(item.recommendation).simple_text),
      probableCause: firstText(item.causaProvavel, item.probableCause),
      affectedArea: firstText(item.pctAreaAfetada != null ? `${item.pctAreaAfetada}%` : undefined, item.areaAfetada),
      responsible: firstText(item.responsavel),
      deadline: firstText(item.prazo, item.deadline),
      latitude: numberValue(item.latitude),
      longitude: numberValue(item.longitude),
      photos: photosForOccurrence(item, photos),
    };
  });

  const desvios = asArray((dto as AnyRecord).desvios).map((item): TechnicalVisitOccurrence => {
    const name = firstText(item.tipo, item.descricao, item.name) ?? EMPTY;
    const severity = firstText(item.severidade);
    return {
      id: firstText(item.id, item.local_id),
      type: 'desvio',
      name,
      severity,
      severityTone: resolveSeverity(severity),
      status: firstText(item.status),
      priority: firstText(item.prioridade),
      observation: firstText(item.observacoes, item.descricao),
      recommendation: firstText(item.recomendacao),
      probableCause: firstText(item.causaProvavel),
      affectedArea: firstText(item.areaAfetada),
      responsible: firstText(item.responsavel),
      deadline: firstText(item.prazoResolucao, item.prazo),
      latitude: numberValue(item.latitude),
      longitude: numberValue(item.longitude),
      photos: photosForOccurrence(item, photos),
    };
  });

  return [...pragas, ...desvios];
}

function resolveRecommendations(dto: PayloadVisitaTecnica, occurrences: TechnicalVisitOccurrence[]): TechnicalVisitRecommendation[] {
  const diagnostico = asRecord(dto.diagnostico);
  const fromDiag = Array.isArray(diagnostico.recomendacoes)
    ? diagnostico.recomendacoes.map((rec) => ({ text: text(rec) })).filter((x): x is TechnicalVisitRecommendation => !!x.text)
    : [];
  const fromOccurrences = occurrences
    .filter((occ) => occ.recommendation)
    .map((occ) => ({
      text: occ.recommendation as string,
      priority: occ.priority,
      occurrence: occ.name,
      responsible: occ.responsible,
      deadline: occ.deadline,
    }));
  return [...fromOccurrences, ...fromDiag];
}

function resolveActions(dto: PayloadVisitaTecnica): TechnicalVisitAction[] {
  const plano = asRecord(dto.planoAcao);
  const actions = asArray(plano.acoes).map((action) => ({
    action: firstText(action.acao, action.descricao) ?? EMPTY,
    priority: firstText(action.prioridade),
    deadline: firstText(action.prazo, action.prazoExecucao),
    responsible: firstText(action.responsavel),
    status: firstText(action.status),
    source: firstText(action.origem, plano.objetivoManejo),
  }));
  return actions.filter((action) => action.action !== EMPTY);
}

function resolveTimeline(dto: PayloadVisitaTecnica, points: TechnicalVisitGeoPoint[], photos: TechnicalVisitPhoto[], occurrences: TechnicalVisitOccurrence[], recommendations: TechnicalVisitRecommendation[]): TechnicalVisitTimelineItem[] {
  const meta = asRecord(dto.meta);
  const snapshot = asRecord(dto.visita_snapshot ?? dto.visita);
  const items: TechnicalVisitTimelineItem[] = [];
  const visitDate = firstText(dto.dataVisita, dto.data, meta.dataVisita, snapshot.data);
  const generated = firstText(meta.dataGeracao, meta.createdAt);
  const created = firstText(meta.createdAt, generated);

  if (created) items.push({ label: 'Visita criada', date: created });
  if (visitDate) items.push({ label: 'Visita realizada', date: visitDate, detail: firstText(meta.workflowStatus, dto.status) });
  if (occurrences.length > 0 && visitDate) {
    items.push({ label: 'Ocorrências registradas', date: visitDate, detail: `${occurrences.length} ocorrência(s)` });
  }
  if (recommendations.length > 0) {
    items.push({
      label: 'Recomendações geradas',
      date: visitDate ?? generated ?? created ?? '',
      detail: `${recommendations.length} recomendação(ões)`,
    });
  }
  if (points.length > 0) {
    const firstPointDate = firstText(points.map((p) => p.date).find(Boolean), visitDate);
    if (firstPointDate) items.push({ label: 'Pontos georreferenciados', date: firstPointDate, detail: `${points.length} ponto(s)` });
  }
  if (photos.length > 0) {
    const firstPhotoDate = firstText(photos.map((p) => p.date).find(Boolean), visitDate);
    if (firstPhotoDate) items.push({ label: 'Fotos anexadas', date: firstPhotoDate, detail: `${photos.length} foto(s)` });
  }
  if (generated) items.push({ label: 'Relatório emitido', date: generated });
  return items.filter((item) => item.date);
}

function buildDecisionPanel(
  report: Pick<
    TechnicalVisitReport,
    'areaHa' | 'occurrences' | 'recommendations' | 'photos' | 'points' | 'technicianName'
  >,
  assessment: ReturnType<typeof normalizeAgronomicAssessment>,
): TechnicalVisitDecisionChip[] {
  const criticalCount = report.occurrences.filter((o) => o.severityTone === 'critical' || o.severityTone === 'high').length;
  return [
    { label: 'Status geral', value: assessment.generalStatus, tone: assessment.generalStatusTone },
    { label: 'Risco', value: assessment.risk, tone: assessment.riskTone },
    { label: 'Urgência', value: assessment.urgency, tone: assessment.urgencyTone },
    { label: 'Área monitorada', value: report.areaHa ?? '—', tone: 'neutral' },
    {
      label: 'Ocorrências',
      value: String(report.occurrences.length),
      tone: criticalCount > 0 ? 'danger' : report.occurrences.length > 0 ? 'warning' : 'success',
    },
    {
      label: 'Recomendações',
      value: String(report.recommendations.length),
      tone: report.recommendations.length > 0 ? 'info' : 'neutral',
    },
    { label: 'Fotos/evidências', value: String(report.photos.length), tone: report.photos.length > 0 ? 'info' : 'neutral' },
    { label: 'Pontos georreferenciados', value: String(report.points.length), tone: report.points.length > 0 ? 'info' : 'neutral' },
    { label: 'Principal fator observado', value: assessment.mainFactor, tone: assessment.hasAnyOccurrence ? 'warning' : 'success' },
    { label: 'Próxima ação recomendada', value: assessment.nextAction, tone: 'info' },
  ];
}

export function resolveFarmName(dto: PayloadVisitaTecnica): string {
  const propriedade = asRecord(dto.propriedade);
  return firstText(dto.fazenda, propriedade.fazenda, propriedade.nome, asRecord(dto.contextoSafra).fazendaNome) ?? EMPTY;
}

export function resolvePlotName(dto: PayloadVisitaTecnica): string {
  const talhao = asRecord(asArray((dto as AnyRecord).talhoes)[0]);
  const snapshot = asRecord(dto.visita_snapshot ?? dto.visita);
  return firstText(talhao.nome, talhao.talhaoNome, snapshot.talhao) ?? EMPTY;
}

export function resolveCropName(dto: PayloadVisitaTecnica): string | undefined {
  const talhao = asRecord(asArray((dto as AnyRecord).talhoes)[0]);
  const snapshot = asRecord(dto.visita_snapshot ?? dto.visita);
  return firstText(talhao.cultura, dto.contextoSafra && asRecord(dto.contextoSafra).cultura, snapshot.cultura);
}

export function resolveSeasonName(dto: PayloadVisitaTecnica): string | undefined {
  const meta = asRecord(dto.meta);
  const contexto = asRecord(dto.contextoSafra);
  return firstText(dto.safra, meta.safra, contexto.safra);
}

export function resolveVisitStatus(dto: PayloadVisitaTecnica): string | undefined {
  const meta = asRecord(dto.meta);
  return firstText(meta.workflowStatus, meta.statusGeralVisita, (dto as AnyRecord).status);
}

export function normalizeTechnicalVisitReport(dto: PayloadVisitaTecnica, opts: { reportId?: string; relatorioUuid?: string } = {}): TechnicalVisitReport {
  const meta = asRecord(dto.meta);
  const prop = asRecord(dto.propriedade);
  const talhao = asRecord(asArray((dto as AnyRecord).talhoes)[0]);
  const contexto = asRecord(dto.contextoSafra);
  const condicoes = asRecord(dto.condicoes);
  const diagnostico = asRecord(dto.diagnostico);
  const assinatura = asRecord(dto.assinaturaTecnica);
  const mapa = asRecord(dto.mapa);
  const photosDraft = resolvePhotos(dto, []);
  const occurrences = resolveOccurrences(dto, photosDraft);
  const points = resolveGeoPoints(dto, occurrences, photosDraft);
  const photos = resolvePhotos(dto, points);
  const fenologia = asRecord(dto.fenologia);
  const rawRecommendations = resolveRecommendations(dto, occurrences);
  const rawActions = resolveActions(dto);
  const visitDate = firstText(dto.dataVisita, dto.data, meta.dataVisita, asRecord(dto.visita_snapshot ?? dto.visita).data);
  const generatedAt = firstText(meta.dataGeracao);
  const technicianName = firstText(meta.tecnicoSessao, dto.tecnico, meta.tecnico, assinatura.nome);
  const technicianCrea = firstText(meta.tecnicoCrea, prop.tecnicoCrea, assinatura.crea);
  const farmName = resolveFarmName(dto);
  const plotName = resolvePlotName(dto);
  const cropName = resolveCropName(dto);
  const seasonName = resolveSeasonName(dto);
  const areaHa = formatHa(firstText(talhao.area, contexto.area));
  const status = resolveVisitStatus(dto);
  const phenologicalStage = firstText(fenologia.estadio, fenologia.estagio);
  const areaCondition = firstText(condicoes.vigorCultura, condicoes.uniformidade, condicoes.situacao);
  const criticalCount = occurrences.filter((occ) => occ.severityTone === 'critical' || occ.severityTone === 'high').length;

  const draftReport: TechnicalVisitReport = {
    id: firstText(meta.sessaoId, asRecord(dto.visita_snapshot ?? dto.visita).visita_id),
    reportKey: firstText(opts.reportId, opts.relatorioUuid, meta.id, meta.relatorioId, meta.uuid),
    title: 'Relatório de Visita Técnica Agronômica',
    farmName,
    plotName,
    cropName,
    seasonName,
    visitDate,
    generatedAt,
    technicianName,
    technicianCrea,
    status,
    visitType: firstText((dto as AnyRecord).tipoVisita, meta.tipoVisita),
    objective: firstText((dto as AnyRecord).objetivoVisita, asRecord(dto.planoAcao).objetivoManejo),
    city: firstText(prop.municipio),
    state: firstText(prop.estado),
    ownerName: firstText(prop.proprietario),
    areaHa,
    phenologicalStage,
    areaCondition,
    heroImage: firstText(photos.find((photo) => photo.url)?.url, prop.fotoAreaPath),
    polygon: resolvePolygon(mapa),
    points,
    photos,
    occurrences,
    recommendations: rawRecommendations,
    actions: rawActions,
    timeline: [],
    farmFields: [],
    visitFields: [],
    fieldConditionFields: [],
    identificationRows: [],
    operationRows: [],
    decisionPanel: [],
    kpis: [],
    conclusion: firstText(dto.conclusao, diagnostico.conclusaoProdutor),
    diagnosis: {
      mainProblem: firstText(diagnostico.problemaPrincipal),
      probableCause: firstText(diagnostico.causaProvavel),
      risk: firstText(diagnostico.nivelRisco),
      urgency: firstText(diagnostico.urgenciaAcao),
      observations: firstText(diagnostico.observacoes, diagnostico.observacoesTecnicas),
    },
    rawDebugIds: {
      farmId: firstText(prop.fazendaId, prop.farm_id),
      plotId: firstText(talhao.id, talhao.talhaoId),
      seasonId: firstText(contexto.safraId, meta.safraId),
      cropId: firstText(contexto.culturaId, talhao.culturaId),
    },
  };

  const assessment = normalizeAgronomicAssessment(draftReport);
  const recommendations = buildRecommendationsFallback({ ...draftReport, recommendations: rawRecommendations });
  const actions = buildPreventiveActionPlan({ ...draftReport, actions: rawActions });
  const diagnosisRisk = assessment.risk;

  return {
    id: firstText(meta.sessaoId, asRecord(dto.visita_snapshot ?? dto.visita).visita_id),
    reportKey: firstText(opts.reportId, opts.relatorioUuid, meta.id, meta.relatorioId, meta.uuid),
    title: 'Relatório de Visita Técnica Agronômica',
    farmName,
    plotName,
    cropName,
    seasonName,
    visitDate,
    generatedAt,
    technicianName,
    technicianCrea,
    status,
    visitType: draftReport.visitType,
    objective: draftReport.objective,
    city: draftReport.city,
    state: draftReport.state,
    ownerName: draftReport.ownerName,
    areaHa,
    phenologicalStage,
    areaCondition,
    heroImage: draftReport.heroImage,
    polygon: resolvePolygon(mapa),
    points,
    photos,
    occurrences,
    recommendations,
    actions,
    timeline: resolveTimeline(dto, points, photos, occurrences, rawRecommendations),
    farmFields: compactFields([
      field('Fazenda', farmName, true),
      field('Produtor', prop.proprietario),
      field('Município', prop.municipio),
      field('Estado', prop.estado),
      field('Talhão', plotName, true),
      field('Área', areaHa),
      field('Cultura', cropName),
      field('Safra', seasonName),
    ]),
    visitFields: compactFields([
      field('Data da visita', formatVisitDate(visitDate), true),
      field('Início', formatDateTime(condicoes.inicioVisita)),
      field('Fim', formatDateTime(condicoes.fimVisita)),
      field('Tipo', firstText((dto as AnyRecord).tipoVisita, meta.tipoVisita)),
      field('Objetivo', firstText((dto as AnyRecord).objetivoVisita, asRecord(dto.planoAcao).objetivoManejo)),
      field('Responsável', technicianName, true),
      field('CREA', technicianCrea),
      field('Status', status),
    ]),
    fieldConditionFields: compactFields([
      field('Clima', firstText(dto.condicoesClimaticasVisita, condicoes.condicoesClimaticas)),
      field('Temperatura', condicoes.temperatura != null ? `${condicoes.temperatura} °C` : undefined),
      field('Umidade do ar', condicoes.umidade != null ? `${condicoes.umidade}%` : undefined),
      field('Estádio fenológico', phenologicalStage),
      field('Condição da área', areaCondition),
      field('Vento', condicoes.vento),
      field('Umidade do solo', condicoes.soloUmidade),
      field('Observações de campo', firstText(condicoes.observacoes, dto.observacoesGeraisVisita)),
    ]),
    identificationRows: compactFields([
      field('Fazenda', farmName, true),
      field('Produtor', prop.proprietario),
      field('Município', prop.municipio),
      field('Estado', prop.estado),
      field('Talhão', plotName, true),
      field('Área', areaHa),
      field('Cultura', cropName),
      field('Safra', seasonName),
    ]),
    operationRows: compactFields([
      field('Data da visita', formatVisitDate(visitDate), true),
      field('Responsável', technicianName, true),
      field('CREA', technicianCrea),
      field('Status', status),
      field('Tipo', firstText((dto as AnyRecord).tipoVisita, meta.tipoVisita)),
      field('Objetivo', firstText((dto as AnyRecord).objetivoVisita, asRecord(dto.planoAcao).objetivoManejo)),
    ]),
    decisionPanel: buildDecisionPanel(
      { areaHa, occurrences, recommendations: rawRecommendations, photos, points, technicianName },
      assessment,
    ),
    kpis: [
      kpi('Status geral', assessment.generalStatus, undefined, assessment.generalStatusTone),
      kpi('Estádio fenológico', phenologicalStage, undefined, 'info'),
      kpi('Ocorrências', String(occurrences.length), criticalCount > 0 ? `${criticalCount} em atenção` : 'Sem críticas', criticalCount > 0 ? 'warning' : 'success'),
      kpi('Fotos', String(photos.length), undefined, 'neutral'),
      kpi('Pontos GPS', String(points.length), undefined, 'info'),
      kpi('Área monitorada', areaHa, undefined, 'neutral'),
      kpi('Risco agronômico', diagnosisRisk, undefined, assessment.riskTone === 'danger' ? 'danger' : assessment.riskTone === 'warning' ? 'warning' : 'success'),
      kpi('Urgência', assessment.urgency, undefined, assessment.urgencyTone === 'danger' ? 'danger' : 'info'),
    ].filter(Boolean) as TechnicalVisitKpi[],
    conclusion: draftReport.conclusion,
    diagnosis: {
      mainProblem: assessment.mainProblem,
      probableCause: assessment.probableCause,
      risk: assessment.risk,
      urgency: assessment.urgency,
      observations: firstText(diagnostico.observacoes, diagnostico.observacoesTecnicas),
    },
    rawDebugIds: {
      farmId: firstText(prop.fazendaId, prop.farm_id),
      plotId: firstText(talhao.id, talhao.talhaoId),
      seasonId: firstText(contexto.safraId, meta.safraId),
      cropId: firstText(contexto.culturaId, talhao.culturaId),
    },
  };
}
