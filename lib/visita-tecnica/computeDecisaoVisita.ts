/**
 * Motor orientador para o relatório web de visita técnica:
 * índice 0–100, dimensões e alertas a partir do payload (sem IA remota).
 */

/** Subconjunto do payload usado pelo cálculo (evita dependência circular com componentes). */
export interface VisitaTecnicaDecisaoInput {
  pragas?: Record<string, unknown>[];
  diagnostico?: Record<string, unknown>;
  fenologia?: Record<string, unknown>;
  populacao?: Record<string, unknown>;
  condicoes?: Record<string, unknown>;
}

export type DecisaoTone = 'bom' | 'medio' | 'atencao' | 'critico' | 'neutro';

export interface DimensaoVisita {
  id: string;
  label: string;
  status: string;
  tone: DecisaoTone;
  detalhe?: string;
}

export interface AlertaVisita {
  nivel: 'critico' | 'atencao' | 'ok';
  texto: string;
}

export interface DecisaoVisitaResult {
  indiceFortSmart: number;
  resumoLinha: string;
  dimensoes: DimensaoVisita[];
  alertas: AlertaVisita[];
}

function norm(s: unknown): string {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function severidadePeso(p: Record<string, unknown>): number {
  const sev = norm(p.severidade);
  const sit = norm(p.situacao);
  if (sev.includes('crit') || sit.includes('crit')) return 3;
  if (sev.includes('alt') || sit.includes('acima') || sit.includes('elev')) return 2;
  if (sev.includes('med')) return 1;
  return 0;
}

function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

/** Subscore 0–100 (maior = melhor) */
function scoreSanidade(
  pragas: Record<string, unknown>[],
  nivelRisco: string,
): number {
  let s = 88;
  for (const p of pragas) {
    const w = severidadePeso(p);
    if (w >= 3) s -= 18;
    else if (w === 2) s -= 10;
    else if (w === 1) s -= 5;
    else s -= 2;
  }
  const r = norm(nivelRisco);
  if (r.includes('alt') || r.includes('crit')) s -= 22;
  else if (r.includes('med') || r.includes('aten')) s -= 10;
  return clamp(s, 15, 100);
}

function scoreEstande(pop?: Record<string, unknown>): number {
  const ef = pop?.eficienciaPct;
  if (typeof ef === 'number' && !Number.isNaN(ef)) {
    if (ef >= 92) return 95;
    if (ef >= 85) return 85;
    if (ef >= 75) return 72;
    if (ef >= 65) return 58;
    return 45;
  }
  const sit = norm(pop?.situacao);
  if (sit.includes('excel') || sit.includes('bom') || sit.includes('adequ')) return 82;
  if (sit.includes('med') || sit.includes('regular')) return 68;
  if (sit.includes('baix') || sit.includes('defic')) return 48;
  return 72;
}

function scoreDesenvolvimento(fen: Record<string, unknown>): number {
  const est = String(fen.estadio ?? fen.estagio ?? '').trim();
  if (est.length > 1) return 84;
  return 65;
}

function scoreAmbiente(cond: Record<string, unknown>): number {
  let s = 78;
  const vig = norm(cond.vigorCultura);
  const comp = norm(cond.compactacao);
  const solo = norm(cond.soloUmidade);
  if (vig.includes('baix') || vig.includes('frac')) s -= 18;
  if (comp.includes('alt') || comp.includes('sever') || comp.includes('elev')) s -= 20;
  if (solo.includes('excess') || solo.includes('enchar')) s -= 8;
  if (solo.includes('seco') || solo.includes('defic')) s -= 8;
  return clamp(s, 20, 100);
}

function scoreRiscoInvertido(nivelRisco: string): number {
  const r = norm(nivelRisco);
  if (!r || r === '—') return 75;
  if (r.includes('baix') || r.includes('control')) return 92;
  if (r.includes('med')) return 68;
  if (r.includes('alt') || r.includes('crit')) return 35;
  return 70;
}

function toneFromScore(s: number): DecisaoTone {
  if (s >= 78) return 'bom';
  if (s >= 62) return 'medio';
  if (s >= 45) return 'atencao';
  return 'critico';
}

function labelFromTone(t: DecisaoTone): string {
  switch (t) {
    case 'bom':
      return 'Dentro do esperado';
    case 'medio':
      return 'Atenção';
    case 'atencao':
      return 'Requer manejo';
    case 'critico':
      return 'Prioridade';
    default:
      return 'Sem dados';
  }
}

export function computeDecisaoVisita(relatorio: VisitaTecnicaDecisaoInput): DecisaoVisitaResult {
  const pragas = (relatorio.pragas ?? []) as Record<string, unknown>[];
  const diag = (relatorio.diagnostico ?? {}) as Record<string, unknown>;
  const fen = (relatorio.fenologia ?? {}) as Record<string, unknown>;
  const pop =
    relatorio.populacao != null && typeof relatorio.populacao === 'object'
      ? (relatorio.populacao as Record<string, unknown>)
      : undefined;
  const cond = (relatorio.condicoes ?? {}) as Record<string, unknown>;
  const nivelRisco = String(diag.nivelRisco ?? '');

  const sSan = scoreSanidade(pragas, nivelRisco);
  const sEst = scoreEstande(pop);
  const sDes = scoreDesenvolvimento(fen);
  const sAmb = scoreAmbiente(cond);
  const sRis = scoreRiscoInvertido(nivelRisco);

  const indice = Math.round(
    sSan * 0.34 + sEst * 0.24 + sDes * 0.18 + sAmb * 0.14 + sRis * 0.1,
  );

  const tSan = toneFromScore(sSan);
  const tEst = toneFromScore(sEst);
  const tDes = toneFromScore(sDes);
  const tAmb = toneFromScore(sAmb);
  const tRis = toneFromScore(sRis);

  const dimensoes: DimensaoVisita[] = [
    {
      id: 'sanidade',
      label: 'Sanidade fitossanitária',
      status: labelFromTone(tSan),
      tone: tSan,
      detalhe:
        pragas.length > 0
          ? `${pragas.length} ocorrência(s) registrada(s) nesta visita.`
          : 'Nenhuma ocorrência fitossanitária registrada.',
    },
    {
      id: 'estande',
      label: 'Estande / população',
      status: labelFromTone(tEst),
      tone: tEst,
      detalhe:
        typeof pop?.eficienciaPct === 'number'
          ? `Eficiência declarada: ${pop.eficienciaPct}%.`
          : pop?.situacao != null
            ? String(pop.situacao)
            : 'Sem métrica de estande neste relatório.',
    },
    {
      id: 'desenvolvimento',
      label: 'Desenvolvimento',
      status: labelFromTone(tDes),
      tone: tDes,
      detalhe:
        String(fen.estadio ?? fen.estagio ?? '').trim() ||
        'Estágio fenológico não informado.',
    },
    {
      id: 'ambiente',
      label: 'Ambiente de campo',
      status: labelFromTone(tAmb),
      tone: tAmb,
      detalhe: [cond.vigorCultura, cond.compactacao, cond.soloUmidade]
        .filter(Boolean)
        .map(String)
        .join(' · ') || 'Condições de solo/vigor não detalhadas.',
    },
    {
      id: 'risco',
      label: 'Risco agronômico',
      status: nivelRisco.trim() || labelFromTone(tRis),
      tone: tRis,
      detalhe: diag.urgenciaAcao != null ? String(diag.urgenciaAcao) : undefined,
    },
  ];

  const alertas: AlertaVisita[] = [];

  const critPraga = pragas.some((p) => severidadePeso(p) >= 3);
  const altPraga = pragas.some((p) => severidadePeso(p) === 2);
  if (critPraga) {
    alertas.push({
      nivel: 'critico',
      texto:
        'Alto impacto fitossanitário: há ocorrência(s) em severidade crítica ou situação de alerta elevado — priorizar definição de manejo.',
    });
  } else if (altPraga) {
    alertas.push({
      nivel: 'atencao',
      texto:
        'Incidência/situação em nível alto em pelo menos um alvo — monitorar evolução em curto prazo.',
    });
  }

  const r = norm(nivelRisco);
  if (r.includes('alt') || r.includes('crit')) {
    alertas.push({
      nivel: 'critico',
      texto: `Nível de risco declarado no diagnóstico: ${String(diag.nivelRisco ?? '')}.`,
    });
  }

  if (typeof pop?.eficienciaPct === 'number' && pop.eficienciaPct < 78) {
    alertas.push({
      nivel: 'atencao',
      texto: `Eficiência de estande abaixo do ideal (${pop.eficienciaPct}%) — avaliar uniformidade, falhas e causas.`,
    });
  }

  const comp = norm(cond.compactacao);
  if (comp.includes('alt') || comp.includes('sever')) {
    alertas.push({
      nivel: 'atencao',
      texto:
        'Compactação de solo mencionada em nível alto — considerar manejo físico do solo conforme zona e umidade.',
    });
  }

  if (alertas.length === 0 && indice >= 76) {
    alertas.push({
      nivel: 'ok',
      texto:
        'Área alinhada ao esperado para os dados registrados nesta visita. Manter monitoramento de rotina.',
    });
  } else if (alertas.length === 0) {
    alertas.push({
      nivel: 'atencao',
      texto:
        'Revisar blocos de diagnóstico e plano de ação — consolidar próximos passos com prazos.',
    });
  }

  let resumoLinha = '';
  if (indice >= 80) resumoLinha = 'Cenário favorável com base nos registros desta visita.';
  else if (indice >= 65)
    resumoLinha = 'Cenário com pontos de atenção — manejo preventivo recomendado.';
  else resumoLinha = 'Cenário que exige decisões de manejo priorizadas.';

  return { indiceFortSmart: indice, resumoLinha, dimensoes, alertas };
}
