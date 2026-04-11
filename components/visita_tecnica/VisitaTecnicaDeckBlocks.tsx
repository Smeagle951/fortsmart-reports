'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Check, Minus } from 'lucide-react';
import styles from './visita-tecnica-deck.module.css';

export function VtDeckSlide({
  kicker,
  title,
  children,
  icon: Icon,
  variant = 'default',
  spanFull = false,
}: {
  kicker?: string;
  title: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'default' | 'warning';
  spanFull?: boolean;
}) {
  return (
    <section
      className={[
        styles.reportCard,
        variant === 'warning' ? styles.reportCardWarning : '',
        spanFull ? styles.cardSpanFull : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          styles.reportCardHead,
          variant === 'warning' ? styles.reportCardHeadWarning : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {Icon ? (
          <span
            className={[
              styles.reportCardIcon,
              variant === 'warning' ? styles.reportCardIconWarning : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-hidden
          >
            <Icon size={18} strokeWidth={2.25} />
          </span>
        ) : null}
        <div style={{ minWidth: 0 }}>
          {kicker ? <span className={styles.reportCardKicker}>{kicker}</span> : null}
          <h2 className={styles.reportCardTitle}>{title}</h2>
        </div>
      </div>
      <div className={styles.reportCardBody}>{children}</div>
    </section>
  );
}

function fmt(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function checklistTone(v: unknown): 'sim' | 'nao' | 'outro' {
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (s.startsWith('sim') || s === 's' || s === 'yes') return 'sim';
  if (s.startsWith('não') || s.startsWith('nao') || s === 'n' || s === 'no') return 'nao';
  if (s.includes('n/a') || s.includes('na ') || s === '—') return 'outro';
  return 'outro';
}

export function VtChecklistBlock({ checklist }: { checklist: Record<string, unknown> | undefined }) {
  if (checklist == null || typeof checklist !== 'object') {
    return <p className={styles.emptyHint}>Checklist não registrado para esta visita.</p>;
  }
  const entries = Object.entries(checklist).filter(
    ([k, v]) => k !== 'observacoes' && v != null && String(v).trim() !== '',
  );
  const obs = checklist.observacoes != null ? String(checklist.observacoes).trim() : '';
  if (entries.length === 0 && !obs) {
    return <p className={styles.emptyHint}>Itens do checklist em branco.</p>;
  }
  return (
    <>
      {entries.length > 0 ? (
        <div className={styles.checklistGrid}>
          {entries.map(([k, v]) => {
            const tone = checklistTone(v);
            return (
              <div key={k} className={styles.checklistItem}>
                <span>{k}</span>
                <span className={styles.checkOk}>
                  {tone === 'sim' ? (
                    <>
                      <Check size={16} strokeWidth={2.5} aria-hidden />
                      Sim
                    </>
                  ) : tone === 'nao' ? (
                    <>
                      <Minus size={16} strokeWidth={2.5} aria-hidden />
                      Não
                    </>
                  ) : (
                    <span style={{ color: '#78716c', fontWeight: 700 }}>{fmt(v)}</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
      {obs ? (
        <div style={{ marginTop: entries.length ? 16 : 0 }}>
          <div className={styles.fieldLabel}>Observações</div>
          <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.55, color: '#44403c' }}>{obs}</p>
        </div>
      ) : null}
    </>
  );
}

export function VtDesviosBlock({ desvios }: { desvios: Record<string, unknown>[] }) {
  if (desvios.length === 0) {
    return <p className={styles.emptyHint}>Nenhum desvio / não conformidade registrado nesta visita.</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Severidade</th>
            <th>Status</th>
            <th>Causa provável</th>
          </tr>
        </thead>
        <tbody>
          {desvios.map((d, i) => (
            <tr key={i}>
              <td>{fmt(d.data)}</td>
              <td>
                <span className={styles.badge}>{fmt(d.tipo)}</span>
              </td>
              <td>{fmt(d.descricao)}</td>
              <td>{fmt(d.severidade)}</td>
              <td>{fmt(d.status)}</td>
              <td>{fmt(d.causaProvavel)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function VtPontosGeorefTable({ pontos }: { pontos: Record<string, unknown>[] }) {
  const rows = pontos.filter((p) => {
    const lat = (p.latitude ?? p.lat) as number | undefined;
    const lng = (p.longitude ?? p.lng) as number | undefined;
    return lat != null && lng != null && !Number.isNaN(Number(lat)) && !Number.isNaN(Number(lng));
  });
  if (rows.length === 0) {
    return <p className={styles.emptyHint}>Sem pontos com latitude/longitude para listar.</p>;
  }
  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Tipo</th>
            <th>Título</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const lat = Number(p.latitude ?? p.lat);
            const lng = Number(p.longitude ?? p.lng);
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{lat.toFixed(6)}</td>
                <td>{lng.toFixed(6)}</td>
                <td>{fmt(p.tipo)}</td>
                <td>{fmt(p.titulo)}</td>
                <td>{fmt(p.data)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const COND_LABELS: Record<string, string> = {
  temperatura: 'Temperatura (°C)',
  umidade: 'Umidade relativa (%)',
  vento: 'Vento',
  nebulosidade: 'Nebulosidade',
  soloUmidade: 'Solo / umidade',
  palhada: 'Palhada',
  compactacao: 'Compactação',
  vigorCultura: 'Vigor da cultura',
  uniformidade: 'Uniformidade',
  sintomas: 'Sintomas observados',
};

const AMOST_LABELS: Record<string, string> = {
  metodo: 'Método de amostragem',
  nPlantasAvaliadas: 'Nº plantas avaliadas',
  nPontosColetados: 'Nº pontos coletados',
  raioAmostraM: 'Raio da amostra (m)',
};

export function VtCondicoesMomentBlock({
  condicoes,
  amostragem,
}: {
  condicoes: Record<string, unknown>;
  amostragem: Record<string, unknown> | undefined;
}) {
  const condPairs = Object.entries(condicoes).filter(
    ([k, v]) => k !== 'amostragem' && v != null && String(v).trim() !== '',
  );
  const amo = amostragem ?? {};
  const amoPairs = Object.entries(amo).filter(([, v]) => v != null && String(v).trim() !== '');
  if (condPairs.length === 0 && amoPairs.length === 0) {
    return (
      <p className={styles.emptyHint}>
        Condições de campo não registadas nesta sessão. Preencha no app (visita técnica → condições) para aparecerem aqui.
      </p>
    );
  }
  return (
    <>
      {condPairs.length > 0 ? (
        <div className={styles.grid2} style={{ marginBottom: amoPairs.length ? 20 : 0 }}>
          {condPairs.map(([k, v]) => (
            <div key={k}>
              <div className={styles.fieldLabel}>{COND_LABELS[k] ?? k}</div>
              <div className={styles.fieldValue}>{fmt(v)}</div>
            </div>
          ))}
        </div>
      ) : null}
      {amoPairs.length > 0 ? (
        <>
          <div className={styles.reportCardKicker} style={{ marginBottom: 8 }}>
            Amostragem no campo
          </div>
          <div className={styles.grid2}>
            {amoPairs.map(([k, v]) => (
              <div key={k}>
                <div className={styles.fieldLabel}>{AMOST_LABELS[k] ?? k}</div>
                <div className={styles.fieldValue}>{fmt(v)}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
  );
}
