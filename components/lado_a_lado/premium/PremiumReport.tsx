'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import './premium-theme.css';
import AgronomicAlertBanner from './AgronomicAlertBanner';
import ConclusionSection from './ConclusionSection';
import CoverSection from './CoverSection';
import DecisionLayerSummarySection from './DecisionLayerSummarySection';
import EconomicSection from './EconomicSection';
import ExecutiveDeckSection from './ExecutiveDeckSection';
import ExecutiveOutcomeStrip from './ExecutiveOutcomeStrip';
import ExperimentDesignSection from './ExperimentDesignSection';
import ReportFooterEnterprise from './enterprise/ReportFooterEnterprise';
import FieldCollectionModulesSection from './FieldCollectionModulesSection';
import FortSmartAiSection from './FortSmartAiSection';
import HeroSection from './HeroSection';
import KPISection from './KPISection';
import PlantEvaluationSection from './PlantEvaluationSection';
import SidePhotoGallerySection from './SidePhotoGallerySection';
import SubareaCostsAndEvolutionSection from './SubareaCostsAndEvolutionSection';
import TimelinePremiumSection from './TimelinePremiumSection';
import TreatmentExecutionCombinedSection from './TreatmentExecutionCombinedSection';
import WhyWinPanel from './WhyWinPanel';

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
  { id: 'tratamento-execucao-premium', label: 'Tratamento' },
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
      <div className="premium-toolbar sticky top-0 z-40 flex flex-wrap items-center justify-end gap-2 px-4 py-2.5 border-b print:hidden backdrop-blur-xl shadow-sm">
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide rounded-full border transition-colors"
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
          className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white rounded-full transition-colors shadow-md"
          style={{ background: 'linear-gradient(90deg, var(--fs-forest,#1b4332), var(--fs-forest-md,#2d6a4f))' }}
        >
          Exportar PDF
        </button>
      </div>

      <nav className="premium-nav-bar sticky top-[52px] z-30 print:hidden border-b">
        <div className="mx-auto flex max-w-[1140px] gap-1 overflow-x-auto px-2 py-2.5 sm:px-4">
          {NAV_PREMIUM.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToId(item.id)}
              className="shrink-0 px-3.5 py-2 text-[0.7rem] sm:text-xs font-semibold uppercase tracking-wide rounded-full whitespace-nowrap transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        <div id="hero-premium" className="scroll-mt-36 fs-l2-avoid print:break-inside-avoid">
          <CoverSection data={data} reportId={reportId} />
          <ExecutiveOutcomeStrip data={data} />
          <AgronomicAlertBanner data={data} />
          <HeroSection data={data} />
        </div>

        <div className="pt-6 sm:pt-8 fs-l2-avoid print:break-inside-avoid">
          <DecisionLayerSummarySection data={data} />
        </div>

        <div className="fs-l2-page-break print:break-after-page" aria-hidden />
        <div className="mx-auto max-w-[1140px] space-y-16 px-4 py-12 sm:space-y-20 sm:px-6 sm:py-16 print:space-y-10 print:px-4">
          <ExecutiveDeckSection data={data} />
          <WhyWinPanel data={data} />
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
          <TreatmentExecutionCombinedSection data={data} />
          <PlantEvaluationSection data={data} />
        </div>

        <ReportFooterEnterprise data={data} reportId={reportId} />
      </div>
    </div>
  );
}
