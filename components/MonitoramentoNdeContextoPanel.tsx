'use client';

import React from 'react';
import type { OrganismoContextoWeb } from '@/lib/types/monitoring';
import { formatDecimal2, formatPercent2 } from '@/utils/format';

function fmtNum(v: number | undefined | null, digits = 2): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return v.toLocaleString('pt-BR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function sevColor(sev: number | undefined) {
  if (sev == null || !Number.isFinite(sev)) return '#94a3b8';
  if (sev >= 40) return '#f87171';
  if (sev >= 20) return '#fbbf24';
  return '#4ade80';
}

export interface MonitoramentoNdeContextoPanelProps {
  /** Linhas emitidas pelo app (organismos detectados + catálogo NDE). */
  rows: OrganismoContextoWeb[];
  /** Rótulo opcional, ex. UF do perfil. */
  propriedadeUf?: string;
}

/**
 * Tabela NDE + danos (referência catálogo + leitura real do monitoramento).
 * Só exibe conteúdo se `rows.length > 0` — nunca dados fictícios.
 */
export default function MonitoramentoNdeContextoPanel({
  rows,
  propriedadeUf,
}: MonitoramentoNdeContextoPanelProps) {
  if (rows.length === 0) return null;

  const regiao = rows.find((r) => r.paramsRegionId)?.paramsRegionId;
  const showRegiao = regiao != null && regiao.length > 0;

  return (
    <div
      className="print:break-inside-avoid nde-contexto-panel"
      style={{
        borderRadius: 12,
        border: '1px solid #1e293b',
        background: 'linear-gradient(180deg, #0f172a 0%, #0b1120 100%)',
        color: '#e2e8f0',
        marginBottom: '1.5rem',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.04em' }}>
            NDE, danos na cultura e leitura do monitoramento
          </h3>
          <p style={{ margin: '6px 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.45, maxWidth: 720 }}>
            Valores de referência do catálogo (Decision Engine) para a cultura; colunas de monitoramento refletem esta sessão.
            {(showRegiao || propriedadeUf) && (
              <span>
                {showRegiao && (
                  <>
                    {' '}
                    Parâmetros de região: <strong style={{ color: '#cbd5e1' }}>{regiao}</strong>
                  </>
                )}
                {propriedadeUf && (
                  <>
                    {showRegiao ? ' · ' : ' '}
                    Propriedade (UF): <strong style={{ color: '#cbd5e1' }}>{propriedadeUf}</strong>
                  </>
                )}
                .
              </span>
            )}
          </p>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '0.72rem',
            minWidth: 900,
          }}
        >
          <thead>
            <tr style={{ background: '#1e293b' }}>
              {[
                'Organismo',
                'NDE ref.',
                'Estágio (ref.)',
                'Monitoram. (frequência / sev. méd.)',
                'Perda (ref.)',
                'Econ. (R$/ha)',
                'Interpretação',
                'Notas & fonte',
              ].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '9px 10px',
                    fontWeight: 700,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    borderBottom: '1px solid #334155',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.nome}-${i}`} style={{ borderBottom: '1px solid #1e293b' }}>
                <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{r.nome}</div>
                  {r.nomeCientifico && (
                    <div style={{ fontStyle: 'italic', color: '#64748b', marginTop: 2, fontSize: '0.65rem' }}>
                      {r.nomeCientifico}
                    </div>
                  )}
                  {r.usandoParametrosGenericos && (
                    <div style={{ fontSize: '0.6rem', color: '#fbbf24', marginTop: 4 }}>Parâmetros genéricos / fallback</div>
                  )}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top', fontFamily: 'ui-monospace, monospace' }}>
                  {r.referenciaNde != null ? (
                    <>
                      {fmtNum(r.referenciaNde, 3)} {r.referenciaNdeUnidade != null && r.referenciaNdeUnidade !== 'conforme catálogo' ? ` ${r.referenciaNdeUnidade}` : ''}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top', color: '#cbd5e1' }}>
                  {r.estagioNde || '—'}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top' }}>
                  {r.pontosAfetados != null && r.totalOcorrencias != null && (
                    <div style={{ color: '#e2e8f0' }}>
                      {r.pontosAfetados} pts · {r.totalOcorrencias} ocorr. ·{' '}
                      {formatPercent2(Number(r.frequencia ?? 0) * 100)} incid.
                    </div>
                  )}
                  {r.severidadeMedia != null && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div
                        style={{
                          width: 48,
                          height: 5,
                          borderRadius: 999,
                          background: '#334155',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, r.severidadeMedia)}%`,
                            height: '100%',
                            background: sevColor(r.severidadeMedia),
                            borderRadius: 999,
                          }}
                        />
                      </div>
                      <span style={{ fontFamily: 'ui-monospace, monospace', color: sevColor(r.severidadeMedia) }}>
                        {formatPercent2(r.severidadeMedia)}
                      </span>
                    </div>
                  )}
                  {r.densidadeIndM2 != null && (
                    <div style={{ color: '#94a3b8', marginTop: 4, fontSize: '0.65rem' }}>
                      Densidade: {fmtNum(r.densidadeIndM2, 3)} ind/m²
                    </div>
                  )}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top', color: '#a7f3d0' }}>
                  {r.perdaUnidadeTexto || '—'}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top', fontFamily: 'ui-monospace, monospace', fontSize: '0.7rem' }}>
                  {r.perdaBrlHa != null ? (
                    <div>R$ {fmtNum(r.perdaBrlHa, 0)}/ha</div>
                  ) : (
                    '—'
                  )}
                  {r.roiMultiplo != null && (
                    <div style={{ color: '#94a3b8' }}>ROI {fmtNum(r.roiMultiplo, 1)}x</div>
                  )}
                </td>
                <td
                  style={{
                    padding: '10px 10px',
                    verticalAlign: 'top',
                    lineHeight: 1.45,
                    maxWidth: 300,
                    color: '#e2e8f0',
                    fontSize: '0.7rem',
                    borderLeft: '1px solid #334155',
                  }}
                >
                  {r.interpretacaoTexto || r.interpretacaoRatioNde != null || r.interpretacaoCategoria ? (
                    <>
                      {r.interpretacaoTipo && (
                        <div style={{ fontSize: '0.58rem', color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>
                          {r.interpretacaoTipo === 'doenca' ? 'Doença · ' : 'Praga · '}
                          {r.interpretacaoEscala === 'severidade_pontos_0_100' ? 'severidade' : 'leitura / NDE'}
                        </div>
                      )}
                      {(r.interpretacaoRatioNde != null || r.interpretacaoPercentualAcimaNde != null) && (
                        <div style={{ fontFamily: 'ui-monospace, monospace', color: '#7dd3fc', marginBottom: 6, fontSize: '0.65rem' }}>
                          {r.interpretacaoRatioNde != null && <span>Ratio {fmtNum(r.interpretacaoRatioNde, 2)}× NDE</span>}
                          {r.interpretacaoPercentualAcimaNde != null && (
                            <span>
                              {r.interpretacaoRatioNde != null ? ' · ' : ''}
                              +{fmtNum(r.interpretacaoPercentualAcimaNde, 0)}% sobre o limiar
                            </span>
                          )}
                        </div>
                      )}
                      {r.interpretacaoCategoria && (
                        <div style={{ fontSize: '0.6rem', color: '#cbd5e1', marginBottom: 6 }}>
                          Classe: <strong style={{ color: '#fbbf24' }}>{r.interpretacaoCategoria}</strong>
                          {r.interpretacaoJanelaRecomendada && (
                            <span style={{ color: '#94a3b8' }}> · Janela: {r.interpretacaoJanelaRecomendada}</span>
                          )}
                          {r.interpretacaoUrgencia && (
                            <span style={{ color: '#94a3b8' }}> · Urg.: {r.interpretacaoUrgencia}</span>
                          )}
                        </div>
                      )}
                      {r.interpretacaoTexto && <p style={{ margin: 0, color: '#f1f5f9' }}>{r.interpretacaoTexto}</p>}
                      {r.interpretacaoNotaOperacional && (
                        <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: '0.62rem' }}>{r.interpretacaoNotaOperacional}</p>
                      )}
                    </>
                  ) : (
                    '—'
                  )}
                </td>
                <td style={{ padding: '10px 10px', verticalAlign: 'top', color: '#94a3b8', lineHeight: 1.4, maxWidth: 220 }}>
                  {r.observacaoCatalogo && <p style={{ margin: '0 0 6px' }}>{r.observacaoCatalogo}</p>}
                  {r.fonte && <p style={{ margin: 0, fontSize: '0.6rem', opacity: 0.9 }}>Fonte: {r.fonte}</p>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Converte o payload bruto do relatório em linhas tipadas.
 */
export function parseOrganismosContextoFromPayload(
  relatorio: Record<string, unknown>,
): OrganismoContextoWeb[] {
  const raw = relatorio.organismos_contexto;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.filter((x): x is OrganismoContextoWeb => x != null && typeof x === 'object') as OrganismoContextoWeb[];
}
