'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { normalizePlantioMultiPayload } from '@/lib/normalize-relatorio-plantio';
import { formatNumber } from '@/utils/format';
import HeaderRelatorio from '@/components/HeaderRelatorio';
import PlantioEditorialSnapshot from './PlantioEditorialSnapshot';
import styles from './relatorio-plantio-editorial.module.css';

type UnknownRec = Record<string, unknown>;

function num(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function str(v: unknown): string {
  if (v == null) return '';
  return String(v).trim();
}

function snapshotIndexForRankingRow(
  row: UnknownRec,
  talhoes: UnknownRec[],
): number {
  const id = str(row.talhaoId);
  if (id) {
    const i = talhoes.findIndex((t) => {
      const th = t.talhao as UnknownRec | undefined;
      return str(th?.id) === id;
    });
    if (i >= 0) return i;
  }
  const ord = num(row.ordem);
  if (ord != null && ord >= 1 && ord <= talhoes.length) return ord - 1;
  return 0;
}

export default function RelatorioPlantioMultiContent({
  relatorio,
  reportId,
}: {
  relatorio: UnknownRec;
  reportId?: string;
}) {
  const normalized = useMemo(
    () => normalizePlantioMultiPayload(relatorio as Record<string, unknown>),
    [relatorio],
  );

  const talhoes = (normalized.talhoes || []) as UnknownRec[];
  const analitico = (normalized.analiticoMulti || {}) as UnknownRec;
  const prop = (normalized.propriedade || {}) as UnknownRec;
  const meta = (normalized.meta || {}) as UnknownRec;
  const ranking = Array.isArray(analitico.ranking)
    ? (analitico.ranking as UnknownRec[])
    : [];

  const maxIqi = useMemo(() => {
    let m = 0;
    for (const r of ranking) {
      const q = num(r.iqi);
      if (q != null && q > m) m = q;
    }
    return m > 0 ? m : 100;
  }, [ranking]);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openAt = useCallback((i: number) => {
    if (talhoes.length === 0) return;
    setActiveIndex(Math.min(Math.max(0, i), talhoes.length - 1));
    setModalOpen(true);
  }, [talhoes.length]);

  const goPrev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + talhoes.length) % talhoes.length);
  }, [talhoes.length]);

  const goNext = useCallback(() => {
    setActiveIndex((i) => (i + 1) % talhoes.length);
  }, [talhoes.length]);

  const textoGeral = str(analitico.textoDiagnosticoGeral);
  const nTalhoes = talhoes.length;
  const showAnaliticoBlock = nTalhoes > 1 && ranking.length > 0;

  const activeSnapshot = talhoes[activeIndex];
  const activeTalhao = (activeSnapshot?.talhao || {}) as UnknownRec;

  return (
    <div className={`relatorio-plantio-multi ${styles.master}`}>
      <HeaderRelatorio
          meta={meta as { dataGeracao?: string; safra?: string; tecnico?: string; id?: string }}
          propriedade={prop as { fazenda?: string; proprietario?: string; municipio?: string; estado?: string }}
          talhao={{
            nome: nTalhoes === 1 ? str((talhoes[0]?.talhao as UnknownRec)?.nome) || 'Talhão' : `${nTalhoes} talhões`,
            cultura: 'Plantio — comparativo',
          }}
          reportId={reportId}
          variant="plantio"
        />

      <h1>Relatório de plantio — visão da propriedade</h1>
      <p className={styles.masterLead}>
        Comparativo de implantação entre {nTalhoes} talhão{nTalhoes === 1 ? '' : 'ões'}. Clique em uma linha para
        abrir o relatório editorial do talhão (navegue com ← → no painel).
      </p>

      {showAnaliticoBlock ? (
        <div className={styles.footerBlock} style={{ marginBottom: '1.25rem' }}>
          <h2>Resumo executivo</h2>
          <p style={{ margin: 0, fontSize: '0.95rem', lineHeight: 1.55 }}>
            Melhor IQI:{' '}
            <strong>{str(analitico.melhorTalhaoNome) || str(analitico.melhorTalhaoId)}</strong>
            {num(analitico.melhorIqi) != null ? ` (${num(analitico.melhorIqi)!.toFixed(0)})` : ''}
            {' · '}
            Menor IQI:{' '}
            <strong>{str(analitico.piorTalhaoNome) || str(analitico.piorTalhaoId)}</strong>
            {num(analitico.piorIqi) != null ? ` (${num(analitico.piorIqi)!.toFixed(0)})` : ''}
            {num(analitico.populacaoRealMedia) != null
              ? ` · Pop. real média: ${formatNumber(num(analitico.populacaoRealMedia)!)} pl/ha`
              : ''}
            {num(analitico.cvPercentMedio) != null
              ? ` · CV% médio: ${num(analitico.cvPercentMedio)!.toFixed(1)}%`
              : ''}
          </p>
        </div>
      ) : null}

      {ranking.length > 0 ? (
        <table className={styles.rankTable}>
          <thead>
            <tr>
              <th>#</th>
              <th>Talhão</th>
              <th>Cultura</th>
              <th>IQI</th>
              <th>Classificação</th>
              <th>Pop. real (pl/ha)</th>
              <th>CV%</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((row, i) => (
              <tr
                key={i}
                role="button"
                tabIndex={0}
                onClick={() => openAt(snapshotIndexForRankingRow(row, talhoes))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openAt(snapshotIndexForRankingRow(row, talhoes));
                  }
                }}
              >
                <td>{num(row.ordem) ?? i + 1}</td>
                <td>{str(row.talhaoNome) || '—'}</td>
                <td>{str(row.cultura) || '—'}</td>
                <td>{num(row.iqi) != null ? num(row.iqi)!.toFixed(0) : '—'}</td>
                <td>{str(row.classificacaoLabel) || '—'}</td>
                <td>
                  {num(row.populacaoReal) != null ? formatNumber(num(row.populacaoReal)!) : '—'}
                </td>
                <td>
                  {num(row.cvPercent) != null ? `${num(row.cvPercent)!.toFixed(1)}%` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <table className={styles.rankTable}>
          <thead>
            <tr>
              <th>Talhão</th>
              <th>Cultura</th>
            </tr>
          </thead>
          <tbody>
            {talhoes.map((t, i) => {
              const th = t.talhao as UnknownRec | undefined;
              return (
                <tr
                  key={i}
                  role="button"
                  tabIndex={0}
                  onClick={() => openAt(i)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openAt(i);
                    }
                  }}
                >
                  <td>{str(th?.nome) || '—'}</td>
                  <td>{str(th?.cultura) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {showAnaliticoBlock && (
        <>
          <h2 className={styles.sectionTitle} style={{ marginTop: '1.75rem', border: 'none', paddingBottom: 0 }}>
            IQI por talhão
          </h2>
          <div className={styles.chartRow} aria-hidden>
            {ranking.map((row, i) => {
              const q = num(row.iqi);
              const h = q != null && maxIqi > 0 ? Math.max(12, Math.round((q / maxIqi) * 120)) : 12;
              return (
                <div
                  key={i}
                  className={styles.chartBar}
                  style={{ height: h }}
                  title={`${str(row.talhaoNome)}: ${q?.toFixed(0) ?? '—'}`}
                />
              );
            })}
          </div>
        </>
      )}

      {showAnaliticoBlock ? (
        <div className={styles.footerBlock}>
          <h2>Síntese técnica</h2>
          {textoGeral ? <p style={{ margin: 0 }}>{textoGeral}</p> : null}
          {num(analitico.iqiMedio) != null ? (
            <p
              style={{
                margin: textoGeral ? '0.75rem 0 0' : 0,
                color: '#5c5c5c',
                fontSize: '0.88rem',
              }}
            >
              IQI médio: {num(analitico.iqiMedio)!.toFixed(1)} · Desvio entre talhões:{' '}
              {num(analitico.iqiDesvioEntreTalhoes) != null
                ? num(analitico.iqiDesvioEntreTalhoes)!.toFixed(1)
                : '—'}{' '}
              · Variabilidade: {str(analitico.variabilidadeIqi) || '—'}
            </p>
          ) : null}
        </div>
      ) : null}

      {modalOpen && activeSnapshot ? (
        <div
          className={styles.modalBackdrop}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className={styles.modalPanel} role="dialog" aria-modal aria-labelledby="modal-plantio-title">
            <div className={`${styles.modalToolbar} ${styles.noPrint}`}>
              <div className={styles.navHint}>
                <span id="modal-plantio-title">
                  {str(activeTalhao.nome)} · {activeIndex + 1}/{talhoes.length}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={goPrev} disabled={talhoes.length < 2}>
                  ← Anterior
                </button>
                <button type="button" onClick={goNext} disabled={talhoes.length < 2}>
                  Próximo →
                </button>
                <button type="button" className={styles.modalClose} onClick={() => setModalOpen(false)} aria-label="Fechar">
                  ×
                </button>
              </div>
            </div>
            <PlantioEditorialSnapshot snapshot={activeSnapshot} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
