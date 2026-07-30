'use client';

import { useMemo } from 'react';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import {
  normalizeMonitoringReport,
  type PayloadMonitoramento,
} from '@/lib/monitoring-report/normalize';
import {
  buildMonitoringOverview,
  buildPriorityActions,
  buildTechnicalConclusion,
  collectPlotImages,
  deduplicateReportImages,
  sortPlotsByRisk,
  type MonitoringReportImage,
} from '@/lib/monitoring-report/professional';
import type { OrganismoContextoWeb } from '@/lib/types/monitoring';
import PlantioIntegradoPremiumSection from './PlantioIntegradoPremiumSection';
import {
  parseOrganismosContextoFromPayload,
} from './MonitoramentoNdeContextoPanel';
import MonitoringActionPlan from './monitoring-report/MonitoringActionPlan';
import MonitoringEvidenceGrid from './monitoring-report/MonitoringEvidenceGrid';
import MonitoringExecutiveSummary from './monitoring-report/MonitoringExecutiveSummary';
import MonitoringNdeTable from './monitoring-report/MonitoringNdeTable';
import MonitoringPlotSection from './monitoring-report/MonitoringPlotSection';
import MonitoringPlotsTable from './monitoring-report/MonitoringPlotsTable';
import MonitoringReportFooter from './monitoring-report/MonitoringReportFooter';
import MonitoringReportHeader from './monitoring-report/MonitoringReportHeader';
import MonitoringTechnicalConclusion from './monitoring-report/MonitoringTechnicalConclusion';
import '@/styles/report-monitoramento-professional.css';

export type { PayloadMonitoramento } from '@/lib/monitoring-report/normalize';

interface RelatorioMonitoramentoContentProps {
  relatorio: PayloadMonitoramento;
  reportId?: string;
  relatorioUuid?: string;
  /** Token `/r/[token]` usado somente no analytics de download. */
  shareToken?: string;
}

function normalizedName(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function payloadImages(relatorio: PayloadMonitoramento): MonitoringReportImage[] {
  return (Array.isArray(relatorio.imagens) ? relatorio.imagens : [])
    .filter(
      (image): image is NonNullable<PayloadMonitoramento['imagens']>[number] =>
        image !== null && typeof image === 'object',
    )
    .map((image) => ({
      url: String(image.url ?? '').trim(),
      descricao: image.descricao,
      categoria: image.categoria,
      data: image.data,
      ponto: image.ponto,
      organismo: image.organismo,
    }));
}

export default function RelatorioMonitoramentoContent({
  relatorio,
  reportId,
  relatorioUuid,
  shareToken,
}: RelatorioMonitoramentoContentProps) {
  const normalized = useMemo(
    () => normalizeMonitoringReport(relatorio),
    [relatorio],
  );
  const assessments = useMemo(
    () => sortPlotsByRisk(normalized.talhoes),
    [normalized.talhoes],
  );
  const overview = useMemo(
    () => buildMonitoringOverview(normalized),
    [normalized],
  );
  const actions = useMemo(
    () => buildPriorityActions(assessments),
    [assessments],
  );
  const ndeRows = useMemo(
    () =>
      parseOrganismosContextoFromPayload(
        relatorio as Record<string, unknown>,
      ),
    [relatorio],
  );
  const conclusions = useMemo(
    () =>
      buildTechnicalConclusion(
        normalized,
        assessments,
        overview,
        actions,
        typeof relatorio.observacoes === 'string'
          ? relatorio.observacoes
          : null,
      ),
    [actions, assessments, normalized, overview, relatorio.observacoes],
  );

  const plotImages = useMemo(
    () => assessments.flatMap(collectPlotImages),
    [assessments],
  );
  const consolidatedImages = useMemo(() => {
    // Fotos dos talhões vêm primeiro; ao filtrar por `talhaoId`, a galeria
    // final contém somente evidências que ainda não apareceram.
    return deduplicateReportImages([
      ...plotImages,
      ...payloadImages(relatorio),
    ]).filter((image) => !image.talhaoId);
  }, [plotImages, relatorio]);

  const unmatchedNdeRows = useMemo(() => {
    const occurrenceNames = new Set(
      assessments.flatMap((assessment) =>
        assessment.ocorrencias.map((occurrence) =>
          normalizedName(occurrence.organismo),
        ),
      ),
    );
    return ndeRows.filter(
      (row) => !occurrenceNames.has(normalizedName(row.nome)),
    );
  }, [assessments, ndeRows]);

  const alerts = Array.isArray(relatorio.alertas)
    ? relatorio.alertas
        .map((alert) => String(alert).trim())
        .filter(Boolean)
    : [];
  const meta =
    relatorio.meta !== null && typeof relatorio.meta === 'object'
      ? (relatorio.meta as Record<string, unknown>)
      : undefined;
  const version =
    meta?.schemaVersion !== undefined
      ? `Schema ${String(meta.schemaVersion)}`
      : undefined;
  const resolvedReportId = reportId || relatorioUuid;

  const handleExportPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById(
      'relatorio-monitoramento-content',
    );
    if (!element) return;

    const safeFarm = (normalized.fazenda || 'Relatorio')
      .replace(/[^\p{L}\p{N}]+/gu, '_')
      .replace(/^_|_$/g, '');
    const safeDate =
      (normalized.data || 'data').replace(/[^\p{L}\p{N}]+/gu, '-') || 'data';

    await html2pdf()
      .set({
        margin: [12, 10, 12, 10],
        filename: `FortSmart_Monitoramento_${safeFarm}_${safeDate}.pdf`,
        image: { type: 'jpeg', quality: 0.96 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          logging: false,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save();

    if (shareToken) {
      void postReportAnalytics({
        shareToken,
        eventType: 'download',
        module: 'monitoramento',
      });
    }
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      ['Relatório Técnico de Monitoramento'],
      ['Fazenda', normalized.fazenda || 'Não informado'],
      ['Safra', normalized.safra || 'Não informado'],
      ['Data', normalized.data || 'Não informado'],
      ['Responsável', normalized.tecnico || 'Não informado'],
      ['CREA', normalized.crea || 'Não informado'],
      ['ID', resolvedReportId || 'Não informado'],
      [],
      [
        'Talhão',
        'Cultura',
        'Área (ha)',
        'Pontos',
        'Ocorrências',
        'Severidade média (%)',
        'Situação',
      ],
      ...assessments.map((assessment) => [
        assessment.talhao.nome,
        assessment.talhao.cultura,
        assessment.talhao.disponibilidade.area === 'not_informed'
          ? 'Não informado'
          : assessment.talhao.area_ha,
        assessment.totalPontos,
        assessment.totalOcorrencias,
        assessment.severidadeMedia ?? 'Não informado',
        assessment.classificacao ?? 'Sem dados',
      ]),
    ];
    XLSX.utils.book_append_sheet(
      workbook,
      XLSX.utils.aoa_to_sheet(summaryRows),
      'Resumo',
    );

    for (const assessment of assessments) {
      const rows: (string | number | null)[][] = [
        [
          'Ponto',
          'Tipo',
          'Ocorrência',
          'Terço',
          'Quantidade',
          'Severidade (%)',
        ],
      ];
      for (const point of assessment.talhao.pontos) {
        for (const infestation of point.infestacoes) {
          rows.push([
            point.identificador,
            infestation.tipo,
            infestation.nome,
            infestation.terco,
            infestation.quantidadeInformada
              ? infestation.quantidade
              : 'Não informado',
            infestation.severidadeInformada
              ? infestation.severidade
              : 'Não informado',
          ]);
        }
      }
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!cols'] = [
        { wch: 10 },
        { wch: 16 },
        { wch: 26 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
      ];
      XLSX.utils.book_append_sheet(
        workbook,
        sheet,
        assessment.talhao.nome
          .replace(/[\\/?*[\]:]/g, ' ')
          .slice(0, 31) || 'Talhão',
      );
    }

    XLSX.writeFile(
      workbook,
      `FortSmart_Monitoramento_${
        (normalized.data || 'export').replace(/[^\p{L}\p{N}]+/gu, '-')
      }.xlsx`,
    );
  };

  return (
    <div
      id="relatorio-monitoramento-content"
      className="monitoring-report-professional"
    >
      <MonitoringReportHeader
        report={normalized}
        reportId={resolvedReportId}
        onExportPdf={handleExportPDF}
        onExportExcel={handleExportExcel}
      />

      <MonitoringExecutiveSummary overview={overview} />
      <MonitoringPlotsTable assessments={assessments} />
      <MonitoringActionPlan actions={actions} />

      {alerts.length > 0 && (
        <section className="mr-section report-keep-together">
          <div className="mr-section-heading">
            <p className="mr-eyebrow">Registros do relatório</p>
            <h2>Alertas informados</h2>
          </div>
          <ul className="mr-recorded-alerts">
            {alerts.map((alert, index) => (
              <li key={`${alert}-${index}`}>{alert}</li>
            ))}
          </ul>
        </section>
      )}

      <div className="mr-planting-context">
        <PlantioIntegradoPremiumSection
          relatorio={relatorio as Record<string, unknown>}
        />
      </div>

      <section
        className="mr-section mr-plots-detail"
        aria-labelledby="monitoring-details-title"
      >
        <div className="mr-section-heading">
          <p className="mr-eyebrow">Evidências e análise</p>
          <h2 id="monitoring-details-title">Detalhamento por talhão</h2>
        </div>
        {assessments.length === 0 ? (
          <p className="mr-empty">
            Não há talhões para apresentar no detalhamento.
          </p>
        ) : (
          assessments.map((assessment, index) => (
            <MonitoringPlotSection
              key={assessment.talhao.id}
              assessment={assessment}
              index={index + 1}
              total={assessments.length}
              reportDate={normalized.data}
              actions={actions}
              ndeRows={ndeRows}
            />
          ))
        )}
      </section>

      {unmatchedNdeRows.length > 0 && (
        <section className="mr-section">
          <MonitoringNdeTable
            rows={unmatchedNdeRows as OrganismoContextoWeb[]}
          />
        </section>
      )}

      {consolidatedImages.length > 0 && (
        <section className="mr-section">
          <MonitoringEvidenceGrid
            images={consolidatedImages}
            title="Outras evidências do relatório"
          />
        </section>
      )}

      <MonitoringTechnicalConclusion paragraphs={conclusions} />
      <MonitoringReportFooter
        report={normalized}
        reportId={resolvedReportId}
        relatorioUuid={relatorioUuid}
        version={version}
      />
    </div>
  );
}
