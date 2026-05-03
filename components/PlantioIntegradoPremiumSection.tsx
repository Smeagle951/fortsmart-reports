'use client';

import React, { useMemo, useState } from 'react';
import {
  deriveDadosPlantioFromModuloPlantio,
  mergePlantioCampos,
  type DadosPlantioMonitoramento,
} from '@/components/RelatorioFitossanitarioContent';
import type { Talhao } from '@/lib/types/monitoring';
import { formatDecimal2, formatDate } from '@/utils/format';

type Props = {
  relatorio: Record<string, unknown>;
};

function hasPlantioContent(dp: DadosPlantioMonitoramento | null | undefined): boolean {
  if (!dp || typeof dp !== 'object') return false;
  return !!(
    dp.cultura ||
    dp.hibrido ||
    dp.cv_percent != null ||
    dp.estagio_atual ||
    dp.data_plantio ||
    dp.data_emergencia ||
    dp.populacao_desejada != null ||
    dp.populacao_real != null ||
    (dp.evolucao_fenologica?.length ?? 0) > 0 ||
    (dp.linha_plantabilidade?.length ?? 0) > 0
  );
}

function miniTalhaoForMerge(relatorio: Record<string, unknown>): Talhao | undefined {
  const talhoes = relatorio.talhoes;
  if (!Array.isArray(talhoes) || talhoes.length === 0) return undefined;
  const raw = talhoes[0] as Record<string, unknown>;
  const dae = raw.dae != null ? Number(raw.dae) : undefined;
  const estagio = raw.estagio != null ? String(raw.estagio) : undefined;
  const emptyPoly: Talhao['poligono_geojson'] = {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [[[0, 0], [0, 0], [0, 0], [0, 0], [0, 0]]] },
  };
  return {
    id: String(raw.id ?? 't0'),
    nome: String(raw.nome ?? 'Talhão'),
    cultura: String(raw.cultura ?? '—'),
    area_ha: Number(raw.area_ha ?? 0) || 0,
    pontos: [],
    poligono_geojson: emptyPoly,
    ...(estagio ? { estagio } : {}),
    ...(dae != null && Number.isFinite(dae) ? { dae } : {}),
  };
}

const cardBase: React.CSSProperties = {
  background: 'rgba(255,255,255,0.92)',
  borderRadius: 12,
  border: '1px solid var(--fs-border-md, rgba(0,0,0,0.12))',
  marginBottom: 16,
  padding: '16px 18px',
};

/**
 * Plantio completo (paridade com fluxo antigo fitossanitário): CV%, tabela técnica, estande, linha/sulco de plantabilidade.
 */
export default function PlantioIntegradoPremiumSection({ relatorio }: Props) {
  const [zoomPlantabilidade, setZoomPlantabilidade] = useState(1);

  const dp = useMemo((): DadosPlantioMonitoramento | null => {
    const direct = relatorio.dados_plantio as DadosPlantioMonitoramento | null | undefined;
    if (direct && typeof direct === 'object' && hasPlantioContent(direct)) return direct;
    const modulo = relatorio.modulo_plantio as Record<string, unknown> | undefined;
    return deriveDadosPlantioFromModuloPlantio(modulo ?? null);
  }, [relatorio]);

  const camposPlantioMesclados = useMemo(() => {
    const dataVisita = String(relatorio.data ?? (relatorio.meta as Record<string, unknown> | undefined)?.dataGeracao ?? '');
    return mergePlantioCampos({
      dp: dp ?? undefined,
      estandeRoot: relatorio.estande as Record<string, unknown> | undefined,
      fenologiaRoot: relatorio.fenologia as Record<string, unknown> | undefined,
      talhao: miniTalhaoForMerge(relatorio),
      dataVisitaRelatorio: dataVisita,
    });
  }, [relatorio, dp]);

  if (!hasPlantioContent(dp)) return null;

  const d = dp!;
  const fmt = (n: number | undefined) => (n != null ? formatDecimal2(n) : '—');
  const fmtInt = (n: number | undefined) => (n != null ? String(Math.round(n)) : '—');

  const hasAny =
    d.cultura ||
    d.populacao_desejada != null ||
    d.populacao_real != null ||
    d.cv_percent != null ||
    d.estagio_atual ||
    (d.evolucao_fenologica?.length ?? 0) > 0 ||
    (d.linha_plantabilidade?.length ?? 0) > 0;
  if (!hasAny) return null;

  return (
    <section className="fs-mon-premium__section" aria-labelledby="hdr-plantio-integrado">
      <div className="fs-mon-premium__section-head">
        <span className="fs-mon-premium__section-num">03+</span>
        <h2 className="fs-mon-premium__section-title" id="hdr-plantio-integrado">
          Plantio <em>integrado ao monitoramento</em>
        </h2>
        <div className="fs-mon-premium__section-rule" />
      </div>

      <div className="fs-mon-premium__surface" style={{ paddingBottom: 8 }}>
        <div className="fs-mon-premium__surface-h">Avaliação técnica do plantio (módulo Plantio / plantadeira)</div>
        <p style={{ margin: '0 0 18px', fontSize: 14, color: '#5c6d5c', lineHeight: 1.65 }}>
          Inclui linha de plantabilidade da plantadeira quando registrada no app. Textos de classificação automática são referência —
          não substituem parecer do responsável técnico.
        </p>

        {d.cv_percent != null && (
          <div style={{ ...cardBase, borderLeft: '4px solid var(--fs-leaf, #1a6b35)' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12, color: 'var(--fs-ink-mid, #1c211c)' }}>
              Classificação automática — qualidade do plantio (referência)
            </div>
            {(() => {
              const cv = d.cv_percent;
              const qualidade = cv < 10 ? 'EXCELENTE' : cv < 15 ? 'BOM' : cv < 25 ? 'REGULAR' : 'CRÍTICO';
              const faixaIdeal = '< 10%';
              const interpretacao =
                cv < 10
                  ? 'A distribuição de sementes apresenta excelente uniformidade, indicando boa regulagem da plantadeira e adequada deposição de sementes.'
                  : cv < 15
                    ? 'A uniformidade do plantio está dentro do esperado. Pequenos ajustes podem melhorar ainda mais o desempenho.'
                    : cv < 25
                      ? 'Há desuniformidade moderada. Recomenda-se verificar regulagem do dosador e condições de solo.'
                      : 'Alta desuniformidade. Revisar regulagem, profundidade e velocidade de plantio.';
              const impacto =
                cv < 10
                  ? 'Impacto produtivo estimado: +1,8 a +3,5 sc/ha comparado a plantios com CV% > 15%.'
                  : cv < 15
                    ? 'Impacto produtivo: dentro da faixa esperada para o padrão técnico.'
                    : cv < 25
                      ? 'Impacto produtivo estimado: potencial de perda de 0,5 a 2 sc/ha em relação a plantio uniforme.'
                      : 'Impacto produtivo estimado: perda de 2 a 5 sc/ha. Priorizar correções na próxima operação.';
              return (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: '#7a8a7a', marginBottom: 4 }}>Qualidade do plantio</div>
                      <div
                        style={{
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: cv < 10 ? '#15803d' : cv < 25 ? '#ca8a04' : '#b91c1c',
                        }}
                      >
                        {qualidade}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#7a8a7a', marginBottom: 4 }}>CV%</div>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>{fmt(cv)}%</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#7a8a7a', marginBottom: 4 }}>Faixa ideal</div>
                      <div>{faixaIdeal}</div>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 8 }}>
                    <strong>Referência (classificação automática):</strong> {interpretacao}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.5, color: '#64748b', margin: 0 }}>{impacto}</p>
                </>
              );
            })()}
          </div>
        )}

        <div style={cardBase}>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Dados do talhão e desenvolvimento da cultura</div>
          <div style={{ overflowX: 'auto' }}>
            <table className="fs-mon-premium__table" style={{ width: '100%', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Indicador</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {d.cultura != null && (
                  <tr>
                    <td style={{ padding: '8px 10px' }}>Cultura</td>
                    <td style={{ padding: '8px 10px' }}>{d.cultura}</td>
                  </tr>
                )}
                {d.hibrido != null && (
                  <tr>
                    <td style={{ padding: '8px 10px' }}>Híbrido/Variedade</td>
                    <td style={{ padding: '8px 10px' }}>{d.hibrido}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '8px 10px' }}>Data de plantio</td>
                  <td style={{ padding: '8px 10px' }}>
                    {camposPlantioMesclados.data_plantio ?? d.data_plantio
                      ? formatDate(camposPlantioMesclados.data_plantio ?? d.data_plantio!)
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Data de emergência</td>
                  <td style={{ padding: '8px 10px' }}>
                    {camposPlantioMesclados.data_emergencia ?? d.data_emergencia
                      ? formatDate(camposPlantioMesclados.data_emergencia ?? d.data_emergencia!)
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Estágio da cultura</td>
                  <td
                    style={{
                      padding: '8px 10px',
                      fontWeight: 700,
                      color: 'var(--fs-leaf, #1a6b35)',
                    }}
                  >
                    {camposPlantioMesclados.estagio ?? d.estagio_atual ?? '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>DAE</td>
                  <td style={{ padding: '8px 10px' }}>
                    {(camposPlantioMesclados.dae ?? d.dae) != null
                      ? `${camposPlantioMesclados.dae ?? d.dae} dias`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>DAP</td>
                  <td style={{ padding: '8px 10px' }}>
                    {(camposPlantioMesclados.dap ?? d.dap) != null
                      ? `${camposPlantioMesclados.dap ?? d.dap} dias`
                      : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Espaçamento entre linhas</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.espacamento_entre_linhas_m != null ? `${fmt(d.espacamento_entre_linhas_m)} m` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Espaçamento médio entre plantas</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.espacamento_medio_cm != null ? `${fmt(d.espacamento_medio_cm)} cm` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>População</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.populacao_real != null
                      ? `${fmtInt(d.populacao_real)} plantas/ha`
                      : d.populacao_desejada != null
                        ? `${fmtInt(d.populacao_desejada)} (alvo)`
                        : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Eficiência do estande</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.eficiencia_estande_percent != null ? `${fmt(d.eficiencia_estande_percent)}%` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>CV de plantio</td>
                  <td style={{ padding: '8px 10px', fontWeight: d.cv_classificacao ? 700 : undefined }}>
                    {d.cv_percent != null ? `${fmt(d.cv_percent)}%` : '—'}
                    {d.cv_classificacao ? ` (${d.cv_classificacao})` : ''}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Falhas</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.indice_falhas_percent != null ? `${fmt(d.indice_falhas_percent)}%` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Duplos</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.indice_duplas_percent != null ? `${fmt(d.indice_duplas_percent)}%` : '—'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 10px' }}>Plantas contadas / metros amostrados</td>
                  <td style={{ padding: '8px 10px' }}>
                    {d.plantas_contadas != null && d.metros_amostrados != null
                      ? `${fmtInt(d.plantas_contadas)} plantas em ${fmt(d.metros_amostrados)} m`
                      : d.plantas_contadas != null
                        ? fmtInt(d.plantas_contadas)
                        : d.metros_amostrados != null
                          ? `${fmt(d.metros_amostrados)} m`
                          : '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {d.populacao_desejada != null && d.populacao_real != null && (
          <div style={{ ...cardBase, borderLeft: '4px solid #ca8a04' }}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Diagnóstico do estande (referência)</div>
            {(() => {
              const alvo = d.populacao_desejada;
              const real = d.populacao_real;
              const perda = Math.max(0, alvo - real);
              const impactoScHa = perda > 0 ? (perda / 1000) * 0.4 : 0;
              const recomendacoes =
                perda > 5000
                  ? [
                      'Revisar pressão da roda compactadora',
                      'Conferir profundidade de plantio',
                      'Avaliar regulagem do dosador',
                    ]
                  : perda > 2000
                    ? ['Conferir regulagem do dosador', 'Verificar condições de palhada']
                    : ['Manter monitoramento do estande'];
              return (
                <>
                  <table className="fs-mon-premium__table" style={{ width: '100%', fontSize: 13, marginBottom: perda > 0 ? 12 : 0 }}>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 10px' }}>População alvo</td>
                        <td style={{ padding: '8px 10px' }}>{fmtInt(alvo)} plantas/ha</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 10px' }}>População real</td>
                        <td style={{ padding: '8px 10px' }}>{fmt(real)} plantas/ha</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 10px' }}>Perda estimada</td>
                        <td style={{ padding: '8px 10px', color: perda > 0 ? '#ca8a04' : undefined }}>
                          {fmtInt(perda)} plantas/ha
                        </td>
                      </tr>
                      {perda > 0 && (
                        <tr>
                          <td style={{ padding: '8px 10px' }}>Impacto produtivo estimado</td>
                          <td style={{ padding: '8px 10px', color: '#b91c1c' }}>
                            -{formatDecimal2(impactoScHa)} sc/ha
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  {perda > 0 && (
                    <>
                      <p style={{ fontSize: 13, marginBottom: 8, fontWeight: 600 }}>Recomenda-se:</p>
                      <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: 13, lineHeight: 1.7 }}>
                        {recomendacoes.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {Array.isArray(d.linha_plantabilidade) && d.linha_plantabilidade.length > 0 && (() => {
          const lin = d.linha_plantabilidade;
          const total = lin.length;
          const ok = lin.filter((p) => p.tipo === 'ok').length;
          const duplas = lin.filter((p) => p.tipo === 'dupla').length;
          const triplas = lin.filter((p) => p.tipo === 'tripla').length;
          const falhas = lin.filter((p) => p.tipo === 'falha').length;
          const pct = (n: number) => (total > 0 ? formatDecimal2((n / total) * 100) : '0');
          const espacamentoIdeal =
            d.espacamento_medio_cm ?? (lin.length > 0 ? lin.reduce((a, p) => a + p.espacamento_cm, 0) / lin.length : undefined);
          const comprimentoAvaliado =
            d.metros_amostrados ??
            (lin.length > 0 ? lin.reduce((a, p) => a + p.espacamento_cm, 0) / 100 : undefined);
          const linShow = lin;
          const cms = lin.map((p) => p.espacamento_cm);
          const minCm = cms.length > 0 ? Math.min(...cms) : 0;
          const maxCm = cms.length > 0 ? Math.max(...cms) : 0;
          const medianaCm = cms.length > 0 ? [...cms].sort((a, b) => a - b)[Math.floor(cms.length / 2)] : 0;
          const pxPerCm = 4 * zoomPlantabilidade;
          return (
            <div style={cardBase}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Linha de plantabilidade (plantadeira)</div>
              <table className="fs-mon-premium__table" style={{ width: '100%', maxWidth: 440, fontSize: 13, marginBottom: 12 }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '6px 10px' }}>CV%</td>
                    <td style={{ padding: '6px 10px' }}>{d.cv_percent != null ? formatDecimal2(d.cv_percent) : '—'}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px' }}>Comprimento avaliado</td>
                    <td style={{ padding: '6px 10px' }}>
                      {comprimentoAvaliado != null ? `${formatDecimal2(comprimentoAvaliado)} m` : '—'}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '6px 10px' }}>Espaç. ideal (média)</td>
                    <td style={{ padding: '6px 10px' }}>
                      {espacamentoIdeal != null ? `${formatDecimal2(espacamentoIdeal)} cm` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#7a8a7a' }}>Zoom da régua (px/cm)</span>
                <button
                  type="button"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--fs-border-md)',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setZoomPlantabilidade((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))}
                >
                  −
                </button>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{zoomPlantabilidade.toFixed(2)}×</span>
                <button
                  type="button"
                  style={{
                    padding: '4px 10px',
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid var(--fs-border-md)',
                    background: '#fff',
                    cursor: 'pointer',
                  }}
                  onClick={() => setZoomPlantabilidade((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
                >
                  +
                </button>
              </div>
              <div style={{ overflowX: 'auto', padding: '12px 0' }}>
                <div style={{ fontSize: 12, color: '#7a8a7a', marginBottom: 6 }}>
                  Sulco (trena) — largura proporcional ao espaçamento medido. mín. {formatDecimal2(minCm)} cm · mediana{' '}
                  {formatDecimal2(medianaCm)} cm · máx. {formatDecimal2(maxCm)} cm
                  {espacamentoIdeal != null ? ` · ref. média ${formatDecimal2(espacamentoIdeal)} cm` : ''}
                </div>
                <div
                  style={{
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: '0.95rem',
                    lineHeight: 1.8,
                    overflowX: 'auto',
                    padding: '10px 12px',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 10,
                    border: '1px solid var(--fs-border-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', flexWrap: 'nowrap', gap: 0, minWidth: 'max-content' }}>
                    <span style={{ marginRight: 4, alignSelf: 'center' }}>|</span>
                    {linShow.map((p, i) => (
                      <React.Fragment key={i}>
                        {p.tipo === 'falha' ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              minWidth: Math.max(12, p.espacamento_cm * pxPerCm),
                              color: '#64748b',
                              textAlign: 'center',
                            }}
                            title={`Falha — ${p.espacamento_cm.toFixed(1)} cm`}
                          >
                            <span>⋯</span>
                            <span style={{ fontSize: 9, lineHeight: 1 }}>{p.espacamento_cm.toFixed(0)}cm</span>
                          </span>
                        ) : (
                          <>
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                              }}
                            >
                              <span>
                                {p.tipo === 'ok' && '🌱'}
                                {p.tipo === 'dupla' && '🌱🌱'}
                                {p.tipo === 'tripla' && '🌱🌱🌱'}
                              </span>
                            </span>
                            {i < linShow.length - 1 && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  flexDirection: 'column',
                                  justifyContent: 'flex-end',
                                  minWidth: Math.max(8, p.espacamento_cm * pxPerCm),
                                  flexShrink: 0,
                                  borderBottom: '2px solid rgba(15,23,42,0.15)',
                                  marginBottom: 2,
                                }}
                                title={`${p.espacamento_cm.toFixed(1)} cm entre plantas`}
                              >
                                <span
                                  style={{
                                    fontSize: 9,
                                    color: '#64748b',
                                    textAlign: 'center',
                                    lineHeight: 1,
                                    userSelect: 'none',
                                  }}
                                >
                                  {p.espacamento_cm.toFixed(0)}
                                </span>
                              </span>
                            )}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                    <span style={{ marginLeft: 4, alignSelf: 'center' }}>|</span>
                  </div>
                  <div style={{ fontSize: 11, color: '#7a8a7a', marginTop: 6 }}>
                    Legenda: número = espaçamento em cm. 🌱 simples; 🌱🌱 dupla; 🌱🌱🌱 tripla; ⋯ falha.
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 12, color: '#64748b', flexWrap: 'wrap' }}>
                  <span>
                    <strong>Total:</strong> {total} posições
                  </span>
                  <span style={{ color: '#15803d' }}>
                    OK: {ok} ({pct(ok)}%)
                  </span>
                  <span style={{ color: '#ca8a04' }}>
                    Duplas: {duplas} ({pct(duplas)}%)
                  </span>
                  <span style={{ color: '#9333ea' }}>
                    Triplas: {triplas} ({pct(triplas)}%)
                  </span>
                  <span style={{ color: '#dc2626' }}>
                    Falhas: {falhas} ({pct(falhas)}%)
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </section>
  );
}
