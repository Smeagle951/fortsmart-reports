'use client';

import Link from 'next/link';

export default function PrintBar({ showHome = false }: { showHome?: boolean }) {
  return (
    <div className="report no-print">
      <button
        type="button"
        className="btn btn-primary btn-print"
        onClick={() => window.print()}
      >
        Baixar PDF
      </button>
      {showHome && (
        <Link href="/" className="btn btn-secondary" style={{ marginLeft: 8 }}>
          Início
        </Link>
      )}
    </div>
  );
}
