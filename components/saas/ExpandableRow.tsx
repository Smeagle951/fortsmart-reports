'use client';

import type { AvaliacaoRow } from './EvaluationTable';

interface ExpandableRowProps {
  row: AvaliacaoRow;
  expanded: boolean;
  onToggle: () => void;
}

function formatVal(v: unknown): string {
  if (v == null) return '—';
  if (typeof v === 'number') return v.toFixed(1);
  return String(v);
}

/** Ícone seta minimalista */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default function ExpandableRow({ row, expanded, onToggle }: ExpandableRowProps) {
  const hasDrillDown = row.drillDown && (
    Object.keys(row.drillDown.plantabilidade || {}).length > 0 ||
    Object.keys(row.drillDown.estande || {}).length > 0 ||
    Object.keys(row.drillDown.fitossanidade || {}).length > 0
  );

  const statusColor =
    row.status === 'OK'
      ? 'bg-emerald-100 text-emerald-800'
      : row.status === 'Atenção'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-800';

  return (
    <>
      <tr
        className={`border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50/80 ${hasDrillDown ? 'cursor-pointer' : ''}`}
        onClick={hasDrillDown ? onToggle : undefined}
      >
        <td className="saas-td w-10">
          {hasDrillDown && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="flex items-center justify-center p-1 text-slate-400 transition-colors hover:text-slate-600"
              aria-expanded={expanded}
              aria-label={expanded ? 'Recolher detalhes' : 'Expandir detalhes técnicos'}
            >
              <Chevron open={expanded} />
            </button>
          )}
        </td>
        <td className="saas-td font-medium">{row.data}</td>
        <td className="saas-td">{row.dae != null ? row.dae : '—'}</td>
        <td className="saas-td">{row.cvPercent != null ? `${row.cvPercent}%` : '—'}</td>
        <td className="saas-td">{row.classificacao}</td>
        <td className="saas-td">{row.estandePlm != null ? row.estandePlm.toFixed(1) : '—'}</td>
        <td className="saas-td">{row.fenologia}</td>
        <td className="saas-td">{row.perdaPct != null ? `${row.perdaPct}%` : '—'}</td>
        <td className="saas-td">{row.iat != null ? row.iat : '—'}</td>
        <td className="saas-td">
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusColor}`}>
            {row.status}
          </span>
        </td>
      </tr>

      {expanded && row.drillDown && (
        <tr className="drill-down-row bg-slate-50/80">
          <td colSpan={10} className="saas-td p-0">
            <div className="drill-down-content grid gap-4 border-t border-slate-200 bg-white p-5 sm:grid-cols-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:col-span-3">
                Drill-down técnico
              </div>
              {row.drillDown.plantabilidade && Object.keys(row.drillDown.plantabilidade).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Plantabilidade
                  </h4>
                  <dl className="space-y-2">
                    {Object.entries(row.drillDown.plantabilidade).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-medium text-slate-800">{formatVal(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {row.drillDown.estande && Object.keys(row.drillDown.estande).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Estande
                  </h4>
                  <dl className="space-y-2">
                    {Object.entries(row.drillDown.estande).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-medium text-slate-800">{formatVal(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {row.drillDown.fitossanidade && Object.keys(row.drillDown.fitossanidade).length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
                  <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                    Fitossanidade
                  </h4>
                  <dl className="space-y-2">
                    {Object.entries(row.drillDown.fitossanidade).map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-4 text-sm">
                        <dt className="text-slate-500">{k}</dt>
                        <dd className="font-medium text-slate-800">{formatVal(v)}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
