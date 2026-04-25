'use client';

import type { MapaViewMode } from './geojsonUtils';

type Props = {
  cultura: string;
  safra: string;
  viewMode: MapaViewMode;
  culturas: string[];
  safras: string[];
  onCultura: (v: string) => void;
  onSafra: (v: string) => void;
  onViewMode: (v: MapaViewMode) => void;
  hasData: boolean;
  tip: string | null;
  linkBusy: boolean;
  onExportGeoJson: () => void;
  onCopyShortLink: () => void;
  onPrintPdf: () => void;
  /** KML é gerado no app móvel — abre página de ajuda / loja. */
  onKmlInfo: () => void;
  novoPlantioHref: string;
};

export function FiltersHeader({
  cultura,
  safra,
  viewMode,
  culturas,
  safras,
  onCultura,
  onSafra,
  onViewMode,
  hasData,
  tip,
  linkBusy,
  onExportGeoJson,
  onCopyShortLink,
  onPrintPdf,
  onKmlInfo,
  novoPlantioHref,
}: Props) {
  return (
    <header className="mapa-talhoes-print-header border-b border-emerald-950/40 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950/30 px-4 py-3 shadow-lg print:border-0 print:bg-white print:shadow-none">
      <div className="mx-auto flex max-w-[1920px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-['Poppins',system-ui,sans-serif] text-lg font-bold tracking-tight text-white print:text-slate-900 md:text-xl">
            Mapa de talhões
          </h1>
          <p className="text-xs text-emerald-100/70 print:text-slate-600">
            FortSmart — plantio, subáreas de manejo e exportação GeoJSON (app móvel)
          </p>
        </div>

        {hasData ? (
          <div className="flex flex-wrap items-end gap-2 print:hidden">
            <label className="flex flex-col gap-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Safra
              <select
                className="min-w-[8.5rem] rounded-lg border border-slate-600/80 bg-slate-950/90 px-2 py-1.5 text-xs font-normal normal-case text-slate-100 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                value={safra}
                onChange={(e) => onSafra(e.target.value)}
              >
                {safras.map((s) => (
                  <option key={s} value={s}>
                    {s === 'all' ? 'Todas' : s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Cultura
              <select
                className="min-w-[8.5rem] rounded-lg border border-slate-600/80 bg-slate-950/90 px-2 py-1.5 text-xs font-normal normal-case text-slate-100 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                value={cultura}
                onChange={(e) => onCultura(e.target.value)}
              >
                {culturas.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? 'Todas' : c}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Visualização
              <select
                className="min-w-[11rem] rounded-lg border border-slate-600/80 bg-slate-950/90 px-2 py-1.5 text-xs font-normal normal-case text-slate-100 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/40"
                value={viewMode}
                onChange={(e) => onViewMode(e.target.value as MapaViewMode)}
              >
                <option value="talhoes">Talhões</option>
                <option value="talhoes_subareas">Talhões + subáreas</option>
                <option value="subareas">Apenas subáreas</option>
              </select>
            </label>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          {tip ? <span className="text-xs text-emerald-300">{tip}</span> : null}
          {hasData ? (
            <>
              <button
                type="button"
                className="rounded-lg border border-slate-500/80 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
                onClick={onExportGeoJson}
              >
                GeoJSON
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-600/60 bg-slate-800/50 px-2.5 py-2 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                onClick={onKmlInfo}
                title="KML completo: Plantio → Exportar KML no app FortSmart."
              >
                KML
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-500/80 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-100 hover:bg-slate-800"
                onClick={onPrintPdf}
              >
                PDF
              </button>
              <button
                type="button"
                disabled={linkBusy}
                className="rounded-lg border border-emerald-600/50 bg-emerald-800/40 px-3 py-2 text-xs font-semibold text-emerald-50 hover:bg-emerald-800/60 disabled:opacity-50"
                onClick={() => void onCopyShortLink()}
              >
                {linkBusy ? 'A gerar…' : 'Link curto'}
              </button>
              <a
                href={novoPlantioHref}
                className="rounded-lg bg-[#2E7D32] px-3 py-2 text-xs font-semibold text-white shadow-md hover:bg-[#1B5E20]"
              >
                Novo plantio
              </a>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
