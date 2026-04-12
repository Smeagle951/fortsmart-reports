'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import {
  AlertTriangle,
  Bug,
  ClipboardCheck,
  CloudSun,
  Droplets,
  FileText,
  Image as ImageIcon,
  Sprout,
} from 'lucide-react';
import type { PayloadVisitaTecnica, VisitaSnapshotCanonico } from '@/types/payload-visita-tecnica';
import { calcularScoreVisitaTecnica } from '@/lib/visita-tecnica/vtSideBySideScore';
import { formatDate } from '@/utils/format';
import { ExpandableReportCard } from './ExpandableReportCard';
import styles from './relatorio-side-by-side.module.css';

function fmt(v: unknown): string {
  if (v == null || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  if (v != null && typeof v === 'object' && !Array.isArray(v)) return v as Record<string, unknown>;
  return undefined;
}

function asObjArray(v: unknown): Record<string, unknown>[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is Record<string, unknown> => x != null && typeof x === 'object' && !Array.isArray(x));
}

function isHttpUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function formatSnapDate(value: unknown, fallback?: string): string {
  if (value != null && String(value).trim() !== '') {
    const s = String(value);
    return formatDate(s) || s;
  }
  return fallback ?? '';
}

function severidadeTone(raw: unknown): 'baixa' | 'media' | 'alta' | 'neutra' {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('alt') || s.includes('sever') || s.includes('high') || s.includes('crít') || s.includes('crit'))
    return 'alta';
  if (s.includes('méd') || s.includes('med') || s.includes('média') || s.includes('media') || s.includes('moder'))
    return 'media';
  if (s.includes('baix') || s.includes('low') || s.includes('leve')) return 'baixa';
  return 'neutra';
}

function severidadeClass(tone: ReturnType<typeof severidadeTone>): string {
  switch (tone) {
    case 'baixa':
      return styles.sevBaixa;
    case 'media':
      return styles.sevMedia;
    case 'alta':
      return styles.sevAlta;
    default:
      return styles.sevNeutra;
  }
}

function impactoTone(raw: unknown): 'alto' | 'medio' | 'baixo' | 'neutro' {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('alt') || s.includes('high') || s.includes('crít') || s.includes('crit')) return 'alto';
  if (s.includes('méd') || s.includes('med') || s.includes('moder')) return 'medio';
  if (s.includes('baix') || s.includes('low') || s.includes('leve')) return 'baixo';
  return 'neutro';
}

function prioridadeTone(raw: unknown): 'alta' | 'media' | 'baixa' | 'neutra' {
  const s = String(raw ?? '').toLowerCase();
  if (s.includes('alt') || s.includes('urg') || s.includes('1') || s.includes('crít')) return 'alta';
  if (s.includes('méd') || s.includes('med') || s.includes('2')) return 'media';
  if (s.includes('baix') || s.includes('3')) return 'baixa';
  return 'neutra';
}

/** Rank numérico: maior = pior (fitossanidade). */
function sevRank(raw: unknown): number {
  const t = severidadeTone(raw);
  if (t === 'alta') return 3;
  if (t === 'media') return 2;
  if (t === 'baixa') return 1;
  return 0;
}

function countPragaSeveridades(rows: Record<string, unknown>[]): { alta: number; media: number; baixa: number } {
  let alta = 0;
  let media = 0;
  let baixa = 0;
  for (const r of rows) {
    const t = severidadeTone(r.severidade);
    if (t === 'alta') alta += 1;
    else if (t === 'media') media += 1;
    else if (t === 'baixa') baixa += 1;
  }
  return { alta, media, baixa };
}

function pragaNomeKey(row: Record<string, unknown>): string {
  return String(row.nome ?? row.alvo ?? '').trim().toLowerCase();
}

function countDesviosAlto(rows: Record<string, unknown>[]): number {
  return rows.filter((d) => impactoTone(d.impacto) === 'alto').length;
}

function countPlanoCriticas(rows: Record<string, unknown>[]): number {
  return rows.filter((a) => prioridadeTone(a.prioridade) === 'alta').length;
}

type DeltaKind = 'improved' | 'worsened' | 'neutral';

function deltaSeveridade(beforeRank: number, afterRank: number): DeltaKind {
  if (afterRank < beforeRank) return 'improved';
  if (afterRank > beforeRank) return 'worsened';
  return 'neutral';
}

function buildRecomendacaoLines(input: {
  score: number;
  melhora: boolean | null;
  variacao: number;
  desviosAltos: number;
  pragasAltas: number;
  pragasHint?: 'up' | 'down' | 'same';
}): string[] {
  const lines: string[] = [];
  const { score, melhora, variacao, desviosAltos, pragasAltas, pragasHint } = input;

  if (score < 60) {
    lines.push('⚠ Intervir: índice técnico baixo — rever manejo e priorizar correções.');
  } else if (desviosAltos >= 2) {
    lines.push('⚠ Corrigir manejo: múltiplos desvios de impacto alto.');
  } else if (desviosAltos >= 1) {
    lines.push('⚠ Corrigir manejo nos pontos de desvio crítico registrados.');
  } else if (score > 75 && melhora === true) {
    lines.push('✔ Manter manejo atual — cenário favorável e em melhora.');
  } else if (score > 75 && melhora !== false) {
    lines.push('✔ Manter manejo e acompanhar evolução na próxima visita.');
  } else if (score >= 60 && score <= 75) {
    lines.push('✔ Ajustar pontos do plano de ação e reforçar monitoramento.');
  } else {
    lines.push('✔ Manter rotina com monitoramento reforçado.');
  }

  if (pragasAltas > 0 || pragasHint === 'down') {
    lines.push('⚠ Monitorar pragas e doenças (incl. secundárias e rebotes).');
  }
  if (variacao < -5 && melhora === false) {
    lines.push('⚠ Atenção: queda relevante no índice — validar prescrições em campo.');
  }

  return lines.slice(0, 4);
}

function execSummaryPragas(
  pragas: Record<string, unknown>[],
  hint?: 'up' | 'down' | 'same',
): React.ReactNode {
  const c = countPragaSeveridades(pragas);
  const trend =
    hint === 'up' ? 'tendência ↓' : hint === 'down' ? 'tendência ↑' : 'pressão estável';
  const parts = [
    `${pragas.length} ocorr.`,
    c.alta > 0 ? `${c.alta} alta` : null,
    c.media > 0 ? `${c.media} média` : null,
    c.baixa > 0 ? `${c.baixa} baixa` : null,
    trend,
  ].filter(Boolean);
  return <span className={styles.summaryExec}>{parts.join(' · ')}</span>;
}

function execSummaryPlano(plano: Record<string, unknown>[]): React.ReactNode {
  const crit = countPlanoCriticas(plano);
  return (
    <span className={styles.summaryExec}>
      {plano.length} ação(ões){crit > 0 ? ` · ${crit} crítica(s)` : ''}
    </span>
  );
}

function execSummaryDesvios(desvios: Record<string, unknown>[]): React.ReactNode {
  const hi = countDesviosAlto(desvios);
  const rest = desvios.length - hi;
  return (
    <span className={styles.summaryExec}>
      {desvios.length} desvio(s)
      {hi > 0 ? ` · ${hi} impacto alto` : ''}
      {rest > 0 && hi > 0 ? ` · ${rest} moderado(s)/baixo(s)` : ''}
    </span>
  );
}

function execSummaryAplic(aplic: Record<string, unknown>[]): React.ReactNode {
  return <span className={styles.summaryExec}>{aplic.length} registo(s) no snapshot</span>;
}

type PhotoItem = { url: string; descricao: string; sub: string };

function collectPhotoItems(
  snap: Record<string, unknown>,
  imagensRaiz: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>,
): PhotoItem[] {
  const pontos = asObjArray(snap.pontos_georreferenciados);
  const fromPontos = pontos
    .map((p) => {
      const u = typeof p.imagem === 'string' ? p.imagem.trim() : '';
      if (!isHttpUrl(u)) return null;
      return {
        url: u,
        descricao: fmt(p.descricao),
        sub: [p.latitude, p.longitude].filter((x) => x != null).join(', '),
      };
    })
    .filter(Boolean) as PhotoItem[];

  const fromRaiz = imagensRaiz
    .filter((im) => im.url && isHttpUrl(im.url!))
    .map((im) => ({
      url: im.url!,
      descricao: im.descricao ?? '',
      sub: im.categoria ?? im.data ?? '',
    }));

  return fromPontos.length > 0 ? fromPontos : fromRaiz;
}

function FotosCompareStrip({
  snapPrev,
  snapAtual,
  imagensRaiz,
  onPhotoClick,
}: {
  snapPrev: Record<string, unknown>;
  snapAtual: Record<string, unknown>;
  imagensRaiz: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  onPhotoClick?: (url: string) => void;
}) {
  const a = collectPhotoItems(snapPrev, imagensRaiz);
  const b = collectPhotoItems(snapAtual, imagensRaiz);
  const n = Math.min(4, a.length, b.length);
  if (n === 0) return null;

  return (
    <div className={styles.fotoCompareStrip}>
      <div className={styles.fotoCompareTitle}>Comparativo visual (amostra)</div>
      <div className={styles.fotoComparePairs}>
        {Array.from({ length: n }).map((_, i) => (
          <div key={`${a[i].url}-${b[i].url}-${i}`} className={styles.fotoComparePair}>
            <div className={styles.fotoCompareCell}>
              <span className={styles.fotoEtiquetaAntes}>ANTES</span>
              <button
                type="button"
                className={styles.photoThumb}
                onClick={() => onPhotoClick?.(a[i].url)}
                aria-label={a[i].descricao || 'Foto anterior'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a[i].url} alt="" />
              </button>
              <div className={styles.photoMeta}>{a[i].descricao || '—'}</div>
            </div>
            <div className={styles.fotoCompareArrow} aria-hidden>
              →
            </div>
            <div className={styles.fotoCompareCell}>
              <span className={styles.fotoEtiquetaAgora}>AGORA</span>
              <button
                type="button"
                className={styles.photoThumb}
                onClick={() => onPhotoClick?.(b[i].url)}
                aria-label={b[i].descricao || 'Foto atual'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={b[i].url} alt="" />
              </button>
              <div className={styles.photoMeta}>{b[i].descricao || '—'}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecomendacaoBlock({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null;
  return (
    <div className={styles.recomendacaoBox}>
      <div className={styles.recomendacaoTitle}>Recomendação</div>
      <ul className={styles.recomendacaoList}>
        {lines.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>
    </div>
  );
}

function EvoMiniStrip({
  pragasHint,
  desviosHint,
  prodDeltaPctLast,
  melhora,
}: {
  pragasHint?: 'up' | 'down' | 'same';
  desviosHint?: 'up' | 'down' | 'same';
  prodDeltaPctLast: number | null;
  melhora: boolean | null;
}) {
  const arrow = (h?: 'up' | 'down' | 'same') =>
    h === 'up' ? '↓' : h === 'down' ? '↑' : '=';
  const vigor =
    prodDeltaPctLast != null && !Number.isNaN(prodDeltaPctLast)
      ? prodDeltaPctLast > 0.5
        ? '↑'
        : prodDeltaPctLast < -0.5
          ? '↓'
          : '='
      : '=';
  const barPct =
    melhora === true ? 72 : melhora === false ? 32 : melhora === null ? 50 : 50;

  return (
    <div className={styles.evoMiniStrip}>
      <div className={styles.evoMiniGrid}>
        <div className={styles.evoMiniCell}>
          <span className={styles.evoMiniLabel}>Pragas</span>
          <span className={styles.evoMiniVal}>{arrow(pragasHint)}</span>
        </div>
        <div className={styles.evoMiniCell}>
          <span className={styles.evoMiniLabel}>Desvios</span>
          <span className={styles.evoMiniVal}>{arrow(desviosHint)}</span>
        </div>
        <div className={styles.evoMiniCell}>
          <span className={styles.evoMiniLabel}>Vigor / prod.</span>
          <span className={styles.evoMiniVal}>{vigor}</span>
        </div>
      </div>
      <div className={styles.evoBarTrack} aria-hidden>
        <div className={styles.evoBarFill} style={{ width: `${barPct}%` }} />
      </div>
      <p className={styles.evoBarCaption}>Leitura rápida da trajetória (orientativa)</p>
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 50;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className={styles.scoreGauge} aria-hidden>
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#16a34a"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className={styles.scoreGaugeValue}>
        <span className={styles.scoreNumber}>
          <CountUp end={score} duration={1.75} preserveValue />
        </span>
        <span className={styles.scoreMax}>de 100</span>
      </div>
    </div>
  );
}

function CondicoesBody({ snap }: { snap: Record<string, unknown> }) {
  const c = asRecord(snap.condicoes_momento) ?? {};
  return (
    <dl className={styles.kv}>
      <dt>Clima</dt>
      <dd>{fmt(c.clima)}</dd>
      <dt>Temperatura</dt>
      <dd>{fmt(c.temperatura)}</dd>
      <dt>Umidade</dt>
      <dd>{fmt(c.umidade)}</dd>
      <dt>Observações</dt>
      <dd>{fmt(c.observacoes)}</dd>
    </dl>
  );
}

function ContextoBody({ snap }: { snap: Record<string, unknown> }) {
  const c = asRecord(snap.contexto_safra) ?? {};
  return (
    <dl className={styles.kv}>
      <dt>Histórico climático</dt>
      <dd>{fmt(c.historico_climatico)}</dd>
      <dt>Manejo realizado</dt>
      <dd>{fmt(c.manejo_realizado)}</dd>
      <dt>Observações</dt>
      <dd>{fmt(c.observacoes)}</dd>
    </dl>
  );
}

function PragasRichList({
  rows,
  rowsPrev,
}: {
  rows: Record<string, unknown>[];
  rowsPrev?: Record<string, unknown>[] | null;
}) {
  if (rows.length === 0) return <p className={styles.expandBody}>Nenhum registro.</p>;

  const prevByNome = new Map<string, Record<string, unknown>>();
  if (rowsPrev != null) {
    for (const q of rowsPrev) {
      const k = pragaNomeKey(q);
      if (k) prevByNome.set(k, q);
    }
  }

  return (
    <ul className={styles.pragasList}>
      {rows.map((p, i) => {
        const sevRaw = p.severidade;
        const tone = severidadeTone(sevRaw);
        const label = String(sevRaw ?? '—').toUpperCase();
        const inc =
          p.incidencia != null && String(p.incidencia).trim() !== ''
            ? String(p.incidencia)
            : p.observacoes != null && String(p.observacoes).trim() !== ''
              ? String(p.observacoes)
              : '';
        const pk = pragaNomeKey(p);
        const prev = pk ? prevByNome.get(pk) : undefined;
        const rankPrev = prev != null ? sevRank(prev.severidade) : null;
        const rankCur = sevRank(sevRaw);
        let deltaRow: React.ReactNode = null;
        if (prev != null && rankPrev != null) {
          const d = deltaSeveridade(rankPrev, rankCur);
          const arrow = d === 'improved' ? '↓' : d === 'worsened' ? '↑' : '→';
          const rowClass =
            d === 'improved' ? styles.deltaImproved : d === 'worsened' ? styles.deltaWorsened : styles.deltaNeutral;
          const prevLabel = String(prev.severidade ?? '—').toUpperCase();
          deltaRow = (
            <div className={`${styles.pragaDeltaRow} ${rowClass}`}>
              <span>ANTES: {prevLabel}</span>
              <span className={styles.pragaDeltaArrow} aria-hidden>
                {' '}
                →{' '}
              </span>
              <span>AGORA: {label}</span>
              <span className={styles.pragaDeltaIcon} aria-hidden>
                {' '}
                {arrow}
              </span>
            </div>
          );
        }

        return (
          <li key={i} className={styles.pragaItem}>
            <div className={styles.pragaNome}>{fmt(p.nome)}</div>
            {deltaRow}
            <div className={styles.pragaMeta}>
              <span className={`${styles.sevBadge} ${severidadeClass(tone)}`}>{label}</span>
              <span>Tipo: {fmt(p.tipo)}</span>
              {inc ? <span>Incidência / notas: {inc}</span> : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DesvioLi({ d }: { d: Record<string, unknown> }) {
  const imp = impactoTone(d.impacto);
  const itemClass =
    imp === 'alto'
      ? `${styles.desvioItem} ${styles.desvioItemImpactoAlto}`
      : imp === 'baixo'
        ? `${styles.desvioItem} ${styles.desvioItemImpactoBaixo}`
        : styles.desvioItem;
  return (
    <li className={itemClass}>
      <div className={styles.desvioTitulo}>
        <AlertTriangle size={18} aria-hidden />
        {fmt(d.tipo)}
      </div>
      {d.descricao != null && String(d.descricao).trim() !== '' ? (
        <div className={styles.desvioDesc}>{fmt(d.descricao)}</div>
      ) : null}
      <div>
        <span
          className={`${styles.sevBadge} ${imp === 'alto' ? styles.sevAlta : imp === 'medio' ? styles.sevMedia : styles.sevBaixa}`}
        >
          Impacto: {fmt(d.impacto)}
        </span>
      </div>
    </li>
  );
}

function DesviosRichList({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Nenhum desvio registrado.</p>;
  const altos = rows.filter((d) => impactoTone(d.impacto) === 'alto');
  const outros = rows.filter((d) => impactoTone(d.impacto) !== 'alto');
  return (
    <div>
      {altos.length > 0 ? (
        <>
          <div className={styles.desvioSectionTitleCrit}>Impacto alto</div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {altos.map((d, i) => (
              <DesvioLi key={`a-${i}`} d={d} />
            ))}
          </ul>
        </>
      ) : null}
      {outros.length > 0 ? (
        <>
          <div
            className={`${styles.desvioSectionTitleMod} ${altos.length === 0 ? styles.desvioSectionModFirst : ''}`}
          >
            Moderados e baixos
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {outros.map((d, i) => (
              <DesvioLi key={`o-${i}`} d={d} />
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function AplicacoesTimeline({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Nenhuma aplicação no snapshot.</p>;
  return (
    <ul className={styles.aplicTimeline}>
      {rows.map((r, i) => {
        const dt = r.data != null && String(r.data).trim() !== '' ? String(r.data) : null;
        const prod = fmt(r.produto);
        const dose = r.dose != null && String(r.dose).trim() !== '' ? ` · ${fmt(r.dose)}` : '';
        const st = r.status != null && String(r.status).trim() !== '' ? ` (${fmt(r.status)})` : '';
        return (
          <li key={i}>
            {dt ? <span className={styles.aplicData}>{dt}</span> : null}
            <span>
              {prod}
              {dose}
              {st}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PlanoRichList({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Sem plano de ação no snapshot.</p>;
  return (
    <ul className={styles.planoList}>
      {rows.map((a, i) => {
        const p = prioridadeTone(a.prioridade);
        const pClass =
          p === 'alta' ? styles.prioAlta : p === 'media' ? styles.prioMedia : p === 'baixa' ? styles.prioBaixa : styles.pill;
        return (
          <li key={i} className={styles.planoItem}>
            <span className={styles.planoCheck} aria-hidden>
              ✓
            </span>
            <div className={styles.planoBody}>
              <div className={styles.planoAcaoTexto}>{fmt(a.acao)}</div>
              <div>
                <span className={`${styles.prioridadeBadge} ${pClass}`}>Prioridade: {fmt(a.prioridade)}</span>
                {a.prazo != null && String(a.prazo).trim() !== '' ? (
                  <span style={{ fontSize: '0.82rem', color: '#57534e' }}>Prazo: {fmt(a.prazo)}</span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DiagnosticoBody({ snap }: { snap: Record<string, unknown> }) {
  const d = asRecord(snap.diagnostico_final);
  if (!d || (!d.resumo && !d.risco)) {
    return <p style={{ color: '#78716c' }}>Diagnóstico não preenchido no snapshot.</p>;
  }
  return (
    <div>
      <p style={{ fontSize: '1rem', lineHeight: 1.5, margin: '0 0 10px' }}>{fmt(d.resumo)}</p>
      <p style={{ fontSize: '0.85rem', color: '#57534e' }}>
        Risco:{' '}
        <span className={`${styles.sevBadge} ${severidadeClass(severidadeTone(d.risco))}`}>{fmt(d.risco)}</span>
        {d.potencial_produtivo != null && String(d.potencial_produtivo).trim() !== '' ? (
          <>
            {' '}
            · Potencial: <strong>{fmt(d.potencial_produtivo)}</strong>
          </>
        ) : null}
      </p>
    </div>
  );
}

function FotosGrid({
  snap,
  imagensRaiz,
  onPhotoClick,
}: {
  snap: Record<string, unknown>;
  imagensRaiz: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  onPhotoClick?: (url: string) => void;
}) {
  const merged = collectPhotoItems(snap, imagensRaiz);
  const summary = `${merged.length} imagem(ns) com URL pública`;

  if (merged.length === 0) {
    return <p style={{ color: '#78716c' }}>Sem fotos com URL no relatório.</p>;
  }

  return (
    <>
      <p style={{ fontSize: '0.82rem', color: '#78716c', marginBottom: 10 }}>{summary}</p>
      <div className={styles.photoGrid}>
        {merged.slice(0, 12).map((ph, i) => (
          <div key={`${ph.url}-${i}`}>
            <button
              type="button"
              className={styles.photoThumb}
              onClick={() => onPhotoClick?.(ph.url)}
              aria-label={ph.descricao || 'Abrir imagem'}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ph.url} alt="" />
            </button>
            <div className={styles.photoMeta}>
              {ph.descricao}
              {ph.sub ? <div>{ph.sub}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function SnapshotColumn({
  snap,
  colTitle,
  imagensRaiz,
  onPhotoClick,
  compareHints,
  columnPrefix,
  openCardId,
  toggleCard,
  pragasRowsPrev,
}: {
  snap: Record<string, unknown>;
  colTitle: string;
  imagensRaiz: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  onPhotoClick?: (url: string) => void;
  compareHints?: { pragas?: 'up' | 'down' | 'same'; desvios?: 'up' | 'down' | 'same' };
  columnPrefix: string;
  openCardId: string | null;
  toggleCard: (id: string) => void;
  /** Snapshot anterior para delta por espécie (só coluna atual). */
  pragasRowsPrev?: Record<string, unknown>[] | null;
}) {
  const pragas = asObjArray(snap.pragas_doencas);
  const desvios = asObjArray(snap.desvios);
  const aplic = asObjArray(snap.aplicacoes_prescricoes);
  const plano = asObjArray(snap.plano_acao);

  const card = (id: string, props: React.ComponentProps<typeof ExpandableReportCard>) => (
    <ExpandableReportCard
      {...props}
      isOpen={openCardId === id}
      onToggle={() => toggleCard(id)}
    />
  );

  return (
    <div className={styles.columnStack}>
      <h3 className={styles.colTitle}>{colTitle}</h3>

      {card(`${columnPrefix}-condicoes`, {
        title: 'Condições do momento',
        icon: <CloudSun size={20} strokeWidth={2.25} aria-hidden />,
        summary: (
          <span className={styles.summaryExec}>Clima, temperatura e umidade no snapshot</span>
        ),
        children: <CondicoesBody snap={snap} />,
      })}

      {card(`${columnPrefix}-contexto`, {
        title: 'Contexto da safra',
        icon: <Sprout size={20} strokeWidth={2.25} aria-hidden />,
        summary: <span className={styles.summaryExec}>Manejo e notas de safra registrados</span>,
        children: <ContextoBody snap={snap} />,
      })}

      {card(`${columnPrefix}-pragas`, {
        title: 'Pragas e doenças',
        icon: <Bug size={20} strokeWidth={2.25} aria-hidden />,
        summary: execSummaryPragas(pragas, columnPrefix === 'atual' ? compareHints?.pragas : undefined),
        compareTone: compareHints?.pragas,
        children: (
          <PragasRichList
            rows={pragas}
            rowsPrev={columnPrefix === 'atual' ? pragasRowsPrev : undefined}
          />
        ),
      })}

      {card(`${columnPrefix}-desvios`, {
        title: 'Desvios',
        icon: <AlertTriangle size={20} strokeWidth={2.25} aria-hidden />,
        summary: execSummaryDesvios(desvios),
        compareTone: compareHints?.desvios,
        children: <DesviosRichList rows={desvios} />,
      })}

      {card(`${columnPrefix}-aplic`, {
        title: 'Aplicações e prescrições',
        icon: <Droplets size={20} strokeWidth={2.25} aria-hidden />,
        summary: (
          <>
            {execSummaryAplic(aplic)}
            <span className={styles.summaryMuted}> · somente leitura</span>
          </>
        ),
        children: <AplicacoesTimeline rows={aplic} />,
      })}

      {card(`${columnPrefix}-plano`, {
        title: 'Plano de ação',
        icon: <ClipboardCheck size={20} strokeWidth={2.25} aria-hidden />,
        summary: execSummaryPlano(plano),
        children: <PlanoRichList rows={plano} />,
      })}

      {card(`${columnPrefix}-fotos`, {
        title: 'Fotos e evidências',
        icon: <ImageIcon size={20} strokeWidth={2.25} aria-hidden />,
        summary: (
          <span className={styles.summaryExec}>
            {collectPhotoItems(snap, imagensRaiz).length} foto(s) com URL · galeria e pontos
          </span>
        ),
        children: <FotosGrid snap={snap} imagensRaiz={imagensRaiz} onPhotoClick={onPhotoClick} />,
      })}

      {card(`${columnPrefix}-diag`, {
        title: 'Diagnóstico final',
        icon: <FileText size={20} strokeWidth={2.25} aria-hidden />,
        summary: (
          <span className={styles.summaryExec}>
            Risco e conclusão técnica do snapshot
          </span>
        ),
        children: <DiagnosticoBody snap={snap} />,
      })}
    </div>
  );
}

function LimitedPreviousColumn({
  evoSnap,
  evoRoot,
  openCardId,
  toggleCard,
}: {
  evoSnap: Record<string, unknown> | undefined;
  evoRoot: Record<string, unknown> | undefined;
  openCardId: string | null;
  toggleCard: (id: string) => void;
}) {
  const comp = evoSnap ? asRecord(evoSnap.comparativo) : undefined;
  const melhora = comp?.melhora === true ? true : comp?.melhora === false ? false : null;
  const daeAnt = evoSnap?.dae_anterior;

  const card = (id: string, props: React.ComponentProps<typeof ExpandableReportCard>) => (
    <ExpandableReportCard
      {...props}
      isOpen={openCardId === id}
      onToggle={() => toggleCard(id)}
    />
  );

  return (
    <div className={styles.columnStack}>
      <h3 className={styles.colTitle}>Visita anterior (resumo)</h3>

      <div className={styles.fallbackBox}>
        <strong>Visita anterior sem dados completos no JSON.</strong>
        <br />
        Abaixo: informação disponível da cadeia de visitas e da evolução da safra.
      </div>

      {melhora != null ? (
        <div className={styles.badgeRow}>
          <span className={`${styles.badgeSm} ${melhora ? styles.badgeOk : styles.badgeRisk}`}>
            {melhora ? 'Melhora vs anterior' : 'Atenção vs anterior'}
          </span>
          {daeAnt != null ? (
            <span className={`${styles.badgeSm} ${styles.badgeNeutral}`}>DAE anterior: {fmt(daeAnt)}</span>
          ) : null}
        </div>
      ) : null}

      {comp?.resumo != null && String(comp.resumo).trim() !== '' ? (
        card('fb-comparativo', {
          title: 'Comparativo',
          icon: <FileText size={20} strokeWidth={2.25} aria-hidden />,
          defaultOpen: true,
          summary: null,
          children: (
            <>
              <p style={{ lineHeight: 1.55 }}>{fmt(comp.resumo)}</p>
              {Array.isArray(comp.variacoes) && (comp.variacoes as unknown[]).length > 0 ? (
                <table className={styles.tableMini} style={{ marginTop: 12 }}>
                  <thead>
                    <tr>
                      <th>Campo</th>
                      <th>Antes</th>
                      <th>Depois</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(comp.variacoes as Record<string, unknown>[]).map((v, i) => (
                      <tr key={i}>
                        <td>{fmt(v.campo)}</td>
                        <td>{fmt(v.antes)}</td>
                        <td>{fmt(v.depois)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
            </>
          ),
        })
      ) : null}

      {evoRoot && Array.isArray(evoRoot.visitas) && (evoRoot.visitas as unknown[]).length > 0 ? (
        card('fb-historico', {
          title: 'Histórico de visitas (meta)',
          icon: <ClipboardCheck size={20} strokeWidth={2.25} aria-hidden />,
          defaultOpen: true,
          summary: null,
          children: (
            <>
              <ul className={styles.evoList}>
                {(evoRoot.visitas as Record<string, unknown>[]).slice(-6).map((v, i) => (
                  <li key={i} style={{ paddingLeft: 0 }}>
                    {fmt(v.data ?? v.data_sessao ?? v.id)} — {fmt(v.resumo ?? v.nota ?? 'visita')}
                  </li>
                ))}
              </ul>
              {evoRoot.tendencia != null ? (
                <p style={{ marginTop: 10, fontWeight: 700, color: '#14532d' }}>
                  Tendência: {fmt(evoRoot.tendencia)}
                </p>
              ) : null}
            </>
          ),
        })
      ) : null}
    </div>
  );
}

function ConclusaoFinalSection({
  relatorio,
  snapRec,
}: {
  relatorio: PayloadVisitaTecnica;
  snapRec: Record<string, unknown>;
}) {
  const raw = relatorio.conclusao;
  const d = relatorio.diagnostico as Record<string, unknown> | undefined;
  const df = asRecord(snapRec.diagnostico_final);
  const texto =
    typeof raw === 'string' && raw.trim() !== ''
      ? raw.trim()
      : d?.resumo != null && String(d.resumo).trim() !== ''
        ? String(d.resumo)
        : df?.resumo != null && String(df.resumo).trim() !== ''
          ? String(df.resumo)
          : '';
  const risco = df?.risco ?? d?.risco;
  if (!texto && (risco == null || String(risco).trim() === '')) return null;

  return (
    <div className={styles.conclusaoBlock}>
      <h3 className={styles.conclusaoTitle}>Conclusão final</h3>
      {texto ? <p className={styles.conclusaoTexto}>{texto}</p> : null}
      {risco != null && String(risco).trim() !== '' ? (
        <p style={{ margin: 0, fontSize: '0.88rem', color: '#57534e' }}>
          Risco consolidado:{' '}
          <span className={`${styles.sevBadge} ${severidadeClass(severidadeTone(risco))}`}>{fmt(risco)}</span>
        </p>
      ) : null}
    </div>
  );
}

export type RelatorioSideBySideProps = {
  relatorio: PayloadVisitaTecnica;
  talhaoNome?: string;
  culturaNome?: string;
  dataRelatorio?: string;
  onPhotoClick?: (url: string) => void;
};

export default function RelatorioSideBySide({
  relatorio,
  talhaoNome,
  culturaNome,
  dataRelatorio,
  onPhotoClick,
}: RelatorioSideBySideProps) {
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [mobileVisitTab, setMobileVisitTab] = useState<'atual' | 'anterior'>('atual');
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const toggleCard = useCallback((id: string) => {
    setOpenCardId((prev) => (prev === id ? null : id));
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsNarrowViewport(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const snap = relatorio.visita_snapshot as VisitaSnapshotCanonico | undefined;
  const snapPrev = (relatorio as Record<string, unknown>).visita_snapshot_anterior as
    | VisitaSnapshotCanonico
    | undefined;
  const metricas = (relatorio as Record<string, unknown>).conclusao_metricas as
    | { score?: number; variacao?: number }
    | undefined;

  const evoRoot = asRecord((relatorio as Record<string, unknown>).evolucao);
  const evoSnap = snap != null && typeof snap === 'object' ? asRecord(snap.evolucao) : undefined;
  const comparativo = evoSnap ? asRecord(evoSnap.comparativo) : undefined;
  const melhora = comparativo?.melhora === true ? true : comparativo?.melhora === false ? false : null;

  const prodSeries = evoRoot?.produtividade_delta_pct;
  const prodLast =
    Array.isArray(prodSeries) && prodSeries.length > 0
      ? Number(prodSeries[prodSeries.length - 1])
      : null;

  const diagnostico = relatorio.diagnostico as Record<string, unknown> | undefined;

  const scoreResult = useMemo((): { score: number; variacao: number; oficial: boolean } => {
    if (metricas != null && typeof metricas.score === 'number' && !Number.isNaN(metricas.score)) {
      return {
        score: clampScore(metricas.score),
        variacao:
          typeof metricas.variacao === 'number' && !Number.isNaN(metricas.variacao)
            ? metricas.variacao
            : 0,
        oficial: true,
      };
    }
    const h = calcularScoreVisitaTecnica({
      snapshot: snap as Record<string, unknown> | undefined,
      diagnostico,
      comparativoMelhora: melhora,
      prodDeltaPctLast: prodLast,
    });
    return { score: h.score, variacao: h.variacao, oficial: false };
  }, [metricas, snap, diagnostico, melhora, prodLast]);

  const imagensRaiz =
    Array.isArray(relatorio.imagens) && relatorio.imagens.length > 0 ? relatorio.imagens : [];

  const snapRec = snap != null && typeof snap === 'object' ? (snap as Record<string, unknown>) : null;
  const snapPrevRec =
    snapPrev != null && typeof snapPrev === 'object' ? (snapPrev as Record<string, unknown>) : null;

  const daeAtual =
    snapRec != null && snapRec.dae != null && !Number.isNaN(Number(snapRec.dae)) ? Number(snapRec.dae) : null;
  const daeAntEvo = evoSnap?.dae_anterior != null ? Number(evoSnap.dae_anterior) : null;
  const daeAntSnap =
    snapPrevRec != null && snapPrevRec.dae != null && !Number.isNaN(Number(snapPrevRec.dae))
      ? Number(snapPrevRec.dae)
      : null;
  const daeAnt = daeAntSnap ?? (daeAntEvo != null && !Number.isNaN(daeAntEvo) ? daeAntEvo : null);

  const dataAtualFmt = snapRec != null ? formatSnapDate(snapRec.data, dataRelatorio) : (dataRelatorio ?? '');
  const dataPrevFmt = snapPrevRec != null ? formatSnapDate(snapPrevRec.data) : '';

  const compareHints = useMemo(():
    | { pragas: 'up' | 'down' | 'same'; desvios: 'up' | 'down' | 'same' }
    | undefined => {
    if (!snapPrevRec || snapRec == null) return undefined;
    const p0 = asObjArray(snapRec.pragas_doencas).length;
    const p1 = asObjArray(snapPrevRec.pragas_doencas).length;
    const d0 = asObjArray(snapRec.desvios).length;
    const d1 = asObjArray(snapPrevRec.desvios).length;
    const pragas: 'up' | 'down' | 'same' = p0 < p1 ? 'up' : p0 > p1 ? 'down' : 'same';
    const desvios: 'up' | 'down' | 'same' = d0 < d1 ? 'up' : d0 > d1 ? 'down' : 'same';
    return { pragas, desvios };
  }, [snapRec, snapPrevRec]);

  const recomendacaoLines = useMemo(() => {
    if (snapRec == null) return [];
    return buildRecomendacaoLines({
      score: scoreResult.score,
      melhora,
      variacao: scoreResult.variacao,
      desviosAltos: countDesviosAlto(asObjArray(snapRec.desvios)),
      pragasAltas: countPragaSeveridades(asObjArray(snapRec.pragas_doencas)).alta,
      pragasHint: compareHints?.pragas,
    });
  }, [snapRec, scoreResult.score, scoreResult.variacao, melhora, compareHints]);

  const evoListItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    if (melhora === true) {
      items.push(
        <li key="m-ok">
          <span className={styles.evoIcon} aria-hidden>
            ✔
          </span>
          Melhora sinalizada no comparativo fitossanitário.
        </li>,
      );
    }
    if (melhora === false) {
      items.push(
        <li key="m-warn">
          <span className={styles.evoIcon} aria-hidden>
            ⚠
          </span>
          Pontos de atenção: pressão mantida ou elevada.
        </li>,
      );
    }
    if (comparativo?.resumo != null && String(comparativo.resumo).trim() !== '') {
      items.push(
        <li key="resumo">
          <span className={styles.evoIcon} aria-hidden>
            •
          </span>
          {fmt(comparativo.resumo)}
        </li>,
      );
    }
    const vars = comparativo?.variacoes;
    if (Array.isArray(vars)) {
      (vars as Record<string, unknown>[]).forEach((v, i) => {
        const antes = fmt(v.antes);
        const depois = fmt(v.depois);
        const campo = fmt(v.campo);
        const icon = melhora === true ? '✔' : melhora === false ? '⚠' : '•';
        items.push(
          <li key={`var-${i}`}>
            <span className={styles.evoIcon} aria-hidden>
              {icon}
            </span>
            <strong>{campo}</strong>: {antes} → {depois}
          </li>,
        );
      });
    }
    return items;
  }, [melhora, comparativo]);

  const showEvoSection =
    evoListItems.length > 0 ||
    compareHints != null ||
    melhora != null ||
    (prodLast != null && !Number.isNaN(prodLast));

  const pragasPrevList = snapPrevRec != null ? asObjArray(snapPrevRec.pragas_doencas) : undefined;

  if (snapRec == null) {
    return null;
  }

  const talhaoLine = talhaoNome ?? fmt(snapRec.talhao);
  const culturaLine = culturaNome ?? fmt(snapRec.cultura);

  return (
    <motion.section
      className={styles.wrap}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <header className={styles.pageHeader}>
        <h2 className={styles.title}>Comparação de visitas</h2>
        <div className={styles.headerMeta}>
          <div className={styles.headerLine}>
            <strong>Talhão</strong> <span>{talhaoLine}</span>
          </div>
          <div className={styles.headerLine}>
            <strong>Cultura</strong> <span>{culturaLine}</span>
          </div>
          {daeAnt != null && daeAtual != null && !Number.isNaN(daeAnt) && !Number.isNaN(daeAtual) ? (
            <div className={styles.headerLine}>
              <strong>DAE</strong>{' '}
              <span>
                {daeAnt}
                <span className={styles.headerArrow}> → </span>
                {daeAtual}
              </span>
            </div>
          ) : daeAtual != null && !Number.isNaN(daeAtual) ? (
            <div className={styles.headerLine}>
              <strong>DAE</strong> <span>{daeAtual}</span>
            </div>
          ) : null}
          {dataPrevFmt && dataAtualFmt ? (
            <div className={styles.headerLine}>
              <strong>Data</strong>{' '}
              <span>
                {dataPrevFmt}
                <span className={styles.headerArrow}> → </span>
                {dataAtualFmt}
              </span>
            </div>
          ) : dataAtualFmt ? (
            <div className={styles.headerLine}>
              <strong>Data</strong> <span>{dataAtualFmt}</span>
            </div>
          ) : null}
        </div>
      </header>

      <div className={styles.scoreHero}>
        <div className={styles.badgeHeroRow}>
          {melhora === true ? <span className={`${styles.badgeHero} ${styles.badgeHeroOk}`}>MELHORA</span> : null}
          {melhora === false ? (
            <span className={`${styles.badgeHero} ${styles.badgeHeroWarn}`}>ATENÇÃO / PRESSÃO</span>
          ) : null}
          {melhora === null ? (
            <span className={`${styles.badgeHero} ${styles.badgeHeroNeutral}`}>COMPARATIVO INDISPONÍVEL</span>
          ) : null}
        </div>
        <ScoreGauge score={scoreResult.score} />
        <p
          className={`${styles.scoreDeltaLarge} ${scoreResult.variacao < 0 ? styles.scoreDeltaLargeNeg : ''}`}
        >
          {scoreResult.variacao >= 0 ? '+' : ''}
          {scoreResult.variacao} pontos desde a última visita
        </p>
        <p className={styles.scoreHint}>
          {scoreResult.oficial
            ? 'Índice oficial emitido pelo app (conclusao_metricas).'
            : 'Estimativa no viewer a partir de risco, pragas, desvios e plano até o app enviar métricas oficiais.'}
        </p>
        <RecomendacaoBlock lines={recomendacaoLines} />
      </div>

      {isNarrowViewport ? (
        <div className={styles.mobileToggleBar} role="tablist" aria-label="Alternar entre visitas">
          <button
            type="button"
            role="tab"
            aria-selected={mobileVisitTab === 'atual'}
            className={`${styles.mobileToggleBtn} ${mobileVisitTab === 'atual' ? styles.mobileToggleBtnActive : ''}`}
            onClick={() => setMobileVisitTab('atual')}
          >
            Visita atual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mobileVisitTab === 'anterior'}
            className={`${styles.mobileToggleBtn} ${mobileVisitTab === 'anterior' ? styles.mobileToggleBtnActive : ''}`}
            onClick={() => setMobileVisitTab('anterior')}
          >
            Visita anterior
          </button>
        </div>
      ) : null}

      <div className={styles.grid}>
        <div
          className={`${styles.colPrevious} ${isNarrowViewport && mobileVisitTab !== 'anterior' ? styles.colPaneHidden : ''}`}
        >
          {snapPrevRec != null ? (
            <SnapshotColumn
              snap={snapPrevRec}
              colTitle="Visita anterior (completa)"
              imagensRaiz={imagensRaiz}
              onPhotoClick={onPhotoClick}
              columnPrefix="anterior"
              openCardId={openCardId}
              toggleCard={toggleCard}
            />
          ) : (
            <LimitedPreviousColumn
              evoSnap={evoSnap}
              evoRoot={evoRoot}
              openCardId={openCardId}
              toggleCard={toggleCard}
            />
          )}
        </div>
        <div
          className={`${styles.colCurrent} ${isNarrowViewport && mobileVisitTab !== 'atual' ? styles.colPaneHidden : ''}`}
        >
          <SnapshotColumn
            snap={snapRec}
            colTitle="Visita atual"
            imagensRaiz={imagensRaiz}
            onPhotoClick={onPhotoClick}
            compareHints={compareHints}
            columnPrefix="atual"
            openCardId={openCardId}
            toggleCard={toggleCard}
            pragasRowsPrev={pragasPrevList}
          />
        </div>
      </div>

      {snapPrevRec != null ? (
        <FotosCompareStrip
          snapPrev={snapPrevRec}
          snapAtual={snapRec}
          imagensRaiz={imagensRaiz}
          onPhotoClick={onPhotoClick}
        />
      ) : null}

      {showEvoSection ? (
        <div className={styles.evoBlock}>
          <h3 className={styles.evoTitle}>Evolução</h3>
          {compareHints != null || melhora != null || (prodLast != null && !Number.isNaN(prodLast)) ? (
            <EvoMiniStrip
              pragasHint={compareHints?.pragas}
              desviosHint={compareHints?.desvios}
              prodDeltaPctLast={prodLast}
              melhora={melhora}
            />
          ) : null}
          {evoListItems.length > 0 ? (
            <ul className={styles.evoList}>{evoListItems}</ul>
          ) : (
            <p className={styles.evoEmpty}>Sem resumo textual adicional — use o comparativo e as métricas acima.</p>
          )}
        </div>
      ) : null}

      <ConclusaoFinalSection relatorio={relatorio} snapRec={snapRec} />
    </motion.section>
  );
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
