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

function severityRank(p: Record<string, unknown>): number {
  const s = String(p.severidade ?? p.situacao ?? '').toLowerCase();
  const pct = severidadeParaBarraPct(p);
  if (s.includes('crit') || s.includes('alt') || pct >= 70) return 3;
  if (s.includes('med') || s.includes('acima') || pct >= 40) return 2;
  if (pct >= 20) return 1;
  return 0;
}

function severityLabel(rank: number): string {
  if (rank >= 3) return 'alta';
  if (rank === 2) return 'media';
  if (rank === 1) return 'baixa a moderada';
  return 'baixa';
}

export default function VtPragasBarras({ pragas }: { pragas: Record<string, unknown>[] }) {
  if (pragas.length === 0) return null;
  const dominante = [...pragas].sort((a, b) => severityRank(b) - severityRank(a))[0];
  const dominanteNome = String(dominante?.alvo ?? dominante?.nome ?? 'alvo principal').trim();
  const dominanteRank = severityRank(dominante ?? {});

  return (
    <section className={dp.sectionPremium} aria-label="Pragas e daninhas — severidade visual">
      <h2 className={dp.sectionTitle}>Pressão fitossanitária</h2>
      <div className={dp.pestSummary}>
        Pressao dominante: {dominanteNome} ({severityLabel(dominanteRank)}) com tendencia de crescimento se nao houver manejo.
      </div>
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
