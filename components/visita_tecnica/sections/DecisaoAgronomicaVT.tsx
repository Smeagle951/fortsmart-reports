'use client';

import React, { useMemo } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Target } from 'lucide-react';
import {
  computeDecisaoVisita,
  type DecisaoTone,
  type VisitaTecnicaDecisaoInput,
} from '@/lib/visita-tecnica/computeDecisaoVisita';
import deck from '../visita-tecnica-deck.module.css';

const toneAccent: Record<DecisaoTone, string> = {
  bom: '#166534',
  medio: '#a16207',
  atencao: '#c2410c',
  critico: '#b91c1c',
  neutro: '#78716c',
};

const alertaIcon = {
  critico: { Icon: AlertCircle, color: '#b91c1c' },
  atencao: { Icon: AlertTriangle, color: '#c2410c' },
  ok: { Icon: CheckCircle2, color: '#166534' },
} as const;

interface DecisaoAgronomicaVTProps {
  input: VisitaTecnicaDecisaoInput;
}

export default function DecisaoAgronomicaVT({ input }: DecisaoAgronomicaVTProps) {
  const d = useMemo(() => computeDecisaoVisita(input), [input]);

  return (
    <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
      <div className={deck.reportCardHead}>
        <span className={deck.reportCardIcon} aria-hidden>
          <Target size={18} strokeWidth={2.25} />
        </span>
        <div style={{ minWidth: 0 }}>
          <span className={deck.reportCardKicker}>Síntese FortSmart</span>
          <h2 className={deck.reportCardTitle}>Decisão agronômica</h2>
        </div>
      </div>

      <div className={deck.reportCardBody}>
        <div className={deck.indexHero}>
          <div>
            <div className={deck.indexHeroLabel}>Índice orientativo da visita</div>
            <div className={deck.indexHeroScoreRow}>
              <span className={deck.indexHeroScore}>{d.indiceFortSmart}</span>
              <span className={deck.indexHeroMax}>/ 100</span>
            </div>
            <p className={deck.indexHeroSummary}>{d.resumoLinha}</p>
          </div>
          <div className={deck.indexHeroAside}>
            Índice calculado a partir dos dados desta visita (ocorrências, diagnóstico, estande, fenologia e
            condições). Não substitui avaliação presencial nem recomendações legais de defensivos.
          </div>
        </div>

        <div className={deck.editorialSubhead} style={{ marginTop: '0.15rem' }}>
          Alertas automáticos
        </div>
        <div className={deck.alertList}>
          {d.alertas.map((a, i) => {
            const { Icon, color } = alertaIcon[a.nivel];
            return (
              <div key={i} className={deck.alertItem}>
                <span className={deck.alertItemIcon} style={{ color }} aria-hidden>
                  <Icon size={18} strokeWidth={2.25} />
                </span>
                <span>{a.texto}</span>
              </div>
            );
          })}
        </div>

        <div className={deck.editorialSubhead} style={{ marginTop: '1.1rem' }}>
          Indicadores por dimensão
        </div>
        <div className={deck.dimGrid}>
          {d.dimensoes.map((dim) => (
            <div
              key={dim.id}
              className={deck.dimTile}
              style={{ ['--vt-dim-accent' as string]: toneAccent[dim.tone] }}
            >
              <div className={deck.dimTileLabel}>{dim.label}</div>
              <div className={deck.dimTileStatus}>{dim.status}</div>
              <div className={deck.dimTileDetail}>{dim.detalhe}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
