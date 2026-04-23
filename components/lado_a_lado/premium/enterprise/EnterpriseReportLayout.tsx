'use client';

import { motion } from 'framer-motion';
import { BarChart3, Camera, Coins } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import FieldContextStrip from '../FieldContextStrip';
import ReportHeader from './ReportHeader';
import HeroComparison from './HeroComparison';
import EnterpriseKPIStrip from './EnterpriseKPIStrip';
import ReportConfidenceBadge from './ReportConfidenceBadge';
import SectionCover from './SectionCover';
import ChartsEnterpriseGrid from './ChartsEnterpriseGrid';
import EconomicTableEnterprise from './EconomicTableEnterprise';
import ExecutiveSummaryEnterprise from './ExecutiveSummaryEnterprise';
import PhotoGalleryEnterprise from './PhotoGalleryEnterprise';

type Props = {
  data: SideBySideReportData;
};

/**
 * Ordem alinhada à referência visual: cabeçalho → ficha 6 colunas → herói A|troféu|B → KPIs
 * (sem banner duplicado “decisão” acima do comparativo; os deltas ficam no strip de KPIs).
 */
export default function EnterpriseReportLayout({ data }: Props) {
  return (
    <motion.div
      id="hero-premium"
      className="scroll-mt-36"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <ReportHeader data={data} />

      <FieldContextStrip data={data} />

      <HeroComparison data={data} />

      <EnterpriseKPIStrip data={data} />

      <div className="mx-auto max-w-[1400px] px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6">
        <ReportConfidenceBadge data={data} />
      </div>

      <SectionCover
        number="01"
        title="Comparativo técnico"
        subtitle="Desempenho multidimensional e evolução por DAA"
        icon={BarChart3}
        tone="blue"
      />
      <ChartsEnterpriseGrid data={data} />

      <SectionCover
        number="02"
        title="Análise económica e síntese"
        subtitle="Margem, retorno e leitura executiva"
        icon={Coins}
        tone="emerald"
      />
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-12 lg:gap-4">
        <div className="lg:col-span-7">
          <EconomicTableEnterprise data={data} />
        </div>
        <div className="lg:col-span-5">
          <ExecutiveSummaryEnterprise data={data} />
        </div>
      </div>

      <SectionCover
        number="03"
        title="Evidências de campo"
        subtitle="Registo fotográfico por manejo"
        icon={Camera}
        tone="blue"
      />
      <PhotoGalleryEnterprise data={data} />
    </motion.div>
  );
}
