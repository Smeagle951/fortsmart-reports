'use client';

/**
 * Atalho de impressão do browser (Ctrl+P). Não duplica export PDF dos relatórios.
 */
export default function PrintBar() {
  return (
    <div className="report print:hidden no-print" role="region" aria-label="Impressão">
      <button
        type="button"
        className="btn-print rounded-lg border border-emerald-700/40 bg-white px-3 py-2 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
        onClick={() => window.print()}
      >
        Imprimir
      </button>
    </div>
  );
}
