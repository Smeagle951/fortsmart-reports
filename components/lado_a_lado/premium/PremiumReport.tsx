'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import LadoALadoRelatorioAgronomico from '@/components/lado_a_lado/agronomic/LadoALadoRelatorioAgronomico';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import './premium-theme.css';
import ReportFooterEnterprise from './enterprise/ReportFooterEnterprise';

export default function PremiumReport({
  data,
  reportId,
  shareToken,
}: {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
}) {
  const meta = data.meta || {};

  const handlePrint = () => window.print();

  const handleExportPdf = async () => {
    const el = document.getElementById('relatorio-lado-a-lado-content');
    if (!el) {
      window.print();
      return;
    }
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 10,
          filename: `relatorio-lado-a-lado-${meta.reportId || reportId || 'report'}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();
      if (shareToken?.trim()) {
        void postReportAnalytics({
          shareToken: shareToken.trim(),
          eventType: 'download',
          module: 'avaliacao_lado_a_lado',
        });
      }
    } catch {
      window.print();
    }
  };

  return (
    <div className="premium-spec-theme relative min-h-screen overflow-x-hidden print:bg-white">
      <style jsx global>{`
        @media print {
          .fs-l2-page-break {
            page-break-after: always;
            break-inside: avoid;
          }
          .fs-l2-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(27,67,50,0.06),transparent_50%)] print:hidden"
        aria-hidden
      />
      <div className="premium-toolbar sticky top-0 z-40 flex flex-wrap items-center justify-end gap-2 border-b px-4 py-2.5 shadow-sm backdrop-blur-xl print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors"
          style={{
            color: 'var(--fs-forest, #1b4332)',
            borderColor: 'var(--fs-border, rgba(0,0,0,0.08))',
            background: '#fff',
          }}
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          className="rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-md transition-colors"
          style={{ background: 'linear-gradient(90deg, var(--fs-forest,#1b4332), var(--fs-forest-md,#2d6a4f))' }}
        >
          Exportar PDF
        </button>
      </div>

      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        <LadoALadoRelatorioAgronomico data={data} />
        <ReportFooterEnterprise data={data} reportId={reportId} />
      </div>
    </div>
  );
}
