'use client';

export default function PrintBar() {
  return (
    <div className="report no-print">
      <button type="button" className="btn btn-primary btn-print" onClick={() => window.print()}>
        Exportar PDF
      </button>
    </div>
  );
}
