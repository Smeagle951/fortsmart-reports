'use client';

import RelatorioPlantioContent from '@/components/plantio/RelatorioPlantioContent';
import PrintBar from '@/components/PrintBar';
import exemploRelatorioPlantio from '@/data/exemplo-relatorio-plantio.json';

/** Página de preview do relatório de plantio com dados de exemplo (desenvolvimento). */
export default function RelatorioPlantioPreviewPage() {
  const data = exemploRelatorioPlantio as Record<string, unknown>;

  return (
    <>
      <PrintBar />
      <article className="relatorio relatorio--plantio">
        <RelatorioPlantioContent
          relatorio={data}
          reportId="preview-plantio"
        />
      </article>
    </>
  );
}
