import React from 'react';

function labelMetodoAmostragem(v: unknown): string {
  const s = String(v ?? '').trim();
  const map: Record<string, string> = {
    aleatorio: 'Aleatório',
    zigue_zague: 'Zigue-zague',
    ponto_fixo: 'Ponto fixo',
    grid: 'Grid',
  };
  return map[s] || s || '—';
}

function labelTendencia(t: unknown): string {
  const s = String(t ?? '');
  const map: Record<string, string> = {
    crescimento_acelerado: 'Crescimento acelerado',
    crescimento: 'Em alta',
    queda: 'Em queda',
    estavel: 'Estável',
    severidade_apenas: 'Severidade (ordinal)',
    sem_historico: 'Primeiro registro',
  };
  return map[s] || s || '—';
}

function labelCausa(c: unknown): string {
  const s = String(c ?? '').trim();
  const map: Record<string, string> = {
    clima: 'Clima',
    manejo: 'Manejo',
    solo: 'Solo',
    genetica: 'Genética',
    operacional: 'Operacional',
    desconhecido: 'Desconhecido',
  };
  return map[s] || s || '—';
}

function labelCiclo(c: unknown): string {
  const s = String(c ?? '').trim();
  const map: Record<string, string> = {
    precoce: 'Precoce',
    medio: 'Médio',
    tardio: 'Tardio',
  };
  return map[s] || s || '—';
}

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
    produtividade &&
    Object.keys(produtividade).some((k) => produtividade[k] != null && produtividade[k] !== '');
  const hasTempos =
    tempos &&
    (tempos.horasDuracaoVisita != null || tempos.diasOcorrenciaParaAplicacao != null);
  const hasIntel = evolucao.length > 0 || causas.length > 0 || hasTempos;

  if (!hasProd && !hasIntel) return null;

  return (
    <section className="section-block relatorio-editorial">
      <div className="section-block__title">Inteligência estratégica (visita)</div>
      <div className="section-block__body" style={{ padding: 20 }}>
        {hasProd && produtividade && (
          <div style={{ marginBottom: hasIntel ? 24 : 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: '0 0 12px' }}>
              Produtividade (declarada × heurística)
            </h3>
            <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 12px', fontStyle: 'italic' }}>
              Estimativas heurísticas são indicativas; valores declarados vêm do contexto da safra no app.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <tbody>
                {produtividade.potencialDeclaradoScHa != null && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b', width: '42%' }}>Potencial declarado (sc/ha)</td>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>{String(produtividade.potencialDeclaradoScHa)}</td>
                  </tr>
                )}
                {produtividade.estimativaDeclaradaScHa != null && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b' }}>Estimativa atual declarada (sc/ha)</td>
                    <td style={{ padding: '8px 0', fontWeight: 600 }}>{String(produtividade.estimativaDeclaradaScHa)}</td>
                  </tr>
                )}
                {produtividade.notaMetodoDeclarada != null && String(produtividade.notaMetodoDeclarada).trim() !== '' && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b', verticalAlign: 'top' }}>Nota do método (declarada)</td>
                    <td style={{ padding: '8px 0' }}>{String(produtividade.notaMetodoDeclarada)}</td>
                  </tr>
                )}
                {produtividade.potencialHeuristicaScHa != null && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b' }}>Potencial sugerido (heurística, sc/ha)</td>
                    <td style={{ padding: '8px 0', fontWeight: 600, color: '#166534' }}>{String(produtividade.potencialHeuristicaScHa)}</td>
                  </tr>
                )}
                {produtividade.estimativaHeuristicaScHa != null && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b' }}>Estimativa atual sugerida (heurística, sc/ha)</td>
                    <td style={{ padding: '8px 0', fontWeight: 600, color: '#166534' }}>{String(produtividade.estimativaHeuristicaScHa)}</td>
                  </tr>
                )}
                {produtividade.notaHeuristica != null && String(produtividade.notaHeuristica).trim() !== '' && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b', verticalAlign: 'top' }}>Nota (heurística)</td>
                    <td style={{ padding: '8px 0', fontSize: 12 }}>{String(produtividade.notaHeuristica)}</td>
                  </tr>
                )}
                {produtividade.cicloCultivar != null && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b' }}>Ciclo da cultivar</td>
                    <td style={{ padding: '8px 0' }}>{labelCiclo(produtividade.cicloCultivar)}</td>
                  </tr>
                )}
                {produtividade.tecnologiaSementes != null && String(produtividade.tecnologiaSementes).trim() !== '' && (
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b' }}>Tecnologia de sementes</td>
                    <td style={{ padding: '8px 0' }}>{String(produtividade.tecnologiaSementes)}</td>
                  </tr>
                )}
                {produtividade.resistencias != null && typeof produtividade.resistencias === 'object' && (
                  <tr>
                    <td style={{ padding: '8px 12px 8px 0', color: '#64748b', verticalAlign: 'top' }}>Resistências (declaradas)</td>
                    <td style={{ padding: '8px 0' }}>
                      {(() => {
                        const r = produtividade.resistencias as Record<string, unknown>;
                        const parts: string[] = [];
                        if (r.ferrugem != null) parts.push(`Ferrugem: ${simNaoTri(r.ferrugem)}`);
                        if (r.nematoide != null) parts.push(`Nematóide: ${simNaoTri(r.nematoide)}`);
                        if (r.lagarta != null) parts.push(`Lagarta: ${simNaoTri(r.lagarta)}`);
                        return parts.length ? parts.join(' · ') : '—';
                      })()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {hasTempos && tempos && (
          <div style={{ marginBottom: evolucao.length || causas.length ? 24 : 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: '0 0 10px' }}>Tempos de resposta (indicativos)</h3>
            <ul style={{ margin: 0, paddingLeft: 18, color: '#334155', fontSize: 13 }}>
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
          <div style={{ marginBottom: evolucao.length ? 24 : 0 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: '0 0 10px' }}>
              Causas prováveis agregadas (esta visita)
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, maxWidth: 480 }}>
              <thead>
                <tr style={{ background: '#F8FAFC' }}>
                  <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>Causa</th>
                  <th style={{ padding: 10, textAlign: 'right', borderBottom: '2px solid #E2E8F0' }}>Ocorrências</th>
                </tr>
              </thead>
              <tbody>
                {causas.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <td style={{ padding: 10 }}>{labelCausa(row.causa)}</td>
                    <td style={{ padding: 10, textAlign: 'right', fontWeight: 600 }}>{String(row.count ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {evolucao.length > 0 && (
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#14532d', margin: '0 0 10px' }}>
              Evolução por alvo (vs visita anterior)
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 520 }}>
                <thead>
                  <tr style={{ background: '#F8FAFC' }}>
                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>Alvo</th>
                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>Tipo</th>
                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>Tendência</th>
                    <th style={{ padding: 10, textAlign: 'left', borderBottom: '2px solid #E2E8F0' }}>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {evolucao.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #E2E8F0', verticalAlign: 'top' }}>
                      <td style={{ padding: 10, fontWeight: 600 }}>{String(row.alvo ?? '—')}</td>
                      <td style={{ padding: 10 }}>{String(row.tipo ?? '—')}</td>
                      <td style={{ padding: 10 }}>{labelTendencia(row.tendencia)}</td>
                      <td style={{ padding: 10, color: '#475569' }}>
                        {String(row.subtitulo ?? '—')}
                        {row.deltaPct != null && (
                          <span style={{ display: 'block', marginTop: 4, fontWeight: 600, color: '#0f766e' }}>
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

export { labelMetodoAmostragem, labelCausa, labelCiclo };
