'use client';

import { useState, useMemo } from 'react';
import ExpandableRow from './ExpandableRow';

export interface AvaliacaoRow {
  id: string;
  data: string;
  dae: number | null;
  cvPercent: number | null;
  classificacao: string;
  estandePlm: number | null;
  fenologia: string;
  perdaPct: number | null;
  iat: number | null;
  status: string;
  drillDown?: {
    plantabilidade?: Record<string, string | number>;
    estande?: Record<string, string | number>;
    fitossanidade?: Record<string, string | number>;
  };
}

type SortKey = keyof AvaliacaoRow;
type SortDir = 'asc' | 'desc';

interface EvaluationTableProps {
  rows: AvaliacaoRow[];
  onExportCsv?: () => void;
}

export default function EvaluationTable({ rows, onExportCsv }: EvaluationTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>('data');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>('');

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const sorted = [...rows].sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      if (va == null && vb == null) return 0;
      if (va == null) return sortDir === 'asc' ? 1 : -1;
      if (vb == null) return sortDir === 'asc' ? -1 : 1;
      if (typeof va === 'string' && typeof vb === 'string') {
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      }
      const na = Number(va);
      const nb = Number(vb);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) {
        return sortDir === 'asc' ? na - nb : nb - na;
      }
      return 0;
    });
    return sorted;
  }, [rows, sortKey, sortDir]);

  const filteredRows = useMemo(() => {
    if (!dateFilter) return sortedRows;
    return sortedRows.filter((r) => r.data.includes(dateFilter));
  }, [sortedRows, dateFilter]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <span className="ml-1 opacity-40">↕</span>;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <section className="saas-section">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="saas-section-title">Avaliações Técnicas</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Filtrar por data"
            />
            <button
              type="button"
              onClick={onExportCsv}
              className="saas-btn saas-btn-secondary inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="saas-table w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="saas-th w-8"></th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('data')}>
                  Data <SortIcon col="data" />
                </th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('dae')}>
                  DAE <SortIcon col="dae" />
                </th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('cvPercent')}>
                  CV% <SortIcon col="cvPercent" />
                </th>
                <th className="saas-th">Classificação</th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('estandePlm')}>
                  Estande (pl/m) <SortIcon col="estandePlm" />
                </th>
                <th className="saas-th">Fenologia</th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('perdaPct')}>
                  Perda % <SortIcon col="perdaPct" />
                </th>
                <th className="saas-th cursor-pointer" onClick={() => handleSort('iat')}>
                  IAT <SortIcon col="iat" />
                </th>
                <th className="saas-th">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <ExpandableRow
                  key={row.id}
                  row={row}
                  expanded={expandedId === row.id}
                  onToggle={() => setExpandedId((id) => (id === row.id ? null : row.id))}
                />
              ))}
            </tbody>
          </table>
        </div>

        {filteredRows.length === 0 && (
          <p className="py-8 text-center text-slate-500">Nenhuma avaliação encontrada.</p>
        )}
      </div>
    </section>
  );
}
