import React, { useMemo } from 'react';
import { Bug } from 'lucide-react';
import { labelCausa } from '@/lib/visita-tecnica/label-utils';
import deck from '../visita-tecnica-deck.module.css';

interface OcorrenciasPragasVTProps {
  pragas: Record<string, unknown>[];
  /** Só o corpo da tabela (para usar dentro de `VtDeckSlide`). */
  embedded?: boolean;
}

export default function OcorrenciasPragasVT({ pragas, embedded }: OcorrenciasPragasVTProps) {
  const flags = useMemo(() => {
    let causa = false;
    let desfolha = false;
    let area = false;
    let impacto = false;
    let reco = false;
    for (const p of pragas) {
      if (p.causaProvavel != null && String(p.causaProvavel).trim() !== '') causa = true;
      if (p.pctDesfolha != null) desfolha = true;
      if (p.pctAreaAfetada != null) area = true;
      if (p.impactoVisual != null && String(p.impactoVisual).trim() !== '') impacto = true;
      if (p.recomendacao != null && String(p.recomendacao).trim() !== '') reco = true;
    }
    return { causa, desfolha, area, impacto, reco };
  }, [pragas]);

  if (pragas.length === 0) return null;

  const table = (
    <div className={deck.tableWrap}>
      <table
        className={deck.table}
        style={{ minWidth: flags.causa || flags.desfolha || flags.area || flags.impacto ? 920 : 600 }}
      >
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Alvo</th>
            <th>Incidência</th>
            <th>Severidade</th>
            <th>Situação</th>
            {flags.causa && <th>Causa provável</th>}
            {flags.desfolha && <th>% desfolha</th>}
            {flags.area && <th>% área afet.</th>}
            {flags.impacto && <th>Impacto visual</th>}
            {flags.reco && <th>Recomendação</th>}
          </tr>
        </thead>
        <tbody>
          {pragas.map((p, i) => {
            const isCritical =
              String(p.severidade || '').toLowerCase().includes('alta') ||
              String(p.situacao || '').toLowerCase().includes('acima');
            return (
              <tr key={i} className={isCritical ? deck.tableRowAlert : undefined}>
                <td>
                  <span className={isCritical ? deck.typePillUrgent : deck.typePill}>{String(p.tipo ?? '—')}</span>
                </td>
                <td style={{ fontWeight: 800 }}>
                  {String(p.alvo ?? p.nome ?? '—')}
                  {Boolean(p.observacoes) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--vt-muted)', marginTop: 4, fontWeight: 600 }}>
                      {String(p.observacoes)}
                    </div>
                  )}
                  {Boolean(p.causaProvavelNota) && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--vt-muted)', marginTop: 4, fontWeight: 600 }}>
                      Nota causa: {String(p.causaProvavelNota)}
                    </div>
                  )}
                </td>
                <td style={{ fontWeight: 700 }}>{String(p.incidencia ?? '—')}</td>
                <td style={{ fontWeight: 800, color: isCritical ? '#b91c1c' : 'var(--vt-muted)' }}>
                  {String(p.severidade ?? '—')}
                </td>
                <td style={{ fontWeight: 700 }}>{String(p.situacao ?? '—')}</td>
                {flags.causa && (
                  <td style={{ fontSize: '0.8rem' }}>
                    {p.causaProvavel != null && String(p.causaProvavel).trim() !== '' ? labelCausa(p.causaProvavel) : '—'}
                  </td>
                )}
                {flags.desfolha && (
                  <td>
                    {p.pctDesfolha != null
                      ? `${Number(p.pctDesfolha).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                      : '—'}
                  </td>
                )}
                {flags.area && (
                  <td>
                    {p.pctAreaAfetada != null
                      ? `${Number(p.pctAreaAfetada).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`
                      : '—'}
                  </td>
                )}
                {flags.impacto && <td style={{ fontSize: '0.8rem' }}>{p.impactoVisual != null ? String(p.impactoVisual) : '—'}</td>}
                {flags.reco && (
                  <td style={{ fontSize: '0.8rem', maxWidth: 220 }}>{p.recomendacao != null ? String(p.recomendacao) : '—'}</td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (embedded) {
    return table;
  }

  return (
    <section className={`${deck.reportCard} ${deck.noBreakInside} pdf-keep-together`}>
      <div className={deck.reportCardHead}>
        <span className={deck.reportCardIcon} aria-hidden>
          <Bug size={18} strokeWidth={2.25} />
        </span>
        <div style={{ minWidth: 0 }}>
          <span className={deck.reportCardKicker}>Fitossanidade</span>
          <h2 className={deck.reportCardTitle}>Pragas, doenças e daninhas</h2>
        </div>
      </div>
      <div className={deck.reportCardBody}>{table}</div>
    </section>
  );
}
