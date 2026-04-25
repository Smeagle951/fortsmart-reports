'use client';

import type { TalhaoListItem } from './geojsonUtils';
import { strokeForProperties } from './materialColor';

type Props = {
  listFiltered: TalhaoListItem[];
  staged: Set<string>;
  search: string;
  onSearchChange: (v: string) => void;
  onToggle: (talhaoId: string) => void;
  onSelectAll: () => void;
  onClearStaged: () => void;
  onAplicarMapa: () => void;
  onMapCount: number;
};

export function TalhaoSidebar({
  listFiltered,
  staged,
  search,
  onSearchChange,
  onToggle,
  onSelectAll,
  onClearStaged,
  onAplicarMapa,
  onMapCount,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-700/70 bg-slate-900/80 shadow-inner print:hidden">
      <div className="border-b border-slate-700/60 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-white">Talhões</h2>
          <span className="rounded-full bg-emerald-900/50 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
            {onMapCount} no mapa
          </span>
        </div>
        <input
          className="mt-2 w-full rounded-lg border border-slate-600/80 bg-slate-950/90 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar talhão…"
          aria-label="Buscar talhão"
        />
        <div className="mt-2 flex gap-2 text-[11px]">
          <button
            type="button"
            className="rounded-md border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={onSelectAll}
          >
            Tudo
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-600 px-2 py-1 text-slate-300 hover:bg-slate-800"
            onClick={onClearStaged}
          >
            Limpar seleção
          </button>
        </div>
      </div>

      <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-2">
        {listFiltered.map((t) => {
          const dot =
            t.material !== '—'
              ? strokeForProperties({ material: t.material })
              : '#64748b';
          return (
            <li
              key={t.talhaoId}
              className="rounded-lg border border-slate-700/50 bg-slate-950/50 transition hover:border-emerald-800/40"
            >
              <label className="flex cursor-pointer items-center gap-2 px-2 py-2 text-xs text-slate-100">
                <input
                  checked={staged.has(t.talhaoId)}
                  className="h-3.5 w-3.5 rounded border-slate-500 text-emerald-600 focus:ring-emerald-500"
                  type="checkbox"
                  onChange={() => onToggle(t.talhaoId)}
                />
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/20"
                  style={{ background: dot }}
                  title={t.material}
                />
                <span className="min-w-0 flex-1 truncate font-medium">{t.label}</span>
                <span className="shrink-0 tabular-nums text-slate-400">
                  {t.areaHa != null
                    ? `${t.areaHa.toLocaleString('pt-BR', { maximumFractionDigits: 1, minimumFractionDigits: 1 })} ha`
                    : '—'}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      {search.trim() !== '' && (
        <p className="border-t border-slate-700/50 px-3 py-1 text-center text-[10px] text-slate-500">
          {listFiltered.length} resultado(s)
        </p>
      )}

      <div className="border-t border-slate-700/60 bg-slate-950/40 px-3 py-3">
        <p className="mb-2 text-center text-[11px] text-slate-400">
          <span className="font-semibold text-emerald-300">{staged.size}</span> selecionado(s)
        </p>
        <button
          type="button"
          className="w-full rounded-lg bg-[#2E7D32] py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-[#1B5E20] active:scale-[0.99]"
          onClick={onAplicarMapa}
        >
          Visualizar no mapa
        </button>
      </div>
    </div>
  );
}
