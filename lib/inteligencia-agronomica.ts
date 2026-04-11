/**
 * Fonte única de verdade para o viewer: `inteligencia_agronomica` (contrato canónico).
 * Espelha `InteligenciaAgronomicaBuilder` (Dart). KPIs / SaaS devem usar `mapInteligenciaToKpi`.
 */

export type ConfiancaLabel = 'alta' | 'media' | 'baixa';

/** Slugs canónicos (minúsculos, sem acento) — armazenamento / API. */
export type SituacaoSlug = 'saudavel' | 'atencao' | 'critico';
export type RiscoSlug = 'baixo' | 'moderado' | 'alto';
export type TendenciaSlug = 'estavel' | 'piorando';

export type InteligenciaAgronomicaPayload = {
  situacao?: string;
  risco?: string;
  tendencia?: string;
  /** 0–100 — índice de decisão unificado (KPI principal). */
  score?: number;
  resumo?: string;
  recomendacao?: { acao?: string; prazo?: string };
  impacto?: { perda_estimada_sc?: number; roi_estimado?: number };
  confianca?: ConfiancaLabel;
  confianca_score?: number;
  evolucao?: { anterior_pct?: number; atual_pct?: number; delta_pct?: string };
  padrao?: string[];
  /** Legado: espelha `impacto` após normalização. */
  economia?: { perda_evitada_sc_ha?: number; roi_estimado?: number };
};

export type StatusGeralPt = 'Saudável' | 'Atenção' | 'Crítico';

export type IntelKpiDerived = {
  score: number | null;
  confianca: number | null;
  situacaoSlug: SituacaoSlug;
  riscoSlug: RiscoSlug;
  tendenciaSlug: TendenciaSlug;
  /** Cabeçalhos / badges SaaS — alinhado ao painel. */
  statusGeral: StatusGeralPt;
};

/** Texto vindo do app/DB pode ser número ou boolean — evita crash em .toLowerCase() no servidor. */
function coerceIntelText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return '';
}

function foldAccents(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

export function normalizeSituacaoSlug(s: unknown): SituacaoSlug {
  const str = coerceIntelText(s).trim();
  if (!str) return 'saudavel';
  const x = foldAccents(str);
  if (x.includes('crit')) return 'critico';
  if (x.includes('aten')) return 'atencao';
  return 'saudavel';
}

export function normalizeRiscoSlug(s: unknown): RiscoSlug {
  const str = coerceIntelText(s).trim();
  if (!str) return 'baixo';
  const x = foldAccents(str);
  if (x.includes('alt')) return 'alto';
  if (x.includes('mod')) return 'moderado';
  return 'baixo';
}

export function normalizeTendenciaSlug(s: unknown): TendenciaSlug {
  const str = coerceIntelText(s).trim();
  if (!str) return 'estavel';
  const x = foldAccents(str);
  if (x.includes('pior')) return 'piorando';
  return 'estavel';
}

export function formatSituacaoDisplay(slug: unknown): string {
  const s = normalizeSituacaoSlug(slug);
  if (s === 'critico') return 'Crítico';
  if (s === 'atencao') return 'Atenção';
  return 'Saudável';
}

export function formatRiscoDisplay(slug: unknown): string {
  const riscoSlug = normalizeRiscoSlug(slug);
  if (riscoSlug === 'alto') return 'Alto';
  if (riscoSlug === 'moderado') return 'Moderado';
  return 'Baixo';
}

export function formatTendenciaDisplay(slug: unknown): string {
  const t = normalizeTendenciaSlug(slug);
  return t === 'piorando' ? 'Piorando' : 'Estável';
}

function deriveScore(sit: SituacaoSlug, risco: RiscoSlug, confianca01: number): number {
  let base = sit === 'critico' ? 36 : sit === 'atencao' ? 58 : 80;
  if (risco === 'alto') base = Math.min(base, 44);
  else if (risco === 'moderado') base = Math.min(base, 64);
  const adj = Math.round((confianca01 - 0.5) * 26);
  return Math.min(100, Math.max(0, base + adj));
}

function resumoFromMap(m: InteligenciaAgronomicaPayload): string {
  const p = m.padrao;
  if (p && p.length > 0) return p[0]!;
  const sit = normalizeSituacaoSlug(m.situacao);
  if (sit === 'critico') {
    return 'Pressão agronómica elevada: priorizar ação corretiva e reavaliação em curto prazo.';
  }
  if (sit === 'atencao') {
    return 'Cenário que requer atenção técnica e monitoramento reforçado.';
  }
  return 'Cenário alinhado ao esperado para o momento avaliado; manter monitoramento de rotina.';
}

function recomendacaoFromKeys(sit: SituacaoSlug, risco: RiscoSlug): { acao: string; prazo: string } {
  if (sit === 'critico' || risco === 'alto') {
    return { acao: 'aplicar_controle', prazo: '48h' };
  }
  if (sit === 'atencao' || risco === 'moderado') {
    return { acao: 'reforcar_monitoramento', prazo: '7d' };
  }
  return { acao: 'manter_monitoramento', prazo: 'rotina' };
}

function impactoFromEconomia(m: InteligenciaAgronomicaPayload): { perda_estimada_sc: number; roi_estimado: number } {
  const ec = m.economia;
  let perda = 0;
  let roi = 1;
  if (ec && typeof ec === 'object') {
    const ph = ec.perda_evitada_sc_ha;
    const roiRaw = ec.roi_estimado;
    if (typeof ph === 'number' && !Number.isNaN(ph)) perda = ph;
    if (typeof roiRaw === 'number' && !Number.isNaN(roiRaw)) roi = roiRaw;
  }
  return { perda_estimada_sc: perda, roi_estimado: roi };
}

/** Garante contrato canónico (slug + score + resumo + recomendacao + impacto + economia). */
export function normalizeInteligenciaPayload(raw: Record<string, unknown>): InteligenciaAgronomicaPayload {
  let padraoNorm: string[] | undefined;
  const padRaw = raw.padrao;
  if (padRaw == null) {
    padraoNorm = undefined;
  } else if (Array.isArray(padRaw)) {
    padraoNorm = padRaw.map((x) => (typeof x === 'string' ? x : JSON.stringify(x)));
  } else if (typeof padRaw === 'object') {
    padraoNorm = Object.values(padRaw as Record<string, unknown>).map((x) =>
      typeof x === 'string' ? x : JSON.stringify(x),
    );
  } else {
    padraoNorm = [String(padRaw)];
  }

  const out: InteligenciaAgronomicaPayload = {
    situacao: normalizeSituacaoSlug(raw.situacao),
    risco: normalizeRiscoSlug(raw.risco),
    tendencia: normalizeTendenciaSlug(raw.tendencia),
    confianca: raw.confianca as ConfiancaLabel | undefined,
    confianca_score:
      typeof raw.confianca_score === 'number' && !Number.isNaN(raw.confianca_score)
        ? raw.confianca_score
        : undefined,
    evolucao: raw.evolucao as InteligenciaAgronomicaPayload['evolucao'],
    padrao: padraoNorm,
    economia: raw.economia as InteligenciaAgronomicaPayload['economia'],
    resumo: coerceIntelText(raw.resumo).trim() || undefined,
    recomendacao: raw.recomendacao as InteligenciaAgronomicaPayload['recomendacao'],
    impacto: raw.impacto as InteligenciaAgronomicaPayload['impacto'],
  };

  let confNum =
    typeof out.confianca_score === 'number' && !Number.isNaN(out.confianca_score)
      ? out.confianca_score
      : 0.55;
  if (out.confianca_score == null || Number.isNaN(out.confianca_score)) {
    out.confianca_score = confNum;
  } else {
    confNum = out.confianca_score;
  }
  if (!out.confianca) {
    out.confianca = confidenceLabel(confNum);
  }

  const sit = normalizeSituacaoSlug(out.situacao);
  const risco = normalizeRiscoSlug(out.risco);
  const tend = normalizeTendenciaSlug(out.tendencia);
  out.situacao = sit;
  out.risco = risco;
  out.tendencia = tend;

  const scoreRaw = raw.score;
  let scoreN: number | undefined;
  if (typeof scoreRaw === 'number' && !Number.isNaN(scoreRaw)) scoreN = Math.round(scoreRaw);
  else if (typeof scoreRaw === 'string') scoreN = parseInt(scoreRaw, 10);
  out.score =
    scoreN != null && !Number.isNaN(scoreN) && scoreN >= 0 && scoreN <= 100
      ? scoreN
      : deriveScore(sit, risco, confNum);

  const resumoTrim = coerceIntelText(out.resumo).trim();
  out.resumo = resumoTrim.length > 0 ? resumoTrim : resumoFromMap(out);

  const rec = out.recomendacao;
  if (!rec || typeof rec !== 'object' || Object.keys(rec).length === 0) {
    out.recomendacao = recomendacaoFromKeys(sit, risco);
  }

  const imp = out.impacto;
  if (!imp || typeof imp !== 'object' || Object.keys(imp).length === 0) {
    out.impacto = impactoFromEconomia(out);
  }

  const perdaSc =
    typeof out.impacto?.perda_estimada_sc === 'number' && !Number.isNaN(out.impacto.perda_estimada_sc)
      ? out.impacto.perda_estimada_sc
      : 0;
  const roiEst =
    typeof out.impacto?.roi_estimado === 'number' && !Number.isNaN(out.impacto.roi_estimado)
      ? out.impacto.roi_estimado
      : 1;
  out.economia = {
    ...out.economia,
    perda_evitada_sc_ha: perdaSc,
    roi_estimado: roiEst,
  };

  return out;
}

/** KPIs e status de cabeçalho — sempre derivados do bloco canónico. */
export function mapInteligenciaToKpi(intel: InteligenciaAgronomicaPayload): IntelKpiDerived {
  const n = normalizeInteligenciaPayload(intel as unknown as Record<string, unknown>);
  const situacaoSlug = normalizeSituacaoSlug(n.situacao);
  const statusGeral: StatusGeralPt =
    situacaoSlug === 'critico' ? 'Crítico' : situacaoSlug === 'atencao' ? 'Atenção' : 'Saudável';
  return {
    score: typeof n.score === 'number' ? n.score : null,
    confianca: typeof n.confianca_score === 'number' ? n.confianca_score : null,
    situacaoSlug,
    riscoSlug: normalizeRiscoSlug(n.risco),
    tendenciaSlug: normalizeTendenciaSlug(n.tendencia),
    statusGeral,
  };
}

/** Compat SaaS (`inteligenciaAgronomica` legado no `ReportPageSaaSData`). */
export function intelToLegacySaaSFields(intel: InteligenciaAgronomicaPayload): {
  score: number;
  status: StatusGeralPt;
} {
  const k = mapInteligenciaToKpi(intel);
  return {
    score: k.score ?? 0,
    status: k.statusGeral,
  };
}

export function confidenceScore(input: {
  numAmostrasNorm: number;
  consistenciaDados: number;
  historicoSimilar: number;
}): number {
  const s =
    input.numAmostrasNorm * 0.4 + input.consistenciaDados * 0.3 + input.historicoSimilar * 0.3;
  return Math.min(1, Math.max(0, s));
}

export function confidenceLabel(score: number): ConfiancaLabel {
  if (score >= 0.67) return 'alta';
  if (score >= 0.4) return 'media';
  return 'baixa';
}

function normSeveridade(s: unknown): number {
  const str = coerceIntelText(s).trim();
  if (!str) return 0;
  const x = str.toLowerCase();
  if (x.includes('crít') || x.includes('crit') || x.includes('alta')) return 0.85;
  if (x.includes('méd') || x.includes('med')) return 0.5;
  return 0.25;
}

function severidadeLabelFromNum(n: number): string {
  if (n >= 70) return 'alta';
  if (n >= 40) return 'média';
  return 'baixa';
}

function collectPragasLike(relatorio: Record<string, unknown>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  const talhoes = (relatorio.talhoes as Record<string, unknown>[] | undefined) ?? [];
  const primeiro = talhoes[0];
  if (primeiro && typeof primeiro === 'object') {
    const pr = primeiro.pragas;
    if (Array.isArray(pr)) {
      for (const p of pr) {
        if (p && typeof p === 'object') out.push(p as Record<string, unknown>);
      }
    }
    const pontos = primeiro.pontos as unknown[] | undefined;
    if (Array.isArray(pontos)) {
      for (const pt of pontos) {
        if (!pt || typeof pt !== 'object') continue;
        const inf = (pt as Record<string, unknown>).infestacoes as unknown[] | undefined;
        if (!Array.isArray(inf)) continue;
        for (const i of inf) {
          if (!i || typeof i !== 'object') continue;
          const im = i as Record<string, unknown>;
          const sevRaw = im.severidade;
          const sevNum = typeof sevRaw === 'number' ? sevRaw : Number(sevRaw);
          const label =
            !Number.isNaN(sevNum) && sevRaw != null && sevRaw !== ''
              ? severidadeLabelFromNum(sevNum)
              : '';
          out.push({
            alvo: im.nome,
            nome: im.nome,
            tipo: im.tipo,
            ...(label ? { severidade: label } : {}),
          });
        }
      }
    }
  }
  const rootPragas = relatorio.pragas as unknown;
  if (Array.isArray(rootPragas)) {
    for (const p of rootPragas) {
      if (p && typeof p === 'object') out.push(p as Record<string, unknown>);
    }
  } else if (rootPragas != null && typeof rootPragas === 'object' && !Array.isArray(rootPragas)) {
    for (const p of Object.values(rootPragas as Record<string, unknown>)) {
      if (p && typeof p === 'object' && !Array.isArray(p)) out.push(p as Record<string, unknown>);
    }
  }
  return out;
}

function maxFromOrganismos(relatorio: Record<string, unknown>): number {
  let maxSev = 0;
  const orgs = relatorio.organismos as Record<string, unknown>[] | undefined;
  if (!Array.isArray(orgs)) return maxSev;
  for (const o of orgs) {
    if (!o || typeof o !== 'object') continue;
    const sm =
      (o.severidadeMedia as number | undefined) ?? (o.severidade_media as number | undefined);
    if (typeof sm === 'number' && !Number.isNaN(sm)) {
      maxSev = Math.max(maxSev, Math.min(1, sm / 100));
    }
  }
  return maxSev;
}

function resolveNumPontos(relatorio: Record<string, unknown>): number {
  const m = relatorio.metricas as Record<string, unknown> | undefined;
  if (m && typeof m === 'object') {
    const tp = m.totalPontos ?? m.total_pontos;
    if (typeof tp === 'number') return tp;
  }
  const n = relatorio.num_pontos;
  if (typeof n === 'number') return n;
  const talhoes = relatorio.talhoes as unknown[] | undefined;
  if (Array.isArray(talhoes) && talhoes.length > 0) return 4;
  return 1;
}

function situacaoRiscoTendencia(maxSev: number): { situacao: string; risco: string; tendencia: string } {
  if (maxSev >= 0.75) {
    return { situacao: 'CRÍTICO', risco: 'ALTO', tendencia: 'PIORANDO' };
  }
  if (maxSev >= 0.45) {
    return {
      situacao: 'ATENÇÃO',
      risco: 'MODERADO',
      tendencia: maxSev >= 0.55 ? 'PIORANDO' : 'ESTÁVEL',
    };
  }
  return { situacao: 'SAUDÁVEL', risco: 'BAIXO', tendencia: 'ESTÁVEL' };
}

function evolucaoFromIqf(relatorio: Record<string, unknown>): InteligenciaAgronomicaPayload['evolucao'] {
  const iqfpct = typeof relatorio.iqf_media === 'number' ? relatorio.iqf_media : undefined;
  const anterior = iqfpct != null ? Math.max(0, iqfpct - 12) : 18;
  const atual = iqfpct ?? 32;
  let deltaPct = '+78%';
  if (anterior > 0) {
    const pct = Math.round(((atual - anterior) / anterior) * 100);
    deltaPct = `${pct >= 0 ? '+' : ''}${pct}%`;
  }
  return { anterior_pct: anterior, atual_pct: atual, delta_pct: deltaPct };
}

function forResearchPro(relatorio: Record<string, unknown>): InteligenciaAgronomicaPayload {
  const av = relatorio.avaliacoes as unknown[] | undefined;
  const n = Array.isArray(av) ? av.length : 0;
  const numAmostrasNorm = Math.min(1, n / 8);
  const sc = confidenceScore({
    numAmostrasNorm,
    consistenciaDados: 0.72,
    historicoSimilar: 0.55,
  });
  return {
    situacao: 'SAUDÁVEL',
    risco: 'BAIXO',
    tendencia: 'ESTÁVEL',
    confianca: confidenceLabel(sc),
    confianca_score: Math.round(sc * 100) / 100,
    evolucao: { anterior_pct: 40, atual_pct: 48, delta_pct: '+20%' },
    padrao: [
      'Ensaio experimental: priorizar delineamento e uniformidade operacional na leitura dos resultados.',
    ],
    economia: { perda_evitada_sc_ha: 0, roi_estimado: 1.2 },
  };
}

function forAmostragemSolo(): InteligenciaAgronomicaPayload {
  return {
    situacao: 'ATENÇÃO',
    risco: 'MODERADO',
    tendencia: 'ESTÁVEL',
    confianca: 'media',
    confianca_score: 0.52,
    evolucao: { anterior_pct: 12, atual_pct: 18, delta_pct: '+50%' },
    padrao: [
      'Amostragem de solos: interpretar resultados laboratoriais antes de decisão de correção.',
      'Verificar compactação e camadas restritivas se indicado no plano de amostragem.',
    ],
    economia: { perda_evitada_sc_ha: 0, roi_estimado: 1.0 },
  };
}

function forLadoALado(relatorio: Record<string, unknown>): InteligenciaAgronomicaPayload {
  const ocs = relatorio.ocorrencias as Record<string, unknown>[] | undefined;
  let maxSev = 0;
  if (Array.isArray(ocs)) {
    for (const o of ocs) {
      if (!o || typeof o !== 'object') continue;
      const inc = o.incidenciaPct as number | undefined;
      if (typeof inc === 'number' && !Number.isNaN(inc)) {
        maxSev = Math.max(maxSev, Math.min(1, inc / 100));
      }
      maxSev = Math.max(maxSev, normSeveridade(o.severidade as string | undefined));
    }
  }
  const n = Array.isArray(ocs) ? ocs.length : 0;
  const sc = confidenceScore({
    numAmostrasNorm: Math.min(1, n / 6),
    consistenciaDados: n > 0 ? 0.65 : 0.45,
    historicoSimilar: maxSev * 0.9,
  });
  const { situacao, risco, tendencia } = situacaoRiscoTendencia(maxSev);
  const padrao: string[] = [];
  if (n >= 2) {
    padrao.push(
      'Comparativo lado a lado: contrastar manejo e condições entre parcelas ao interpretar diferenças.',
    );
  }
  return {
    situacao,
    risco,
    tendencia,
    confianca: confidenceLabel(sc),
    confianca_score: Math.round(sc * 100) / 100,
    evolucao: evolucaoFromIqf(relatorio),
    ...(padrao.length ? { padrao } : {}),
    economia: { perda_evitada_sc_ha: 8, roi_estimado: 2.2 },
  };
}

function forPlantio(relatorio: Record<string, unknown>): InteligenciaAgronomicaPayload {
  let maxStress = 0;
  const dp = relatorio.dados_plantio as Record<string, unknown> | undefined;
  if (dp && typeof dp === 'object') {
    const cv = dp.cv_percent as number | undefined;
    if (typeof cv === 'number' && !Number.isNaN(cv)) {
      maxStress = Math.max(maxStress, Math.min(1, cv / 50));
    }
  }
  const mod = relatorio.modulo_plantio as Record<string, unknown> | undefined;
  const plant = mod?.plantabilidade as Record<string, unknown> | undefined;
  if (plant && typeof plant === 'object') {
    const falhas = plant.falhasPct as number | undefined;
    if (typeof falhas === 'number' && !Number.isNaN(falhas)) {
      maxStress = Math.max(maxStress, Math.min(1, falhas / 30));
    }
  }
  if (maxStress < 0.2) maxStress = 0.15;
  const { situacao, risco, tendencia } = situacaoRiscoTendencia(maxStress);
  const sc = confidenceScore({
    numAmostrasNorm: 0.55,
    consistenciaDados: 0.6,
    historicoSimilar: maxStress * 0.85,
  });
  const padrao: string[] = [];
  if (maxStress >= 0.45) {
    padrao.push('Plantio: atenção a CV% / falhas — revisar semeadora, velocidade e umidade do solo.');
  }
  return {
    situacao,
    risco,
    tendencia,
    confianca: confidenceLabel(sc),
    confianca_score: Math.round(sc * 100) / 100,
    evolucao: evolucaoFromIqf(relatorio),
    ...(padrao.length ? { padrao } : {}),
    economia: { perda_evitada_sc_ha: 6, roi_estimado: 2.0 },
  };
}

function defaultFromPragasAndMetrics(relatorio: Record<string, unknown>): InteligenciaAgronomicaPayload {
  const pragas = collectPragasLike(relatorio);
  let maxSev = 0;
  const alvos: string[] = [];
  for (const p of pragas) {
    maxSev = Math.max(maxSev, normSeveridade(p.severidade as string | undefined));
    const nome = String(p.alvo ?? p.nome ?? p.tipo ?? '').trim();
    if (nome) alvos.push(nome);
  }
  maxSev = Math.max(maxSev, maxFromOrganismos(relatorio));

  const nPontos = resolveNumPontos(relatorio);
  const numAmostrasNorm = Math.min(1, nPontos / 6);
  const consistencia = pragas.length > 0 ? 0.65 : 0.4;
  const sc = confidenceScore({
    numAmostrasNorm,
    consistenciaDados: consistencia,
    historicoSimilar: maxSev * 0.9,
  });
  const { situacao, risco } = situacaoRiscoTendencia(maxSev);
  const tendencia = maxSev >= 0.55 ? 'PIORANDO' : 'ESTÁVEL';

  const padrao: string[] = [];
  if (alvos.some((a) => /lagarta|spodoptera|helicoverpa/i.test(a))) {
    padrao.push(
      'Recorrência ou pressão de lagarta associada ao histórico de ocorrências neste talhão.',
    );
  }
  if (pragas.length >= 3) {
    padrao.push('Múltiplos alvos fitossanitários — revisar cobertura e calendário de aplicações.');
  }

  return {
    situacao,
    risco,
    tendencia,
    confianca: confidenceLabel(sc),
    confianca_score: Math.round(sc * 100) / 100,
    evolucao: evolucaoFromIqf(relatorio),
    ...(padrao.length ? { padrao } : {}),
    economia: { perda_evitada_sc_ha: 10, roi_estimado: 2.8 },
  };
}

/** Deriva painel a partir do relatório (ou usa bloco já enviado pelo app) — sempre canónico. */
export function computeInteligenciaAgronomicaFromRelatorio(
  relatorio: Record<string, unknown>,
): InteligenciaAgronomicaPayload {
  const embedded = relatorio.inteligencia_agronomica as Record<string, unknown> | undefined;
  if (embedded && typeof embedded === 'object' && (embedded.situacao != null || embedded.risco != null)) {
    return normalizeInteligenciaPayload(embedded);
  }

  const core = relatorio.core as Record<string, unknown> | undefined;
  if (core && core.report_type === 'RESEARCH_PRO') {
    return normalizeInteligenciaPayload(forResearchPro(relatorio) as unknown as Record<string, unknown>);
  }

  const tipo = String(relatorio.tipo ?? '').toLowerCase();
  if (tipo === 'amostragem_solo') {
    return normalizeInteligenciaPayload(forAmostragemSolo() as unknown as Record<string, unknown>);
  }
  if (tipo === 'avaliacao_lado_a_lado') {
    return normalizeInteligenciaPayload(forLadoALado(relatorio) as unknown as Record<string, unknown>);
  }
  if (tipo === 'plantio' || tipo === 'plantio_multi') {
    return normalizeInteligenciaPayload(forPlantio(relatorio) as unknown as Record<string, unknown>);
  }

  return normalizeInteligenciaPayload(
    defaultFromPragasAndMetrics(relatorio) as unknown as Record<string, unknown>,
  );
}
