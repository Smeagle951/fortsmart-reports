'use client';

import type { NormalizedMonitoringReport } from '@/lib/monitoring-report/normalize';

interface MonitoringReportHeaderProps {
  report: NormalizedMonitoringReport;
  reportId?: string;
  onExportPdf: () => void;
  onExportExcel: () => void;
}

export default function MonitoringReportHeader({
  report,
  reportId,
  onExportPdf,
  onExportExcel,
}: MonitoringReportHeaderProps) {
  const institution =
    report.consultoria?.nome?.trim() || 'FortSmart Agro';

  return (
    <>
      <div className="mr-toolbar no-print" aria-label="Ações do relatório">
        <span className="mr-toolbar__label">Relatório de monitoramento</span>
        <div className="mr-toolbar__actions">
          <button type="button" onClick={() => window.print()}>
            Imprimir
          </button>
          <button type="button" onClick={onExportExcel}>
            Exportar Excel
          </button>
          <button type="button" className="mr-button-primary" onClick={onExportPdf}>
            Exportar PDF
          </button>
        </div>
      </div>

      <header className="mr-header report-keep-together">
        <div className="mr-header__identity">
          {report.consultoria?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.consultoria.logoUrl}
              alt={`Logotipo ${institution}`}
              className="mr-header__logo"
            />
          ) : (
            <span className="mr-header__mark" aria-hidden>
              FS
            </span>
          )}
          <div>
            <p className="mr-eyebrow">{institution}</p>
            <h1>Relatório Técnico de Monitoramento</h1>
          </div>
        </div>

        <dl className="mr-header__meta">
          <div>
            <dt>Fazenda</dt>
            <dd>{report.fazenda || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Safra</dt>
            <dd>{report.safra || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Data da avaliação</dt>
            <dd>{report.data || 'Não informado'}</dd>
          </div>
          <div>
            <dt>Responsável técnico</dt>
            <dd>{report.tecnico || 'Não informado'}</dd>
          </div>
          <div>
            <dt>CREA</dt>
            <dd>{report.crea || 'Não informado'}</dd>
          </div>
          <div>
            <dt>ID do relatório</dt>
            <dd className="mr-mono">{reportId || 'Não informado'}</dd>
          </div>
        </dl>
      </header>
    </>
  );
}
