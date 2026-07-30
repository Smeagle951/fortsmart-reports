'use client';

import RelatorioMonitoramentoContent from '@/components/RelatorioMonitoramentoContent';
import { mockRelatorio } from '@/lib/data/mock_monitoring';

/** Preview visual isolado. Produção continua usando somente `/r/[token]`. */
export default function RelatorioMonitoramentoPreviewPage() {
  const data = {
    tipo: 'monitoramento',
    ...mockRelatorio,
    consultoria: { nome: 'FortSmart Agro' },
    talhoes: mockRelatorio.talhoes.map((talhao, index) => ({
      ...talhao,
      recomendacoes:
        index === 0
          ? [
              {
                nivel: 'ALTO_RISCO',
                organismo: 'Percevejo Marrom',
                tipo: 'praga',
                acao: 'Repetir a avaliação nos pontos com maior ocorrência.',
                produto: '',
                dose: '',
                prazo: '48 horas',
                pontos: ['P2', 'P4', 'P11'],
                severidade: 28,
                evidencia: 'Registros de campo nos pontos P2, P4 e P11.',
              },
            ]
          : [
              {
                nivel: 'ACAO_IMEDIATA',
                organismo: 'Lagarta do Cartucho',
                tipo: 'praga',
                acao: 'Realizar inspeção dirigida e registrar a evolução.',
                produto: '',
                dose: '',
                prazo: '24 horas',
                pontos: ['P1', 'P2', 'P7'],
                severidade: 53,
                evidencia: 'Registros de campo nos pontos P1, P2 e P7.',
              },
            ],
    })),
    observacoes:
      'A avaliação deve ser repetida nos pontos indicados para confirmar a evolução das ocorrências antes da definição de manejo.',
  } as Record<string, unknown>;

  return (
    <article className="relatorio relatorio--monitoramento">
      <RelatorioMonitoramentoContent
        relatorio={data}
        reportId="preview-monitoramento"
        relatorioUuid="preview-monitoramento"
      />
    </article>
  );
}
