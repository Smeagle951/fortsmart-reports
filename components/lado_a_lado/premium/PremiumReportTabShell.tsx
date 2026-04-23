'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import EnterpriseReportLayout from './enterprise/EnterpriseReportLayout';
import ReportFooterEnterprise from './enterprise/ReportFooterEnterprise';
import DecisionLayerSummarySection from './DecisionLayerSummarySection';
import KPISection from './KPISection';
import TimelinePremiumSection from './TimelinePremiumSection';
import EconomicSection from './EconomicSection';
import ConclusionSection from './ConclusionSection';
import TreatmentExecutionCombinedSection from './TreatmentExecutionCombinedSection';
import SubareaCostsAndEvolutionSection from './SubareaCostsAndEvolutionSection';
import PlantEvaluationSection from './PlantEvaluationSection';
import FortSmartAiSection from './FortSmartAiSection';
import ExperimentDesignSection from './ExperimentDesignSection';
import FieldCollectionModulesSection from './FieldCollectionModulesSection';
import ExecutiveDeckSection from './ExecutiveDeckSection';

export type PremiumTabId =
  | 'visao'
  | 'aplicacoes'
  | 'coleta'
  | 'economia'
  | 'indicadores'
  | 'ensaio'
  | 'conclusao';

const TABS: { id: PremiumTabId; label: string; hint: string }[] = [
  { id: 'visao', label: 'Visão geral', hint: 'Resumo, KPIs, gráficos, síntese e fotos' },
  { id: 'aplicacoes', label: 'Tratamento e aplicações', hint: 'Protocolo e registos de campo' },
  { id: 'coleta', label: 'Coleta (módulos)', hint: 'Ponto a ponto conforme módulos' },
  { id: 'economia', label: 'Análise económica', hint: 'Colheita, custos, ROI e subáreas' },
  { id: 'indicadores', label: 'Indicadores e painel', hint: 'Motor, KPIs, decisão e deck' },
  { id: 'ensaio', label: 'Ensaio e tempo', hint: 'Delineamento e linha do tempo' },
  { id: 'conclusao', label: 'Conclusão', hint: 'Síntese final e plantas' },
];

const HASH_PREFIX = 'tab=';

function parseHash(): PremiumTabId | null {
  if (typeof window === 'undefined') return null;
  const raw = window.location.hash.replace(/^#/, '');
  if (!raw.startsWith(HASH_PREFIX)) return null;
  const id = raw.slice(HASH_PREFIX.length) as PremiumTabId;
  return TABS.some((t) => t.id === id) ? id : null;
}

type Props = {
  data: SideBySideReportData;
  reportId?: string;
};

export default function PremiumReportTabShell({ data, reportId }: Props) {
  const [tab, setTabState] = useState<PremiumTabId>('visao');

  const setTab = useCallback((id: PremiumTabId) => {
    setTabState(id);
    if (typeof window !== 'undefined') {
      const next = `#${HASH_PREFIX}${id}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, '', next);
      }
    }
  }, []);

  useEffect(() => {
    const fromHash = parseHash();
    if (fromHash) {
      setTabState(fromHash);
    } else if (typeof window !== 'undefined' && !window.location.hash) {
      window.history.replaceState(null, '', `#${HASH_PREFIX}visao`);
    }
  }, []);

  useEffect(() => {
    const onHash = () => {
      const next = parseHash();
      if (next) setTabState(next);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const active = useMemo(() => TABS.find((t) => t.id === tab) ?? TABS[0], [tab]);

  const panelClass = (id: PremiumTabId) =>
    [
      'premium-tab-panel pb-10 sm:pb-14',
      tab === id ? 'block' : 'hidden print:block',
      'print:break-inside-avoid',
    ].join(' ');

  return (
    <>
      {/* Barra de subtelas — oculta na impressão; cada painel torna-se visível ao exportar PDF */}
      <nav
        className="premium-tablist sticky top-[52px] z-30 border-b border-slate-200/80 bg-white/95 shadow-sm print:hidden backdrop-blur-xl"
        aria-label="Secções do relatório"
      >
        <div className="mx-auto max-w-[1400px] px-2 py-2 sm:px-4">
          <div
            className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
          >
            {TABS.map((t) => {
              const selected = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  id={`tab-trigger-${t.id}`}
                  aria-controls={`tab-panel-${t.id}`}
                  title={t.hint}
                  onClick={() => setTab(t.id)}
                  className={[
                    'shrink-0 rounded-xl border px-3 py-2.5 text-left transition-colors sm:px-4',
                    selected
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200/80 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span className="block text-[0.65rem] font-bold uppercase tracking-wide sm:text-[0.7rem]">{t.label}</span>
                  <span
                    className={`mt-0.5 hidden text-[10px] leading-snug sm:block ${
                      selected ? 'text-white/80' : 'text-slate-500'
                    }`}
                  >
                    {t.hint}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-500 print:hidden">
            <span className="font-semibold text-slate-700">{active.label}</span>
            <span className="mx-1.5 text-slate-300">·</span>
            {active.hint}
          </p>
        </div>
      </nav>

      <div className="premium-tab-bodies min-h-[50vh]">
        <div
          id="tab-panel-visao"
          role="tabpanel"
          aria-labelledby="tab-trigger-visao"
          className={panelClass('visao')}
          aria-hidden={tab !== 'visao'}
        >
          <EnterpriseReportLayout data={data} />
        </div>

        <div
          id="tab-panel-aplicacoes"
          role="tabpanel"
          aria-labelledby="tab-trigger-aplicacoes"
          className={panelClass('aplicacoes')}
          aria-hidden={tab !== 'aplicacoes'}
        >
          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pt-8 sm:px-6">
            <TreatmentExecutionCombinedSection data={data} />
          </div>
        </div>

        <div
          id="tab-panel-coleta"
          role="tabpanel"
          aria-labelledby="tab-trigger-coleta"
          className={panelClass('coleta')}
          aria-hidden={tab !== 'coleta'}
        >
          <div className="mx-auto max-w-[1400px] space-y-6 px-4 pt-8 sm:px-6">
            <FieldCollectionModulesSection data={data} sectionId="coleta-modulos-premium" />
          </div>
        </div>

        <div
          id="tab-panel-economia"
          role="tabpanel"
          aria-labelledby="tab-trigger-economia"
          className={panelClass('economia')}
          aria-hidden={tab !== 'economia'}
        >
          <div className="mx-auto max-w-[1400px] space-y-12 px-4 pt-8 sm:px-6 sm:space-y-16">
            <EconomicSection data={data} />
            <SubareaCostsAndEvolutionSection data={data} />
          </div>
        </div>

        <div
          id="tab-panel-indicadores"
          role="tabpanel"
          aria-labelledby="tab-trigger-indicadores"
          className={panelClass('indicadores')}
          aria-hidden={tab !== 'indicadores'}
        >
          <div className="mx-auto max-w-[1400px] space-y-10 px-4 pt-8 sm:px-6 sm:space-y-12">
            <DecisionLayerSummarySection data={data} />
            <KPISection data={data} />
            <ExecutiveDeckSection data={data} />
            <FortSmartAiSection data={data} />
          </div>
        </div>

        <div
          id="tab-panel-ensaio"
          role="tabpanel"
          aria-labelledby="tab-trigger-ensaio"
          className={panelClass('ensaio')}
          aria-hidden={tab !== 'ensaio'}
        >
          <div className="mx-auto max-w-[1400px] space-y-10 px-4 pt-8 sm:px-6 sm:space-y-12">
            <ExperimentDesignSection data={data} sectionId="ensaio-premium" />
            <TimelinePremiumSection data={data} />
          </div>
        </div>

        <div
          id="tab-panel-conclusao"
          role="tabpanel"
          aria-labelledby="tab-trigger-conclusao"
          className={panelClass('conclusao')}
          aria-hidden={tab !== 'conclusao'}
        >
          <div className="mx-auto max-w-[1400px] space-y-10 px-4 pt-8 sm:px-6 sm:space-y-12">
            <ConclusionSection data={data} />
            <PlantEvaluationSection data={data} />
          </div>
        </div>
      </div>

      <ReportFooterEnterprise data={data} reportId={reportId} />
    </>
  );
}
