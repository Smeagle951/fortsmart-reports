'use client';

import RelatorioMonitoramentoContent from '@/components/RelatorioMonitoramentoContent';
import PrintBar from '@/components/PrintBar';
import { emptyRelatorio } from '@/lib/data/empty_monitoring';

/** Preview do layout do relatório de monitoramento (dados vazios — use /r/[token] para relatórios reais). */
export default function RelatorioMonitoramentoPreviewPage() {
  const data = {
    tipo: 'monitoramento',
    fazenda: emptyRelatorio.fazenda,
    safra: emptyRelatorio.safra,
    data: emptyRelatorio.data,
    tecnico: emptyRelatorio.tecnico,
    crea: emptyRelatorio.crea,
    talhoes: emptyRelatorio.talhoes,
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
