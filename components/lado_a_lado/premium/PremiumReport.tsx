'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import HeroSection from './HeroSection';
import KPISection from './KPISection';
import CompareManejosSection from './CompareManejosSection';
import InsightSection from './InsightSection';
import TimelinePremiumSection from './TimelinePremiumSection';
import EconomicSection from './EconomicSection';
import ConclusionSection from './ConclusionSection';
import TreatmentSection from './TreatmentSection';
import ExecutionSection from './ExecutionSection';
import EvolutionSection from './EvolutionSection';
import EvaluationSection from './EvaluationSection';

const NAV_PREMIUM: { id: string; label: string }[] = [
  { id: 'hero-premium', label: 'Início' },
  { id: 'kpis-premium', label: 'Indicadores' },
  { id: 'comparativo-premium', label: 'Comparativo' },
  { id: 'timeline-premium', label: 'Linha do tempo' },
  { id: 'economico-premium', label: 'Econômico' },
  { id: 'conclusao-premium', label: 'Conclusão' },
  { id: 'tratamento-premium', label: 'Protocolo' },
  { id: 'execucao-premium', label: 'Execução' },
  { id: 'evolucao-premium', label: 'Evolução' },
  { id: 'avaliacao-premium', label: 'Evidências' },
];

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

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const createdStr = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR')
    : null;
  const idStr = meta.reportId || reportId;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="sticky top-0 z-40 flex flex-wrap justify-end gap-2 px-4 py-2 bg-white/95 border-b border-slate-200 print:hidden backdrop-blur-md shadow-sm">
        <button
          type="button"
          onClick={handlePrint}
          className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-emerald-700 rounded-lg hover:bg-emerald-700"
        >
          Exportar PDF
        </button>
      </div>

      <nav className="sticky top-[49px] z-30 print:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 flex gap-1 overflow-x-auto py-2">
          {NAV_PREMIUM.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="shrink-0 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 whitespace-nowrap"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        <div id="hero-premium" className="scroll-mt-36">
          <HeroSection data={data} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-20 sm:space-y-24 py-14 sm:py-20 print:space-y-12">
          <KPISection data={data} />
          <CompareManejosSection data={data} />
          <InsightSection data={data} />
          <TimelinePremiumSection data={data} />
          <EconomicSection data={data} />
          <ConclusionSection data={data} />
          <TreatmentSection data={data} />
          <ExecutionSection data={data} />
          <EvolutionSection data={data} />
          <EvaluationSection data={data} />
        </div>

        <footer className="text-center text-sm text-slate-500 py-12 border-t border-slate-200 print:mt-8">
          <p className="font-medium text-slate-700">FortSmart Agro · relatório decisório</p>
          <p className="mt-2 text-xs text-slate-500">
            {[createdStr, idStr ? `ID ${idStr}` : null].filter(Boolean).join(' · ') || ' '}
          </p>
        </footer>
      </div>
    </div>
  );
}
