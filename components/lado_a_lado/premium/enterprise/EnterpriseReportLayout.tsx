'use client';

import { motion } from 'framer-motion';
import { BarChart3, Camera, Coins, Gauge } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import FieldContextStrip from '../FieldContextStrip';
import ReportHeader from './ReportHeader';
import HeroDecisionBanner from './HeroDecisionBanner';
import HeroComparison from './HeroComparison';
import EnterpriseKPIStrip from './EnterpriseKPIStrip';
import ReportConfidenceBadge from './ReportConfidenceBadge';
import SectionCover from './SectionCover';
import ChartsEnterpriseGrid from './ChartsEnterpriseGrid';
import EconomicTableEnterprise from './EconomicTableEnterprise';
import ExecutiveSummaryEnterprise from './ExecutiveSummaryEnterprise';
import PhotoGalleryEnterprise from './PhotoGalleryEnterprise';
import ReportFooterEnterprise from './ReportFooterEnterprise';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
  onPrint?: () => void;
};

export default function EnterpriseReportLayout({ data }: Props) {
  return (
    <motion.div
      id="hero-premium"
      className="scroll-mt-36"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Capa / Header */}
      <ReportHeader data={data} />

      {/* ▸ Decisão no topo — impacto imediato */}
      <HeroDecisionBanner data={data} />

      {/* Contexto técnico */}
      <FieldContextStrip data={data} />

      {/* Confiança do relatório (auditoria executiva) */}
      <ReportConfidenceBadge data={data} />

      {/* SECÇÃO 01 — Resumo executivo */}
      <SectionCover
        number="01"
        title="Resumo executivo"
        subtitle="Indicadores-chave do ensaio comparados lado a lado"
        icon={Gauge}
        tone="emerald"
      />
      <HeroComparison data={data} />
      <EnterpriseKPIStrip data={data} />

      {/* SECÇÃO 02 — Comparativo técnico */}
      <SectionCover
        number="02"
        title="Comparativo técnico"
        subtitle="Índices técnicos multidimensionais e curva de evolução"
        icon={BarChart3}
        tone="blue"
      />
      <ChartsEnterpriseGrid data={data} />

      {/* SECÇÃO 03 — Análise económica */}
      <SectionCover
        number="03"
        title="Análise económica"
        subtitle="Receita, custo, margem e retorno sobre o investimento"
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

      {/* SECÇÃO 04 — Evidências de campo */}
      <SectionCover
        number="04"
        title="Evidências de campo"
        subtitle="Registo fotográfico auditável por manejo"
        icon={Camera}
        tone="blue"
      />
      <PhotoGalleryEnterprise data={data} />

      <ReportFooterEnterprise data={data} />
    </motion.div>
  );
}
