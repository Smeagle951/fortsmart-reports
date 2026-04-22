'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import HeroSection from './HeroSection';
import DecisionLayerSummarySection from './DecisionLayerSummarySection';
import KPISection from './KPISection';
import TimelinePremiumSection from './TimelinePremiumSection';
import EconomicSection from './EconomicSection';
import ConclusionSection from './ConclusionSection';
import TreatmentSection from './TreatmentSection';
import ExecutionSection from './ExecutionSection';
import SubareaCostsAndEvolutionSection from './SubareaCostsAndEvolutionSection';
import PlantEvaluationSection from './PlantEvaluationSection';
import FortSmartAiSection from './FortSmartAiSection';
import ExperimentDesignSection from './ExperimentDesignSection';
import FieldCollectionModulesSection from './FieldCollectionModulesSection';
import ExecutiveDeckSection from './ExecutiveDeckSection';
import SidePhotoGallerySection from './SidePhotoGallerySection';

const NAV_PREMIUM: { id: string; label: string }[] = [
  { id: 'hero-premium', label: 'Início' },
  { id: 'decisao-executiva-premium', label: 'Decisão' },
  { id: 'deck-executivo-premium', label: 'Painel' },
  { id: 'fotos-premium', label: 'Fotos' },
  { id: 'kpis-premium', label: 'Indicadores' },
  { id: 'fortsmart-ai-premium', label: 'FortSmart AI' },
  { id: 'ensaio-premium', label: 'Ensaio' },
  { id: 'coleta-modulos-premium', label: 'Coleta' },
  { id: 'timeline-premium', label: 'Linha do tempo' },
  { id: 'economico-premium', label: 'Econômico' },
  { id: 'custos-evolucao-visitas-premium', label: 'Subáreas / visitas' },
  { id: 'conclusao-premium', label: 'Conclusão' },
  { id: 'tratamento-premium', label: 'Protocolo' },
  { id: 'execucao-premium', label: 'Execução' },
  { id: 'plantas-premium', label: 'Plantas' },
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#F0F2F5] text-slate-900 print:bg-white">
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
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_120%_80%_at_50%_-20%,rgba(15,23,42,0.06),transparent_50%)] print:hidden"
        aria-hidden
      />
      <div className="sticky top-0 z-40 flex flex-wrap items-center justify-end gap-2 px-4 py-2.5 border-b border-slate-200/80 bg-white/90 print:hidden backdrop-blur-xl shadow-[0_4px_24px_-8px_rgba(15,23,42,0.08)]">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 bg-white border border-slate-200 rounded-full shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-colors"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-full bg-gradient-to-r from-slate-800 to-slate-900 shadow-md shadow-slate-900/15 hover:from-slate-700 hover:to-slate-800 transition-colors"
        >
          Exportar PDF
        </button>
      </div>

      <nav className="sticky top-[52px] z-30 print:hidden border-b border-slate-200/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] gap-1 overflow-x-auto px-2 py-2.5 sm:px-4">
          {NAV_PREMIUM.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="shrink-0 px-3.5 py-2 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100/90 whitespace-nowrap transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        <div id="hero-premium" className="scroll-mt-36 fs-l2-avoid print:break-inside-avoid">
          <HeroSection data={data} />
        </div>

        <div className="pt-6 sm:pt-8 fs-l2-avoid print:break-inside-avoid">
          <DecisionLayerSummarySection data={data} />
        </div>

        <div className="fs-l2-page-break print:break-after-page" aria-hidden />
        <div className="mx-auto max-w-[1400px] space-y-20 px-4 py-14 sm:space-y-24 sm:px-6 sm:py-20 print:space-y-12 print:px-4">
          <ExecutiveDeckSection data={data} />
          <div className="fs-l2-page-break print:hidden" aria-hidden />
          <SidePhotoGallerySection data={data} />
          <KPISection data={data} />
          <FortSmartAiSection data={data} />
          <ExperimentDesignSection data={data} sectionId="ensaio-premium" />
          <FieldCollectionModulesSection data={data} sectionId="coleta-modulos-premium" />
          <TimelinePremiumSection data={data} />
          <EconomicSection data={data} />
          <SubareaCostsAndEvolutionSection data={data} />
          <ConclusionSection data={data} />
          <TreatmentSection data={data} />
          <ExecutionSection data={data} />
          <PlantEvaluationSection data={data} />
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
