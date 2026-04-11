import React from 'react';
import { LineChart } from 'lucide-react';
import { labelTendencia, labelCausa, labelCiclo } from '@/lib/visita-tecnica/label-utils';
import deck from '../visita-tecnica-deck.module.css';

function simNaoTri(v: unknown): string {
  if (v === true || v === 1 || v === '1') return 'Sim';
  if (v === false || v === 0 || v === '0') return 'Não';
  return '—';
}

interface InteligenciaEstrategicaVisitaVTProps {
  produtividade?: Record<string, unknown> | null;
  inteligenciaEstrategica?: Record<string, unknown> | null;
}

export default function InteligenciaEstrategicaVisitaVT({
  produtividade,
  inteligenciaEstrategica,
}: InteligenciaEstrategicaVisitaVTProps) {
  const evo = inteligenciaEstrategica?.evolucaoIndicadores;
  const evolucao = Array.isArray(evo) ? (evo as Record<string, unknown>[]) : [];
  const tempos = (inteligenciaEstrategica?.temposResposta ?? null) as Record<string, unknown> | null;
  const causasRaw = inteligenciaEstrategica?.agregacaoCausaProvavel;
  const causas = Array.isArray(causasRaw) ? (causasRaw as Record<string, unknown>[]) : [];

  const hasProd =
    produtividade && Object.keys(produtividade).some((k) => produtividade[k] != null && produtividade[k] !== '');
  const hasTempos =
    tempos && (tempos.horasDuracaoVisita != null || tempos.diasOcorrenciaParaAplicacao != null);
  const hasIntel = evolucao.length > 0 || causas.length > 0 || hasTempos;

  if (!hasProd && !hasIntel) return null;

  return (
    <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
      <div className={deck.reportCardHead}>
        <span className={deck.reportCardIcon} aria-hidden>
          <LineChart size={18} strokeWidth={2.25} />
        </span>
        <div style={{ minWidth: 0 }}>
          <span className={deck.reportCardKicker}>Análise complementar</span>
          <h2 className={deck.reportCardTitle}>Inteligência estratégica</h2>
        </div>
      </div>
      <div className={deck.reportCardBody}>
        {hasProd && produtividade && (
          <div style={{ marginBottom: hasIntel ? '1.15rem' : 0 }}>
            <div className={deck.editorialSubhead}>Produtividade (declarada × heurística)</div>
            <p className={deck.editorialProseMuted}>
              Estimativas heurísticas são indicativas; valores declarados vêm do contexto da safra no app.
            </p>
            <div className={deck.tableWrap}>
              <table className={deck.table}>
                <tbody>
                  {produtividade.potencialDeclaradoScHa != null && (
                    <tr>
                      <td style={{ width: '44%', fontWeight: 700, color: 'var(--vt-muted)' }}>Potencial declarado (sc/ha)</td>
                      <td style={{ fontWeight: 700 }}>{String(produtividade.potencialDeclaradoScHa)}</td>
                    </tr>
                  )}
                  {produtividade.estimativaDeclaradaScHa != null && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>Estimativa atual declarada (sc/ha)</td>
                      <td style={{ fontWeight: 700 }}>{String(produtividade.estimativaDeclaradaScHa)}</td>
                    </tr>
                  )}
                  {produtividade.notaMetodoDeclarada != null && String(produtividade.notaMetodoDeclarada).trim() !== '' && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)', verticalAlign: 'top' }}>Nota do método (declarada)</td>
                      <td>{String(produtividade.notaMetodoDeclarada)}</td>
                    </tr>
                  )}
                  {produtividade.potencialHeuristicaScHa != null && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>Potencial sugerido (heurística, sc/ha)</td>
                      <td style={{ fontWeight: 800, color: 'var(--vt-accent)' }}>{String(produtividade.potencialHeuristicaScHa)}</td>
                    </tr>
                  )}
                  {produtividade.estimativaHeuristicaScHa != null && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>Estimativa atual sugerida (heurística, sc/ha)</td>
                      <td style={{ fontWeight: 800, color: 'var(--vt-accent)' }}>{String(produtividade.estimativaHeuristicaScHa)}</td>
                    </tr>
                  )}
                  {produtividade.notaHeuristica != null && String(produtividade.notaHeuristica).trim() !== '' && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)', verticalAlign: 'top' }}>Nota (heurística)</td>
                      <td style={{ fontSize: '0.8rem' }}>{String(produtividade.notaHeuristica)}</td>
                    </tr>
                  )}
                  {produtividade.cicloCultivar != null && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>Ciclo da cultivar</td>
                      <td>{labelCiclo(produtividade.cicloCultivar)}</td>
                    </tr>
                  )}
                  {produtividade.tecnologiaSementes != null && String(produtividade.tecnologiaSementes).trim() !== '' && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)' }}>Tecnologia de sementes</td>
                      <td>{String(produtividade.tecnologiaSementes)}</td>
                    </tr>
                  )}
                  {produtividade.resistencias != null && typeof produtividade.resistencias === 'object' && (
                    <tr>
                      <td style={{ fontWeight: 700, color: 'var(--vt-muted)', verticalAlign: 'top' }}>Resistências (declaradas)</td>
                      <td>
                        {(() => {
                          const resist = produtividade.resistencias as Record<string, unknown>;
                          const parts: string[] = [];
                          if (resist.ferrugem != null) parts.push(`Ferrugem: ${simNaoTri(resist.ferrugem)}`);
                          if (resist.nematoide != null) parts.push(`Nematóide: ${simNaoTri(resist.nematoide)}`);
                          if (resist.lagarta != null) parts.push(`Lagarta: ${simNaoTri(resist.lagarta)}`);
                          return parts.length ? parts.join(' · ') : '—';
                        })()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {hasTempos && tempos && (
          <div style={{ marginBottom: evolucao.length || causas.length ? '1.15rem' : 0 }}>
            <div className={deck.editorialSubhead} style={{ marginTop: hasProd ? '0.5rem' : undefined }}>
              Tempos de resposta (indicativos)
            </div>
            <ul className={deck.recommendList}>
              {tempos.horasDuracaoVisita != null && (
                <li style={{ marginBottom: 6 }}>
                  Duração da visita: <strong>{Number(tempos.horasDuracaoVisita).toFixed(1)} h</strong> (início/fim nas condições)
                </li>
              )}
              {tempos.diasOcorrenciaParaAplicacao != null && (
                <li>
                  Da primeira ocorrência à próxima aplicação no talhão:{' '}
                  <strong>{Number(tempos.diasOcorrenciaParaAplicacao).toFixed(1)} dias</strong>
                </li>
              )}
            </ul>
          </div>
        )}

        {causas.length > 0 && (
          <div style={{ marginBottom: evolucao.length ? '1.15rem' : 0 }}>
            <div className={deck.editorialSubhead}>Causas prováveis agregadas (esta visita)</div>
            <div className={deck.tableWrap}>
              <table className={deck.table} style={{ maxWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Causa</th>
                    <th style={{ textAlign: 'right' }}>Ocorrências</th>
                  </tr>
                </thead>
                <tbody>
                  {causas.map((row, i) => (
                    <tr key={i}>
                      <td>{labelCausa(row.causa)}</td>
                      <td style={{ textAlign: 'right', fontWeight: 800 }}>{String(row.count ?? '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {evolucao.length > 0 && (
          <div>
            <div className={deck.editorialSubhead}>Evolução por alvo (vs visita anterior)</div>
            <div className={deck.tableWrap}>
              <table className={deck.table} style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>Alvo</th>
                    <th>Tipo</th>
                    <th>Tendência</th>
                    <th>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {evolucao.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 800 }}>{String(row.alvo ?? '—')}</td>
                      <td>{String(row.tipo ?? '—')}</td>
                      <td>{labelTendencia(row.tendencia)}</td>
                      <td>
                        {String(row.subtitulo ?? '—')}
                        {row.deltaPct != null && (
                          <span style={{ display: 'block', marginTop: 4, fontWeight: 800, color: 'var(--vt-accent)' }}>
                            Δ%: {Number(row.deltaPct) >= 0 ? '+' : ''}
                            {Number(row.deltaPct).toFixed(0)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
