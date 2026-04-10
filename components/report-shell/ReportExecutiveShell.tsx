'use client';

import React, { useMemo, useState } from 'react';
import type { ReportExecutiveShellProps } from './types';

function TabPanel<T extends string>({
  id,
  active,
  children,
}: {
  id: T;
  active: T;
  children: React.ReactNode;
}) {
  const inactive = active !== id;
  return (
    <div
      role="tabpanel"
      id={`tab-panel-${id}`}
      aria-labelledby={`tab-${id}`}
      className={`space-y-8 ${inactive ? 'hidden print:block' : ''}`}
    >
      {children}
    </div>
  );
}

/**
 * Shell executivo reutilizável: cabeçalho, pessoas, ações PDF/imprimir, abas e painéis.
 * Use em relatório lado a lado, colheita, monitoramento, etc. — apenas passe `tabs` + `slots`.
 */
export default function ReportExecutiveShell<T extends string>({
  title,
  subtitle,
  tabs,
  slots,
  defaultTab,
  contextRow,
  people = [],
  footerAudit,
  onPrint,
  onExportPdf,
  className = '',
  shellId = 'report-executive-shell',
}: ReportExecutiveShellProps<T>) {
  const initial = useMemo(() => defaultTab ?? tabs[0]?.id, [defaultTab, tabs]);
  const [tab, setTab] = useState<T>(() => initial as T);

  if (tabs.length === 0) {
    return (
      <div id={shellId} className={`bg-slate-100/80 p-6 text-sm text-red-700 ${className}`}>
        ReportExecutiveShell: nenhuma aba configurada.
      </div>
    );
  }

  return (
    <div id={shellId} className={`bg-slate-100/80 min-h-[50vh] ${className}`}>
      <header className="bg-white border-b border-slate-200/90 shadow-sm print:shadow-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-sky-950 uppercase leading-tight">
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {people.slice(0, 3).map((c, i) => (
                <div
                  key={`${c.initials}-${i}`}
                  className="flex items-center gap-2 rounded-full bg-slate-100 pl-1 pr-3 py-1 border border-slate-200/80"
                  title={c.name}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-sky-700 text-xs font-bold text-white">
                    {c.initials}
                  </span>
                  <span className="text-xs font-medium text-slate-700 max-w-[100px] truncate hidden sm:inline">
                    {c.name}
                  </span>
                </div>
              ))}
              {onPrint && (
                <button
                  type="button"
                  onClick={onPrint}
                  className="hidden sm:inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 print:hidden"
                >
                  Imprimir
                </button>
              )}
              {onExportPdf && (
                <button
                  type="button"
                  onClick={onExportPdf}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-emerald-600 bg-white px-4 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50 transition-colors print:hidden"
                >
                  <span className="text-emerald-600" aria-hidden>
                    ✓
                  </span>
                  Exportar PDF
                </button>
              )}
            </div>
          </div>

          {contextRow}
        </div>

        <div className="border-t border-slate-100 bg-slate-50/90 print:hidden">
          <nav
            className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex gap-1.5 overflow-x-auto scrollbar-thin"
            aria-label="Seções do relatório"
          >
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls={`tab-panel-${t.id}`}
                onClick={() => setTab(t.id)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300 hover:text-emerald-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 pb-32 sm:pb-28 print:pb-8">
        {tabs.map((t) => (
          <TabPanel key={t.id} id={t.id} active={tab}>
            {slots[t.id]}
          </TabPanel>
        ))}
        {footerAudit != null && (
          <p className="text-[10px] text-slate-400 text-center mt-10 print:mt-6 font-mono">{footerAudit}</p>
        )}
      </div>
    </div>
  );
}

export type { ReportTabDefinition, ReportExecutiveShellProps, ReportExecutivePeopleChip } from './types';
