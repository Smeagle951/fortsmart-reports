'use client';

import { useState, useMemo } from 'react';

export interface AplicacaoRow {
  id: string;
  data: string;
  produto: string;
  classe: string;
  dose: string;
  alvo: string;
  talhao?: string;
  responsavel?: string;
}

type TipoFiltro = 'todos' | 'Herbicida' | 'Inseticida' | 'Fungicida';

interface ApplicationsTableProps {
  rows: AplicacaoRow[];
  /** Gera URL da ficha técnica com dados reais do módulo (visita técnica / Prescrições Premium). */
  fichaTecnicaUrl?: (row: AplicacaoRow) => string;
}

export default function ApplicationsTable({ rows, fichaTecnicaUrl }: ApplicationsTableProps) {
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('todos');

  const filteredRows = useMemo(() => {
    if (tipoFiltro === 'todos') return rows;
    return rows.filter((r) =>
      r.classe.toLowerCase().includes(tipoFiltro.toLowerCase())
    );
  }, [rows, tipoFiltro]);

  /** Badge de classe química: Verde Herbicida | Âmbar Inseticida | Azul Fungicida */
  const badgeColor = (classe: string) => {
    const c = classe.toLowerCase();
    if (c.includes('herbicida')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (c.includes('inseticida')) return 'bg-amber-100 text-amber-800 border-amber-200';
    if (c.includes('fungicida')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  if (!rows?.length) return null;

  return (
    <section className="saas-section">
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="saas-section-title">Aplicações realizadas</h2>
          {/* Filtro por tipo */}
          <div className="flex flex-wrap gap-2">
            {(['todos', 'Herbicida', 'Inseticida', 'Fungicida'] as TipoFiltro[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipoFiltro(t)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
                  tipoFiltro === t
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t === 'todos' ? 'Todos' : t}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
          <table className="saas-table w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="saas-th">Data</th>
                <th className="saas-th">Produto</th>
                <th className="saas-th">Classe</th>
                <th className="saas-th">Dose</th>
                <th className="saas-th">Alvo</th>
                <th className="saas-th">Talhão</th>
                <th className="saas-th">Responsável</th>
                {fichaTecnicaUrl && <th className="saas-th w-24 text-center">Ficha</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 transition-colors hover:bg-slate-50/50">
                  <td className="saas-td font-medium">{row.data}</td>
                  <td className="saas-td">
                    {fichaTecnicaUrl ? (
                      <a
                        href={fichaTecnicaUrl(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-emerald-600 hover:underline"
                      >
                        {row.produto}
                        <svg className="h-3.5 w-3.5 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ) : (
                      row.produto
                    )}
                  </td>
                  <td className="saas-td">
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeColor(row.classe)}`}>
                      {row.classe || '—'}
                    </span>
                  </td>
                  <td className="saas-td">{row.dose || '—'}</td>
                  <td className="saas-td">{row.alvo || '—'}</td>
                  <td className="saas-td">{row.talhao ?? '—'}</td>
                  <td className="saas-td">{row.responsavel ?? '—'}</td>
                  {fichaTecnicaUrl && (
                    <td className="saas-td text-center">
                      <a
                        href={fichaTecnicaUrl(row)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                        title="Abrir ficha técnica"
                      >
                        Ficha
                      </a>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
