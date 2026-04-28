'use client';

import React, { useMemo } from 'react';
import { deriveDadosPlantioFromModuloPlantio, type DadosPlantioMonitoramento } from '@/components/RelatorioFitossanitarioContent';
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

/**
 * Bloco exclusivo para o shell premium (/r/token): dados do módulo Plantio já enviados no payload do app.
 */
export default function PlantioIntegradoPremiumSection({ relatorio }: Props) {
  const dp = useMemo((): DadosPlantioMonitoramento | null => {
    const direct = relatorio.dados_plantio as DadosPlantioMonitoramento | null | undefined;
    if (direct && typeof direct === 'object' && hasPlantioContent(direct)) return direct;
    const modulo = relatorio.modulo_plantio as Record<string, unknown> | undefined;
    return deriveDadosPlantioFromModuloPlantio(modulo ?? null);
  }, [relatorio]);

  if (!hasPlantioContent(dp)) return null;

  const d = dp!;

  return (
    <section className="fs-mon-premium__section" aria-labelledby="hdr-plantio-integrado">
      <div className="fs-mon-premium__section-head">
        <span className="fs-mon-premium__section-num">03+</span>
        <h2 className="fs-mon-premium__section-title" id="hdr-plantio-integrado">
          Plantio <em>integrado ao monitoramento</em>
        </h2>
        <div className="fs-mon-premium__section-rule" />
      </div>
      <div className="fs-mon-premium__surface">
        <div className="fs-mon-premium__surface-h">Resumo técnico do módulo Plantio</div>
        <p style={{ margin: '0 0 16px', fontSize: 14, color: '#5c6d5c', lineHeight: 1.65 }}>
          Indicadores de estande, plantabilidade e fenologia vindos da mesma visita/registro técnico usado neste relatório de monitoramento —
          não substituem avaliação presencial quando exigido.
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 14,
            fontSize: 13,
            color: '#2d392d',
          }}
        >
          {d.cultura && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Cultura</div>
              <div style={{ fontWeight: 700 }}>{d.cultura}</div>
            </div>
          )}
          {d.hibrido && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Material</div>
              <div style={{ fontWeight: 600 }}>{d.hibrido}</div>
            </div>
          )}
          {d.data_plantio && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Plantio</div>
              <div>{formatDate(d.data_plantio)}</div>
            </div>
          )}
          {d.data_emergencia && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Emergência</div>
              <div>{formatDate(d.data_emergencia)}</div>
            </div>
          )}
          {d.estagio_atual && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Estágio</div>
              <div style={{ fontWeight: 700, color: 'var(--fs-primary-strong, #1a6b35)' }}>{d.estagio_atual}</div>
            </div>
          )}
          {d.dae != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>DAE / DAP</div>
              <div>
                {d.dae ?? '—'}
                {d.dap != null && d.dap !== d.dae ? ` · ${d.dap}` : ''}
              </div>
            </div>
          )}
          {d.populacao_desejada != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Pop. alvo</div>
              <div>{`${formatDecimal2(d.populacao_desejada)} pl/ha`}</div>
            </div>
          )}
          {d.populacao_real != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Pop. real</div>
              <div>{`${formatDecimal2(d.populacao_real)} pl/ha`}</div>
            </div>
          )}
          {d.espacamento_medio_cm != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Espaç. médio</div>
              <div>{`${formatDecimal2(d.espacamento_medio_cm)} cm`}</div>
            </div>
          )}
          {d.cv_percent != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>CV%</div>
              <div style={{ fontWeight: 800 }}>
                {`${formatDecimal2(d.cv_percent)}%`}
                {d.cv_classificacao ? ` (${d.cv_classificacao})` : ''}
              </div>
            </div>
          )}
          {d.eficiencia_estande_percent != null && (
            <div>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>Efic. estande</div>
              <div>{`${formatDecimal2(d.eficiencia_estande_percent)}%`}</div>
            </div>
          )}
          {Array.isArray(d.linha_plantabilidade) && d.linha_plantabilidade.length > 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#7a8a7a', marginBottom: 4 }}>
                Plantabilidade · amostra
              </div>
              <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                <strong>{d.linha_plantabilidade.length}</strong> espaços da trena avaliados nesta amostra de plantabilidade
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
