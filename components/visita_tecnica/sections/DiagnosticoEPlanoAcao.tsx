import React from 'react';
import { ListChecks, Stethoscope } from 'lucide-react';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';
import deck from '../visita-tecnica-deck.module.css';

interface DiagnosticoEPlanoAcaoProps {
  diagnostico?: Record<string, unknown>;
  planoAcao?: PayloadVisitaTecnica['planoAcao'];
  /** Evita repetir problema/causa/risco quando já exibidos na narrativa do topo; mantém recomendações e plano. */
  omitDiagnosticoResumo?: boolean;
}

function planoPriorClass(prioridade: string | undefined): string {
  const s = String(prioridade ?? '').toLowerCase();
  if (s.includes('alt') || s.includes('crít') || s.includes('crit')) return deck.planoPriorAlta;
  if (s.includes('méd') || s.includes('med')) return deck.planoPriorMedia;
  if (s.includes('baix') || s.includes('baixa')) return deck.planoPriorBaixa;
  return deck.planoPriorNeutra;
}

export default function DiagnosticoEPlanoAcao({ diagnostico, planoAcao, omitDiagnosticoResumo }: DiagnosticoEPlanoAcaoProps) {
  const hasDiagnostico =
    diagnostico &&
    (diagnostico.problemaPrincipal != null ||
      diagnostico.causaProvavel != null ||
      diagnostico.nivelRisco != null ||
      diagnostico.urgenciaAcao != null ||
      (Array.isArray(diagnostico.recomendacoes) && diagnostico.recomendacoes.length > 0));
  const hasPlanoAcao =
    planoAcao &&
    (planoAcao.objetivoManejo != null || (Array.isArray(planoAcao.acoes) && planoAcao.acoes.length > 0));

  if (!hasDiagnostico && !hasPlanoAcao) return null;

  const recomendacoes =
    Array.isArray(diagnostico?.recomendacoes) && diagnostico!.recomendacoes!.length > 0
      ? (diagnostico!.recomendacoes as unknown[])
      : [];
  const showSlimRecomendacoes = Boolean(omitDiagnosticoResumo && recomendacoes.length > 0);

  const acoes = Array.isArray(planoAcao?.acoes) ? planoAcao!.acoes : [];
  const showProduto = acoes.some((a) => (a as { produto?: string }).produto != null && String((a as { produto?: string }).produto).trim() !== '');
  const showDose = acoes.some((a) => (a as { dose?: string }).dose != null && String((a as { dose?: string }).dose).trim() !== '');
  const showMomento = acoes.some((a) => (a as { momento?: string }).momento != null && String((a as { momento?: string }).momento).trim() !== '');
  const showObjetivo = acoes.some(
    (a) =>
      (a as { objetivoTecnico?: string }).objetivoTecnico != null &&
      String((a as { objetivoTecnico?: string }).objetivoTecnico).trim() !== '',
  );

  const riscoStr = String(diagnostico?.nivelRisco || '').toLowerCase();
  const riskWarm =
    riscoStr.includes('alto') || riscoStr.includes('crítico') || riscoStr.includes('critico');
  const riskColor = riskWarm ? '#b91c1c' : '#a16207';

  return (
    <>
      {showSlimRecomendacoes && (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
          <div className={deck.reportCardHead}>
            <span className={deck.reportCardIcon} aria-hidden>
              <Stethoscope size={18} strokeWidth={2.25} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className={deck.reportCardKicker}>Diagnóstico</span>
              <h2 className={deck.reportCardTitle}>Recomendações técnicas</h2>
            </div>
          </div>
          <div className={deck.reportCardBody}>
            <ul className={deck.recommendList}>
              {recomendacoes.map((item, i) => (
                <li key={i} style={{ marginBottom: 6 }}>
                  {typeof item === 'string' ? item : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {hasDiagnostico && !omitDiagnosticoResumo && (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
          <div className={deck.reportCardHead}>
            <span className={deck.reportCardIcon} aria-hidden>
              <Stethoscope size={18} strokeWidth={2.25} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className={deck.reportCardKicker}>Diagnóstico</span>
              <h2 className={deck.reportCardTitle}>Diagnóstico agronômico</h2>
            </div>
          </div>
          <div className={deck.reportCardBody}>
            <div className={deck.diagnosticGrid}>
              <div>
                {diagnostico!.problemaPrincipal != null && String(diagnostico!.problemaPrincipal).trim() && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div className={deck.fieldLabel}>Problema principal</div>
                    <div className={deck.fieldValue} style={{ fontSize: '0.9rem', lineHeight: 1.55, fontWeight: 700 }}>
                      {String(diagnostico!.problemaPrincipal)}
                    </div>
                  </div>
                )}
                {diagnostico!.causaProvavel != null && String(diagnostico!.causaProvavel).trim() && (
                  <div>
                    <div className={deck.fieldLabel}>Causa provável</div>
                    <div className={deck.fieldValue} style={{ fontSize: '0.875rem', lineHeight: 1.55, fontWeight: 600 }}>
                      {String(diagnostico!.causaProvavel)}
                    </div>
                  </div>
                )}
              </div>
              <div className={deck.diagnosticAside}>
                {(diagnostico!.nivelRisco != null || diagnostico!.urgenciaAcao != null) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.15rem', marginBottom: '1rem' }}>
                    {diagnostico!.nivelRisco != null && (
                      <div>
                        <div className={deck.fieldLabel}>Nível de risco</div>
                        <div className={deck.riskValue} style={{ color: riskColor }}>
                          {String(diagnostico!.nivelRisco)}
                        </div>
                      </div>
                    )}
                    {diagnostico!.urgenciaAcao != null && (
                      <div>
                        <div className={deck.fieldLabel}>Urgência de ação</div>
                        <div className={deck.riskValue} style={{ color: 'var(--vt-ink)' }}>
                          {String(diagnostico!.urgenciaAcao)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {Array.isArray(diagnostico!.recomendacoes) && diagnostico!.recomendacoes.length > 0 && (
                  <div>
                    <div className={deck.fieldLabel} style={{ marginBottom: 8 }}>
                      Recomendações técnicas
                    </div>
                    <p className={deck.editorialProseMuted} style={{ fontStyle: 'normal', marginBottom: 10 }}>
                      Priorize registros com produto, dose, momento e objetivo técnico no app — reforça rastreabilidade e
                      execução em campo.
                    </p>
                    <ul className={deck.recommendList}>
                      {(diagnostico!.recomendacoes as unknown[]).map((item, i) => (
                        <li key={i} style={{ marginBottom: 6 }}>
                          {typeof item === 'string' ? item : JSON.stringify(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {hasPlanoAcao && (
        <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
          <div className={deck.reportCardHead}>
            <span className={deck.reportCardIcon} aria-hidden>
              <ListChecks size={18} strokeWidth={2.25} />
            </span>
            <div style={{ minWidth: 0 }}>
              <span className={deck.reportCardKicker}>Execução</span>
              <h2 className={deck.reportCardTitle}>Plano de ação</h2>
            </div>
          </div>
          <div className={deck.reportCardBody}>
            {planoAcao!.objetivoManejo != null && String(planoAcao!.objetivoManejo).trim() && (
              <p className={deck.objetivoLead}>
                <strong style={{ color: 'var(--vt-forest)' }}>Objetivo de manejo:</strong> {String(planoAcao!.objetivoManejo)}
              </p>
            )}
            {Array.isArray(planoAcao!.acoes) && planoAcao!.acoes.length > 0 && (
              <div className={deck.planoExecStack} aria-label="Plano de ação — visão executiva">
                {planoAcao!.acoes.flatMap((acao, i) => {
                  const a = acao as {
                    prioridade?: string;
                    acao?: string;
                    prazo?: string;
                    produto?: string;
                    dose?: string;
                    momento?: string;
                    objetivoTecnico?: string;
                  };
                  const linhas = [
                    a.acao != null && String(a.acao).trim() ? String(a.acao) : null,
                    a.produto != null && String(a.produto).trim() ? `Produto: ${a.produto}` : null,
                    a.dose != null && String(a.dose).trim() ? `Dose: ${a.dose}` : null,
                    a.momento != null && String(a.momento).trim() ? `Momento: ${a.momento}` : null,
                    a.objetivoTecnico != null && String(a.objetivoTecnico).trim() ? `Objetivo: ${a.objetivoTecnico}` : null,
                    a.prazo != null && String(a.prazo).trim() ? `Prazo: ${a.prazo}` : null,
                  ].filter(Boolean) as string[];
                  if (linhas.length === 0) return [];
                  return [
                    <div key={i} className={`${deck.planoExecCard} ${planoPriorClass(a.prioridade)}`}>
                      <div className={deck.planoExecPrior}>{String(a.prioridade ?? 'Prioridade')}</div>
                      {linhas.map((line, j) => (
                        <p key={j} className={deck.planoExecLine}>
                          {line}
                        </p>
                      ))}
                    </div>,
                  ];
                })}
              </div>
            )}
            {Array.isArray(planoAcao!.acoes) && planoAcao!.acoes.length > 0 && (
              <div className={deck.tableWrap}>
                <table className={deck.table}>
                  <thead>
                    <tr>
                      <th>Prioridade</th>
                      <th>Ação</th>
                      {showProduto && <th>Produto</th>}
                      {showDose && <th>Dose</th>}
                      {showMomento && <th>Momento</th>}
                      {showObjetivo && <th>Objetivo técnico</th>}
                      <th>Prazo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {planoAcao!.acoes.map((acao, i) => {
                      const a = acao as {
                        prioridade?: string;
                        acao?: string;
                        prazo?: string;
                        produto?: string;
                        dose?: string;
                        momento?: string;
                        objetivoTecnico?: string;
                      };
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>{String(a.prioridade ?? '—')}</td>
                          <td>{String(a.acao ?? '—')}</td>
                          {showProduto && <td>{a.produto != null ? String(a.produto) : '—'}</td>}
                          {showDose && <td>{a.dose != null ? String(a.dose) : '—'}</td>}
                          {showMomento && <td>{a.momento != null ? String(a.momento) : '—'}</td>}
                          {showObjetivo && <td style={{ fontSize: '0.8rem' }}>{a.objetivoTecnico != null ? String(a.objetivoTecnico) : '—'}</td>}
                          <td>{String(a.prazo ?? '—')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
