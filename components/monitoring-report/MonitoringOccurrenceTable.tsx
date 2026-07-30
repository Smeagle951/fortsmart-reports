import { labelClassificacao } from '@/lib/calculations';
import type { MonitoringOccurrenceRow } from '@/lib/monitoring-report/professional';
import { formatNullableMetric } from '@/lib/monitoring-report/professional';

interface MonitoringOccurrenceTableProps {
  rows: MonitoringOccurrenceRow[];
  caption: string;
  limit?: number;
}

const decimal = (value: number) =>
  value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
const percent = (value: number) =>
  `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;
const TYPE_LABEL = {
  praga: 'Praga',
  doenca: 'Doença',
  daninha: 'Planta daninha',
};

export default function MonitoringOccurrenceTable({
  rows,
  caption,
  limit = 5,
}: MonitoringOccurrenceTableProps) {
  const visibleRows = rows.slice(0, limit);
  if (visibleRows.length === 0) {
    return (
      <p className="mr-empty mr-empty--compact">
        Nenhuma ocorrência registrada nos pontos apresentados.
      </p>
    );
  }

  return (
    <div className="mr-table-scroll">
      <table className="mr-table mr-table--compact">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Organismo</th>
            <th scope="col">Tipo</th>
            <th scope="col" className="mr-number">Pontos afetados</th>
            <th scope="col" className="mr-number">Frequência</th>
            <th scope="col" className="mr-number">Quantidade média</th>
            <th scope="col" className="mr-number">Severidade</th>
            <th scope="col">Situação</th>
          </tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => (
            <tr key={`${row.tipo}-${row.organismo}`}>
              <th scope="row" data-label="Organismo">{row.organismo}</th>
              <td data-label="Tipo">{TYPE_LABEL[row.tipo]}</td>
              <td data-label="Pontos afetados" className="mr-number">
                {row.pontosAfetados}
              </td>
              <td data-label="Frequência" className="mr-number">
                {formatNullableMetric(row.frequencia, percent)}
              </td>
              <td data-label="Quantidade média" className="mr-number">
                {formatNullableMetric(row.quantidadeMedia, decimal)}
              </td>
              <td data-label="Severidade" className="mr-number">
                {formatNullableMetric(row.severidadeMedia, percent)}
              </td>
              <td data-label="Situação">
                {row.classificacao
                  ? labelClassificacao(row.classificacao)
                  : 'Sem classificação'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
