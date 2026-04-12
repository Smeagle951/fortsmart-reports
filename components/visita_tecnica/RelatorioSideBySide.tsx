'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import type { PayloadVisitaTecnica, VisitaSnapshotCanonico } from '@/types/payload-visita-tecnica';
import { calcularScoreVisitaTecnica } from '@/lib/visita-tecnica/vtSideBySideScore';
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

function ScoreGauge({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 44;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div className={styles.scoreGauge} aria-hidden>
      <svg width="112" height="112" viewBox="0 0 112 112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
        <circle
          cx="56"
          cy="56"
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
          <CountUp end={score} duration={1.1} preserveValue />
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

function PragasTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p className={styles.expandBody}>Nenhum registro.</p>;
  return (
    <table className={styles.tableMini}>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Nome</th>
          <th>Severidade</th>
          <th>Notas</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p, i) => (
          <tr key={i}>
            <td>{fmt(p.tipo)}</td>
            <td>{fmt(p.nome)}</td>
            <td>
              <span className={styles.pill}>{fmt(p.severidade)}</span>
            </td>
            <td>{fmt(p.incidencia || p.observacoes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function DesviosList({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Nenhum desvio registrado.</p>;
  return (
    <ul className={styles.evoList}>
      {rows.map((d, i) => (
        <li key={i}>
          <strong>{fmt(d.tipo)}</strong> — {fmt(d.descricao)}{' '}
          <span className={styles.pill}>{fmt(d.impacto)}</span>
        </li>
      ))}
    </ul>
  );
}

function AplicacoesTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Nenhuma aplicação no snapshot.</p>;
  return (
    <table className={styles.tableMini}>
      <thead>
        <tr>
          <th>Produto</th>
          <th>Dose</th>
          <th>Objetivo</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td>{fmt(r.produto)}</td>
            <td>{fmt(r.dose)}</td>
            <td>{fmt(r.objetivo)}</td>
            <td>{fmt(r.status)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PlanoList({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) return <p>Sem plano de ação no snapshot.</p>;
  return (
    <ol className={styles.evoList}>
      {rows.map((a, i) => (
        <li key={i}>
          {fmt(a.acao)} <span className={styles.pill}>{fmt(a.prioridade)}</span>
          {a.prazo != null && String(a.prazo).trim() !== '' ? (
            <span style={{ color: '#78716c' }}> · Prazo: {fmt(a.prazo)}</span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function DiagnosticoAlwaysVisible({ snap }: { snap: Record<string, unknown> }) {
  const d = asRecord(snap.diagnostico_final);
  if (!d || (!d.resumo && !d.risco)) {
    return <p style={{ color: '#78716c' }}>Diagnóstico não preenchido no snapshot.</p>;
  }
  return (
    <div>
      <p style={{ fontSize: '1rem', lineHeight: 1.5, margin: '0 0 10px' }}>{fmt(d.resumo)}</p>
      <p style={{ fontSize: '0.85rem', color: '#57534e' }}>
        Risco: <span className={styles.pill}>{fmt(d.risco)}</span>
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
    .filter(Boolean) as { url: string; descricao: string; sub: string }[];

  const fromRaiz = imagensRaiz
    .filter((im) => im.url && isHttpUrl(im.url!))
    .map((im) => ({
      url: im.url!,
      descricao: im.descricao ?? '',
      sub: im.categoria ?? im.data ?? '',
    }));

  const merged = fromPontos.length > 0 ? fromPontos : fromRaiz;
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
}: {
  snap: Record<string, unknown>;
  colTitle: string;
  imagensRaiz: Array<{ url?: string; descricao?: string; categoria?: string; data?: string }>;
  onPhotoClick?: (url: string) => void;
  compareHints?: { pragas?: 'up' | 'down' | 'same'; desvios?: 'up' | 'down' | 'same' };
}) {
  const pragas = asObjArray(snap.pragas_doencas);
  const desvios = asObjArray(snap.desvios);
  const aplic = asObjArray(snap.aplicacoes_prescricoes);
  const plano = asObjArray(snap.plano_acao);

  return (
    <div className={styles.col}>
      <h3 className={styles.colTitle}>{colTitle}</h3>

      <ExpandableReportCard
        title="Condições do momento"
        summary={<span style={{ color: '#57534e' }}>Clima e ambiente da visita</span>}
        compareTone={undefined}
      >
        <CondicoesBody snap={snap} />
      </ExpandableReportCard>

      <ExpandableReportCard
        title="Contexto da safra"
        summary={<span style={{ color: '#57534e' }}>Manejo e notas de safra</span>}
      >
        <ContextoBody snap={snap} />
      </ExpandableReportCard>

      <ExpandableReportCard
        title="Pragas e doenças"
        summary={
          <span style={{ color: '#57534e' }}>
            {pragas.length} ocorrência(s) registrada(s)
          </span>
        }
        compareTone={compareHints?.pragas}
      >
        <PragasTable rows={pragas} />
      </ExpandableReportCard>

      <ExpandableReportCard
        title="Desvios"
        summary={
          <span style={{ color: '#57534e' }}>{desvios.length} desvio(s)</span>
        }
        compareTone={compareHints?.desvios}
      >
        <DesviosList rows={desvios} />
      </ExpandableReportCard>

      <ExpandableReportCard
        title="Aplicações e prescrições"
        summary={<span style={{ color: '#57534e' }}>Somente leitura (tratamento)</span>}
      >
        <AplicacoesTable rows={aplic} />
      </ExpandableReportCard>

      <ExpandableReportCard title="Plano de ação" summary={<span style={{ color: '#57534e' }}>{plano.length} ação(ões)</span>}>
        <PlanoList rows={plano} />
      </ExpandableReportCard>

      <ExpandableReportCard title="Fotos e evidências" summary={<span style={{ color: '#57534e' }}>Galeria e pontos georreferenciados</span>}>
        <FotosGrid snap={snap} imagensRaiz={imagensRaiz} onPhotoClick={onPhotoClick} />
      </ExpandableReportCard>

      <div className={styles.expandCard} style={{ padding: 16 }}>
        <div className={styles.expandHeadTitle} style={{ marginBottom: 12 }}>
          Diagnóstico final
        </div>
        <DiagnosticoAlwaysVisible snap={snap} />
      </div>
    </div>
  );
}

function LimitedPreviousColumn({
  evoSnap,
  evoRoot,
}: {
  evoSnap: Record<string, unknown> | undefined;
  evoRoot: Record<string, unknown> | undefined;
}) {
  const comp = evoSnap ? asRecord(evoSnap.comparativo) : undefined;
  const melhora = comp?.melhora === true ? true : comp?.melhora === false ? false : null;
  const daeAnt = evoSnap?.dae_anterior;

  return (
    <div className={styles.col}>
      <h3 className={styles.colTitle}>Visita anterior (resumo)</h3>

      <div className={styles.fallbackBox}>
        <strong>Visita anterior sem dados completos no JSON.</strong>
        <br />
        Abaixo: informação disponível da cadeia de visitas e da evolução da safra.
      </div>

      {melhora != null ? (
        <div className={styles.badgeRow}>
          <span className={melhora ? styles.badgeOk : styles.badgeRisk}>
            {melhora ? 'Melhora vs anterior' : 'Atenção vs anterior'}
          </span>
          {daeAnt != null ? (
            <span className={styles.badgeNeutral}>DAE anterior: {fmt(daeAnt)}</span>
          ) : null}
        </div>
      ) : null}

      {comp?.resumo != null && String(comp.resumo).trim() !== '' ? (
        <ExpandableReportCard title="Comparativo" defaultOpen summary={null}>
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
        </ExpandableReportCard>
      ) : null}

      {evoRoot && Array.isArray(evoRoot.visitas) && (evoRoot.visitas as unknown[]).length > 0 ? (
        <ExpandableReportCard title="Histórico de visitas (meta)" defaultOpen>
          <ul className={styles.evoList}>
            {(evoRoot.visitas as Record<string, unknown>[]).slice(-6).map((v, i) => (
              <li key={i}>
                {fmt(v.data ?? v.data_sessao ?? v.id)} — {fmt(v.resumo ?? v.nota ?? 'visita')}
              </li>
            ))}
          </ul>
          {evoRoot.tendencia != null ? (
            <p style={{ marginTop: 10, fontWeight: 700, color: '#14532d' }}>
              Tendência: {fmt(evoRoot.tendencia)}
            </p>
          ) : null}
        </ExpandableReportCard>
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

  const scoreResult = useMemo(() => {
    if (metricas != null && typeof metricas.score === 'number' && !Number.isNaN(metricas.score)) {
      return {
        score: clampScore(metricas.score),
        variacao:
          typeof metricas.variacao === 'number' && !Number.isNaN(metricas.variacao)
            ? metricas.variacao
            : 0,
      };
    }
    return calcularScoreVisitaTecnica({
      snapshot: snap as Record<string, unknown> | undefined,
      diagnostico,
      comparativoMelhora: melhora,
      prodDeltaPctLast: prodLast,
    });
  }, [metricas, snap, diagnostico, melhora, prodLast]);

  const imagensRaiz =
    Array.isArray(relatorio.imagens) && relatorio.imagens.length > 0
      ? relatorio.imagens
      : [];

  const daeAtual = snap != null && typeof snap === 'object' && snap.dae != null ? Number(snap.dae) : null;
  const daeAnt = evoSnap?.dae_anterior != null ? Number(evoSnap.dae_anterior) : null;

  const compareHints = useMemo(():
    | { pragas: 'up' | 'down' | 'same'; desvios: 'up' | 'down' | 'same' }
    | undefined => {
    if (!snapPrev || snap == null) return undefined;
    const p0 = asObjArray((snap as Record<string, unknown>).pragas_doencas).length;
    const p1 = asObjArray((snapPrev as Record<string, unknown>).pragas_doencas).length;
    const d0 = asObjArray((snap as Record<string, unknown>).desvios).length;
    const d1 = asObjArray((snapPrev as Record<string, unknown>).desvios).length;
    const pragas: 'up' | 'down' | 'same' = p0 < p1 ? 'up' : p0 > p1 ? 'down' : 'same';
    const desvios: 'up' | 'down' | 'same' = d0 < d1 ? 'up' : d0 > d1 ? 'down' : 'same';
    return { pragas, desvios };
  }, [snap, snapPrev]);

  if (snap == null || typeof snap !== 'object') {
    return null;
  }

  const snapRec = snap as Record<string, unknown>;

  return (
    <motion.section
      className={styles.wrap}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className={styles.headerBlock}>
        <h2 className={styles.title}>Comparação de visitas</h2>
        <p className={styles.subtitle}>
          {talhaoNome ?? fmt(snapRec.talhao)} · {culturaNome ?? fmt(snapRec.cultura)}
          {dataRelatorio ? ` · Relatório ${dataRelatorio}` : ''}
          {daeAtual != null && !Number.isNaN(daeAtual) ? ` · DAE atual ${daeAtual}` : ''}
          {daeAnt != null && !Number.isNaN(daeAnt) ? ` (DAE anterior ${daeAnt})` : ''}
        </p>
        <div className={styles.badgeRow}>
          {melhora === true ? <span className={styles.badgeOk}>Melhora</span> : null}
          {melhora === false ? <span className={styles.badgeWarn}>Atenção / pressão</span> : null}
          {melhora === null ? <span className={styles.badgeNeutral}>Comparativo indisponível</span> : null}
        </div>
      </div>

      <div className={styles.scoreRow}>
        <ScoreGauge score={scoreResult.score} />
        <div className={styles.scoreCopy}>
          <div className={styles.scoreLabel}>Índice técnico derivado</div>
          <p
            className={`${styles.scoreDelta} ${scoreResult.variacao < 0 ? styles.scoreDeltaNeg : ''}`}
          >
            {scoreResult.variacao >= 0 ? '+' : ''}
            {scoreResult.variacao} pontos desde a leitura anterior (estimativa)
          </p>
          <p style={{ fontSize: '0.78rem', color: '#78716c', marginTop: 8, lineHeight: 1.4 }}>
            Valor orientativo a partir de risco, pragas, desvios e plano. Com{' '}
            <code>conclusao_metricas</code> no JSON (app atualizado), o valor passa a ser o oficial.
          </p>
        </div>
      </div>

      <div className={styles.grid}>
        <SnapshotColumn
          snap={snapRec}
          colTitle="Visita atual"
          imagensRaiz={imagensRaiz}
          onPhotoClick={onPhotoClick}
          compareHints={compareHints}
        />
        {snapPrev != null && typeof snapPrev === 'object' ? (
          <SnapshotColumn
            snap={snapPrev as Record<string, unknown>}
            colTitle="Visita anterior (completa)"
            imagensRaiz={imagensRaiz}
            onPhotoClick={onPhotoClick}
          />
        ) : (
          <LimitedPreviousColumn evoSnap={evoSnap} evoRoot={evoRoot} />
        )}
      </div>

      {(comparativo?.resumo != null && String(comparativo.resumo).trim() !== '') || melhora != null ? (
        <div className={styles.evoBlock}>
          <h3 className={styles.evoTitle}>Evolução</h3>
          <ul className={styles.evoList}>
            {melhora === true ? <li>Melhora sinalizada no comparativo fitossanitário.</li> : null}
            {melhora === false ? <li>Pontos de atenção: pressão mantida ou elevada.</li> : null}
            {comparativo?.resumo != null ? <li>{fmt(comparativo.resumo)}</li> : null}
          </ul>
        </div>
      ) : null}
    </motion.section>
  );
}

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}
