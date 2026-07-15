'use client';

import { useMemo } from 'react';
import nextDynamic from 'next/dynamic';
import { normalizeRelatorioVisitaTecnica } from '@/lib/normalize-relatorio-visita-tecnica';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';
import mockVisitaTecnica from '@/lib/data/mock-visita-tecnica.json';

/** Evita SSR com Leaflet (`window is not defined` no build da Vercel). */
const RelatorioVisitaTecnicaContent = nextDynamic(
  () => import('@/components/RelatorioVisitaTecnicaContent'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
        A carregar pré-visualização do relatório…
      </div>
    ),
  },
);

export default function VisitaTecnicaPreviewClient() {
  const relatorio = useMemo(
    () =>
      normalizeRelatorioVisitaTecnica(mockVisitaTecnica as Record<string, unknown>) as PayloadVisitaTecnica,
    [],
  );

  return (
    <article className="relatorio relatorio--visita-tecnica-preview" style={{ minHeight: '100vh' }}>
      <RelatorioVisitaTecnicaContent
        relatorio={relatorio}
        reportId="preview-visita-tecnica"
        relatorioUuid="00000000-0000-4000-8000-000000000001"
        shareToken="preview-local"
      />
    </article>
  );
}
