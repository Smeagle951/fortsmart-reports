'use client';

import React from 'react';
import { labelCausa } from '@/lib/visita-tecnica/label-utils';
import { labelUrgenciaPraga, severidadeParaBarraPct } from '@/lib/visita-tecnica/buildVtDecisionNarrative';
import dp from './decision-premium.module.css';

function barColor(pct: number, p: Record<string, unknown>): string {
  const s = String(p.severidade ?? '').toLowerCase();
  if (s.includes('alt') || s.includes('crit') || pct >= 70) return '#dc2626';
  if (s.includes('med') || pct >= 40) return '#ca8a04';
  return '#16a34a';
}

export default function VtPragasBarras({ pragas }: { pragas: Record<string, unknown>[] }) {
  if (pragas.length === 0) return null;

  return (
    <section className={dp.sectionPremium} aria-label="Pragas e daninhas — severidade visual">
      <h2 className={dp.sectionTitle}>Pressão fitossanitária</h2>
      <p style={{ margin: '-0.35rem 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45, fontWeight: 600 }}>
        Severidade visual primeiro; tabela técnica abaixo para rastreio.
      </p>
      <p style={{ margin: '0 0 1rem', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.45 }}>
        Barras indicam pressão relativa (incidência % quando informada; caso contrário, severidade declarada).
      </p>
      <div className={dp.pragasGrid}>
        {pragas.map((p, i) => {
          const nome = String(p.alvo ?? p.nome ?? 'Alvo').trim();
          const tipo = String(p.tipo ?? '').trim();
          const pct = severidadeParaBarraPct(p);
          const fill = barColor(pct, p);
          const inc = p.incidencia != null ? String(p.incidencia) : '—';
          const sev = p.severidade != null ? String(p.severidade) : '—';
          const causa =
            p.causaProvavel != null && String(p.causaProvavel).trim() !== '' ? labelCausa(p.causaProvavel) : null;
          return (
            <div key={i} className={dp.pragaCard}>
              <p className={dp.pragaNome}>{nome}</p>
              <p className={dp.pragaMeta}>
                {[tipo, `Incidência: ${inc}`, `Severidade: ${sev}`].filter((x) => x && !x.endsWith('—')).join(' · ')}
              </p>
              {causa ? <p className={dp.pragaMeta}>Causa: {causa}</p> : null}
              <div className={dp.barTrack}>
                <div className={dp.barFill} style={{ width: `${pct}%`, background: fill }} />
              </div>
              <p className={dp.pragaFoot} style={{ color: fill }}>
                {labelUrgenciaPraga(p)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
