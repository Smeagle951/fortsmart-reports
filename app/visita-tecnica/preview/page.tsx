import VisitaTecnicaPreviewClient from './VisitaTecnicaPreviewClient';

/** Evita pré-render estático: o relatório usa Leaflet (`window`) no cliente. */
export const dynamic = 'force-dynamic';

/**
 * Pré-visualização do relatório de visita técnica (dados mock).
 * Acesso: /visita-tecnica/preview
 */
export default function VisitaTecnicaPreviewPage() {
  return <VisitaTecnicaPreviewClient />;
}
