'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { formatNumber, formatPercent } from '@/utils/format';
import LinhaPlantioVisualizer from '../LinhaPlantioVisualizer';
import PlantioFenologiaComparativoChart from '../PlantioFenologiaComparativoChart';
import {
  heroUrlForSnapshot,
  metricasDoSnapshot,
  serieFenologia,
  str,
  num,
  type UnknownRec,
} from '../plantio-comparativo-utils';
import styles from './plantio-analise-drawer.module.css';

type TabId = 'implantacao' | 'fenologia' | 'operacao' | 'diagnostico' | 'evidencias';

const TABS: { id: TabId; label: string }[] = [
  { id: 'implantacao', label: 'Implantação' },
  { id: 'fenologia', label: 'Fenologia' },
  { id: 'operacao', label: 'Operação' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'evidencias', label: 'Evidências' },
];

function mapAnalise(s: UnknownRec): UnknownRec {
  const a = s.analiseAgronomica;
  if (a != null && typeof a === 'object' && !Array.isArray(a)) return a as UnknownRec;
  return {};
}

export default function PlantioAnaliseDrawer({
  open,
  snapshot,
  reportId,
  metaSafra,
  onClose,
  onComparar,
  wide = false,
}: {
  open: boolean;
  snapshot: UnknownRec;
  reportId?: string;
  metaSafra?: string;
  onClose: () => void;
  onComparar?: () => void;
  wide?: boolean;
}) {
  const [tab, setTab] = useState<TabId>('implantacao');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) setTab('implantacao');
  }, [open, snapshot]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleExportPdf = useCallback(async () => {
    const el = document.getElementById('plantio-analise-pdf-root');
    if (!el) return;
    const th = (snapshot.talhao || {}) as UnknownRec;
    const safeNome = (str(th.nome) || 'talhao').replace(/\s/g, '_').replace(/[^\w.-]/g, '');
    document.body.classList.add('exporting-pdf');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: [10, 10, 10, 10],
          filename: `FortSmart_Analise_Plantio_${safeNome}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();
    } finally {
      document.body.classList.remove('exporting-pdf');
    }
  }, [snapshot]);

  if (!open) return null;

  const talhao = (snapshot.talhao || {}) as UnknownRec;
  const meta = (snapshot.meta || {}) as UnknownRec;
  const plantab = (snapshot.plantabilidade || {}) as UnknownRec;
  const pop = (snapshot.populacao || {}) as UnknownRec;
  const fen = (snapshot.fenologia || {}) as UnknownRec;
  const evo = (snapshot.evolucaoCultura || {}) as UnknownRec;
  const diagInt = (snapshot.diagnosticoIntegrado || {}) as UnknownRec;
  const iqiB = (snapshot.indiceQualidadeImplantacao || {}) as UnknownRec;
  const analise = mapAnalise(snapshot);
  const impl = (analise.implantacao || {}) as UnknownRec;
  const fenA = (analise.fenologia || {}) as UnknownRec;
  const opA = (analise.operacaoPlantio || {}) as UnknownRec;
  const diagA = (analise.diagnostico || {}) as UnknownRec;
  const evA = (analise.evidencias || {}) as UnknownRec;
  const motor = (analise.motor || {}) as UnknownRec;

  const m = metricasDoSnapshot(snapshot);
  const nomeTalhao = str(talhao.nome);
  const cultura = str(talhao.cultura);
  const safra = metaSafra ?? str(meta.safra);

  const linha = (plantab.linha || []) as Array<{ tipo: 'ok' | 'dupla' | 'tripla' | 'falha'; posicao?: number; cm?: number }>;
  const espInd = (plantab.espacamentosIndividuais || []) as Array<{ cm?: number; tipo: string }>;

  const hipoteses = (Array.isArray(diagA.hipoteses) ? diagA.hipoteses : diagInt.hipoteses) as string[] | undefined;
  const recs = (Array.isArray(diagA.recomendacoes) ? diagA.recomendacoes : diagInt.recomendacoes) as
    | string[]
    | undefined;
  const textoDiag = str(diagA.texto || diagInt.texto);

  const timelineResumo = (fenA.timelineResumo as UnknownRec[] | undefined) ?? [];
  const morfo = (fenA.morfologiaUltimoRegistro || {}) as UnknownRec;
  const espVs = (fenA.esperadoVsAtual || {}) as UnknownRec;

  const uni = (opA.uniformidadeResumo || {}) as UnknownRec;
  const relQ = (opA.relatorioQualidadePlantio || {}) as UnknownRec;
  const fonteOp = str(opA.fonteDados);

  const categorias = (evA.categorias || {}) as UnknownRec;
  const urlsPlantio = (categorias.plantio as string[] | undefined) ?? [];
  const urlsFeno = (categorias.fenologia as string[] | undefined) ?? [];

  const correlacoes = (motor.correlacoes || []) as UnknownRec[];
  const sub = (motor.subscores || {}) as UnknownRec;

  const fenoSeries = [
    {
      key: 's0',
      name: nomeTalhao || 'Talhão',
      color: '#166534',
      points: serieFenologia(snapshot),
    },
  ];

  const hero = heroUrlForSnapshot(snapshot, reportId);

  return (
    <>
      <div
        className={styles.backdrop}
        aria-hidden
        onClick={onClose}
        onKeyDown={() => {}}
      />
      <aside
        ref={panelRef}
        className={`${styles.drawer} ${wide ? styles.drawerWide : ''}`}
        role="dialog"
        aria-modal
        aria-labelledby="plantio-analise-title"
      >
        <div id="plantio-analise-pdf-root" className={styles.pdfRoot}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleBlock}>
              <h2 id="plantio-analise-title">Talhão: {nomeTalhao || '—'}</h2>
              <p className={styles.metaLine}>
                {cultura || '—'} | Safra {safra || '—'}
              </p>
              <div className={styles.iqiRow}>
                IQI: {m.iqi != null ? `${Math.round(m.iqi)} (${m.iqiLabel})` : '—'}
              </div>
            </div>
            <div className={`${styles.actions} ${styles.noPrint} no-print`}>
              {onComparar ? (
                <button type="button" className={styles.btn} onClick={onComparar}>
                  Comparar
                </button>
              ) : null}
              <button type="button" className={styles.btn} onClick={handlePrint}>
                Imprimir
              </button>
              <button type="button" className={styles.btn} onClick={handleExportPdf}>
                PDF
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onClose}>
                Fechar
              </button>
            </div>
          </div>
          <nav className={`${styles.tabBar} ${styles.noPrint} no-print`} aria-label="Domínios técnicos">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`${styles.tab} ${tab === t.id ? styles.tabActive : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </header>

        <div className={styles.body}>
          {tab === 'implantacao' && (
            <>
              <p className={styles.sectionTitle}>Resumo</p>
              <p className={styles.prose}>
                {str(impl.insight) ||
                  'Dados de implantação consolidados a partir do módulo Plantio (estande, CV% e plantio base).'}
              </p>
              <dl className={styles.dlGrid}>
                <dt>População desejada</dt>
                <dd>
                  {num(impl.populacaoDesejadaPlHa) != null
                    ? `${formatNumber(num(impl.populacaoDesejadaPlHa)!)} pl/ha`
                    : num(pop.plantasHa) != null
                      ? `${formatNumber(num(pop.plantasHa)!)} pl/ha`
                      : '—'}
                </dd>
                <dt>População real</dt>
                <dd>
                  {num(impl.populacaoRealPlHa) != null
                    ? `${formatNumber(num(impl.populacaoRealPlHa)!)} pl/ha`
                    : num(pop.estandeEfetivoPlHa) != null
                      ? `${formatNumber(num(pop.estandeEfetivoPlHa)!)} pl/ha`
                      : '—'}
                </dd>
                <dt>Δ população</dt>
                <dd>
                  {num(impl.deltaPopulacaoPct) != null
                    ? `${num(impl.deltaPopulacaoPct)!.toFixed(1)}%`
                    : '—'}
                </dd>
                <dt>Emergência / eficiência</dt>
                <dd>{m.emergenciaStr ?? (num(pop.eficienciaPct) != null ? formatPercent(num(pop.eficienciaPct)!) : '—')}</dd>
                <dt>CV%</dt>
                <dd>{num(impl.cvPercentual) != null ? `${num(impl.cvPercentual)!.toFixed(1)}%` : m.cvPct != null ? `${m.cvPct.toFixed(1)}%` : '—'}</dd>
                <dt>Espaçamento real (cm)</dt>
                <dd>{num(plantab.espacamentoRealCm) != null ? num(plantab.espacamentoRealCm)!.toFixed(1) : '—'}</dd>
                <dt>Espaçamento alvo (cm)</dt>
                <dd>{num(plantab.espacamentoIdealCm) != null ? num(plantab.espacamentoIdealCm)!.toFixed(1) : '—'}</dd>
              </dl>
              {linha.length > 0 ? (
                <>
                  <p className={styles.sectionTitle}>Trena (distribuição)</p>
                  <LinhaPlantioVisualizer
                    linha={linha}
                    okPct={num(plantab.okPct)}
                    duplasPct={num(plantab.duplasPct)}
                    triplasPct={num(plantab.triplasPct)}
                    falhasPct={num(plantab.falhasPct)}
                    indicePlantabilidade={num(plantab.indicePlantabilidade)}
                    espacamentosIndividuais={espInd}
                    embedded
                  />
                </>
              ) : null}
            </>
          )}

          {tab === 'fenologia' && (
            <>
              <p className={styles.sectionTitle}>Linha do tempo (DAE → estágio)</p>
              {timelineResumo.length > 0 ? (
                <ul className={styles.timelineList}>
                  {timelineResumo.map((row, i) => {
                    const daeTxt =
                      num(row.dae) != null ? String(num(row.dae)) : str(row.dae) || '—';
                    const dataTxt = row.dataRegistro
                      ? ` · ${str(row.dataRegistro).slice(0, 10)}`
                      : '';
                    return (
                      <li key={i}>
                        {`DAE ${daeTxt} → ${str(row.estagio)}${dataTxt}`}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className={styles.prose}>Sem resumo; consulte a timeline completa no relatório.</p>
              )}
              <p className={styles.sectionTitle}>Gráfico DAE × estágio</p>
              <PlantioFenologiaComparativoChart series={fenoSeries} />
              <p className={styles.sectionTitle}>Morfologia (último registro)</p>
              <dl className={styles.dlGrid}>
                <dt>Altura</dt>
                <dd>{num(morfo.alturaCm) != null ? `${num(morfo.alturaCm)} cm` : '—'}</dd>
                <dt>Entre-nós</dt>
                <dd>{num(morfo.espacamentoEntreNosCm) != null ? `${num(morfo.espacamentoEntreNosCm)} cm` : '—'}</dd>
                <dt>Folhas</dt>
                <dd>{morfo.numeroFolhas != null ? String(morfo.numeroFolhas) : '—'}</dd>
                <dt>Nós</dt>
                <dd>{morfo.numeroNos != null ? String(morfo.numeroNos) : '—'}</dd>
              </dl>
              <p className={styles.sectionTitle}>Esperado vs atual</p>
              <p className={styles.prose}>
                Esperado: {str(espVs.estagioEsperado) || str(evo.estadioPrevisto) || '—'} · Atual:{' '}
                {str(espVs.estagioAtual) || str(evo.estadioAtual) || str(fen.estadio) || '—'}
                {num(espVs.desvioEstagios) != null || num(evo.atrasoFenologico) != null
                  ? ` · Desvio: ${num(espVs.desvioEstagios) ?? num(evo.atrasoFenologico)} estágio(s) (aprox.)`
                  : ''}
              </p>
              {hero ? (
                <p className={styles.sectionTitle}>Referência visual</p>
              ) : null}
              {hero ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hero} alt="" style={{ width: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />
              ) : null}
            </>
          )}

          {tab === 'operacao' && (
            <>
              <p className={styles.sectionTitle}>Operação de plantio</p>
              <p className={styles.prose}>
                Fonte: {fonteOp || 'plantabilidade (trena)'}
                {str(opA.velocidadePlantioKmh) ? ` · Velocidade: ${opA.velocidadePlantioKmh} km/h` : ''}
              </p>
              {!str(opA.velocidadePlantioKmh) ? (
                <p className={styles.prose}>
                  Velocidade de plantio, regulagem mecânica e deposição detalhada ainda não estão no JSON público;
                  use o resumo de uniformidade abaixo (derivado da trena/CV%).
                </p>
              ) : null}
              <dl className={styles.dlGrid}>
                <dt>Duplas %</dt>
                <dd>{num(uni.duplasPct) != null ? `${num(uni.duplasPct)!.toFixed(1)}%` : '—'}</dd>
                <dt>Triplas %</dt>
                <dd>{num(uni.triplasPct) != null ? `${num(uni.triplasPct)!.toFixed(1)}%` : '—'}</dd>
                <dt>Falhas %</dt>
                <dd>{num(uni.falhasPct) != null ? `${num(uni.falhasPct)!.toFixed(1)}%` : '—'}</dd>
                <dt>OK %</dt>
                <dd>{num(uni.okPct) != null ? `${num(uni.okPct)!.toFixed(1)}%` : '—'}</dd>
              </dl>
              {(opA.hipotesesOperacao as string[] | undefined)?.length ? (
                <>
                  <p className={styles.sectionTitle}>Hipóteses operacionais</p>
                  <ul className={styles.bullets}>
                    {(opA.hipotesesOperacao as string[]).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {str(relQ.analiseAutomatica) ? (
                <>
                  <p className={styles.sectionTitle}>Relatório de qualidade (histórico)</p>
                  <p className={styles.prose}>{str(relQ.analiseAutomatica)}</p>
                  {str(relQ.sugestoes) ? <p className={styles.prose}>{str(relQ.sugestoes)}</p> : null}
                </>
              ) : null}
            </>
          )}

          {tab === 'diagnostico' && (
            <>
              {textoDiag && textoDiag !== '—' ? <p className={styles.prose}>{textoDiag}</p> : null}
              {hipoteses?.length ? (
                <>
                  <p className={styles.sectionTitle}>Hipóteses</p>
                  <ul className={styles.bullets}>
                    {hipoteses.slice(0, 12).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {recs?.length ? (
                <>
                  <p className={styles.sectionTitle}>Recomendações</p>
                  <ul className={styles.bullets}>
                    {recs.slice(0, 16).map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                </>
              ) : null}
              {!textoDiag && !hipoteses?.length && !recs?.length ? (
                <p className={styles.prose}>Sem diagnóstico automático para este talhão.</p>
              ) : null}
            </>
          )}

          {tab === 'evidencias' && (
            <>
              <p className={styles.sectionTitle}>Fotos plantio</p>
              <div className={styles.strip}>
                {urlsPlantio.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={u} alt="" />
                ))}
              </div>
              <p className={styles.sectionTitle}>Fotos fenologia</p>
              <div className={styles.strip}>
                {urlsFeno.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={u} alt="" />
                ))}
              </div>
              {urlsPlantio.length === 0 && urlsFeno.length === 0 ? (
                <p className={styles.prose}>Nenhuma URL pública de imagem; gere o relatório com upload de fotos.</p>
              ) : null}
            </>
          )}

          <div className={styles.motorBox}>
            <p className={styles.sectionTitle}>Motor agronômico (resumo)</p>
            <p className={styles.prose}>
              Risco produtivo: <strong>{str(motor.riscoProdutivo) || '—'}</strong>
            </p>
            {correlacoes.length > 0 ? (
              <ul className={styles.bullets}>
                {correlacoes.map((c, i) => (
                  <li key={i}>{str(c.mensagem)}</li>
                ))}
              </ul>
            ) : null}
            <div className={styles.motorScores}>
              <span>Impl.: {str(sub.implantacao) || '—'}</span>
              <span>Fen.: {str(sub.fenologia) || '—'}</span>
              <span>Oper.: {str(sub.operacao) || '—'}</span>
              <span>Geral: {str(sub.geral) || '—'}</span>
            </div>
          </div>
        </div>
        </div>
      </aside>
    </>
  );
}
