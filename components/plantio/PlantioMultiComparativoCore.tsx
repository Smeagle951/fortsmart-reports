'use client';

import React from 'react';
import { formatNumber } from '@/utils/format';
import PlantioFenologiaComparativoChart, { type SerieFeno } from './PlantioFenologiaComparativoChart';
import {
  heroUrlForSnapshot,
  metricasDoSnapshot,
  str,
  num,
  type UnknownRec,
} from './plantio-comparativo-utils';
import cmpStyles from './relatorio-plantio-comparativo.module.css';
import editorialStyles from './relatorio-plantio-editorial.module.css';

export function BadgeIqi({
  badgeClass,
  iqi,
  label,
}: {
  badgeClass: 'ok' | 'warn' | 'bad';
  iqi?: number;
  label: string;
}) {
  const extra =
    badgeClass === 'ok' ? cmpStyles.badgeOk : badgeClass === 'bad' ? cmpStyles.badgeBad : cmpStyles.badgeWarn;
  const iqiStr = iqi != null ? `${Math.round(iqi)} ` : '';
  return (
    <span className={`${cmpStyles.badge} ${extra}`}>
      {iqiStr}
      {label.toUpperCase()}
    </span>
  );
}

export interface MultiComparativoCoreProps {
  nTalhoes: number;
  slots: [number, number, number];
  setSlots: React.Dispatch<React.SetStateAction<[number, number, number]>>;
  displayCount: number;
  activeSlotIndices: number[];
  activeNames: string[];
  activeSnapshots: UnknownRec[];
  activeMetrics: ReturnType<typeof metricasDoSnapshot>[];
  seriesFeno: SerieFeno[];
  showAnalitico: boolean;
  iqiMedio: number | undefined;
  cvMedio: number | undefined;
  popMedia: number | undefined;
  resumoIqi: { badgeClass: 'ok' | 'warn' | 'bad'; label: string } | null;
  resumoCv: { badgeClass: 'ok' | 'warn' | 'bad'; label: string } | null;
  melhorNome: string;
  melhorIqi: number | undefined;
  textoGeral: string;
  talhoes: UnknownRec[];
  reportId?: string;
  onOpenAnalise: (talhaoSlotIndex: number) => void;
  hideSelectors?: boolean;
}

export default function PlantioMultiComparativoCore(props: MultiComparativoCoreProps) {
  const {
    nTalhoes,
    slots,
    setSlots,
    displayCount,
    activeSlotIndices,
    activeNames,
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
    onOpenAnalise,
    hideSelectors,
  } = props;

  return (
    <>
      {!hideSelectors && nTalhoes > 1 ? (
        <div className={`${cmpStyles.selectorGrid} ${editorialStyles.noPrint}`}>
          {(['A', 'B', 'C'] as const).map((letter, idx) => (
            <div key={letter} className={cmpStyles.selectorCol}>
              <span className={cmpStyles.selectorLabel}>Comparar {letter}</span>
              <label className={cmpStyles.visuallyHidden} htmlFor={`cmp-select-${letter}-core`}>
                Talhão coluna {letter}
              </label>
              <select
                id={`cmp-select-${letter}-core`}
                className={cmpStyles.select}
                value={slots[idx]}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isFinite(v)) return;
                  setSlots((prev) => {
                    const next = [...prev] as [number, number, number];
                    next[idx] = Math.min(Math.max(0, v), nTalhoes - 1);
                    return next;
                  });
                }}
              >
                {talhoes.map((t, i) => {
                  const th = t.talhao as UnknownRec | undefined;
                  const nome = str(th?.nome) || `Talhão ${i + 1}`;
                  return (
                    <option key={i} value={i}>
                      {nome}
                    </option>
                  );
                })}
              </select>
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={cmpStyles.photoRow}
        style={displayCount === 1 ? { gridTemplateColumns: '1fr' } : undefined}
      >
        {activeSlotIndices.map((slotIdx, colIdx) => {
          const snap = talhoes[slotIdx];
          const url = snap ? heroUrlForSnapshot(snap, reportId) : undefined;
          const nome = activeNames[colIdx];
          return (
            <div key={`${colIdx}-${slotIdx}`} className={cmpStyles.photoCol}>
              <div className={cmpStyles.photoWrap}>
                {url ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img className={cmpStyles.photoImg} src={url} alt="" />
                    <div className={cmpStyles.photoCap}>{nome}</div>
                  </>
                ) : (
                  <div className={cmpStyles.photoPlaceholder}>Sem foto de referência para este talhão</div>
                )}
              </div>
              {snap ? (
                <div className={`${cmpStyles.linkDetail} ${editorialStyles.noPrint}`}>
                  <button type="button" onClick={() => onOpenAnalise(slotIdx)}>
                    Painel de análise
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className={cmpStyles.compareWrap}>
        <table className={cmpStyles.compareTable}>
          <thead>
            <tr>
              <th className={cmpStyles.indLabel}>Indicador</th>
              {displayCount >= 1 ? <th className={cmpStyles.headColA}>{activeNames[0]}</th> : null}
              {displayCount >= 2 ? <th className={cmpStyles.headColB}>{activeNames[1]}</th> : null}
              {displayCount >= 3 ? <th className={cmpStyles.headColC}>{activeNames[2]}</th> : null}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className={cmpStyles.indLabel} scope="row">
                População real
              </th>
              {activeMetrics.map((m, i) => (
                <td key={i} className={cmpStyles.num}>
                  {m.popReal != null ? `${formatNumber(m.popReal)} pl/ha` : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <th className={cmpStyles.indLabel} scope="row">
                CV%
              </th>
              {activeMetrics.map((m, i) => (
                <td key={i} className={cmpStyles.num}>
                  {m.cvPct != null ? `${m.cvPct.toFixed(1)}%` : '—'}
                </td>
              ))}
            </tr>
            <tr>
              <th className={cmpStyles.indLabel} scope="row">
                Emergência (eficiência)
              </th>
              {activeMetrics.map((m, i) => (
                <td key={i} className={cmpStyles.num}>
                  {m.emergenciaStr ?? '—'}
                </td>
              ))}
            </tr>
            <tr>
              <th className={cmpStyles.indLabel} scope="row">
                Estádio fenológico
              </th>
              {activeMetrics.map((m, i) => (
                <td key={i}>{m.estagio}</td>
              ))}
            </tr>
            <tr>
              <th className={cmpStyles.indLabel} scope="row">
                IQI
              </th>
              {activeMetrics.map((m, i) => (
                <td key={i}>
                  <BadgeIqi badgeClass={m.badgeClass} iqi={m.iqi} label={m.iqiLabel} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <section className={cmpStyles.chartBlock}>
        <h2 className={cmpStyles.chartTitle}>Evolução Fenológica</h2>
        <p className={cmpStyles.chartSub}>
          Estágio em função dos dias após emergência (quando houver registros compatíveis)
        </p>
        <PlantioFenologiaComparativoChart series={seriesFeno} />
      </section>

      {showAnalitico ? (
        <>
          <h2 className={cmpStyles.summaryTitle}>Resumo analítico dos talhões</h2>
          <div className={cmpStyles.summaryGrid}>
            <div className={cmpStyles.summaryCard}>
              <div className={cmpStyles.summaryCardLabel}>IQI médio</div>
              <div className={cmpStyles.summaryCardValue}>
                {iqiMedio != null && resumoIqi ? (
                  <BadgeIqi badgeClass={resumoIqi.badgeClass} iqi={iqiMedio} label={resumoIqi.label} />
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className={cmpStyles.summaryCard}>
              <div className={cmpStyles.summaryCardLabel}>População média</div>
              <div className={cmpStyles.summaryCardValue}>
                {popMedia != null ? `${formatNumber(popMedia)} pl/ha` : '—'}
              </div>
            </div>
            <div className={cmpStyles.summaryCard}>
              <div className={cmpStyles.summaryCardLabel}>CV médio</div>
              <div className={cmpStyles.summaryCardValue}>
                {cvMedio != null && resumoCv ? (
                  <>
                    {cvMedio.toFixed(1)}% <BadgeIqi badgeClass={resumoCv.badgeClass} label={resumoCv.label} />
                  </>
                ) : (
                  '—'
                )}
              </div>
            </div>
            <div className={cmpStyles.summaryCard}>
              <div className={cmpStyles.summaryCardLabel}>Maior IQI</div>
              <div className={cmpStyles.summaryCardValue}>
                {melhorNome && melhorNome !== '—'
                  ? `${melhorNome}${melhorIqi != null ? ` (IQI ${melhorIqi.toFixed(0)})` : ''}`
                  : '—'}
              </div>
            </div>
          </div>
        </>
      ) : null}

      <div className={cmpStyles.footerInsight}>
        <ul>
          <li>
            <strong>Melhor talhão:</strong>{' '}
            {melhorNome && melhorNome !== '—'
              ? melhorNome
              : 'Consolidar ranking com ao menos dois talhões no mesmo relatório.'}
            {melhorIqi != null ? ` — IQI ${melhorIqi.toFixed(0)}.` : ''}
          </li>
          <li>
            <strong>Diagnóstico geral:</strong>{' '}
            {textoGeral ||
              'Padrão de implantação aferido a partir dos dados registrados no aplicativo FortSmart (plantio, estande e fenologia).'}
          </li>
        </ul>
      </div>
    </>
  );
}
