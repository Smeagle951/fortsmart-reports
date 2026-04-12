/**
 * Narrativa de decisão para o topo do relatório VT (hero + frases orientadoras).
 */

import {
  computeInteligenciaAgronomicaFromRelatorio,
  formatRiscoDisplay,
  formatSituacaoDisplay,
  normalizeSituacaoSlug,
  type InteligenciaAgronomicaPayload,
} from '@/lib/inteligencia-agronomica';
import { computeDecisaoVisita, type VisitaTecnicaDecisaoInput } from './computeDecisaoVisita';
import { coerceVisitaObjectArray } from './coerceVisitaPayload';

export type HeroStatusVariant = 'critico' | 'atencao' | 'ok' | 'bom';

export interface VtHeroNarrativeModel {
  tituloTalhao: string;
  sublinha: string;
  statusLabel: string;
  statusVariant: HeroStatusVariant;
  score: number;
  impactoScHaTexto: string | null;
  impactoFrase: string | null;
  riscoExibicao: string;
  proximaAcao: string;
  causaLinha: string | null;
  resumoDecisao: string;
  /** Estágio fenológico + ênfase em janela de decisão (ex.: R5). */
  janelaCritica: string | null;
  /** Resposta direta a “Estou perdendo produtividade?”. */
  respostaPerdaProdutividade: string;
  /** Resposta direta a “Preciso agir agora?”. */
  respostaAgirAgora: string;
}

function parseNumSc(v: unknown): number | null {
  if (v == null) return null;
  const n = Number(String(v).replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

function severidadePesoPraga(p: Record<string, unknown>): number {
  const sev = String(p.severidade ?? '').toLowerCase();
  const sit = String(p.situacao ?? '').toLowerCase();
  if (sev.includes('crit') || sit.includes('crit')) return 3;
  if (sev.includes('alt') || sit.includes('acima') || sit.includes('elev')) return 2;
  if (sev.includes('med')) return 1;
  return 0;
}

/** Extrai % de string tipo "12%", "12,5 %", "Alta (40%)" */
export function parseIncidenciaPercentual(incidencia: unknown): number | null {
  if (incidencia == null) return null;
  const s = String(incidencia);
  const m = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (m) {
    const n = Number(m[1].replace(',', '.'));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
  }
  return null;
}

/** Barra 0–100 quando não há % explícito */
export function severidadeParaBarraPct(p: Record<string, unknown>): number {
  const w = severidadePesoPraga(p);
  const pct = parseIncidenciaPercentual(p.incidencia);
  if (pct != null) return pct;
  if (w >= 3) return 88;
  if (w === 2) return 58;
  if (w === 1) return 35;
  return 18;
}

export function labelUrgenciaPraga(p: Record<string, unknown>): string {
  const w = severidadePesoPraga(p);
  if (w >= 3) return 'Agir com prioridade';
  if (w === 2) return 'Monitorar de perto';
  if (w === 1) return 'Acompanhar';
  return 'Controlado / baixo';
}

function statusVariantFromSlug(slug: string, indice: number): HeroStatusVariant {
  if (slug === 'critico') return 'critico';
  if (slug === 'atencao') return 'atencao';
  if (indice >= 78) return 'bom';
  if (indice >= 62) return 'ok';
  return 'atencao';
}

function fallbackStatusFromIndice(indice: number): { label: string; variant: HeroStatusVariant } {
  if (indice >= 78) return { label: 'Dentro do esperado', variant: 'bom' };
  if (indice >= 62) return { label: 'Atenção', variant: 'atencao' };
  if (indice >= 45) return { label: 'Requer manejo', variant: 'atencao' };
  return { label: 'Prioridade', variant: 'critico' };
}

function topCausaLinha(
  pragas: Record<string, unknown>[],
  problemaPrincipal: string | undefined,
  intelResumo: string | undefined,
): string | null {
  if (problemaPrincipal?.trim()) return problemaPrincipal.trim();
  if (intelResumo?.trim()) {
    const t = intelResumo.trim();
    const cut = t.split(/[.!?]\s/).filter(Boolean)[0];
    return cut ? (cut.length > 140 ? `${cut.slice(0, 137)}…` : cut) : t.slice(0, 140);
  }
  if (pragas.length === 0) return null;
  const sorted = [...pragas].sort((a, b) => severidadePesoPraga(b) - severidadePesoPraga(a));
  const p = sorted[0];
  const alvo = String(p.alvo ?? p.nome ?? 'Alvo').trim();
  const tipo = String(p.tipo ?? '').trim();
  return [tipo, alvo].filter(Boolean).join(' · ') || alvo;
}

function buildProximaAcao(
  relatorio: Record<string, unknown>,
  intel: InteligenciaAgronomicaPayload,
  d: ReturnType<typeof computeDecisaoVisita>,
  diag: Record<string, unknown>,
): string {
  const plano = relatorio.planoAcao as { acoes?: Array<{ acao?: string; prazo?: string; prioridade?: string }> } | undefined;
  const acoes = Array.isArray(plano?.acoes) ? plano!.acoes! : [];
  const primeira = acoes.find((a) => (a.acao != null && String(a.acao).trim() !== '') || (a.prazo != null && String(a.prazo).trim() !== ''));
  if (primeira) {
    const parts = [primeira.acao != null ? String(primeira.acao) : null, primeira.prazo != null ? `Prazo: ${primeira.prazo}` : null].filter(Boolean);
    if (parts.length) return parts.join(' · ');
  }
  if (intel.recomendacao?.acao) {
    const p = [intel.recomendacao.acao, intel.recomendacao.prazo ? `(${intel.recomendacao.prazo})` : null].filter(Boolean).join(' ');
    if (p.trim()) return p.trim();
  }
  if (diag.urgenciaAcao != null && String(diag.urgenciaAcao).trim()) return String(diag.urgenciaAcao);
  const urg = d.alertas.find((a) => a.nivel === 'critico') ?? d.alertas.find((a) => a.nivel === 'atencao');
  if (urg) {
    const t = urg.texto;
    return t.length > 160 ? `${t.slice(0, 157)}…` : t;
  }
  return d.resumoLinha;
}

function buildJanelaCritica(fenologiaEstagio: string | undefined): string | null {
  const e = fenologiaEstagio?.trim();
  if (!e) return null;
  if (/^R\d/i.test(e)) {
    return `${e} — janela crítica para manejo (momento da visita)`;
  }
  return `${e} — estágio registrado na visita`;
}

function buildRespostasProntas(args: {
  statusVariant: HeroStatusVariant;
  score: number;
  impactoScHaTexto: string | null;
  impactoFrase: string | null;
  potN: number | null;
  estN: number | null;
  perdaIntel: number | undefined;
}): { perda: string; agir: string } {
  const { statusVariant, score, impactoScHaTexto, impactoFrase, potN, estN, perdaIntel } = args;

  let perda: string;
  if (typeof perdaIntel === 'number' && !Number.isNaN(perdaIntel) && perdaIntel > 0) {
    perda = 'Sim — o motor indica impacto negativo estimado na produtividade (veja sc/ha acima).';
  } else if (typeof perdaIntel === 'number' && !Number.isNaN(perdaIntel) && perdaIntel < 0) {
    perda = 'Indício de espaço positivo frente à referência do motor — validar em campo.';
  } else if (potN != null && estN != null) {
    const delta = estN - potN;
    if (delta < -0.05) {
      perda = 'Sim — estimativa abaixo do potencial declarado (perda relativa possível).';
    } else if (delta > 0.05) {
      perda = 'Não no sentido de perda — estimativa acima do potencial; confira método e dados.';
    } else {
      perda = 'Não — estimativa alinhada ao potencial declarado.';
    }
  } else if (impactoFrase?.includes('parcialmente')) {
    perda = 'Indeterminado — complete potencial e estimativa no app para comparar.';
  } else if (impactoScHaTexto?.startsWith('-') || impactoScHaTexto?.startsWith('−')) {
    perda = 'Sim — há indício quantificado de diferença em sc/ha (ver acima).';
  } else {
    perda = 'Não foi possível concluir só com este relatório — faltam comparativos claros.';
  }

  let agir: string;
  if (statusVariant === 'critico' || score < 42) {
    agir = 'Sim — priorize a próxima ação e reduza risco técnico já nesta janela.';
  } else if (statusVariant === 'atencao' || score < 62) {
    agir = 'Atenção — não ignore: cumpra o prazo da próxima ação e monitore de perto.';
  } else {
    agir = 'Rotina — manter monitoramento; sem sinal de urgência máxima neste snapshot.';
  }

  return { perda, agir };
}

export function buildVtHeroNarrative(
  relatorio: Record<string, unknown>,
  input: VisitaTecnicaDecisaoInput,
  opts: {
    fazenda: string;
    talhaoNome?: string;
    cultura?: string;
    areaHa?: number;
    fenologiaEstagio?: string;
    potencialSc?: string;
    estimativaSc?: string;
  },
): VtHeroNarrativeModel {
  const intel = computeInteligenciaAgronomicaFromRelatorio(relatorio);
  const d = computeDecisaoVisita(input);
  const diag = (relatorio.diagnostico ?? {}) as Record<string, unknown>;
  const pragas = coerceVisitaObjectArray(relatorio.pragas);

  const score = typeof intel.score === 'number' && !Number.isNaN(intel.score) ? Math.round(intel.score) : d.indiceFortSmart;
  const slug = normalizeSituacaoSlug(intel.situacao);
  const hasIntelSituacao = String(intel.situacao ?? '').trim().length > 0;
  const statusLabel = hasIntelSituacao ? formatSituacaoDisplay(intel.situacao) : fallbackStatusFromIndice(score).label;
  const statusVariant = hasIntelSituacao ? statusVariantFromSlug(slug, score) : fallbackStatusFromIndice(score).variant;

  const potN = parseNumSc(opts.potencialSc);
  const estN = parseNumSc(opts.estimativaSc);
  let impactoScHaTexto: string | null = null;
  let impactoFrase: string | null = null;

  const perdaIntelRaw = intel.impacto?.perda_estimada_sc ?? intel.economia?.perda_evitada_sc_ha;
  const perdaIntel = typeof perdaIntelRaw === 'number' && !Number.isNaN(perdaIntelRaw) ? perdaIntelRaw : undefined;
  if (perdaIntel !== undefined && perdaIntel !== 0) {
    const sign = perdaIntel > 0 ? '−' : '+';
    impactoScHaTexto = `${sign}${Math.abs(perdaIntel).toFixed(1)} sc/ha`;
    impactoFrase =
      perdaIntel > 0
        ? 'Impacto estimado sobre a produtividade em relação ao cenário de referência.'
        : 'Estimativa de ganho ou recuperação em sc/ha (referência do motor FortSmart).';
  } else if (potN != null && estN != null) {
    const delta = estN - potN;
    if (Math.abs(delta) >= 0.05) {
      if (delta < 0) {
        impactoScHaTexto = `${delta.toFixed(1)} sc/ha`;
        impactoFrase = `Estimativa atual ${Math.abs(delta).toFixed(1)} sc/ha abaixo do potencial declarado — possível perda relativa de produtividade.`;
      } else {
        impactoScHaTexto = `+${delta.toFixed(1)} sc/ha`;
        impactoFrase = 'Estimativa acima do potencial declarado — validar método e dados de campo.';
      }
    } else {
      impactoFrase = 'Estimativa alinhada ao potencial declarado.';
    }
  } else if (potN != null || estN != null) {
    impactoFrase = 'Potencial ou estimativa parcialmente informados — complete no app para comparar perdas relativas.';
  }

  const riscoExibicao = String(intel.risco ?? '').trim()
    ? formatRiscoDisplay(intel.risco)
    : String(diag.nivelRisco ?? 'Moderado').trim() || 'Moderado';

  const proximaAcao = buildProximaAcao(relatorio, intel, d, diag);
  const causaLinha = topCausaLinha(pragas, String(diag.problemaPrincipal ?? '').trim() || undefined, intel.resumo);

  const talhao = opts.talhaoNome?.trim() || 'Talhão';
  const tituloTalhao = talhao;
  const parts: string[] = [];
  if (opts.cultura?.trim()) parts.push(opts.cultura.trim());
  if (opts.areaHa != null && !Number.isNaN(opts.areaHa)) parts.push(`${opts.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ha`);
  if (opts.fenologiaEstagio?.trim()) parts.push(opts.fenologiaEstagio.trim());
  const sublinha = parts.length > 0 ? parts.join(' · ') : (opts.fazenda !== 'Fazenda' ? opts.fazenda : 'Visita técnica');

  const janelaCritica = buildJanelaCritica(opts.fenologiaEstagio);
  const { perda: respostaPerdaProdutividade, agir: respostaAgirAgora } = buildRespostasProntas({
    statusVariant,
    score,
    impactoScHaTexto,
    impactoFrase,
    potN,
    estN,
    perdaIntel,
  });

  return {
    tituloTalhao,
    sublinha,
    statusLabel,
    statusVariant,
    score,
    impactoScHaTexto,
    impactoFrase,
    riscoExibicao,
    proximaAcao,
    causaLinha,
    resumoDecisao: intel.resumo?.trim() || d.resumoLinha,
    janelaCritica,
    respostaPerdaProdutividade,
    respostaAgirAgora,
  };
}
