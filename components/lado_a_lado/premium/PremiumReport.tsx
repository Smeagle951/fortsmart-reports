'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import PremiumReportTabShell from './PremiumReportTabShell';

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
    el.classList.add('fs-pdf-all-panels');
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
    } finally {
      el.classList.remove('fs-pdf-all-panels');
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#F8F9FA] text-slate-900 print:bg-white">
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
          .premium-tablist {
            display: none !important;
          }
          .premium-tab-panel {
            display: block !important;
            visibility: visible !important;
            break-inside: auto;
            page-break-before: always;
          }
          .premium-tab-panel:first-of-type {
            page-break-before: auto;
          }
        }
        /* html2pdf: força todas as subtelas no canvas (não só a aba ativa) */
        .fs-pdf-all-panels .premium-tab-panel {
          display: block !important;
          visibility: visible !important;
        }
        .fs-pdf-all-panels .premium-tablist {
          display: none !important;
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(15,23,42,0.05),transparent_50%)] print:hidden"
        aria-hidden
      />
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-end gap-2 border-b border-slate-200/80 bg-white/90 px-4 py-2.5 print:hidden backdrop-blur-xl shadow-sm">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          className="rounded-full bg-gradient-to-r from-slate-800 to-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-md transition-colors hover:from-slate-700 hover:to-slate-800"
        >
          Exportar PDF
        </button>
      </div>

      <div
        id="relatorio-lado-a-lado-content"
        className="overflow-x-hidden print:overflow-visible"
        dir="ltr"
      >
        <PremiumReportTabShell data={data} reportId={reportId} />
      </div>
    </div>
  );
}
