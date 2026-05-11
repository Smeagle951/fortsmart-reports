'use client';

import TechnicalVisitEnterpriseReport from '@/components/technical-visit-report/TechnicalVisitEnterpriseReport';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

export type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

interface RelatorioVisitaTecnicaContentProps {
  relatorio: PayloadVisitaTecnica;
  reportId?: string;
  relatorioUuid?: string;
  shareToken?: string;
}

export default function RelatorioVisitaTecnicaContent(props: RelatorioVisitaTecnicaContentProps) {
  return <TechnicalVisitEnterpriseReport {...props} />;
}
