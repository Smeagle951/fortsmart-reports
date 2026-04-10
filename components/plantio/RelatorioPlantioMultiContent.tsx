'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { normalizePlantioMultiPayload } from '@/lib/normalize-relatorio-plantio';
import HeaderRelatorio from '@/components/HeaderRelatorio';
import PlantioAnaliseDrawer from './analise/PlantioAnaliseDrawer';
import PlantioCompareDrawer from './analise/PlantioCompareDrawer';
import PlantioMultiComparativoCore from './PlantioMultiComparativoCore';
import cmpStyles from './relatorio-plantio-comparativo.module.css';
import editorialStyles from './relatorio-plantio-editorial.module.css';
import {
  classificarCvMedio,
  classificarIqiMedio,
  metricasDoSnapshot,
  nomeExibicaoTalhao,
  serieFenologia,
  str,
  num,
  type UnknownRec,
} from './plantio-comparativo-utils';
import type { SerieFeno } from './PlantioFenologiaComparativoChart';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';

function snapshotIndexForRankingRow(row: UnknownRec, talhoes: UnknownRec[]): number {
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

const COL = {
  a: '#2d6a4f',
  b: '#1b7f7a',
  c: '#1b4332',
} as const;

function defaultSlotsFromData(talhoes: UnknownRec[], ranking: UnknownRec[]): [number, number, number] {
  const n = talhoes.length;
  if (n === 0) return [0, 0, 0];
  const fromRank =
    ranking.length > 0
      ? ranking.map((row) => snapshotIndexForRankingRow(row, talhoes))
      : talhoes.map((_, i) => i);
  const uniq: number[] = [];
  for (const idx of fromRank) {
    if (!uniq.includes(idx)) uniq.push(idx);
  }
  while (uniq.length < 3 && n > 0) {
    uniq.push(uniq.length % n);
  }
  while (uniq.length < 3) uniq.push(0);
  return [uniq[0] ?? 0, uniq[1] ?? uniq[0] ?? 0, uniq[2] ?? uniq[0] ?? 0];
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
  const ranking = Array.isArray(analitico.ranking) ? (analitico.ranking as UnknownRec[]) : [];

  const nTalhoes = talhoes.length;
  const textoGeral = str(analitico.textoDiagnosticoGeral);
  const showAnalitico = nTalhoes > 1 && ranking.length > 0;

  const defaultSlots = useMemo(() => defaultSlotsFromData(talhoes, ranking), [talhoes, ranking]);

  const [slots, setSlots] = useState<[number, number, number]>(defaultSlots);
  useEffect(() => {
    setSlots(defaultSlots);
  }, [defaultSlots]);

  const [viewMode, setViewMode] = useState<'detalhe' | 'comparativo'>(() =>
    nTalhoes > 1 ? 'detalhe' : 'comparativo',
  );
  const [singleIdx, setSingleIdx] = useState(0);
  useEffect(() => {
    if (singleIdx >= nTalhoes) setSingleIdx(0);
  }, [nTalhoes, singleIdx]);

  useEffect(() => {
    if (nTalhoes <= 1) setViewMode('comparativo');
  }, [nTalhoes]);

  const [modoAnalise, setModoAnalise] = useState(false);
  const [analiseOpen, setAnaliseOpen] = useState(false);
  const [analiseSlotIndex, setAnaliseSlotIndex] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);

  const openAnalise = useCallback((slotIdx: number) => {
    if (slotIdx < 0 || slotIdx >= talhoes.length) return;
    setAnaliseSlotIndex(slotIdx);
    setAnaliseOpen(true);
  }, [talhoes.length]);

  const displayCount = nTalhoes === 1 ? 1 : viewMode === 'detalhe' ? 1 : 3;
  const activeSlotIndices = useMemo(() => {
    if (nTalhoes === 1) return [0];
    if (viewMode === 'detalhe') return [singleIdx];
    return [slots[0]!, slots[1]!, slots[2]!];
  }, [nTalhoes, viewMode, singleIdx, slots]);
  const activeSnapshots = activeSlotIndices.map((i) => talhoes[i]).filter(Boolean) as UnknownRec[];
  const activeNames = activeSlotIndices.map((i) => nomeExibicaoTalhao(talhoes[i] ?? {}, i));
  const activeMetrics = activeSnapshots.map((snap) => metricasDoSnapshot(snap));

  const keys = ['s0', 's1', 's2'] as const;
  const colors = [COL.a, COL.b, COL.c] as const;
  const seriesFeno: SerieFeno[] = activeSnapshots.map((snap, i) => ({
    key: keys[i],
    name: activeNames[i] || String(i + 1),
    color: colors[i],
    points: serieFenologia(snap),
  }));

  const iqiMedio = num(analitico.iqiMedio);
  const cvMedio = num(analitico.cvPercentMedio);
  const popMedia = num(analitico.populacaoRealMedia);
  const resumoIqi = iqiMedio != null ? classificarIqiMedio(iqiMedio) : null;
  const resumoCv = cvMedio != null ? classificarCvMedio(cvMedio) : null;

  const melhorNome = str(analitico.melhorTalhaoNome) || str(analitico.melhorTalhaoId);
  const melhorIqi = num(analitico.melhorIqi);

  const analiseSnapshot = talhoes[analiseSlotIndex];
  const metaSafra = str(meta.safra);

  const compareCoreProps = useMemo(() => {
    const idxs = [slots[0]!, slots[1]!, slots[2]!];
    const snaps = idxs.map((i) => talhoes[i]).filter(Boolean) as UnknownRec[];
    const names = idxs.map((i) => nomeExibicaoTalhao(talhoes[i] ?? {}, i));
    const metrics = snaps.map((snap) => metricasDoSnapshot(snap));
    const keys = ['s0', 's1', 's2'] as const;
    const colors = [COL.a, COL.b, COL.c] as const;
    const seriesCompare: SerieFeno[] = snaps.map((snap, i) => ({
      key: keys[i],
      name: names[i] || String(i + 1),
      color: colors[i],
      points: serieFenologia(snap),
    }));
    return {
      nTalhoes,
      slots,
      setSlots,
      displayCount: 3,
      activeSlotIndices: idxs,
      activeNames: names,
      activeSnapshots: snaps,
      activeMetrics: metrics,
      seriesFeno: seriesCompare,
      showAnalitico,
      iqiMedio,
      cvMedio,
      popMedia,
      resumoIqi,
      resumoCv,
      melhorNome,
      melhorIqi,
      textoGeral,
      talhoes,
      reportId,
      onOpenAnalise: openAnalise,
      hideSelectors: true,
      selectorMode: 'triple' as const,
    };
  }, [
    nTalhoes,
    slots,
    talhoes,
    reportId,
    showAnalitico,
    iqiMedio,
    cvMedio,
    popMedia,
    resumoIqi,
    resumoCv,
    melhorNome,
    melhorIqi,
    textoGeral,
    openAnalise,
  ]);

  const coreProps = {
    nTalhoes,
    slots,
    setSlots,
    displayCount,
    activeSlotIndices,
    activeNames,
    activeSnapshots,
    activeMetrics,
    seriesFeno,
    showAnalitico,
    iqiMedio,
    cvMedio,
    popMedia,
    resumoIqi,
    resumoCv,
    melhorNome,
    melhorIqi,
    textoGeral,
    talhoes,
    reportId,
    onOpenAnalise: openAnalise,
    selectorMode: (nTalhoes > 1 && viewMode === 'detalhe' ? 'single' : 'triple') as 'single' | 'triple',
    singleTalhaoIndex: singleIdx,
    setSingleTalhaoIndex: setSingleIdx,
  };

  const listaTalhoes = useMemo(() => {
    return talhoes.map((snap, idx) => {
      const th = snap.talhao as UnknownRec | undefined;
      const m = metricasDoSnapshot(snap);
      const thId = str(th?.id);
      let rank: number | null = null;
      if (ranking.length > 0 && thId) {
        const ri = ranking.findIndex((r) => str(r.talhaoId) === thId);
        if (ri >= 0) rank = ri + 1;
      }
      return {
        idx,
        nome: nomeExibicaoTalhao(snap, idx),
        cultura: str(th?.cultura),
        iqi: m.iqi,
        label: m.iqiLabel,
        rank,
      };
    });
  }, [talhoes, ranking]);

  if (nTalhoes === 0) {
    return (
      <div className={cmpStyles.page}>
        <p>Nenhum talhão neste relatório.</p>
      </div>
    );
  }

  const localizacaoTexto = [prop.municipio, prop.estado].filter(Boolean).join(' / ');

  return (
    <div className="relatorio-plantio">
      <div className={cmpStyles.page}>
        <div className={editorialStyles.noPrint}>
          <HeaderRelatorio
            meta={meta as { dataGeracao?: string; safra?: string; tecnico?: string; id?: string }}
            propriedade={prop as { fazenda?: string; proprietario?: string; municipio?: string; estado?: string }}
            talhao={{
              nome:
                nTalhoes === 1
                  ? nomeExibicaoTalhao(talhoes[0] ?? {}, 0)
                  : viewMode === 'detalhe'
                    ? nomeExibicaoTalhao(talhoes[singleIdx] ?? {}, singleIdx)
                    : `${nTalhoes} talhões`,
              cultura:
                nTalhoes === 1
                  ? str((talhoes[0]?.talhao as UnknownRec | undefined)?.cultura) || 'Plantio'
                  : viewMode === 'detalhe'
                    ? str((talhoes[singleIdx]?.talhao as UnknownRec | undefined)?.cultura) || 'Plantio'
                    : 'Comparativo multi-talhão',
            }}
            reportId={reportId}
            variant="plantio"
            plantioComparativo={nTalhoes > 1 && viewMode === 'comparativo'}
            nTalhoesComparados={viewMode === 'comparativo' ? nTalhoes : 1}
            localizacaoTexto={localizacaoTexto || undefined}
          />
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 12px' }}>
          <InteligenciaAgronomicaPanel relatorio={relatorio as Record<string, unknown>} variant="default" />
        </div>

        <div className={`${cmpStyles.actionToolbar} ${editorialStyles.noPrint}`}>
          <div className={cmpStyles.actionToolbarInner}>
            <span className={cmpStyles.actionToolbarLabel}>Ferramentas</span>
            {nTalhoes > 1 ? (
              <div className={cmpStyles.viewModeToggle} role="group" aria-label="Modo de visualização">
                <button
                  type="button"
                  className={`${cmpStyles.viewModeBtn} ${viewMode === 'detalhe' ? cmpStyles.viewModeBtnActive : ''}`}
                  aria-pressed={viewMode === 'detalhe'}
                  onClick={() => setViewMode('detalhe')}
                >
                  Plantio único
                </button>
                <button
                  type="button"
                  className={`${cmpStyles.viewModeBtn} ${viewMode === 'comparativo' ? cmpStyles.viewModeBtnActive : ''}`}
                  aria-pressed={viewMode === 'comparativo'}
                  onClick={() => setViewMode('comparativo')}
                >
                  Comparativo A/B/C
                </button>
              </div>
            ) : null}
            <div className={cmpStyles.actionBtnGroup}>
              <button
                type="button"
                className={`${cmpStyles.actionBtn} ${modoAnalise ? cmpStyles.actionBtnActive : ''}`}
                onClick={() => setModoAnalise((v) => !v)}
                aria-pressed={modoAnalise}
              >
                <span className={cmpStyles.actionBtnTitle}>
                  {modoAnalise ? 'Ocultar lista' : 'Lista de talhões'}
                </span>
                <span className={cmpStyles.actionBtnHint}>Abrir painel por talhão na página</span>
              </button>
              <button
                type="button"
                className={`${cmpStyles.actionBtn} ${cmpStyles.actionBtnPrimary}`}
                onClick={() => setCompareOpen(true)}
              >
                <span className={cmpStyles.actionBtnTitle}>Painel expandido</span>
                <span className={cmpStyles.actionBtnHint}>Comparar A/B/C em tela cheia</span>
              </button>
            </div>
          </div>
        </div>

      {modoAnalise ? (
        <section
          className={cmpStyles.footerInsight}
          style={{ marginBottom: '1.25rem' }}
          aria-label="Lista para drill-down"
        >
          <p className={cmpStyles.summaryTitle} style={{ textAlign: 'left', marginBottom: '0.75rem' }}>
            Talhões — painel lateral
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {listaTalhoes.map((row) => (
              <li
                key={row.idx}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '0.55rem 0',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <span style={{ fontWeight: 600 }}>
                  {row.rank != null ? `#${row.rank} ` : ''}
                  {row.nome}
                  <span style={{ fontWeight: 400, color: '#57534e', marginLeft: 6 }}>
                    {row.cultura || '—'}
                  </span>
                </span>
                <span style={{ fontSize: '0.85rem' }}>
                  IQI {row.iqi != null ? Math.round(row.iqi) : '—'} {row.label ? `· ${row.label}` : ''}
                </span>
                <button
                  type="button"
                  className={cmpStyles.select}
                  style={{ cursor: 'pointer', fontSize: '0.8rem' }}
                  onClick={() => openAnalise(row.idx)}
                >
                  Abrir painel
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <header className={cmpStyles.titleBlock}>
        <h1 className={cmpStyles.title}>
          {nTalhoes === 1 || viewMode === 'detalhe'
            ? 'Relatório de plantio'
            : 'Análise comparativa dos talhões de plantio'}
        </h1>
        <div className={cmpStyles.titleUnderline} aria-hidden />
        <p className={cmpStyles.subtitle}>
          {nTalhoes === 1
            ? 'Dados do módulo plantio e submódulos (CV%, estande, fenologia).'
            : viewMode === 'detalhe'
              ? 'Um talhão/plantio por vez — selecione acima. Safra e contexto vêm do relatório publicado.'
              : 'Comparação lado a lado de até três talhões (colunas A, B e C).'}
        </p>
        {nTalhoes > 1 && viewMode === 'detalhe' ? (
          <p className={cmpStyles.subtitleMeta}>
            Safra (relatório): <strong>{str(meta.safra) || '—'}</strong>
          </p>
        ) : null}
      </header>

      <PlantioMultiComparativoCore {...coreProps} />

      <PlantioAnaliseDrawer
        open={analiseOpen && analiseSnapshot != null}
        snapshot={analiseSnapshot ?? {}}
        reportId={reportId}
        metaSafra={metaSafra}
        onClose={() => setAnaliseOpen(false)}
        onComparar={() => {
          setCompareOpen(true);
        }}
      />

        <PlantioCompareDrawer open={compareOpen} onClose={() => setCompareOpen(false)}>
          <PlantioMultiComparativoCore {...compareCoreProps} />
        </PlantioCompareDrawer>
      </div>
    </div>
  );
}
