'use client';

import RelatorioMonitoramentoContent from '@/components/RelatorioMonitoramentoContent';
import PrintBar from '@/components/PrintBar';
import { mockRelatorio } from '@/lib/data/mock_monitoring';

/** Página de preview do relatório de monitoramento com dados de exemplo (modelo padrão). */
export default function RelatorioMonitoramentoPreviewPage() {
  const data = {
    tipo: 'monitoramento',
    fazenda: mockRelatorio.fazenda,
    safra: mockRelatorio.safra,
    data: mockRelatorio.data,
    tecnico: mockRelatorio.tecnico,
    crea: mockRelatorio.crea,
    talhoes: mockRelatorio.talhoes,
  } as Record<string, unknown>;

  return (
    <>
      <PrintBar />
      <article className="relatorio relatorio--monitoramento">
        <RelatorioMonitoramentoContent
          relatorio={data}
          reportId="preview-monitoramento"
          relatorioUuid="preview-monitoramento"
        />
      </article>
    </>
  );
}
