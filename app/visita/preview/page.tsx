'use client';

import RelatorioContent from '@/components/RelatorioContent';
import PrintBar from '@/components/PrintBar';
import exemploRelatorio from '@/data/exemplo-relatorio.json';

/** Página de preview do relatório de visita técnica com dados de exemplo (desenvolvimento). */
export default function RelatorioVisitaPreviewPage() {
  const data = exemploRelatorio as Record<string, unknown>;

  return (
    <>
      <PrintBar />
      <main role="main" aria-label="Relatório de Visita Técnica">
        <article className="relatorio">
          <RelatorioContent
            relatorio={data}
            reportId="preview-visita"
            relatorioUuid="preview-visita"
          />
        </article>
      </main>
    </>
  );
}
