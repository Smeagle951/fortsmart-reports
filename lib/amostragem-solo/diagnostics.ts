import type { AmostragemObservacao } from './payload';

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
