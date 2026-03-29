import type { CompactacaoAnalytics } from './compactacaoAnalytics';
import type { AmostragemObservacao } from './payload';

/**
 * Parágrafo curto para o bloco “Diagnóstico agronômico” (2–3 frases).
 * Percentuais referem-se às camadas amostradas (ponto × profundidade), não à área do mapa interpolada.
 */
export function buildDiagnosticoAgronomicoBreve(analytics: CompactacaoAnalytics): string {
  if (analytics.nObservacoesComIc === 0) {
    return 'Não há camadas com IC numérico neste recorte; não é possível emitir diagnóstico automático de compactação.';
  }

  const { icMedia, pctCamadasAltaCritica, profundidadeMaiorIcMedio, nObservacoesComIc } = analytics;
  const mediaTxt = icMedia != null ? `${icMedia.toFixed(2)} MPa` : '—';

  let fragil = '';
  if (pctCamadasAltaCritica >= 50) {
    fragil = `Cerca de ${pctCamadasAltaCritica}% das camadas amostradas apresentam restrição alta ou crítica (IC alinhado ao classificador do app), indicando condição frequentemente limitante ao crescimento radicular.`;
  } else if (pctCamadasAltaCritica >= 25) {
    fragil = `Cerca de ${pctCamadasAltaCritica}% das camadas amostradas estão em restrição alta ou crítica; há trechos com maior risco de limitação radicular.`;
  } else {
    fragil = `Aproximadamente ${pctCamadasAltaCritica}% das camadas amostradas estão em restrição alta ou crítica; predominam faixas de IC moderado a baixo no conjunto analisado.`;
  }

  const profTxt =
    profundidadeMaiorIcMedio != null
      ? ` O maior IC médio (${profundidadeMaiorIcMedio.icMedio.toFixed(2)} MPa) concentra-se na camada ${profundidadeMaiorIcMedio.profundidade}.`
      : '';

  return (
    `Com base em ${nObservacoesComIc} camada(s) com IC válido, a média global é ${mediaTxt}.${profTxt} ${fragil} ` +
      '(Valores são amostra pontual; não substituem visita técnica nem mapa de manejo por área real.)'
  );
}

/** Lista curta de recomendações de manejo baseada em regras sobre o resumo numérico. */
export function buildRecomendacoesCompactacao(analytics: CompactacaoAnalytics): string[] {
  const out: string[] = [];
  if (analytics.nObservacoesComIc === 0) {
    return ['Completar leituras com IC válido ou repetir o levantamento antes de definir intervenção mecânica.'];
  }

  const media = analytics.icMedia ?? 0;
  const pctAC = analytics.pctCamadasAltaCritica;
  const profPico = analytics.profundidadeMaiorIcMedio;

  if (pctAC >= 25 || media > 2.2) {
    out.push(
      'Avaliar alívio de compactação (subsolagem ou escarificação) na profundidade do pico de IC, respeitando umidade adequada do solo e orientação técnica local.',
    );
  }
  if (pctAC >= 15 || media > 1.8) {
    out.push(
      'Incluir na rotação culturas ou coberturas com sistema radicular agressivo (ex.: nabo forrageiro, aveia, milheto) para melhorar porosidade ao longo do tempo.',
    );
  }
  out.push('Evitar tráfego de máquinas com solo acima da capacidade de suporte (umidade elevada), reduzindo novo compactação em subsuperfície.');
  out.push('Repetir o levantamento após intervenção ou na safra seguinte para verificar resposta e ajustar manejo.');

  if (profPico && profPico.icMedio > 2.5) {
    out.push(
      `Priorizar diagnóstico visual e decisão localizada na faixa ${profPico.profundidade}, onde o IC médio é mais elevado.`,
    );
  }

  return out;
}

/**
 * Síntese automática de compactação (IC em MPa) a partir das observações do payload.
 * Heurística conservadora — não substitui parecer técnico presencial.
 */
export function buildCompactacaoDiagnostico(obs: AmostragemObservacao[]): string {
  const comIc = obs.filter(
    (o) => o.compactacao != null && Number.isFinite(Number(o.compactacao)),
  );
  if (comIc.length === 0) {
    return 'Não há registros com índice de cone (IC) numérico neste recorte; não é possível gerar síntese automática de compactação.';
  }

  const porClasse: Record<string, number> = {};
  let soma = 0;
  for (const o of comIc) {
    const c = (o.classificacao || 'Indefinido').trim() || 'Indefinido';
    porClasse[c] = (porClasse[c] ?? 0) + 1;
    soma += Number(o.compactacao);
  }
  const media = soma / comIc.length;

  const ordem = ['Crítica', 'Alta', 'Moderada', 'Baixa', 'Indefinido'];
  const partesClasse: string[] = [];
  for (const c of ordem) {
    const n = porClasse[c];
    if (n) partesClasse.push(`${n} ${n === 1 ? 'registro' : 'registros'} em “${c}”`);
  }

  const porProf: Record<string, { n: number; soma: number }> = {};
  for (const o of comIc) {
    const key =
      o.profundidade && String(o.profundidade).trim()
        ? String(o.profundidade).trim()
        : o.depth_top_cm != null && o.depth_bottom_cm != null
          ? `${o.depth_top_cm}-${o.depth_bottom_cm} cm`
          : 'Profundidade não informada';
    const cur = porProf[key] ?? { n: 0, soma: 0 };
    cur.n += 1;
    cur.soma += Number(o.compactacao);
    porProf[key] = cur;
  }

  let profMaxIc = '';
  let maxMedia = -1;
  for (const [prof, { n, soma: sp }] of Object.entries(porProf)) {
    const m = sp / n;
    if (m > maxMedia) {
      maxMedia = m;
      profMaxIc = prof;
    }
  }

  const fragil = (porClasse['Crítica'] ?? 0) + (porClasse['Alta'] ?? 0);
  const total = comIc.length;
  const pct = Math.round((fragil / total) * 100);

  let conclusao = '';
  if (pct >= 50) {
    conclusao =
      'Há fração elevada de camadas com compactação alta a crítica; recomenda-se avaliar manejo (cultivares de raiz, correção profunda, rotação e umidade na operação).';
  } else if (pct >= 25) {
    conclusao =
      'Compactação acentuada em parte do levantamento; priorizar zonas críticas/altas para decisão localizada (tráfego, subsolagem, época).';
  } else {
    conclusao =
      'Predominam camadas com compactação moderada a baixa; manter monitoramento por profundidade e repetir após manejo ou safras seguintes.';
  }

  const profText =
    profMaxIc && maxMedia >= 0
      ? ` Maior IC médio (${maxMedia.toFixed(2)} MPa) na faixa ${profMaxIc}.`
      : '';

  return (
    `Com base em ${total} registro(s) com IC: IC médio global ${media.toFixed(2)} MPa. ` +
      `Distribuição por classe: ${partesClasse.join('; ')}.${profText} ` +
      conclusao
  );
}
