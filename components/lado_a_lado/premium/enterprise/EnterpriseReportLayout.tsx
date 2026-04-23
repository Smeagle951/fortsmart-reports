'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import FieldContextStrip from '../FieldContextStrip';
import ReportHeader from './ReportHeader';
import HeroComparison from './HeroComparison';
import EnterpriseKPIStrip from './EnterpriseKPIStrip';
import ChartsEnterpriseGrid from './ChartsEnterpriseGrid';
import EconomicTableEnterprise from './EconomicTableEnterprise';
import ExecutiveSummaryEnterprise from './ExecutiveSummaryEnterprise';
import PhotoGalleryEnterprise from './PhotoGalleryEnterprise';
import ReportFooterEnterprise from './ReportFooterEnterprise';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
  onPrint: () => void;
};

export default function EnterpriseReportLayout({ data, reportId, shareToken, onPrint }: Props) {
  const meta = data.meta ?? {};
  const idStr = meta.reportId || reportId || '';
  const reportCode = idStr || shareToken?.slice(0, 12) || null;
  const [reportUrl, setReportUrl] = useState<string | null>(null);

  useEffect(() => {
    setReportUrl(typeof window !== 'undefined' ? window.location.href : null);
  }, []);

  return (
    <motion.div
      id="hero-premium"
      className="scroll-mt-36"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReportHeader data={data} onPrint={onPrint} />
      <FieldContextStrip data={data} />
      <HeroComparison data={data} />
      <EnterpriseKPIStrip data={data} />
      <ChartsEnterpriseGrid data={data} />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-7">
          <EconomicTableEnterprise data={data} />
        </div>
        <div className="lg:col-span-5">
          <ExecutiveSummaryEnterprise data={data} />
        </div>
      </div>
      <PhotoGalleryEnterprise data={data} />
      <ReportFooterEnterprise data={data} reportUrl={reportUrl} reportCode={reportCode} />
    </motion.div>
  );
}
