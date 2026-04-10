import React from 'react';

export type ContextChipItem = {
  readonly icon?: React.ReactNode;
  readonly content: React.ReactNode;
  readonly emphasize?: boolean;
};

/**
 * Linha de metadados com ícones — uso comum em relatórios executivos.
 */
export function ReportContextChips({ items }: { items: readonly ContextChipItem[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-slate-600 border-t border-slate-100 pt-4">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 ${item.emphasize ? 'text-slate-800 font-medium' : ''}`}
        >
          {item.icon != null && (
            <span className="text-slate-400 shrink-0" aria-hidden>
              {item.icon}
            </span>
          )}
          {item.content}
        </span>
      ))}
    </div>
  );
}
