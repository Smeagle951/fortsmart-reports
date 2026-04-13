'use client';

import { useMemo } from 'react';
import PrintBar from '@/components/PrintBar';
import RelatorioVisitaTecnicaContent from '@/components/RelatorioVisitaTecnicaContent';
import { normalizeRelatorioVisitaTecnica } from '@/lib/normalize-relatorio-visita-tecnica';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';
import mockVisitaTecnica from '@/lib/data/mock-visita-tecnica.json';

/**
 * Pré-visualização local do relatório web de visita técnica (dados fictícios).
 * Acesso em desenvolvimento: http://localhost:3000/visita-tecnica/preview
 */
export default function VisitaTecnicaPreviewPage() {
  const relatorio = useMemo(
    () =>
      normalizeRelatorioVisitaTecnica(mockVisitaTecnica as Record<string, unknown>) as PayloadVisitaTecnica,
    [],
  );

  return (
    <>
      <PrintBar />
      <article className="relatorio relatorio--visita-tecnica-preview" style={{ minHeight: '100vh' }}>
        <RelatorioVisitaTecnicaContent
          relatorio={relatorio}
          reportId="preview-visita-tecnica"
          relatorioUuid="00000000-0000-4000-8000-000000000001"
          shareToken="preview-local"
        />
      </article>
    </>
  );
}
