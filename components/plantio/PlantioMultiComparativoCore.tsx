'use client';

import React from 'react';
import { formatNumber } from '@/utils/format';
import PlantioFenologiaComparativoChart, { type SerieFeno } from './PlantioFenologiaComparativoChart';
import LinhaPlantioVisualizer from './LinhaPlantioVisualizer';
import {
  heroUrlForSnapshot,
  metricasDoSnapshot,
  nomeExibicaoTalhao,
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
                {talhoes.map((t, i) => (
                  <option key={i} value={i}>
                    {nomeExibicaoTalhao(t, i)}
                  </option>
                ))}
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
                  <div className={cmpStyles.photoPlaceholder}>
                    Sem imagem pública para este talhão. Fotos do plantio, estande ou fenologia aparecem aqui quando
                    o relatório é gerado com upload (Supabase) ou URL http no JSON.
                  </div>
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

      <section className={cmpStyles.plantabBlock}>
        <h2 className={cmpStyles.chartTitle}>Plantabilidade, CV% e trena</h2>
        <p className={cmpStyles.chartSub}>
          Estande de plantas e cálculo de CV% (distribuição na linha com medições), no mesmo espírito do relatório web de
          plantio / monitoramento.
        </p>
        <div
          className={cmpStyles.plantabGrid}
          style={{
            gridTemplateColumns:
              displayCount === 1 ? '1fr' : displayCount === 2 ? 'repeat(2, minmax(0, 1fr))' : 'repeat(3, minmax(0, 1fr))',
          }}
        >
          {activeSlotIndices.map((slotIdx, colIdx) => {
            const snap = talhoes[slotIdx];
            if (!snap) return null;
            const plantab = (snap.plantabilidade || {}) as UnknownRec;
            const est = (snap.estande || {}) as UnknownRec;
            const regs = Array.isArray(est.registros) ? (est.registros as UnknownRec[]) : [];
            const r0 = regs[0] ?? {};
            const linha = (plantab.linha || []) as Array<{
              tipo: 'ok' | 'dupla' | 'tripla' | 'falha';
              posicao?: number;
              cm?: number;
              distancia?: number;
            }>;
            const espInd = (plantab.espacamentosIndividuais || []) as Array<{
              cm?: number;
              tipo: string;
              distancia?: number;
            }>;
            const m = activeMetrics[colIdx];
            const cvShow = num(plantab.cvPercentual) ?? m.cvPct;
            const metros = num(r0.metrosLinearesMedidos as unknown as number);
            const contadas = r0.plantasContadas;
            return (
              <div key={`pb-${colIdx}-${slotIdx}`} className={cmpStyles.plantabCol}>
                <h3 className={cmpStyles.plantabColTitle}>{activeNames[colIdx]}</h3>
                <dl className={cmpStyles.plantabDl}>
                  <div>
                    <dt>CV%</dt>
                    <dd>{cvShow != null ? `${cvShow.toFixed(1)}%` : '—'}</dd>
                  </div>
                  <div>
                    <dt>Eficiência emerg.</dt>
                    <dd>{m.emergenciaStr ?? '—'}</dd>
                  </div>
                  <div>
                    <dt>Pop. real (estande)</dt>
                    <dd>{m.popReal != null ? `${formatNumber(m.popReal)} pl/ha` : '—'}</dd>
                  </div>
                  {metros != null ? (
                    <div>
                      <dt>Metros avaliados</dt>
                      <dd>{metros.toFixed(1)} m</dd>
                    </div>
                  ) : null}
                  {contadas != null && String(contadas).trim() !== '' ? (
                    <div>
                      <dt>Plantas contadas</dt>
                      <dd>{String(contadas)}</dd>
                    </div>
                  ) : null}
                  {num(plantab.okPct) != null ? (
                    <div>
                      <dt>OK na linha</dt>
                      <dd>{num(plantab.okPct)!.toFixed(0)}%</dd>
                    </div>
                  ) : null}
                  {num(plantab.duplasPct) != null ? (
                    <div>
                      <dt>Duplas</dt>
                      <dd>{num(plantab.duplasPct)!.toFixed(0)}%</dd>
                    </div>
                  ) : null}
                  {num(plantab.triplasPct) != null ? (
                    <div>
                      <dt>Triplas</dt>
                      <dd>{num(plantab.triplasPct)!.toFixed(0)}%</dd>
                    </div>
                  ) : null}
                  {num(plantab.falhasPct) != null ? (
                    <div>
                      <dt>Falhas</dt>
                      <dd>{num(plantab.falhasPct)!.toFixed(0)}%</dd>
                    </div>
                  ) : null}
                </dl>
                {linha.length > 0 ? (
                  <LinhaPlantioVisualizer
                    linha={linha}
                    okPct={num(plantab.okPct) ?? undefined}
                    duplasPct={num(plantab.duplasPct) ?? undefined}
                    triplasPct={num(plantab.triplasPct) ?? undefined}
                    falhasPct={num(plantab.falhasPct) ?? undefined}
                    indicePlantabilidade={num(plantab.indicePlantabilidade) ?? undefined}
                    espacamentosIndividuais={espInd}
                    embedded
                  />
                ) : (
                  <p className={cmpStyles.plantabHint}>
                    Sem sequência de medições da trena neste snapshot. Com CV% registrado no app (distâncias entre
                    sementes), a distribuição aparece aqui e no painel de análise.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

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
