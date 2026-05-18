'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { DecisionLayerJson } from '@/lib/decisionLayer';
import { resolveReportPhotoSrc } from '@/lib/resolveReportPhotoSrc';
import { formatDate, formatNumber } from '@/utils/format';
import { formatWind, isColheitaJson, isCustoJson } from '@/components/lado_a_lado/ladoALadoHelpers';
import type { PlantEvaluationMetricJson, ReportPhotoWeb } from '@/types/side-by-side-report';

function parseRowNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = v.replace(/\s/g, '').replace(',', '.');
    const m = /^-?\d+(\.\d+)?/.exec(t);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function criteriaLabel(row: Record<string, unknown>): string {
  const c = row.criteria ?? row.criterio;
  return typeof c === 'string' && c.trim() ? c.trim() : '—';
}

function classifyMoment(p: ReportPhotoWeb): 'antes' | 'depois' | null {
  const cap = (p.caption ?? '').toLowerCase();
  if (/\bantes\b|pré|pre-aplic|pre aplic/i.test(cap)) return 'antes';
  if (/\bdepois\b|p[oó]s|pos-aplic|pós aplic|\bdda\b/i.test(cap)) return 'depois';
  for (const h of p.hotspots ?? []) {
    const m = h.applicationMoment?.trim().toLowerCase();
    if (m === 'antes') return 'antes';
    if (m === 'depois') return 'depois';
  }
  return null;
}

function pickBeforeAfterPhotos(
  photos: ReportPhotoWeb[],
): { antes?: ReportPhotoWeb; depois?: ReportPhotoWeb } {
  let antes: ReportPhotoWeb | undefined;
  let depois: ReportPhotoWeb | undefined;
  for (const p of photos) {
    const m = classifyMoment(p);
    if (m === 'antes' && !antes && resolveReportPhotoSrc(p)) antes = p;
    if (m === 'depois' && !depois && resolveReportPhotoSrc(p)) depois = p;
  }
  return { antes, depois };
}

/** Fotos da execução / campo — até 6 slots (mesma ideia do HTML), dados em `sideA.photos` / `sideB.photos`. */
export function FortSmartHtmlPhotoExecutionGrid({ data }: { data: SideBySideReportData }) {
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';
  const merged: { p: ReportPhotoWeb; side: string }[] = [
    ...(data.sideA?.photos ?? []).map((p) => ({ p, side: nameA })),
    ...(data.sideB?.photos ?? []).map((p) => ({ p, side: nameB })),
  ].slice(0, 6);

  if (merged.length === 0) return null;

  return (
    <section className="ff-l2-card">
      <div className="ff-l2-card-title">
        <span className="ff-l2-icon">📷</span> Fotos da execução / campo
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
        Fonte JSON: <code>sideA.photos</code> e <code>sideB.photos</code> (legendas e categorias do app).
      </p>
      <div className="ff-l2-photo-grid">
        {merged.map(({ p, side }, i) => {
          const src = resolveReportPhotoSrc(p);
          const label =
            [p.category?.trim(), p.caption?.trim()].filter(Boolean).join(' · ') ||
            `${side} · foto ${i + 1}`;
          return (
            <div key={`${side}-${i}`} className="ff-l2-photo-slot">
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={label} />
              ) : (
                <span className="ff-l2-photo-placeholder" aria-hidden>
                  📷
                </span>
              )}
              <div className="ff-l2-photo-label">{label}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Cartões tipo HTML exec-grid a partir da última entrada útil de `applications[]`. */
export function FortSmartHtmlExecSummaryCards({
  data,
  appsSorted,
}: {
  data: SideBySideReportData;
  appsSorted: NonNullable<SideBySideReportData['applications']>;
}) {
  if (appsSorted.length === 0) return null;
  const ev = [...appsSorted].sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
  const sideLabel = ev.side === 'B' ? data.sideB?.name?.trim() || 'B' : data.sideA?.name?.trim() || 'A';

  const cards: { lbl: string; val: string }[] = [
    { lbl: 'Data da aplicação', val: ev.date ? formatDate(ev.date) : '—' },
    { lbl: 'Manejo', val: sideLabel },
    { lbl: 'DAA', val: ev.daa != null ? String(ev.daa) : '—' },
    { lbl: 'Tipo', val: ev.type?.trim() || '—' },
    {
      lbl: 'Clima',
      val:
        [
          ev.climate?.temperature != null ? `${ev.climate.temperature}°C` : null,
          ev.climate?.humidity != null ? `${ev.climate.humidity}% UR` : null,
          ev.climate?.wind != null ? formatWind(ev.climate.wind) : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    {
      lbl: 'Bico / vazão / pressão',
      val:
        [
          ev.applicationTech?.bico,
          ev.applicationTech?.vazao != null ? `${ev.applicationTech.vazao} L/min` : null,
          ev.applicationTech?.pressao != null ? `${ev.applicationTech.pressao} bar` : null,
        ]
          .filter(Boolean)
          .join(' · ') || '—',
    },
    { lbl: 'Responsável', val: ev.responsible?.trim() || '—' },
  ];

  return (
    <section className="ff-l2-card">
      <div className="ff-l2-card-title">
        <span className="ff-l2-icon">🚜</span> Resumo da última execução registrada
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
        Fonte: último evento cronológico em <code>applications[]</code> (campos V2 do módulo).
      </p>
      <div className="ff-l2-exec-grid">
        {cards.map((c) => (
          <div key={c.lbl} className="ff-l2-exec-card">
            <div className="lbl">{c.lbl}</div>
            <div className="val">{c.val}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatCellDisplay(v: unknown, unit?: string): string {
  if (v == null || v === '') return '—';
  const n = parseRowNum(v);
  if (n != null) return unit ? `${formatNumber(n, { decimals: n % 1 === 0 ? 0 : 2 })} ${unit}`.trim() : formatNumber(n, { decimals: n % 1 === 0 ? 0 : 2 });
  return String(v);
}

/** Tabela estilo HTML — linhas de `summary_rows` (critério + valores A/B + barras quando 0–100). */
export function FortSmartHtmlSummaryEvalTable({ data }: { data: SideBySideReportData }) {
  const rows = Array.isArray(data.summary_rows)
    ? data.summary_rows.filter((r): r is Record<string, unknown> => r != null && typeof r === 'object' && !Array.isArray(r))
    : [];
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';

  if (rows.length === 0) return null;

  return (
    <section className="ff-l2-card">
      <div className="ff-l2-card-title">
        <span className="ff-l2-icon">📊</span> Resultados por critério (<code>summary_rows</code>)
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="ff-l2-eval-table">
          <thead>
            <tr>
              <th>Variável</th>
              <th>[A] {nameA}</th>
              <th>[B] {nameB}</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 24).map((row, i) => {
              const lab = criteriaLabel(row);
              const u = typeof row.unit === 'string' ? row.unit : typeof row.unidade === 'string' ? row.unidade : '';
              const aNum = parseRowNum(row.value_a_num ?? row.value_a);
              const bNum = parseRowNum(row.value_b_num ?? row.value_b);
              const showBars =
                aNum != null &&
                bNum != null &&
                aNum >= 0 &&
                bNum >= 0 &&
                aNum <= 100 &&
                bNum <= 100 &&
                Number.isFinite(aNum) &&
                Number.isFinite(bNum);

              return (
                <tr key={`${lab}-${i}`}>
                  <td>
                    <strong>{lab}</strong>
                    {u ? <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}> ({u})</span> : null}
                  </td>
                  <td>
                    {showBars ? (
                      <>
                        <div>{formatNumber(aNum, { decimals: 1 })}%</div>
                        <div className="ff-l2-pct-bar-wrap">
                          <div className="ff-l2-pct-bar-fill ff-l2-fill-a" style={{ width: `${Math.min(100, aNum)}%` }} />
                        </div>
                      </>
                    ) : (
                      formatCellDisplay(row.value_a_num ?? row.value_a, u)
                    )}
                  </td>
                  <td>
                    {showBars ? (
                      <>
                        <div style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{formatNumber(bNum, { decimals: 1 })}%</div>
                        <div className="ff-l2-pct-bar-wrap">
                          <div className="ff-l2-pct-bar-fill ff-l2-fill-b" style={{ width: `${Math.min(100, bNum)}%` }} />
                        </div>
                      </>
                    ) : (
                      formatCellDisplay(row.value_b_num ?? row.value_b, u)
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Barras comparativas — prioridade `plant_evaluation.metrics`; senão KPIs principais dos lados. */
export function FortSmartHtmlEvalBarChart({ data }: { data: SideBySideReportData }) {
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';
  const metrics = data.plant_evaluation?.metrics ?? [];

  type BarRow = { label: string; a: number; b: number };
  let groups: BarRow[] = [];

  if (metrics.length > 0) {
    groups = metrics
      .filter((m): m is PlantEvaluationMetricJson & { meanA: number; meanB: number } => {
        const a = m.meanA;
        const b = m.meanB;
        return typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b);
      })
      .slice(0, 8)
      .map((m) => ({
        label: [m.label || m.key || 'Métrica', m.unit ? `(${m.unit})` : ''].filter(Boolean).join(' '),
        a: m.meanA as number,
        b: m.meanB as number,
      }));
  }

  if (groups.length === 0) {
    const kpA = data.sideA?.kpis;
    const kpB = data.sideB?.kpis;
    const cand: BarRow[] = [];
    const pushIf = (label: string, a: number | null | undefined, b: number | null | undefined) => {
      if (typeof a === 'number' && typeof b === 'number' && Number.isFinite(a) && Number.isFinite(b)) {
        cand.push({ label, a, b });
      }
    };
    pushIf('Desempenho (score)', kpA?.performanceScore, kpB?.performanceScore);
    pushIf('Vigor cultura (%)', kpA?.vigorCulturaPct, kpB?.vigorCulturaPct);
    pushIf('Controle daninhas (%)', kpA?.controleDaninhasPct, kpB?.controleDaninhasPct);
    groups = cand;
  }

  if (groups.length === 0) return null;

  const maxVal = Math.max(...groups.flatMap((g) => [Math.abs(g.a), Math.abs(g.b)]), 1);
  const barHeight = (v: number) => `${Math.round((Math.abs(v) / maxVal) * 140)}px`;

  return (
    <section className="ff-l2-card">
      <div className="ff-l2-card-title">
        <span className="ff-l2-icon">📈</span> Comparativo visual — métricas numéricas
      </div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Fonte: <code>plant_evaluation.metrics[].meanA/meanB</code> quando existir; caso contrário KPIs em{' '}
        <code>sideA.kpis</code> / <code>sideB.kpis</code>.
      </p>
      <div className="ff-l2-eval-chart">
        <div className="ff-l2-chart-bars">
          {groups.map((g) => (
            <div key={g.label} className="ff-l2-bar-group">
              <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end' }}>
                <div className="ff-l2-bar ff-l2-a-bar" style={{ height: barHeight(g.a) }}>
                  <span className="ff-l2-bar-val">{formatNumber(g.a, { decimals: g.a % 1 === 0 ? 0 : 1 })}</span>
                </div>
                <div className="ff-l2-bar ff-l2-b-bar" style={{ height: barHeight(g.b) }}>
                  <span className="ff-l2-bar-val">{formatNumber(g.b, { decimals: g.b % 1 === 0 ? 0 : 1 })}</span>
                </div>
              </div>
              <div className="ff-l2-bar-group-label">{g.label}</div>
            </div>
          ))}
        </div>
        <div className="ff-l2-chart-legend">
          <div className="ff-l2-legend-item">
            <span className="ff-l2-legend-dot ff-l2-legend-a" />[A] {nameA}
          </div>
          <div className="ff-l2-legend-item">
            <span className="ff-l2-legend-dot ff-l2-legend-b" />[B] {nameB}
          </div>
        </div>
      </div>
    </section>
  );
}

function iaNarrativa(data: SideBySideReportData): string | null {
  const dl = data.decision_layer as DecisionLayerJson | null | undefined;
  const lines = dl?.summaryLines?.filter(Boolean).slice(0, 4).join(' ');
  const reasons = dl?.decisionReasons?.filter(Boolean).slice(0, 3).join(' ');
  const expl = dl?.fortsmart_ai?.explanations?.filter(Boolean).slice(0, 4).join(' ');
  const diag = data.diagnosis?.planoAcao?.trim();
  const text = [expl, lines, reasons, diag].filter(Boolean).join(' ');
  return text.trim() || null;
}

/** Antes / depois — classificação por legenda ou `hotspots[].applicationMoment`. */
export function FortSmartHtmlBeforeAfterAndIA({ data }: { data: SideBySideReportData }) {
  const winner = data.conclusion?.winner;
  const primaryName =
    winner === 'A'
      ? data.sideA?.name?.trim() || 'Manejo A'
      : winner === 'B'
        ? data.sideB?.name?.trim() || 'Manejo B'
        : data.sideB?.name?.trim() || 'Manejo B';
  const primaryPhotos =
    winner === 'A' ? data.sideA?.photos ?? [] : winner === 'B' ? data.sideB?.photos ?? [] : [...(data.sideB?.photos ?? []), ...(data.sideA?.photos ?? [])];

  const { antes, depois } = pickBeforeAfterPhotos(primaryPhotos);
  const iaText = iaNarrativa(data);

  const hasPhotos = Boolean(antes || depois);
  if (!hasPhotos && !iaText) return null;

  const slot = (kind: 'antes' | 'depois', ph?: ReportPhotoWeb) => {
    const src = ph ? resolveReportPhotoSrc(ph) : undefined;
    const title = kind === 'antes' ? 'ANTES' : 'DEPOIS';
    const sub = kind === 'antes' ? 'Pré-aplicação / referência' : 'Após intervenção';
    const caption = ph?.caption?.trim();
    return (
      <div className={`ff-l2-before-after-slot ${kind}`}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={caption || title} style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }} />
        ) : (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '28px' }}>{kind === 'antes' ? '🌿' : '✅'}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, marginTop: '4px' }}>{title}</div>
            <div style={{ fontSize: '10px', opacity: 0.75 }}>{sub}</div>
          </div>
        )}
        <div className="ff-l2-photo-label">{caption || (kind === 'antes' ? 'Referência antes' : 'Evidência depois')}</div>
      </div>
    );
  };

  return (
    <div
      className={hasPhotos && iaText ? 'ff-l2-grid-2' : undefined}
      style={!hasPhotos || !iaText ? { marginBottom: '20px' } : undefined}
    >
      {hasPhotos ? (
        <section className="ff-l2-card">
          <div className="ff-l2-card-title">
            <span className="ff-l2-icon">📸</span> Fotos comparativas — {primaryName}
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Emparelhamento por legenda ou <code>hotspots[].applicationMoment</code> (<code>antes</code> /{' '}
            <code>depois</code>) nas fotos do manejo indicado em <code>conclusion.winner</code> (senão prioriza lado B).
          </p>
          <div className="ff-l2-before-after">
            {slot('antes', antes)}
            {slot('depois', depois)}
          </div>
        </section>
      ) : null}
      {iaText ? (
        <div className="ff-l2-ia-block">
          <div className="ff-l2-ia-icon">🤖</div>
          <div>
            <div className="ff-l2-ia-label">Síntese técnica (motor / decisão)</div>
            <div className="ff-l2-ia-text">{iaText}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function FortSmartHtmlEconomicHero({ data }: { data: SideBySideReportData }) {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const preco = data.economia?.preco_saca_brl ?? data.market_reference?.price_sack_brl ?? null;
  const area = data.farm?.areaHa ?? null;
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';

  const sideCost = (side: 'A' | 'B') => custo?.by_side?.find((s) => s.side === side)?.costPerHa ?? null;
  const yieldSc = (side: 'A' | 'B') => colheita?.sides?.find((s) => s.side === side)?.yieldScHa ?? null;

  const ca = sideCost('A');
  const cb = sideCost('B');
  const ya = yieldSc('A');
  const yb = yieldSc('B');
  const deltaSc = ya != null && yb != null && Number.isFinite(ya) && Number.isFinite(yb) ? yb - ya : null;

  const totalA = ca != null && area != null ? ca * area : null;
  const totalB = cb != null && area != null ? cb * area : null;

  const roiB = data.decision_layer?.roiBySide?.B?.roiPct ?? null;

  if (ca == null && cb == null && ya == null && yb == null && roiB == null) return null;

  const revDelta =
    preco != null && deltaSc != null && Number.isFinite(deltaSc) ? deltaSc * preco : null;

  return (
    <div className="ff-l2-econ-hero">
      <div className="ff-l2-kpi-card">
        <div className="ff-l2-kpi-icon">💸</div>
        <div className="ff-l2-kpi-label">Custo · [A] {nameA}</div>
        <div className="ff-l2-kpi-val">{ca != null ? `R$ ${formatNumber(ca, { decimals: 2 })}/ha` : '—'}</div>
        <div className="ff-l2-kpi-sub">{totalA != null && area != null ? `Total ≈ R$ ${formatNumber(totalA, { decimals: 0 })} (${formatNumber(area, { decimals: 1 })} ha)` : 'Fonte: custo.by_side'}</div>
      </div>
      <div className="ff-l2-kpi-card">
        <div className="ff-l2-kpi-icon">⚡</div>
        <div className="ff-l2-kpi-label">Custo · [B] {nameB}</div>
        <div className="ff-l2-kpi-val">{cb != null ? `R$ ${formatNumber(cb, { decimals: 2 })}/ha` : '—'}</div>
        <div className="ff-l2-kpi-sub">{totalB != null && area != null ? `Total ≈ R$ ${formatNumber(totalB, { decimals: 0 })} (${formatNumber(area, { decimals: 1 })} ha)` : 'Fonte: custo.by_side'}</div>
      </div>
      <div className="ff-l2-kpi-card ff-l2-kpi-card--highlight">
        <div className="ff-l2-kpi-icon">📈</div>
        <div className="ff-l2-kpi-label">Δ Produtividade (B − A)</div>
        <div className="ff-l2-kpi-val">{deltaSc != null ? `${deltaSc >= 0 ? '+' : ''}${formatNumber(deltaSc, { decimals: 1 })} sc/ha` : '—'}</div>
        <div className="ff-l2-kpi-sub">
          {revDelta != null && preco != null
            ? `À R$ ${formatNumber(preco, { decimals: 2 })}/sc ≈ ${revDelta >= 0 ? '+' : ''}R$ ${formatNumber(revDelta, { decimals: 0 })}/ha`
            : 'Fonte: colheita.sides[].yieldScHa'}
        </div>
      </div>
      <div className="ff-l2-kpi-card">
        <div className="ff-l2-kpi-icon">🏆</div>
        <div className="ff-l2-kpi-label">ROI indicado · lado B</div>
        <div className="ff-l2-kpi-val" style={{ color: 'var(--green-dark)' }}>
          {roiB != null ? `${formatNumber(roiB, { decimals: 1 })}%` : '—'}
        </div>
        <div className="ff-l2-kpi-sub">Fonte: decision_layer.roiBySide.B.roiPct</div>
      </div>
    </div>
  );
}

export function FortSmartHtmlEconCompareTable({ data }: { data: SideBySideReportData }) {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const preco = data.economia?.preco_saca_brl ?? data.market_reference?.price_sack_brl ?? null;
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';

  const ca = custo?.by_side?.find((s) => s.side === 'A')?.costPerHa ?? null;
  const cb = custo?.by_side?.find((s) => s.side === 'B')?.costPerHa ?? null;
  const ya = colheita?.sides?.find((s) => s.side === 'A')?.yieldScHa ?? null;
  const yb = colheita?.sides?.find((s) => s.side === 'B')?.yieldScHa ?? null;

  const rows: { label: string; va: string; vb: string; diff?: string; winner?: 'A' | 'B' | null }[] = [];

  if (ca != null || cb != null) {
    const diff = ca != null && cb != null ? cb - ca : null;
    rows.push({
      label: 'Custo produtos / ha',
      va: ca != null ? `R$ ${formatNumber(ca, { decimals: 2 })}` : '—',
      vb: cb != null ? `R$ ${formatNumber(cb, { decimals: 2 })}` : '—',
      diff: diff != null ? `${diff <= 0 ? '' : '+'}R$ ${formatNumber(diff, { decimals: 2 })}/ha (B−A)` : undefined,
      winner: ca != null && cb != null ? (cb < ca ? 'B' : cb > ca ? 'A' : null) : null,
    });
  }

  if (ya != null || yb != null) {
    rows.push({
      label: 'Produtividade (sc/ha)',
      va: ya != null ? formatNumber(ya, { decimals: 1 }) : '—',
      vb: yb != null ? formatNumber(yb, { decimals: 1 }) : '—',
      diff:
        ya != null && yb != null && ya !== 0
          ? `${formatNumber(((yb - ya) / Math.abs(ya)) * 100, { decimals: 1 })}% (B vs A)`
          : undefined,
      winner: ya != null && yb != null ? (yb > ya ? 'B' : yb < ya ? 'A' : null) : null,
    });
  }

  if (preco != null && ya != null && yb != null) {
    rows.push({
      label: `Receita bruta / ha (@ R$ ${formatNumber(preco, { decimals: 0 })}/sc)`,
      va: `R$ ${formatNumber(ya * preco, { decimals: 0 })}`,
      vb: `R$ ${formatNumber(yb * preco, { decimals: 0 })}`,
      diff: `Δ R$ ${formatNumber((yb - ya) * preco, { decimals: 0 })}/ha`,
      winner: yb > ya ? 'B' : yb < ya ? 'A' : null,
    });
  }

  if (rows.length === 0) return null;

  return (
    <section className="ff-l2-card">
      <div className="ff-l2-card-title">
        <span className="ff-l2-icon">⚖️</span> Comparativo econômico detalhado
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="ff-l2-econ-compare">
          <thead>
            <tr>
              <th>Indicador</th>
              <th>[A] {nameA}</th>
              <th>[B] {nameB}</th>
              <th>Diferença</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td>{r.label}</td>
                <td>{r.va}</td>
                <td className={r.winner === 'B' ? 'ff-l2-econ-winner' : undefined}>{r.vb}</td>
                <td style={{ color: 'var(--green-dark)', fontWeight: 600 }}>{r.diff ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FortSmartHtmlWinnerBanner({ data }: { data: SideBySideReportData }) {
  const w = data.conclusion?.winner;
  if (w !== 'A' && w !== 'B') return null;
  const nameA = data.sideA?.name?.trim() || 'Manejo A';
  const nameB = data.sideB?.name?.trim() || 'Manejo B';
  const winName = w === 'A' ? nameA : nameB;
  const headline = data.conclusion?.headline?.trim();

  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const ya = colheita?.sides?.find((s) => s.side === 'A')?.yieldScHa ?? null;
  const yb = colheita?.sides?.find((s) => s.side === 'B')?.yieldScHa ?? null;
  const ca = custo?.by_side?.find((s) => s.side === 'A')?.costPerHa ?? null;
  const cb = custo?.by_side?.find((s) => s.side === 'B')?.costPerHa ?? null;

  const pills: string[] = [];
  if (ya != null && yb != null && Number.isFinite(ya) && Number.isFinite(yb)) {
    const better = yb >= ya ? 'B' : 'A';
    if (better === w) pills.push(`Produtividade favorável (${formatNumber(Math.abs(yb - ya), { decimals: 1 })} sc/ha)`);
  }
  if (ca != null && cb != null && Number.isFinite(ca) && Number.isFinite(cb)) {
    const cheaper = cb <= ca ? 'B' : 'A';
    if (cheaper === w) pills.push(`Custo R$ ${formatNumber(Math.abs(cb - ca), { decimals: 2 })}/ha menor`);
  }

  const roi = data.decision_layer?.roiBySide?.[w]?.roiPct;
  if (roi != null) pills.push(`ROI ${formatNumber(roi, { decimals: 1 })}%`);

  return (
    <div className="ff-l2-winner-banner">
      <div className="ff-l2-winner-trophy">🏆</div>
      <div className="ff-l2-winner-title">{winName} — favorecido na publicação</div>
      <div className="ff-l2-winner-sub">{headline || 'Conclusão técnica registrada em conclusion.headline / summary.'}</div>
      {pills.length > 0 ? (
        <div className="ff-l2-winner-pills">
          {pills.slice(0, 6).map((p, i) => (
            <span key={`${i}-${p.slice(0, 24)}`} className="ff-l2-winner-pill">
              {p}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
