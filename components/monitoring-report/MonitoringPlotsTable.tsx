import { labelClassificacao } from '@/lib/calculations';
import type { MonitoringPlotAssessment } from '@/lib/monitoring-report/professional';
import { formatNullableMetric } from '@/lib/monitoring-report/professional';

interface MonitoringPlotsTableProps {
  assessments: MonitoringPlotAssessment[];
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

export default function MonitoringPlotsTable({
  assessments,
}: MonitoringPlotsTableProps) {
  return (
    <section className="mr-section" aria-labelledby="monitoring-plots-title">
      <div className="mr-section-heading">
        <p className="mr-eyebrow">Leitura rápida</p>
        <h2 id="monitoring-plots-title">Situação dos talhões</h2>
      </div>

      {assessments.length === 0 ? (
        <p className="mr-empty">Nenhum talhão informado neste relatório.</p>
      ) : (
        <div className="mr-table-scroll">
          <table className="mr-table mr-plots-table">
            <caption>
              Talhões ordenados da maior para a menor prioridade técnica
            </caption>
            <thead>
              <tr>
                <th scope="col">Prioridade</th>
                <th scope="col">Talhão</th>
                <th scope="col">Cultura / estágio</th>
                <th scope="col" className="mr-number">Área</th>
                <th scope="col" className="mr-number">Pontos</th>
                <th scope="col">Principal ocorrência</th>
                <th scope="col" className="mr-number">Frequência</th>
                <th scope="col" className="mr-number">Severidade</th>
                <th scope="col">Situação</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map((assessment) => {
                const classification = assessment.classificacao;
                const status = classification
                  ? labelClassificacao(classification)
                  : 'Sem dados';
                const occurrence = assessment.principalOcorrencia;
                return (
                  <tr key={assessment.talhao.id}>
                    <td data-label="Prioridade">
                      <span
                        className={`mr-status mr-status--${classification?.toLocaleLowerCase('pt-BR') ?? 'unknown'}`}
                      >
                        {status}
                      </span>
                    </td>
                    <th scope="row" data-label="Talhão">
                      <a href={`#talhao-${assessment.talhao.id}`}>
                        {assessment.talhao.nome}
                      </a>
                    </th>
                    <td data-label="Cultura / estágio">
                      {[assessment.talhao.cultura, assessment.talhao.estagio]
                        .filter(Boolean)
                        .join(' · ') || '—'}
                    </td>
                    <td data-label="Área" className="mr-number">
                      {assessment.talhao.disponibilidade.area === 'not_informed'
                        ? '—'
                        : `${decimal(assessment.talhao.area_ha)} ha`}
                    </td>
                    <td data-label="Pontos" className="mr-number">
                      {assessment.totalPontos}
                    </td>
                    <td data-label="Principal ocorrência">
                      {occurrence?.organismo ?? '—'}
                    </td>
                    <td data-label="Frequência" className="mr-number">
                      {formatNullableMetric(occurrence?.frequencia, percent)}
                    </td>
                    <td data-label="Severidade" className="mr-number">
                      {formatNullableMetric(
                        assessment.severidadeMedia,
                        percent,
                      )}
                    </td>
                    <td data-label="Situação">{status}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
