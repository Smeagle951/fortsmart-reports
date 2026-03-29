'use client';

import React, { useMemo } from 'react';
import {
  computeDecisaoVisita,
  type DecisaoTone,
  type VisitaTecnicaDecisaoInput,
} from '@/lib/visita-tecnica/computeDecisaoVisita';

const toneBorder: Record<DecisaoTone, string> = {
  bom: '#22c55e',
  medio: '#eab308',
  atencao: '#f97316',
  critico: '#ef4444',
  neutro: '#94a3b8',
};

const toneBg: Record<DecisaoTone, string> = {
  bom: '#f0fdf4',
  medio: '#fefce8',
  atencao: '#fff7ed',
  critico: '#fef2f2',
  neutro: '#f8fafc',
};

const alertaStyle = {
  critico: { bg: '#fef2f2', border: '#fecaca', icon: '🔴' },
  atencao: { bg: '#fffbeb', border: '#fde68a', icon: '🟡' },
  ok: { bg: '#ecfdf5', border: '#a7f3d0', icon: '🟢' },
} as const;

interface DecisaoAgronomicaVTProps {
  input: VisitaTecnicaDecisaoInput;
}

export default function DecisaoAgronomicaVT({ input }: DecisaoAgronomicaVTProps) {
  const d = useMemo(() => computeDecisaoVisita(input), [input]);

  return (
    <section
      className="section-block relatorio-editorial no-break-inside"
      style={{ marginBottom: 24 }}
    >
      <div className="section-block__title">Decisão agronômica (visita)</div>
      <div className="section-block__body" style={{ padding: 0 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 0,
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            background: '#fff',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #14532d 0%, #166534 45%, #15803d 100%)',
              color: '#fff',
              padding: '24px 22px',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  opacity: 0.9,
                  marginBottom: 8,
                }}
              >
                ÍNDICE FORTSMART
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>{d.indiceFortSmart}</span>
                <span style={{ fontSize: 20, fontWeight: 600, opacity: 0.9 }}>/ 100</span>
              </div>
              <p style={{ margin: '12px 0 0', fontSize: 14, lineHeight: 1.45, opacity: 0.95, maxWidth: 520 }}>
                {d.resumoLinha}
              </p>
            </div>
            <div
              style={{
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 10,
                padding: '14px 18px',
                fontSize: 12,
                lineHeight: 1.5,
                maxWidth: 320,
              }}
            >
              Índice orientativo calculado a partir dos dados desta visita (ocorrências, diagnóstico,
              estande, fenologia e condições de campo). Não substitui avaliação presencial nem
              recomendações legais de produtos.
            </div>
          </div>

          <div style={{ padding: '18px 20px 8px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>
              Alertas automáticos
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {d.alertas.map((a, i) => {
                const st = alertaStyle[a.nivel];
                return (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      gap: 10,
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: st.bg,
                      border: `1px solid ${st.border}`,
                      fontSize: 13,
                      color: '#334155',
                      lineHeight: 1.5,
                    }}
                  >
                    <span style={{ flexShrink: 0 }} aria-hidden>
                      {st.icon}
                    </span>
                    <span>{a.texto}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ padding: '8px 20px 22px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12 }}>
              Indicadores por dimensão
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 12,
              }}
            >
              {d.dimensoes.map((dim) => (
                <div
                  key={dim.id}
                  style={{
                    borderRadius: 10,
                    border: `2px solid ${toneBorder[dim.tone]}`,
                    background: toneBg[dim.tone],
                    padding: '14px 12px',
                    minHeight: 108,
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>
                    {dim.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>
                    {dim.status}
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>{dim.detalhe}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
