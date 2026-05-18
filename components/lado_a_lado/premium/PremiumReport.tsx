'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import SideBySideOfficialReport from '@/components/lado_a_lado/SideBySideOfficialReport';
import FortSmartLadoALadoReport from '@/components/lado_a_lado/fortsmart/FortSmartLadoALadoReport';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import './premium-theme.css';
import './editorial-lado-a-lado.css';
import ReportFooterEnterprise from './enterprise/ReportFooterEnterprise';
import EditorialLadoALadoFooterStrip from './EditorialLadoALadoFooterStrip';

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
    const el =
      document.getElementById('relatorio-avaliacao-lado-a-lado-content') ??
      document.getElementById('relatorio-lado-a-lado-content');
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
      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        {data.branding?.reportLayout === 'legacy' ? (
          <>
            <FortSmartLadoALadoReport data={data} onPrint={handlePrint} onExportPdf={handleExportPdf} />
            <ReportFooterEnterprise data={data} reportId={reportId} />
            <EditorialLadoALadoFooterStrip data={data} shareToken={shareToken} />
          </>
        ) : (
          <SideBySideOfficialReport
            data={data}
            reportId={reportId}
            shareToken={shareToken}
            onExportPdf={handleExportPdf}
          />
        )}
      </div>
    </div>
  );
}
