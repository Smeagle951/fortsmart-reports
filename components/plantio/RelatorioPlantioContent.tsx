'use client';

import { useState } from 'react';
import { normalizeRelatorioPlantio } from '@/lib/normalize-relatorio-plantio';
import HeaderRelatorio from '@/components/HeaderRelatorio';
import DashboardTalhao, { type RelatorioPlantioData } from './DashboardTalhao';
import PlantabilidadeEstande from './PlantabilidadeEstande';
import DiagnosticoIntegrado from './DiagnosticoIntegrado';
import PlantioEditorialSnapshot from './PlantioEditorialSnapshot';
import PlantioAnaliseDrawer from './analise/PlantioAnaliseDrawer';

type TabId = 'dashboard' | 'plantabilidade' | 'diagnostico';

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Visão analítica' },
  { id: 'plantabilidade', label: 'Plantabilidade e estande' },
  { id: 'diagnostico', label: 'Diagnóstico (painel)' },
];

interface RelatorioPlantioContentProps {
  relatorio: RelatorioPlantioData & Record<string, unknown>;
  reportId?: string;
  relatorioUuid?: string;
}

export default function RelatorioPlantioContent({
  relatorio,
  reportId,
  relatorioUuid,
}: RelatorioPlantioContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [analiseOpen, setAnaliseOpen] = useState(false);
  const normalized = normalizeRelatorioPlantio(relatorio as Record<string, unknown>);
  const data = normalized as RelatorioPlantioData;
  const meta = (normalized.meta || {}) as {
    dataGeracao?: string;
    safra?: string;
    tecnico?: string;
    tecnicoCrea?: string;
    id?: string;
    versao?: number;
    status?: string;
  };
  const prop = (normalized.propriedade || {}) as {
    fazenda?: string;
    proprietario?: string;
    municipio?: string;
    estado?: string;
  };
  const talhao = (normalized.talhao || {}) as { nome?: string; cultura?: string };
  const contextoSafra = (normalized.contextoSafra || {}) as { materialVariedade?: string; empresa?: string };
  const storageId = relatorioUuid || reportId;

  return (
    <div className="relatorio-plantio">
      <HeaderRelatorio
        meta={meta}
        propriedade={prop}
        talhao={talhao}
        contextoSafra={contextoSafra}
        reportId={reportId}
        variant="plantio"
      />

      <PlantioEditorialSnapshot
        snapshot={normalized as Record<string, unknown>}
        relatorioId={storageId}
      />

      <div className="mt-6 flex justify-center print:hidden">
        <button
          type="button"
          onClick={() => setAnaliseOpen(true)}
          className="rounded-lg border border-emerald-800/30 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-100"
        >
          Painel de análise agronômica
        </button>
      </div>

      <PlantioAnaliseDrawer
        open={analiseOpen}
        snapshot={normalized as Record<string, unknown>}
        reportId={storageId}
        metaSafra={meta.safra}
        onClose={() => setAnaliseOpen(false)}
      />

      <details className="plantio-technical-annex mt-10 print:hidden">
        <summary className="cursor-pointer select-none text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-slate-900">
          Anexos técnicos — gráficos, trena (CV%) e painéis complementares
        </summary>
        <div className="mt-5 rounded-lg border border-slate-200/80 bg-slate-50/50 p-4">
          <nav className="plantio-tabs mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                {tab.label}
              </button>
            ))}
          </nav>
          <div className="relatorio-plantio-content">
            {activeTab === 'dashboard' && <DashboardTalhao data={data} relatorioId={storageId} />}
            {activeTab === 'plantabilidade' && <PlantabilidadeEstande data={data} />}
            {activeTab === 'diagnostico' && <DiagnosticoIntegrado data={data} />}
          </div>
        </div>
      </details>

      <div className="hidden print:block print:mt-10 print:border-t print:border-slate-300 print:pt-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-600">Anexos técnicos</p>
        <DashboardTalhao data={data} relatorioId={storageId} />
        <div className="my-8 border-t border-slate-300" />
        <PlantabilidadeEstande data={data} />
        <div className="my-8 border-t border-slate-300" />
        <DiagnosticoIntegrado data={data} />
      </div>
    </div>
  );
}
