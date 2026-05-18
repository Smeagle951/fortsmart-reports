'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import SideBySideHeader from './SideBySideHeader';
import SideBySideExecutiveCards from './SideBySideExecutiveCards';
import SideBySideMap from './SideBySideMap';
import SideBySideComparisonTable from './SideBySideComparisonTable';
import SideBySideTreatments from './SideBySideTreatments';
import SideBySideDAATimeline from './SideBySideDAATimeline';
import SideBySideFieldCollections from './SideBySideFieldCollections';
import SideBySidePhotoGallery from './SideBySidePhotoGallery';
import SideBySideHarvest from './SideBySideHarvest';
import SideBySideCostsROI from './SideBySideCostsROI';
import SideBySideCharts from './SideBySideCharts';
import SideBySideAIInsights from './SideBySideAIInsights';
import SideBySideConclusion from './SideBySideConclusion';
import SideBySideFooter from './SideBySideFooter';
import './official-theme.css';

/**
 * Layout oficial premium — Avaliação Lado a Lado (referência aprovada FortSmart Agro).
 * Compatível com payloads legados via normalização em SideBySideReportData.
 */
export default function SideBySideOfficialReport({
  data,
  reportId,
  shareToken,
  onExportPdf,
}: {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
  onExportPdf?: () => void;
}) {
  return (
    <div className="fs-official-report min-h-screen pb-8">
      <SideBySideHeader
        data={data}
        reportId={reportId}
        shareToken={shareToken}
        onExportPdf={onExportPdf}
      />

      <div id="relatorio-avaliacao-lado-a-lado-content">
        <SideBySideExecutiveCards data={data} />

        <div className="fs-section grid grid-cols-1 gap-6 xl:grid-cols-2">
          <SideBySideMap data={data} />
          <SideBySideComparisonTable data={data} />
        </div>

        <SideBySideTreatments data={data} />
        <SideBySideDAATimeline data={data} />

        <div className="fs-section grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SideBySideFieldCollections data={data} />
          <SideBySidePhotoGallery data={data} />
        </div>

        <div className="fs-section grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SideBySideHarvest data={data} />
          <SideBySideCostsROI data={data} />
          <SideBySideCharts data={data} />
        </div>

        <SideBySideAIInsights data={data} />
        <SideBySideConclusion data={data} />
      </div>

      <SideBySideFooter data={data} reportId={reportId} />
    </div>
  );
}
