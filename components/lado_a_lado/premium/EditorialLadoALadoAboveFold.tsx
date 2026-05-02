'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatNumber } from '@/utils/format';

function rawGeneratedAt(data: SideBySideReportData): string | null {
  const r = data as Record<string, unknown>;
  const g = r.generated_at;
  if (typeof g !== 'string' || !g.trim()) return null;
  try {
    return new Date(g).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return g;
  }
}

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

function unitLabel(row: Record<string, unknown>): string {
  const u = row.unit ?? row.unidade;
  return typeof u === 'string' && u.trim() ? u.trim() : '';
}

function matchesProdRow(label: string): boolean {
  const l = label.toLowerCase();
  return (
    l.includes('produtiv') ||
    l.includes('yield') ||
    l.includes('sc/ha') ||
    l.includes('kg/ha')
  );
}

export default function EditorialLadoALadoAboveFold({ data }: { data: SideBySideReportData }) {
  const farm = data.farm ?? {};
  const branding = data.branding ?? {};
  const meta = data.meta ?? {};
  const qc = data.quality_check as { warnings?: string[] } | undefined;
  const warnings = qc?.warnings ?? [];

  const title =
    branding.title?.trim() ||
    farm.fieldName ||
    farm.farmName ||
    'Relatório de ensaio lado a lado';
  const subtitle =
    branding.subtitle?.trim() ||
    farm.objective?.trim() ||
    'Comparativo técnico entre manejos — dados publicados pelo FortSmart Agro.';

  const nameA = data.sideA?.name?.trim() || data.sideA?.label?.trim() || 'Tratamento A';
  const nameB = data.sideB?.name?.trim() || data.sideB?.label?.trim() || 'Tratamento B';

  const winner = data.conclusion?.winner;
  const schemaV = data.schemaVersion ?? '—';
  const created =
    meta.createdAt &&
    new Date(meta.createdAt).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  const generatedAt = rawGeneratedAt(data);
  const metaLine = [created ? `Emitido ${created}` : null, generatedAt ? `Gerado ${generatedAt}` : null]
    .filter(Boolean)
    .join(' · ');

  const conf = meta.confidenceScore;
  const confPct =
    typeof conf === 'number' && conf >= 0 && conf <= 100 ? Math.round(conf) : null;

  const kpA = data.sideA?.kpis;
  const kpB = data.sideB?.kpis;

  type KpiCard = { label: string; va: string; vb: string };
  const kpiCards: KpiCard[] = [
    {
      label: 'População (pl/ha)',
      va:
        kpA?.finalPopulationPlHa != null
          ? formatNumber(kpA.finalPopulationPlHa, { decimals: 0 })
          : '—',
      vb:
        kpB?.finalPopulationPlHa != null
          ? formatNumber(kpB.finalPopulationPlHa, { decimals: 0 })
          : '—',
    },
    {
      label: 'Produtividade (kg/ha)',
      va:
        kpA?.estimatedYieldKgHa != null
          ? formatNumber(kpA.estimatedYieldKgHa, { decimals: 0 })
          : '—',
      vb:
        kpB?.estimatedYieldKgHa != null
          ? formatNumber(kpB.estimatedYieldKgHa, { decimals: 0 })
          : '—',
    },
    {
      label: 'Altura (cm)',
      va: kpA?.avgHeightCm != null ? formatNumber(kpA.avgHeightCm, { decimals: 1 }) : '—',
      vb: kpB?.avgHeightCm != null ? formatNumber(kpB.avgHeightCm, { decimals: 1 }) : '—',
    },
    {
      label: 'Vigor',
      va:
        kpA?.vigorCulturaPct != null
          ? `${formatNumber(kpA.vigorCulturaPct, { decimals: 0 })}%`
          : kpA?.vigorRating?.label?.trim() || '—',
      vb:
        kpB?.vigorCulturaPct != null
          ? `${formatNumber(kpB.vigorCulturaPct, { decimals: 0 })}%`
          : kpB?.vigorRating?.label?.trim() || '—',
    },
  ];

  const rows = Array.isArray(data.summary_rows) ? data.summary_rows : [];
  let deltaPct: number | null = null;
  let deltaLabel = 'Δ principal';
  for (const r of rows) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) continue;
    const row = r as Record<string, unknown>;
    const lab = criteriaLabel(row);
    if (!matchesProdRow(lab)) continue;
    const a = parseRowNum(row.value_a_num ?? row.value_a);
    const b = parseRowNum(row.value_b_num ?? row.value_b);
    if (a != null && b != null && a !== 0) {
      deltaPct = ((b - a) / Math.abs(a)) * 100;
      deltaLabel = 'Δ vs A (produtividade)';
      break;
    }
  }

  const summaryRowsForTable = rows
    .filter((r): r is Record<string, unknown> => r != null && typeof r === 'object' && !Array.isArray(r))
    .slice(0, 40);

  return (
    <>
      <header className="fs-l2-report-header print:break-inside-avoid">
        <div className="fs-l2-header-accent" aria-hidden />
        <div className="fs-l2-header-noise" aria-hidden />
        <div className="fs-l2-header-inner">
          <div className="flex flex-col gap-6 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/70">
                FortSmart Agro
              </p>
              <span className="fs-l2-type-badge">Avaliação lado a lado</span>
              <h1 className="fs-l2-report-title">{title}</h1>
              <p className="fs-l2-report-subtitle mt-2 max-w-xl">{subtitle}</p>
            </div>
            <div className="fs-l2-header-meta shrink-0 text-left sm:text-right">
              <div>schema {schemaV}</div>
              {metaLine ? <div>{metaLine}</div> : null}
              {meta.appVersion ? <div>{meta.appVersion}</div> : null}
            </div>
          </div>

          <div className="fs-l2-header-grid">
            <div className="fs-l2-header-cell">
              <div className="fs-l2-header-label">Cultura</div>
              <div className="fs-l2-header-value">{farm.culture?.trim() || '—'}</div>
            </div>
            <div className="fs-l2-header-cell">
              <div className="fs-l2-header-label">Safra</div>
              <div className="fs-l2-header-value">{farm.season?.trim() || '—'}</div>
            </div>
            <div className="fs-l2-header-cell">
              <div className="fs-l2-header-label">Talhão</div>
              <div className="fs-l2-header-value">{farm.fieldName?.trim() || '—'}</div>
            </div>
            <div className="fs-l2-header-cell">
              <div className="fs-l2-header-label">Área</div>
              <div className="fs-l2-header-value">
                {farm.areaHa != null ? `${formatNumber(farm.areaHa, { decimals: 2 })} ha` : '—'}
              </div>
            </div>
          </div>
          {(farm.city || farm.state) ? (
            <p className="mt-4 text-xs text-white/45">
              {[farm.city, farm.state].filter(Boolean).join(' · ')}
              {farm.farmName ? ` · ${farm.farmName}` : ''}
            </p>
          ) : farm.farmName ? (
            <p className="mt-4 text-xs text-white/45">{farm.farmName}</p>
          ) : null}
        </div>
      </header>

      <div className="fs-l2-quality-strip">
        <div className="fs-l2-quality-inner">
          <span className="fs-l2-quality-label">Completude do relatório</span>
          <div className="fs-l2-quality-bar-wrap">
            <div
              className="fs-l2-quality-bar-fill"
              style={{ width: `${confPct != null ? confPct : 72}%` }}
            />
          </div>
          <span className="fs-l2-quality-score">
            {confPct != null ? `${confPct}/100` : '—/100'}
          </span>
          {warnings.length > 0 ? (
            <p className="fs-l2-quality-warnings">
              {warnings.slice(0, 3).join(' · ')}
              {warnings.length > 3 ? '…' : ''}
            </p>
          ) : (
            <p className="fs-l2-quality-warnings text-emerald-800/90">
              Sem avisos de qualidade — payload consistente.
            </p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[960px] px-5 pt-10 pb-6 sm:px-10">
        <div className="fs-l2-hero page-section">
          <div className={`fs-l2-hero-side fs-l2-hero-a ${winner === 'A' ? 'ring-2 ring-amber-400/40' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="fs-l2-hero-badge fs-l2-hero-badge-a">Lado A</span>
              {winner === 'A' ? (
                <span className="fs-l2-hero-badge fs-l2-hero-badge-win">Indicado</span>
              ) : null}
            </div>
            <p className="fs-l2-hero-name mt-2">{nameA}</p>
            {data.sideA?.label?.trim() ? (
              <p className="mt-1 text-sm text-[var(--l2-text-muted)]">{data.sideA.label.trim()}</p>
            ) : null}
            <div className="fs-l2-hero-kpis">
              {kpiCards.map((k) => (
                <div key={k.label} className="fs-l2-hero-kpi">
                  <div className="fs-l2-hero-kpi-label">{k.label}</div>
                  <div className="fs-l2-hero-kpi-val text-[var(--l2-a-mid)]">{k.va}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="fs-l2-hero-vs">
            <div className="fs-l2-vs-ring">vs</div>
            <div className="fs-l2-vs-delta">
              {deltaPct != null ? (
                <>
                  <div className="fs-l2-vs-delta-val">
                    {deltaPct >= 0 ? '+' : ''}
                    {formatNumber(deltaPct, { decimals: 1 })}%
                  </div>
                  <div className="fs-l2-vs-delta-lbl">{deltaLabel}</div>
                </>
              ) : (
                <>
                  <div className="fs-l2-vs-delta-val text-sm text-[var(--l2-text-muted)]">—</div>
                  <div className="fs-l2-vs-delta-lbl">Publique critérios comparáveis</div>
                </>
              )}
            </div>
          </div>

          <div className={`fs-l2-hero-side fs-l2-hero-b ${winner === 'B' ? 'ring-2 ring-amber-400/40' : ''}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="fs-l2-hero-badge fs-l2-hero-badge-b">Lado B</span>
              {winner === 'B' ? (
                <span className="fs-l2-hero-badge fs-l2-hero-badge-win">Indicado</span>
              ) : null}
            </div>
            <p className="fs-l2-hero-name mt-2">{nameB}</p>
            {data.sideB?.label?.trim() ? (
              <p className="mt-1 text-sm text-[var(--l2-text-muted)]">{data.sideB.label.trim()}</p>
            ) : null}
            <div className="fs-l2-hero-kpis">
              {kpiCards.map((k) => (
                <div key={`${k.label}-b`} className="fs-l2-hero-kpi">
                  <div className="fs-l2-hero-kpi-label">{k.label}</div>
                  <div className="fs-l2-hero-kpi-val text-[var(--l2-b-mid)]">{k.vb}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {data.comparativo_intro?.trim() ? (
          <div
            className="page-section mt-8 rounded-xl border p-5 text-sm leading-relaxed shadow-sm sm:p-6"
            style={{
              borderColor: 'var(--l2-border)',
              background: 'var(--l2-white)',
              color: 'var(--l2-text)',
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--l2-text-muted)' }}>
              Introdução ao comparativo
            </p>
            <p className="mt-2 whitespace-pre-wrap">{data.comparativo_intro.trim()}</p>
          </div>
        ) : null}

        {summaryRowsForTable.length > 0 ? (
          <div className="mt-8 page-section">
            <div className="fs-l2-section-head">
              <div className="fs-l2-section-num">01</div>
              <h2 className="fs-l2-section-title">Tabela comparativa (summary_rows)</h2>
              <div className="fs-l2-section-rule max-md:hidden" />
            </div>
            <div className="fs-l2-sum-wrap overflow-x-auto">
              <table className="fs-l2-sum-table min-w-[560px]">
                <thead>
                  <tr>
                    <th>Critério</th>
                    <th className="fs-l2-tc">A</th>
                    <th className="fs-l2-tc">B</th>
                    <th>Un.</th>
                    <th className="fs-l2-tc">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryRowsForTable.map((row, i) => {
                    const lab = criteriaLabel(row);
                    const un = unitLabel(row);
                    const va = parseRowNum(row.value_a_num ?? row.value_a);
                    const vb = parseRowNum(row.value_b_num ?? row.value_b);
                    const sit = row.situation ?? row.delta_pct ?? row.winner;
                    const sitStr =
                      typeof sit === 'number'
                        ? formatNumber(sit, { decimals: 1 })
                        : typeof sit === 'string'
                          ? sit
                          : '—';
                    return (
                      <tr key={i}>
                        <td>
                          <span className="font-medium text-[var(--l2-text)]">{lab}</span>
                          {un ? <span className="fs-l2-criteria-unit">{un}</span> : null}
                        </td>
                        <td className="fs-l2-tc fs-l2-td-a">
                          {va != null ? formatNumber(va, { decimals: 2 }) : '—'}
                        </td>
                        <td className="fs-l2-tc fs-l2-td-b">
                          {vb != null ? formatNumber(vb, { decimals: 2 }) : '—'}
                        </td>
                        <td className="text-xs text-[var(--l2-text-muted)]">{un || '—'}</td>
                        <td className="fs-l2-tc text-xs text-[var(--l2-text-muted)]">{sitStr}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
