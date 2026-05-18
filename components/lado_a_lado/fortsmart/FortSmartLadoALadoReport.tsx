'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import EditorialLadoALadoAboveFold from '@/components/lado_a_lado/premium/EditorialLadoALadoAboveFold';
import TreatmentExecutionCombinedSection from '@/components/lado_a_lado/premium/TreatmentExecutionCombinedSection';
import FieldCollectionModulesSection from '@/components/lado_a_lado/premium/FieldCollectionModulesSection';
import SidePhotoGallerySection from '@/components/lado_a_lado/premium/SidePhotoGallerySection';
import PlantEvaluationSection from '@/components/lado_a_lado/premium/PlantEvaluationSection';
import { formatWind, isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate, formatNumber } from '@/utils/format';
import {
  getEvaluationPointsGeo,
  getSubareasGeo,
  getTalhaoPolygonFeatureCollection,
  getTimelineEvents,
} from '@/lib/ladoALadoPayloadExtras';
import type { ColheitaJson, ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import './fortsmart-l2-report.css';
import {
  FortSmartHtmlBeforeAfterAndIA,
  FortSmartHtmlEconCompareTable,
  FortSmartHtmlEconomicHero,
  FortSmartHtmlEvalBarChart,
  FortSmartHtmlExecSummaryCards,
  FortSmartHtmlPhotoExecutionGrid,
  FortSmartHtmlSummaryEvalTable,
  FortSmartHtmlWinnerBanner,
} from '@/components/lado_a_lado/fortsmart/FortSmartHtmlModelBlocks';

const LadoALadoExperimentMap = dynamic(() => import('./LadoALadoExperimentMap'), { ssr: false });

type TabId = 'resumo' | 'tratamento' | 'execucao' | 'avaliacao' | 'economico' | 'conclusao';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'resumo', label: 'Resumo', icon: '📋' },
  { id: 'tratamento', label: 'Tratamento', icon: '🧪' },
  { id: 'execucao', label: 'Execução', icon: '🚜' },
  { id: 'avaliacao', label: 'Avaliação', icon: '📊' },
  { id: 'economico', label: 'Econômico', icon: '💰' },
  { id: 'conclusao', label: 'Conclusão', icon: '🏆' },
];

function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function perfScore(side: SideBySideReportData['sideA']): number | null {
  const ps = side?.kpis?.performanceScore;
  if (typeof ps === 'number' && Number.isFinite(ps)) return Math.min(100, Math.max(0, ps));
  const v = side?.kpis?.vigorCulturaPct;
  if (typeof v === 'number' && Number.isFinite(v)) return Math.min(100, Math.max(0, v));
  return null;
}

function produtosLinha(ev: ReportApplicationEventV2Json): string {
  return (
    ev.products
      ?.map((p) => {
        const d = p.dose != null ? `${p.dose}${p.unidade ? ` ${p.unidade}` : ''}` : '';
        return [p.nomeComercial || p.nomeAtivo || '—', d].filter(Boolean).join(' · ');
      })
      .join(' | ') || '—'
  );
}

function deltaYieldScHa(colheita: ColheitaJson | null): number | null {
  const sides = colheita?.sides;
  if (!sides?.length) return null;
  const a = sides.find((s) => s.side === 'A')?.yieldScHa;
  const b = sides.find((s) => s.side === 'B')?.yieldScHa;
  if (typeof a !== 'number' || typeof b !== 'number' || !Number.isFinite(a) || !Number.isFinite(b)) return null;
  return b - a;
}

function climateLine(apps: ReportApplicationEventV2Json[]): string | null {
  for (let i = apps.length - 1; i >= 0; i--) {
    const ev = apps[i];
    const c = ev.climate;
    if (!c) continue;
    const bits = [
      c.temperature != null ? `${c.temperature}°C` : null,
      c.humidity != null ? `${c.humidity}% UR` : null,
      c.wind != null ? formatWind(c.wind) : null,
    ].filter(Boolean);
    if (bits.length) return bits.join(' · ');
  }
  return null;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function TechnicianObservationPanel({ data }: { data: SideBySideReportData }) {
  const sig = data.conclusion?.signature;
  const exp = data.experiment_design;
  const name =
    sig?.name?.trim() ||
    exp?.technician_name?.trim() ||
    data.meta?.generatedBy?.name?.trim() ||
    'Responsável técnico';
  const crea = sig?.crea?.trim() || exp?.technician_crea?.trim() || '';
  const summary = data.conclusion?.summary?.trim();
  const headline = data.conclusion?.headline?.trim();

  return (
    <div className="ff-l2-tech-box border-emerald-200 bg-emerald-50/35">
      <h4>Observação técnica do responsável</h4>
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{name}</p>
      {crea ? <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>CREA {crea}</p> : null}
      {sig?.city?.trim() ? <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{sig.city.trim()}</p> : null}
      <div
        style={{
          marginTop: '12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(255,255,255,0.85)',
          background: '#fff',
          padding: '16px',
          fontSize: '14px',
          lineHeight: 1.55,
          color: 'var(--text)',
        }}
      >
        {headline ? <p style={{ fontWeight: 700, color: 'var(--green-dark)', marginBottom: '8px' }}>{headline}</p> : null}
        {summary ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{summary}</p>
        ) : (
          <p style={{ margin: 0, fontStyle: 'italic', color: '#92400e' }}>
            Sem texto de observação consolidada — preencha a conclusão na avaliação e publique novamente.
          </p>
        )}
      </div>
      <p style={{ marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
        Texto assinado no aplicativo — sem narrativa genérica automática de “IA”.
      </p>
    </div>
  );
}

export default function FortSmartLadoALadoReport({
  data,
  onPrint,
  onExportPdf,
}: {
  data: SideBySideReportData;
  /** Botões espelham o modelo HTML no cabeçalho — repassados pelo PremiumReport. */
  onPrint?: () => void;
  onExportPdf?: () => void | Promise<void>;
}) {
  const [tab, setTab] = useState<TabId>('resumo');
  const [timelineSel, setTimelineSel] = useState(0);
  const farm = data.farm ?? {};
  const meta = data.meta ?? {};
  const coleta = data.coleta ?? {};
  const exp = data.experiment_design;

  const timeline = useMemo(() => getTimelineEvents(data), [data]);
  const geoPts = useMemo(() => getEvaluationPointsGeo(data), [data]);
  const talhaoFc = useMemo(() => getTalhaoPolygonFeatureCollection(data), [data]);
  const subFc = useMemo(() => getSubareasGeo(data), [data]);

  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';
  const sA = perfScore(data.sideA);
  const sB = perfScore(data.sideB);
  const scoreDiff = sA != null && sB != null ? Math.round(sB - sA) : null;

  const apps = [...(data.applications ?? [])].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const preco = data.economia?.preco_saca_brl ?? data.market_reference?.price_sack_brl ?? null;

  const roiAudit = data.economic_analysis?.roiAudit as Record<string, Record<string, unknown>> | undefined;

  const sig = data.conclusion?.signature;
  const techName = sig?.name?.trim() || exp?.technician_name?.trim() || meta.generatedBy?.name?.trim() || '—';
  const techCrea = sig?.crea?.trim() || exp?.technician_crea?.trim() || '';

  const location =
    [farm.city?.trim(), farm.state?.trim()].filter(Boolean).join(' – ') ||
    exp?.property_label?.trim() ||
    '—';

  const metaDateLine = (() => {
    const bits: string[] = [];
    if (coleta.dae != null) bits.push(`${coleta.dae} DAE`);
    if (coleta.dap != null) bits.push(`${coleta.dap} DAP`);
    if (coleta.dataPlantio) {
      try {
        bits.push(formatDate(coleta.dataPlantio));
      } catch {
        bits.push(String(coleta.dataPlantio));
      }
    }
    return bits.length ? bits.join(' · ') : '—';
  })();

  const clima = climateLine(apps);
  const statusOk = data.resumo?.statusConcluida === true;
  const cultivar = exp?.cultivar_hibrido?.trim() || farm.culture?.trim() || '—';

  const heroTitle =
    data.conclusion?.headline?.trim() ||
    (data.conclusion?.winner === 'B'
      ? `${nameB} — melhor desempenho indicado`
      : data.conclusion?.winner === 'A'
        ? `${nameA} — melhor desempenho indicado`
        : 'Comparativo técnico lado a lado');

  const heroSub =
    truncate(
      farm.objective?.trim() ||
        data.branding?.subtitle?.trim() ||
        data.conclusion?.summary?.trim() ||
        'Dados publicados pelo FortSmart Agro — mesma estrutura de registro da avaliação.',
      220,
    ) || '';

  const dProd = deltaYieldScHa(colheita);
  const heroBadgeParts: string[] = [];
  if (dProd != null) {
    const sign = dProd >= 0 ? '+' : '';
    heroBadgeParts.push(`Δ produtividade (B−A): ${sign}${formatNumber(dProd, { decimals: 1 })} sc/ha`);
  }
  if (preco != null && dProd != null) {
    const rev = dProd * preco;
    heroBadgeParts.push(`≈ ${rev >= 0 ? '+' : ''}R$ ${formatNumber(rev, { decimals: 0 })}/ha receita`);
  }
  const heroBadge = heroBadgeParts.length ? heroBadgeParts.join(' · ') : null;

  return (
    <div className="ff-l2-html print:block">
      <header className="ff-l2-header print:relative">
        <div className="ff-l2-header-left">
          <div className="ff-l2-logo-mark">
            FORT<span>SMART</span>
          </div>
          <h1>
            Relatório Agronômico <span>Lado a Lado</span>
          </h1>
        </div>
        <div className="ff-l2-header-right">
          <div className="ff-l2-header-avatars" aria-hidden>
            <div className="ff-l2-avatar ff-l2-avatar-a" title={nameA}>
              {initials(nameA)}
            </div>
            <div className="ff-l2-avatar ff-l2-avatar-b" title={nameB}>
              {initials(nameB)}
            </div>
          </div>
          {onPrint ? (
            <button type="button" className="ff-l2-btn-export print:hidden" onClick={onPrint}>
              Imprimir
            </button>
          ) : null}
          {onExportPdf ? (
            <button type="button" className="ff-l2-btn-export print:hidden" onClick={() => void onExportPdf()}>
              📄 Exportar PDF
            </button>
          ) : null}
        </div>
      </header>

      <div className="ff-l2-meta-bar">
        <div className="ff-l2-meta-items">
          <span className="ff-l2-meta-item">
            🌾 <strong>{farm.farmName?.trim() || 'Fazenda —'}</strong>
          </span>
          <span className="ff-l2-meta-dot">|</span>
          <span className="ff-l2-meta-item">🌽 {cultivar}</span>
          <span className="ff-l2-meta-dot">|</span>
          <span className="ff-l2-meta-item">📍 {location}</span>
          <span className="ff-l2-meta-dot">|</span>
          <span className="ff-l2-meta-item">📅 {metaDateLine}</span>
          {clima ? (
            <>
              <span className="ff-l2-meta-dot">|</span>
              <span className="ff-l2-meta-item">🌡 {clima}</span>
            </>
          ) : null}
        </div>
        <div className="ff-l2-status-badge">
          <span className="ff-l2-status-dot" />
          {statusOk ? 'Concluída' : 'Em avaliação'}
        </div>
      </div>

      <nav className="ff-l2-tabs-bar print:hidden" aria-label="Abas do relatório">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`ff-l2-tab-btn ${tab === t.id ? 'ff-l2-tab-btn--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="ff-l2-tab-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <div className="ff-l2-content">
        {tab === 'resumo' ? (
          <>
            <div className="ff-l2-hero-result">
              <div className="ff-l2-hero-text">
                <div className="ff-l2-hero-label">Resultado do ensaio</div>
                <div className="ff-l2-hero-title">{heroTitle}</div>
                <div className="ff-l2-hero-sub">{heroSub}</div>
                {heroBadge ? <div className="ff-l2-hero-badge">{heroBadge}</div> : null}
              </div>
              <div className="ff-l2-scores-row">
                <div className="ff-l2-score-circle a">
                  <span className="ff-l2-score-num">{sA != null ? Math.round(sA) : '—'}</span>
                  <span className="ff-l2-score-lbl">{nameA}</span>
                </div>
                <div className="ff-l2-score-circle b">
                  <span className="ff-l2-score-num">{sB != null ? Math.round(sB) : '—'}</span>
                  <span className="ff-l2-score-lbl">{nameB}</span>
                  {scoreDiff != null && scoreDiff !== 0 ? (
                    <span className="ff-l2-score-diff">{scoreDiff > 0 ? `+${scoreDiff}` : scoreDiff} pts</span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="ff-l2-grid-2">
              <div className="ff-l2-card">
                <div className="ff-l2-card-title">
                  <span className="ff-l2-icon">📋</span> Identificação do ensaio
                </div>
                <div className="ff-l2-info-grid">
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Fazenda</div>
                    <div className="ff-l2-val">{farm.farmName?.trim() || '—'}</div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Talhão</div>
                    <div className="ff-l2-val">{farm.fieldName?.trim() || '—'}</div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Área total</div>
                    <div className="ff-l2-val">
                      {farm.areaHa != null ? `${formatNumber(farm.areaHa, { decimals: 2 })} ha` : '—'}
                    </div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Safra</div>
                    <div className="ff-l2-val">{farm.season?.trim() || '—'}</div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Cultivar / cultura</div>
                    <div className="ff-l2-val">{cultivar}</div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Resp. técnico</div>
                    <div className="ff-l2-val">
                      {techName}
                      {techCrea ? ` (CREA ${techCrea})` : ''}
                    </div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Cliente / proprietário</div>
                    <div className="ff-l2-val">{farm.owner?.trim() || '—'}</div>
                  </div>
                  <div className="ff-l2-info-item">
                    <div className="ff-l2-lbl">Empresa</div>
                    <div className="ff-l2-val">{farm.empresa?.trim() || '—'}</div>
                  </div>
                </div>
              </div>

              <div className="ff-l2-card">
                <div className="ff-l2-card-title">
                  <span className="ff-l2-icon">🎯</span> Objetivo e contexto
                </div>
                <div className="ff-l2-info-grid">
                  <div className="ff-l2-info-item" style={{ gridColumn: '1 / -1' }}>
                    <div className="ff-l2-lbl">Objetivo</div>
                    <div className="ff-l2-val" style={{ fontWeight: 500 }}>
                      {farm.objective?.trim() || exp?.objective_text?.trim() || exp?.objective_notes?.trim() || '—'}
                    </div>
                  </div>
                  {exp?.delineamento ? (
                    <div className="ff-l2-info-item">
                      <div className="ff-l2-lbl">Delineamento</div>
                      <div className="ff-l2-val">{exp.delineamento}</div>
                    </div>
                  ) : null}
                  {coleta.pointCount != null ? (
                    <div className="ff-l2-info-item">
                      <div className="ff-l2-lbl">Pontos de coleta</div>
                      <div className="ff-l2-val">{coleta.pointCount}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <section className="ff-l2-card">
              <div className="ff-l2-section-label">Linha do tempo (campo)</div>
              <div className="ff-l2-card-title" style={{ marginBottom: '12px' }}>
                <span className="ff-l2-icon">📆</span> Visitas / etapas registradas
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', lineHeight: 1.5 }}>
                Etapas como “7 DAA / 14 DAA” aparecem quando o JSON incluir <code>timeline_events</code> na publicação.
              </p>
              <div className="ff-l2-chip-row">
                {timeline.length === 0 ? (
                  <span className="ff-l2-chip" style={{ cursor: 'default' }}>
                    Sem timeline no payload — publique novamente após atualização do app
                  </span>
                ) : (
                  timeline.map((ev, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`ff-l2-chip ${timelineSel === i ? 'ff-l2-chip--active' : ''}`}
                      onClick={() => setTimelineSel(i)}
                    >
                      {ev.date ? `${ev.date} · ` : ''}
                      {ev.description || 'Evento'}
                    </button>
                  ))
                )}
              </div>
              {timeline.length > 0 ? (
                <p
                  style={{
                    marginTop: '12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg)',
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: 'var(--text)',
                  }}
                >
                  <strong style={{ color: 'var(--green-dark)' }}>Etapa selecionada:</strong>{' '}
                  {timeline[timelineSel]?.description || '—'}
                  {timeline[timelineSel]?.date ? (
                    <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {timeline[timelineSel]!.date}
                    </span>
                  ) : null}
                </p>
              ) : null}
            </section>

            <section className="ff-l2-card">
              <div className="ff-l2-section-label">Georreferenciamento</div>
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">🗺️</span> Mapa do ensaio
              </div>
              <LadoALadoExperimentMap talhaoGeo={talhaoFc} subareasGeo={subFc} points={geoPts} height={320} />
            </section>

            <div className="ff-l2-embed-slot">
              <EditorialLadoALadoAboveFold data={data} embedded />
            </div>
          </>
        ) : null}

        {tab === 'tratamento' ? (
          <>
            <div className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">🧪</span> Protocolo por manejo
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Fonte: <code>treatment_protocol</code> publicado pela avaliação — produtos, doses e custos ligados ao SQLite do módulo.
              </p>
            </div>
            <TreatmentExecutionCombinedSection data={data} embedded />
          </>
        ) : null}

        {tab === 'execucao' ? (
          <>
            <div className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">🚜</span> Execução em campo
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Registros em <code>applications[]</code>. Mapa de rota GPS / sobreposição será exibido quando o export FortSmart incluir geometria de aplicação.
              </p>
            </div>
            <FortSmartHtmlExecSummaryCards data={data} appsSorted={apps} />
            <FortSmartHtmlPhotoExecutionGrid data={data} />
            {apps.length === 0 ? (
              <div className="ff-l2-card" style={{ borderStyle: 'dashed', borderColor: '#fcd34d', background: '#fffbeb' }}>
                <p style={{ margin: 0, fontSize: '14px', color: '#78350f' }}>
                  Nenhuma execução publicada em <code>applications[]</code>.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <table style={{ width: '100%', minWidth: 880, borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                  <thead style={{ background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '10px 8px' }}>Data</th>
                      <th style={{ padding: '10px 8px' }}>Teste</th>
                      <th style={{ padding: '10px 8px' }}>DAA</th>
                      <th style={{ padding: '10px 8px' }}>Tipo</th>
                      <th style={{ padding: '10px 8px' }}>Produtos</th>
                      <th style={{ padding: '10px 8px' }}>Clima</th>
                      <th style={{ padding: '10px 8px' }}>Equip.</th>
                      <th style={{ padding: '10px 8px', minWidth: 140 }}>Observações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map((ev, i) => (
                      <tr key={ev.id || `${ev.date}-${i}`} style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
                        <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {ev.date ? formatDate(ev.date) : '—'}
                        </td>
                        <td style={{ padding: '10px 8px', fontWeight: 700 }}>{ev.side === 'B' ? nameB : nameA}</td>
                        <td style={{ padding: '10px 8px' }}>{ev.daa ?? '—'}</td>
                        <td style={{ padding: '10px 8px' }}>{ev.type || '—'}</td>
                        <td style={{ padding: '10px 8px', maxWidth: 220 }}>{produtosLinha(ev)}</td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                          {[
                            ev.climate?.temperature != null ? `${ev.climate.temperature}°C` : null,
                            ev.climate?.humidity != null ? `${ev.climate.humidity}% UR` : null,
                            ev.climate?.wind != null ? formatWind(ev.climate.wind) : null,
                          ]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </td>
                        <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                          {[ev.applicationTech?.bico, ev.applicationTech?.vazao != null ? `${ev.applicationTech.vazao} L/min` : null]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          {ev.notes?.trim() ? (
                            <span style={{ whiteSpace: 'pre-wrap' }}>{ev.notes.trim()}</span>
                          ) : (
                            <span style={{ fontStyle: 'italic', color: '#92400e' }}>Sem observação</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : null}

        {tab === 'avaliacao' ? (
          <>
            <div className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">📊</span> Avaliação técnica
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Layout alinhado ao modelo HTML de referência: tabela por <code>summary_rows</code>, gráfico de barras a partir de{' '}
                <code>plant_evaluation.metrics</code> ou KPIs dos lados, comparativo antes/depois nas fotos (
                <code>hotspots[].applicationMoment</code>
                ), mapa e coleta estruturada.
              </p>
            </div>

            <FortSmartHtmlSummaryEvalTable data={data} />
            <FortSmartHtmlEvalBarChart data={data} />
            <FortSmartHtmlBeforeAfterAndIA data={data} />

            <section className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">🗺️</span> Pontos georreferenciados
              </div>
              <LadoALadoExperimentMap talhaoGeo={talhaoFc} subareasGeo={subFc} points={geoPts} height={360} />
              {geoPts.length === 0 ? (
                <p style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Publique com snapshot geo (<code>evaluation_points_geo</code>) para pins no mapa.
                </p>
              ) : null}
            </section>

            <div className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">📷</span> Galeria por lado
              </div>
              <SidePhotoGallerySection data={data} embedded />
            </div>

            <PlantEvaluationSection data={data} />

            <section className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">📑</span> Coleta estruturada (módulos)
              </div>
              <FieldCollectionModulesSection data={data} sectionId="fs-l2-field-modules" compact />
            </section>

            <TechnicianObservationPanel data={data} />

            {data.diagnosis ? (
              <div className="ff-l2-tech-box">
                <h4>Diagnóstico registrado</h4>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '14px', lineHeight: 1.55 }}>
                  {data.diagnosis.problemaPrincipal ? <li>{data.diagnosis.problemaPrincipal}</li> : null}
                  {(data.diagnosis.problemasSecundarios ?? []).map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                  {data.diagnosis.planoAcao ? (
                    <li>
                      <strong>Plano:</strong> {data.diagnosis.planoAcao}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}

        {tab === 'economico' ? (
          <>
            <div className="ff-l2-card">
              <div className="ff-l2-card-title">
                <span className="ff-l2-icon">💰</span> Análise econômica
              </div>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Valores de <code>colheita</code>, <code>custo</code>, <code>economia</code>, <code>decision_layer.roiBySide</code> — mesmos registros da avaliação publicada.
              </p>
              {preco != null ? (
                <p style={{ marginTop: '12px', fontSize: '14px' }}>
                  Preço referência saca:{' '}
                  <strong>R$ {formatNumber(preco, { decimals: 2 })}/sc</strong>
                </p>
              ) : null}
            </div>

            <FortSmartHtmlEconomicHero data={data} />
            <FortSmartHtmlEconCompareTable data={data} />

            {roiAudit ? (
              <div className="ff-l2-card" style={{ background: 'var(--bg)' }}>
                <div className="ff-l2-card-title">Auditoria ROI</div>
                <pre style={{ margin: 0, overflowX: 'auto', fontSize: '11px', color: 'var(--text-muted)' }}>
                  {JSON.stringify(roiAudit, null, 2)}
                </pre>
              </div>
            ) : null}

            {colheita?.sides?.length ? (
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead style={{ background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Teste</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>sc/ha</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>kg/ha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {colheita.sides.map((s, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
                        <td style={{ padding: '12px 10px', fontWeight: 600 }}>{s.sideName || (s.side === 'A' ? nameA : nameB)}</td>
                        <td style={{ padding: '12px 10px' }}>{s.yieldScHa != null ? formatNumber(s.yieldScHa, { decimals: 1 }) : '—'}</td>
                        <td style={{ padding: '12px 10px' }}>{s.yieldKgHa != null ? formatNumber(s.yieldKgHa, { decimals: 0 }) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ff-l2-card">
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Sem colheita publicada.</p>
              </div>
            )}

            {custo?.by_side?.length ? (
              <div style={{ overflowX: 'auto', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead style={{ background: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                    <tr>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>Teste</th>
                      <th style={{ padding: '12px 10px', textAlign: 'left' }}>R$/ha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {custo.by_side.map((r, i) => (
                      <tr key={i} style={{ borderTop: '1px solid var(--border)', background: '#fff' }}>
                        <td style={{ padding: '12px 10px' }}>{r.sideName || (r.side === 'A' ? nameA : nameB)}</td>
                        <td style={{ padding: '12px 10px' }}>
                          {r.costPerHa != null ? `R$ ${formatNumber(r.costPerHa, { decimals: 2 })}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="ff-l2-card">
                <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>Sem custos por lado publicados.</p>
              </div>
            )}
          </>
        ) : null}

        {tab === 'conclusao' ? (
          <>
            <FortSmartHtmlWinnerBanner data={data} />

            <TechnicianObservationPanel data={data} />

            {(data.conclusion?.recommendations ?? []).filter(Boolean).length > 0 ? (
              <div className="ff-l2-tech-box">
                <h4>Recomendações listadas</h4>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '14px' }}>
                  {(data.conclusion!.recommendations ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {(data.ocorrencias ?? []).length > 0 ? (
              <div className="ff-l2-tech-box">
                <h4>Ocorrências</h4>
                <ul style={{ margin: '8px 0 0', paddingLeft: '0', listStyle: 'none', fontSize: '14px' }}>
                  {(data.ocorrencias ?? []).map((o, i) => (
                    <li key={i} style={{ marginBottom: '8px' }}>
                      <strong>{o.tipo}</strong> · {o.nomeAlvo} · sev. {o.severidade ?? '—'}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
