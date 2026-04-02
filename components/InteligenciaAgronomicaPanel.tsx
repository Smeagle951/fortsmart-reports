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

function IntelTemporalBlock({ relatorio }: { relatorio: Record<string, unknown> }) {
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
      ? '#fca5a5'
      : temporal.delta?.direcao === 'subida'
        ? '#86efac'
        : '#e2e8f0';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.07)',
        borderRadius: 12,
        padding: '0.85rem 1rem',
        fontSize: 13,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: 8, fontSize: 12, opacity: 0.9, letterSpacing: '0.04em' }}>
        Evolução temporal
      </div>
      {temporal.previous_report_at && (
        <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 10 }}>
          Comparado ao relatório anterior de <strong>{formatIsoDatePt(temporal.previous_report_at)}</strong>
          {temporal.dias_desde_anterior != null ? ` · ${temporal.dias_desde_anterior} dia(s) entre registos` : ''}
        </div>
      )}
      {hasDelta && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Score anterior: <strong>{temporal.previous_score}</strong>
          </div>
          <span style={{ opacity: 0.45 }}>→</span>
          <div style={{ fontSize: 12, opacity: 0.85 }}>
            Score atual: <strong>{temporal.current_score}</strong>
          </div>
          <div style={{ color: deltaColor, fontWeight: 800, fontSize: 13 }}>
            {temporal.delta!.direcao === 'queda' ? '▼ ' : temporal.delta!.direcao === 'subida' ? '▲ ' : '◆ '}
            {temporal.delta!.mensagem}
          </div>
        </div>
      )}
      {temporal.impacto_diff_sc && (
        <p style={{ margin: '0 0 8px', lineHeight: 1.45, opacity: 0.92 }}>{temporal.impacto_diff_sc.mensagem}</p>
      )}
      {temporal.confianca_trend && (
        <p style={{ margin: '0 0 8px', lineHeight: 1.45, opacity: 0.92 }}>{temporal.confianca_trend.mensagem}</p>
      )}
      {temporal.insights && temporal.insights.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 11, opacity: 0.85 }}>Insights automáticos</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', lineHeight: 1.5, opacity: 0.95 }}>
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
  variant?: 'fitossanitario' | 'default';
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

function badgeStyle(kind: 'sit' | 'risco' | 'tend' | 'conf', value: string): React.CSSProperties {
  const v = value.toUpperCase();
  if (kind === 'sit') {
    if (v.includes('CRÍT') || v.includes('CRIT'))
      return { ...badgeBase, background: 'rgba(248,113,113,0.25)', color: '#fecaca' };
    if (v.includes('ATEN')) return { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  }
  if (kind === 'risco') {
    if (v.includes('ALTO')) return { ...badgeBase, background: 'rgba(248,113,113,0.25)', color: '#fecaca' };
    if (v.includes('MOD')) return { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  }
  if (kind === 'tend') {
    if (v.includes('PIOR')) return { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
    return { ...badgeBase, background: 'rgba(148,163,184,0.2)', color: '#e2e8f0' };
  }
  if (v.includes('ALTA')) return { ...badgeBase, background: 'rgba(34,197,94,0.25)', color: '#bbf7d0' };
  if (v.includes('MÉD') || v.includes('MED')) return { ...badgeBase, background: 'rgba(251,191,36,0.2)', color: '#fde68a' };
  return { ...badgeBase, background: 'rgba(255,255,255,0.1)', color: '#cbd5e1' };
}

function labelRecomendacaoAcao(acao: string | undefined): string {
  const a = (acao ?? '').toLowerCase();
  if (a.includes('aplicar')) return 'Aplicar controle';
  if (a.includes('reforcar')) return 'Reforçar monitoramento';
  return 'Manter monitoramento';
}

export default function InteligenciaAgronomicaPanel({ relatorio, variant = 'default' }: Props) {
  const data: InteligenciaAgronomicaPayload = computeInteligenciaAgronomicaFromRelatorio(relatorio);
  const sitLabel = formatSituacaoDisplay(data.situacao);
  const riscoLabel = formatRiscoDisplay(data.risco);
  const tendLabel = formatTendenciaDisplay(data.tendencia);
  const perdaSc =
    data.impacto?.perda_estimada_sc ?? data.economia?.perda_evitada_sc_ha ?? undefined;
  const roiVal = data.impacto?.roi_estimado ?? data.economia?.roi_estimado ?? undefined;

  const isFitossanitario = variant === 'fitossanitario';
  const cardBg = isFitossanitario ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #14532d 100%)' : '#0f172a';

  return (
    <section
      className="inteligencia-agronomica-panel pdf-keep-together"
      style={{
        marginTop: isFitossanitario ? '1.25rem' : '1rem',
        marginBottom: '1rem',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(15,23,42,0.25)',
        background: cardBg,
        color: '#f8fafc',
      }}
    >
      <div style={{ padding: '1rem 1.25rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.12)' }}>
        <h2 style={{ margin: 0, fontSize: isFitossanitario ? '1.05rem' : '1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Inteligência agronômica
        </h2>
        <p style={{ margin: '0.35rem 0 0', fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
          Diagnóstico sintético, confiança e leitura econômica — apoio à decisão (v1 heurística).
        </p>
      </div>

      <div style={{ padding: '1rem 1.25rem 1.25rem', display: 'grid', gap: '0.85rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'stretch' }}>
          {data.score != null && (
            <div
              style={{
                minWidth: 88,
                borderRadius: 12,
                background: 'rgba(255,255,255,0.1)',
                padding: '0.5rem 0.75rem',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 10, opacity: 0.75, fontWeight: 700, letterSpacing: '0.06em' }}>SCORE</div>
              <div style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1 }}>{data.score}</div>
              <div style={{ fontSize: 10, opacity: 0.65 }}>0–100</div>
            </div>
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            <span style={badgeStyle('sit', sitLabel)}>{sitLabel}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={badgeStyle('risco', riscoLabel)}>Risco: {riscoLabel}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={badgeStyle('tend', tendLabel)}>Tendência: {tendLabel}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span style={badgeStyle('conf', data.confianca ?? '')}>
              Confiança: {(data.confianca ?? '—').toString().toUpperCase()}
              {data.confianca_score != null ? ` (${data.confianca_score})` : ''}
            </span>
          </div>
        </div>

        <IntelTemporalBlock relatorio={relatorio} />

        {data.resumo && (
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, opacity: 0.95, fontWeight: 500 }}>{data.resumo}</p>
        )}

        {data.recomendacao && (data.recomendacao.acao || data.recomendacao.prazo) && (
          <div
            style={{
              background: 'rgba(255,255,255,0.07)',
              borderRadius: 10,
              padding: '0.65rem 0.9rem',
              fontSize: 13,
              borderLeft: '3px solid rgba(52,211,153,0.7)',
            }}
          >
            <strong style={{ display: 'block', marginBottom: 4, fontSize: 11, opacity: 0.85 }}>Recomendação</strong>
            <span>
              {labelRecomendacaoAcao(data.recomendacao.acao)}
              {data.recomendacao.prazo ? ` · prazo: ${data.recomendacao.prazo}` : ''}
            </span>
          </div>
        )}

        {data.evolucao && (
          <div
            style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: 10,
              padding: '0.75rem 1rem',
              fontSize: 13,
            }}
          >
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, opacity: 0.9 }}>Evolução (indicativo)</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'baseline' }}>
              <span>
                Última referência: <strong>{data.evolucao.anterior_pct ?? '—'}%</strong>
              </span>
              <span>→</span>
              <span>
                Atual: <strong>{data.evolucao.atual_pct ?? '—'}%</strong>
              </span>
              {data.evolucao.delta_pct && (
                <span style={{ color: '#86efac', fontWeight: 700 }}>Δ {data.evolucao.delta_pct}</span>
              )}
            </div>
          </div>
        )}

        {data.padrao && data.padrao.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12, opacity: 0.9 }}>Padrão identificado</div>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: 13, lineHeight: 1.5, opacity: 0.95 }}>
              {data.padrao.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
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
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
              <div style={{ fontSize: 11, opacity: 0.75 }}>Impacto (est. sc/ha)</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{perdaSc ?? '—'} sc/ha</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.65rem 0.85rem' }}>
              <div style={{ fontSize: 11, opacity: 0.75 }}>ROI estimado</div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{roiVal ?? '—'}×</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
