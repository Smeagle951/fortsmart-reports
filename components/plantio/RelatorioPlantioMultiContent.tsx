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
  serieFenologia,
  str,
  num,
  type UnknownRec,
} from './plantio-comparativo-utils';
import type { SerieFeno } from './PlantioFenologiaComparativoChart';

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

  const [modoAnalise, setModoAnalise] = useState(false);
  const [analiseOpen, setAnaliseOpen] = useState(false);
  const [analiseSlotIndex, setAnaliseSlotIndex] = useState(0);
  const [compareOpen, setCompareOpen] = useState(false);

  const openAnalise = useCallback((slotIdx: number) => {
    if (slotIdx < 0 || slotIdx >= talhoes.length) return;
    setAnaliseSlotIndex(slotIdx);
    setAnaliseOpen(true);
  }, [talhoes.length]);

  const displayCount = nTalhoes === 1 ? 1 : 3;
  const activeSlotIndices = Array.from({ length: displayCount }, (_, i) =>
    nTalhoes === 1 ? slots[0] : slots[i],
  );
  const activeSnapshots = activeSlotIndices.map((i) => talhoes[i]).filter(Boolean) as UnknownRec[];
  const activeNames = activeSlotIndices.map((i) => {
    const th = talhoes[i]?.talhao as UnknownRec | undefined;
    return str(th?.nome) || `Talhão ${i + 1}`;
  });
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
        nome: str(th?.nome) || `Talhão ${idx + 1}`,
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

  return (
    <div className={cmpStyles.page}>
      <div className={editorialStyles.noPrint}>
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
      </div>

      <div className={`${editorialStyles.noPrint}`} style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={cmpStyles.select}
          style={{ cursor: 'pointer', fontWeight: 600 }}
          onClick={() => setModoAnalise((v) => !v)}
        >
          {modoAnalise ? 'Ocultar modo análise' : 'Modo análise — lista de talhões'}
        </button>
        <button
          type="button"
          className={cmpStyles.select}
          style={{ cursor: 'pointer', fontWeight: 600, marginLeft: 8 }}
          onClick={() => setCompareOpen(true)}
        >
          Comparar talhões (painel expandido)
        </button>
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
        <h1 className={cmpStyles.title}>Análise Comparativa dos Talhões de Plantio</h1>
        <div className={cmpStyles.titleUnderline} aria-hidden />
        <p className={cmpStyles.subtitle}>Comparação detalhada dos talhões selecionados</p>
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
        <PlantioMultiComparativoCore {...coreProps} hideSelectors />
      </PlantioCompareDrawer>
    </div>
  );
}
