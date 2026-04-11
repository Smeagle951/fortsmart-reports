'use client';

import React from 'react';
import {
  computeInteligenciaAgronomicaFromRelatorio,
  formatRiscoDisplay,
  formatSituacaoDisplay,
  formatTendenciaDisplay,
  type InteligenciaAgronomicaPayload,
} from '@/lib/inteligencia-agronomica';
import type { AiTemporalViewerPayload } from '@/lib/inteligencia-temporal';

function formatIsoDatePt(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = Date.parse(iso);
  if (Number.isNaN(d)) return String(iso).slice(0, 10);
  return new Date(d).toLocaleDateString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function IntelTemporalBlock({ relatorio, light }: { relatorio: Record<string, unknown>; light?: boolean }) {
  const temporal = relatorio.ai_temporal_viewer as AiTemporalViewerPayload | undefined;
  if (!temporal) return null;
  const hasDelta =
    temporal.delta != null &&
    temporal.previous_score != null &&
    temporal.current_score != null;
  const hasExtras =
    temporal.impacto_diff_sc != null ||
    temporal.confianca_trend != null ||
    (temporal.insights?.length ?? 0) > 0;
  if (!hasDelta && !hasExtras) return null;

  const deltaColor =
    temporal.delta?.direcao === 'queda'
      ? light
        ? '#b91c1c'
        : '#fca5a5'
      : temporal.delta?.direcao === 'subida'
        ? light
          ? '#15803d'
          : '#86efac'
        : light
          ? '#57534e'
          : '#e2e8f0';

  return (
    <div
      style={{
        background: light ? 'rgba(26,77,50,0.06)' : 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '0.85rem 1rem',
        fontSize: 13,
        border: light ? '1px solid #e7e2d9' : '1px solid rgba(255,255,255,0.1)',
        color: light ? '#1c1917' : undefined,
      }}
    >
      <div
        style={{
          fontWeight: 800,
          marginBottom: 8,
          fontSize: 12,
          opacity: light ? 1 : 0.9,
          letterSpacing: '0.04em',
          color: light ? '#1a4d32' : undefined,
        }}
      >
        Evolução temporal
      </div>
      {temporal.previous_report_at && (
        <div style={{ fontSize: 11, opacity: light ? 0.85 : 0.7, marginBottom: 10 }}>
          Comparado ao relatório anterior de <strong>{formatIsoDatePt(temporal.previous_report_at)}</strong>
          {temporal.dias_desde_anterior != null ? ` · ${temporal.dias_desde_anterior} dia(s) entre registros` : ''}
        </div>
      )}
      {hasDelta && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, opacity: light ? 0.9 : 0.85, color: light ? '#44403c' : undefined }}>
            Score anterior: <strong>{temporal.previous_score}</strong>
          </div>
          <span style={{ opacity: light ? 0.4 : 0.45 }}>→</span>
          <div style={{ fontSize: 12, opacity: light ? 0.9 : 0.85, color: light ? '#44403c' : undefined }}>
            Score atual: <strong>{temporal.current_score}</strong>
          </div>
          <div style={{ color: deltaColor, fontWeight: 800, fontSize: 13 }}>
            {temporal.delta!.direcao === 'queda' ? '▼ ' : temporal.delta!.direcao === 'subida' ? '▲ ' : '◆ '}
            {temporal.delta!.mensagem}
          </div>
        </div>
      )}
      {temporal.impacto_diff_sc && (
        <p
          style={{
            margin: '0 0 8px',
            lineHeight: 1.45,
            opacity: light ? 1 : 0.92,
            color: light ? '#44403c' : undefined,
          }}
        >
          {temporal.impacto_diff_sc.mensagem}
        </p>
      )}
      {temporal.confianca_trend && (
        <p
          style={{
            margin: '0 0 8px',
            lineHeight: 1.45,
            opacity: light ? 1 : 0.92,
            color: light ? '#44403c' : undefined,
          }}
        >
          {temporal.confianca_trend.mensagem}
        </p>
      )}
      {temporal.insights && temporal.insights.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div
            style={{
              fontWeight: 700,
              marginBottom: 6,
              fontSize: 11,
              opacity: light ? 1 : 0.85,
              color: light ? '#1a4d32' : undefined,
            }}
          >
            Insights automáticos
          </div>
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.1rem',
              lineHeight: 1.5,
              opacity: light ? 1 : 0.95,
              color: light ? '#44403c' : undefined,
            }}
          >
            {temporal.insights.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

type Props = {
  relatorio: Record<string, unknown>;
  variant?: 'fitossanitario' | 'default' | 'executiveBrief';
};

const badgeBase: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.2rem 0.55rem',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.02em',
};

function badgeStyle(kind: 'sit' | 'risco' | 'tend' | 'conf', value: string, light?: boolean): React.CSSProperties {
  const v = value.toUpperCase();
  if (kind === 'sit') {
    if (v.includes('CRÍT') || v.includes('CRIT'))
      return light
        ? { ...badgeBase, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
        : { ...badgeBase, background: 'rgba(248,113,113,0.25)', color: '#fecaca' };
    if (v.includes('ATEN'))
      return light
        ? { ...badgeBase, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
        : { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return light
      ? { ...badgeBase, background: '#dcfce7', color: '#14532d', border: '1px solid #bbf7d0' }
      : { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  }
  if (kind === 'risco') {
    if (v.includes('ALTO'))
      return light
        ? { ...badgeBase, background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }
        : { ...badgeBase, background: 'rgba(248,113,113,0.25)', color: '#fecaca' };
    if (v.includes('MOD'))
      return light
        ? { ...badgeBase, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
        : { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return light
      ? { ...badgeBase, background: '#dcfce7', color: '#14532d', border: '1px solid #bbf7d0' }
      : { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  }
  if (kind === 'tend') {
    if (v.includes('PIOR'))
      return light
        ? { ...badgeBase, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
        : { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return light
      ? { ...badgeBase, background: '#f1f5f9', color: '#334155', border: '1px solid #e2e8f0' }
      : { ...badgeBase, background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' };
  }
  if (v.includes('ALTA'))
    return light
      ? { ...badgeBase, background: '#dcfce7', color: '#14532d', border: '1px solid #bbf7d0' }
      : { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  if (v.includes('MÉD') || v.includes('MED'))
    return light
      ? { ...badgeBase, background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
      : { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
  return light
    ? { ...badgeBase, background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' }
    : { ...badgeBase, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' };
}

function labelRecomendacaoAcao(acao: string | undefined): string {
  const a = (acao ?? '').toLowerCase();
  if (a.includes('aplicar')) return 'Aplicar controle';
  if (a.includes('reforcar')) return 'Reforçar monitoramento';
  return 'Manter monitoramento';
}

function readMotorBlocks(relatorio: Record<string, unknown>) {
  const intelRaw = relatorio.inteligencia_agronomica as Record<string, unknown> | undefined;
  const motorAlertas = Array.isArray(intelRaw?.motor_alertas)
    ? (intelRaw.motor_alertas as Record<string, unknown>[])
    : [];
  const motorFatores = Array.isArray(intelRaw?.motor_fatores)
    ? (intelRaw.motor_fatores as unknown[]).map((x) => String(x))
    : [];
  return { motorAlertas, motorFatores };
}

export default function InteligenciaAgronomicaPanel({ relatorio, variant = 'default' }: Props) {
  const data: InteligenciaAgronomicaPayload = computeInteligenciaAgronomicaFromRelatorio(relatorio);
  const { motorAlertas, motorFatores } = readMotorBlocks(relatorio);
  const sitLabel = formatSituacaoDisplay(data.situacao);
  const riscoLabel = formatRiscoDisplay(data.risco);
  const tendLabel = formatTendenciaDisplay(data.tendencia);
  const perdaSc =
    data.impacto?.perda_estimada_sc ?? data.economia?.perda_evitada_sc_ha ?? undefined;
  const roiVal = data.impacto?.roi_estimado ?? data.economia?.roi_estimado ?? undefined;

  const isFitossanitario = variant === 'fitossanitario';
  const isLight = variant === 'executiveBrief';
  const cardBg = isFitossanitario
    ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #14532d 100%)'
    : isLight
      ? '#fffcf7'
      : '#0f172a';
  const fg = isLight ? '#1c1917' : '#f8fafc';
  const headBorder = isLight ? '1px solid #e7e2d9' : '1px solid rgba(255,255,255,0.12)';
  const subOpacity = isLight ? 0.75 : 0.85;
  const scoreBoxBg = isLight ? 'rgba(26,77,50,0.08)' : 'rgba(255,255,255,0.1)';
  const dotOpacity = isLight ? 0.35 : 0.5;

  return (
    <section
      className="inteligencia-agronomica-panel pdf-keep-together"
      style={{
        marginTop: 0,
        marginBottom: 0,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: isLight ? '0 2px 12px rgba(28,25,23,0.06)' : '0 8px 32px rgba(15,23,42,0.25)',
        border: isLight ? '1px solid #e7e2d9' : undefined,
        background: cardBg,
        color: fg,
      }}
    >
      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: headBorder }}>
        <h2
          style={{
            margin: 0,
            fontSize: isFitossanitario ? '1.05rem' : '0.8rem',
            fontWeight: 800,
            letterSpacing: isLight ? '0.06em' : '-0.02em',
            textTransform: isLight ? 'uppercase' : undefined,
            color: isLight ? '#1a4d32' : fg,
          }}
        >
          Inteligência agronômica
        </h2>
        <p style={{ margin: '0.35rem 0 0', fontSize: 12, opacity: subOpacity, lineHeight: 1.4, color: isLight ? '#57534e' : undefined }}>
          Diagnóstico sintético, confiança e leitura econômica — apoio à decisão (heurística FortSmart).
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem 1.25rem', display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'stretch' }}>
          {data.score != null && (
            <div
              style={{
                minWidth: 88,
                borderRadius: 12,
                background: scoreBoxBg,
                padding: '0.5rem 0.75rem',
                textAlign: 'center',
                border: isLight ? '1px solid #e7e2d9' : undefined,
              }}
            >
              <div style={{ fontSize: 10, opacity: isLight ? 0.8 : 0.75, fontWeight: 700, letterSpacing: '0.06em', color: isLight ? '#1a4d32' : undefined }}>
                SCORE
              </div>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, color: isLight ? '#1a4d32' : fg }}>{data.score}</div>
              <div style={{ fontSize: 10, opacity: isLight ? 0.65 : 0.65 }}>0–100</div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            <span style={badgeStyle('sit', sitLabel, isLight)}>{sitLabel}</span>
            <span style={{ opacity: dotOpacity }}>·</span>
            <span style={badgeStyle('risco', riscoLabel, isLight)}>Risco: {riscoLabel}</span>
            <span style={{ opacity: dotOpacity }}>·</span>
            <span style={badgeStyle('tend', tendLabel, isLight)}>Tendência: {tendLabel}</span>
            <span style={{ opacity: dotOpacity }}>·</span>
            <span style={badgeStyle('conf', data.confianca ?? '', isLight)}>
              Confiança: {(data.confianca ?? '—').toString().toUpperCase()}
              {data.confianca_score != null ? ` (${data.confianca_score})` : ''}
            </span>
          </div>
        </div>

        <IntelTemporalBlock relatorio={relatorio} light={isLight} />

        {data.resumo && (
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              opacity: isLight ? 1 : 0.95,
              fontWeight: 500,
              color: isLight ? '#44403c' : undefined,
            }}
          >
            {data.resumo}
          </p>
        )}

        {data.recomendacao && (data.recomendacao.acao || data.recomendacao.prazo) && (
          <div
            style={{
              background: isLight ? 'rgba(22,101,52,0.06)' : 'rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '0.65rem 0.9rem',
              fontSize: 13,
              borderLeft: isLight ? '3px solid #166534' : '3px solid rgba(52,211,153,0.7)',
              color: isLight ? '#1c1917' : undefined,
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: 4,
                fontSize: 11,
                opacity: isLight ? 1 : 0.85,
                color: isLight ? '#1a4d32' : undefined,
              }}
            >
              Recomendação
            </strong>
            <span>
              {labelRecomendacaoAcao(data.recomendacao.acao)}
              {data.recomendacao.prazo ? ` · prazo: ${data.recomendacao.prazo}` : ''}
            </span>
          </div>
        )}

        {data.evolucao && (
          <div
            style={{
              background: isLight ? '#f5f2eb' : 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              fontSize: 13,
              border: isLight ? '1px solid #e7e2d9' : undefined,
              color: isLight ? '#1c1917' : undefined,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                marginBottom: 6,
                fontSize: 12,
                opacity: isLight ? 1 : 0.9,
                color: isLight ? '#1a4d32' : undefined,
              }}
            >
              Evolução (indicativo)
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'baseline' }}>
              <span>
                Última referência: <strong>{data.evolucao.anterior_pct ?? '—'}%</strong>
              </span>
              <span>→</span>
              <span>
                Atual: <strong>{data.evolucao.atual_pct ?? '—'}%</strong>
              </span>
              {data.evolucao.delta_pct && (
                <span style={{ color: isLight ? '#166534' : '#86efac', fontWeight: 700 }}>Δ {data.evolucao.delta_pct}</span>
              )}
            </div>
          </div>
        )}

        {Array.isArray(data.padrao) && data.padrao.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 6,
                fontSize: 12,
                opacity: isLight ? 1 : 0.9,
                color: isLight ? '#1a4d32' : undefined,
              }}
            >
              Padrão identificado
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.1rem',
                fontSize: 13,
                lineHeight: 1.5,
                opacity: isLight ? 1 : 0.95,
                color: isLight ? '#44403c' : undefined,
              }}
            >
              {data.padrao.map((line, i) => (
                <li key={i}>{String(line)}</li>
              ))}
            </ul>
          </div>
        )}

        {motorFatores.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 6,
                fontSize: 12,
                opacity: isLight ? 1 : 0.9,
                color: isLight ? '#1a4d32' : undefined,
              }}
            >
              Fatores da visita (motor FortSmart)
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: '1.1rem',
                fontSize: 13,
                lineHeight: 1.5,
                opacity: isLight ? 1 : 0.95,
                color: isLight ? '#44403c' : undefined,
              }}
            >
              {motorFatores.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
          </div>
        )}

        {motorAlertas.length > 0 && (
          <div>
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                fontSize: 12,
                opacity: isLight ? 1 : 0.9,
                color: isLight ? '#1a4d32' : undefined,
              }}
            >
              Alertas técnicos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {motorAlertas.map((a, i) => {
                const nivel = String(a.nivel ?? 'info');
                const border =
                  nivel.includes('alt') || nivel.includes('crit')
                    ? isLight
                      ? '#f87171'
                      : 'rgba(248,113,113,0.5)'
                    : nivel.includes('med')
                      ? isLight
                        ? '#f59e0b'
                        : 'rgba(251,191,36,0.45)'
                      : isLight
                        ? '#22c55e'
                        : 'rgba(52,211,153,0.35)';
                return (
                  <div
                    key={i}
                    style={{
                      borderRadius: 10,
                      padding: '0.65rem 0.85rem',
                      fontSize: 13,
                      lineHeight: 1.45,
                      background: isLight ? '#f5f2eb' : 'rgba(255,255,255,0.06)',
                      borderLeft: `3px solid ${border}`,
                      color: isLight ? '#1c1917' : undefined,
                    }}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 4 }}>{String(a.titulo ?? 'Alerta')}</div>
                    {a.descricao != null && <div style={{ opacity: 0.92 }}>{String(a.descricao)}</div>}
                    {a.acaoSugerida != null && (
                      <div style={{ marginTop: 6, fontSize: 12, opacity: 0.85 }}>
                        <strong>Ação sugerida:</strong> {String(a.acaoSugerida)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(perdaSc != null || roiVal != null) && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 10,
              fontSize: 13,
            }}
          >
            <div
              style={{
                background: isLight ? 'rgba(26,77,50,0.06)' : 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                border: isLight ? '1px solid #e7e2d9' : undefined,
              }}
            >
              <div style={{ fontSize: 11, opacity: isLight ? 0.8 : 0.75, color: isLight ? '#57534e' : undefined }}>Impacto (est. sc/ha)</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: isLight ? '#1a4d32' : undefined }}>{perdaSc ?? '—'} sc/ha</div>
            </div>
            <div
              style={{
                background: isLight ? 'rgba(26,77,50,0.06)' : 'rgba(255,255,255,0.08)',
                borderRadius: 10,
                padding: '0.65rem 0.85rem',
                border: isLight ? '1px solid #e7e2d9' : undefined,
              }}
            >
              <div style={{ fontSize: 11, opacity: isLight ? 0.8 : 0.75, color: isLight ? '#57534e' : undefined }}>ROI estimado</div>
              <div style={{ fontWeight: 800, fontSize: 16, color: isLight ? '#1a4d32' : undefined }}>{roiVal ?? '—'}×</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
