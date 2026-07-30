import type { MonitoringOverview } from '@/lib/monitoring-report/professional';
import { formatNullableMetric } from '@/lib/monitoring-report/professional';

interface MonitoringExecutiveSummaryProps {
  overview: MonitoringOverview;
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

export default function MonitoringExecutiveSummary({
  overview,
}: MonitoringExecutiveSummaryProps) {
  const indicators = [
    {
      label: 'Área monitorada',
      value: formatNullableMetric(
        overview.areaMonitorada.value,
        (value) => `${decimal(value)} ha`,
      ),
    },
    { label: 'Talhões avaliados', value: String(overview.talhoesAvaliados) },
    { label: 'Pontos amostrados', value: String(overview.pontosAmostrados) },
    {
      label: 'Ocorrências registradas',
      value: String(overview.ocorrenciasRegistradas),
    },
    {
      label: 'Severidade média',
      value: formatNullableMetric(overview.severidadeMedia.value, percent),
    },
    {
      label: 'Crítico / alto risco',
      value: String(overview.talhoesCriticos + overview.talhoesAltoRisco),
    },
  ];

  return (
    <section
      className="mr-section mr-executive report-keep-together"
      aria-labelledby="monitoring-executive-title"
    >
      <div className="mr-section-heading">
        <p className="mr-eyebrow">Visão da propriedade</p>
        <h2 id="monitoring-executive-title">Resumo executivo</h2>
      </div>
      <p className="mr-diagnostic">{overview.diagnostic}</p>
      <dl className="mr-indicator-strip">
        {indicators.map((indicator) => (
          <div key={indicator.label}>
            <dt>{indicator.label}</dt>
            <dd>{indicator.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
