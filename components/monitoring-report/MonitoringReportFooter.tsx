import type { NormalizedMonitoringReport } from '@/lib/monitoring-report/normalize';

interface MonitoringReportFooterProps {
  report: NormalizedMonitoringReport;
  reportId?: string;
  relatorioUuid?: string;
  version?: string;
}

export default function MonitoringReportFooter({
  report,
  reportId,
  relatorioUuid,
  version,
}: MonitoringReportFooterProps) {
  const source = relatorioUuid
    ? 'Aplicativo FortSmart / dados registrados em campo'
    : 'Relatório web / origem não informada';

  return (
    <footer className="mr-footer report-keep-together">
      <dl className="mr-footer__trace">
        <div>
          <dt>Responsável</dt>
          <dd>{report.tecnico || 'Não informado'}</dd>
        </div>
        <div>
          <dt>CREA</dt>
          <dd>{report.crea || 'Não informado'}</dd>
        </div>
        <div>
          <dt>Data</dt>
          <dd>{report.data || 'Não informado'}</dd>
        </div>
        <div>
          <dt>Fazenda / safra</dt>
          <dd>
            {[report.fazenda, report.safra].filter(Boolean).join(' · ') ||
              'Não informado'}
          </dd>
        </div>
        <div>
          <dt>ID do relatório</dt>
          <dd className="mr-mono">{reportId || 'Não informado'}</dd>
        </div>
        <div>
          <dt>Origem / versão</dt>
          <dd>
            {source}
            {version ? ` · ${version}` : ''}
          </dd>
        </div>
      </dl>
      <p>
        Relatório elaborado a partir dos dados registrados em campo pelo
        profissional identificado. Recomendações envolvendo defensivos devem
        respeitar receituário agronômico, bula, registro para a cultura e
        legislação vigente.
      </p>
    </footer>
  );
}
