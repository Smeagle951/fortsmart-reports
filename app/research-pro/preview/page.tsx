'use client';

import RelatorioResearchProContent from '@/components/research/RelatorioResearchProContent';
import PrintBar from '@/components/PrintBar';
import type { ResearchProReportPayload } from '@/types/research-report';
import mockResearchPro from '@/lib/data/mock-research-pro.json';

/**
 * Página de preview do relatório Research Pro com dados de exemplo.
 * Acesso: /research-pro/preview
 * Separado dos outros relatórios (plantio, visita, monitoramento), mesma app.
 */
export default function RelatorioResearchProPreviewPage() {
  const data = mockResearchPro as ResearchProReportPayload;

  return (
    <>
      <PrintBar />
      <article className="relatorio relatorio--research-pro" style={{ minHeight: '100vh', background: '#F1F5F9' }}>
        <RelatorioResearchProContent
          relatorio={data}
          reportId="preview-research-pro"
        />
      </article>
    </>
  );
}
