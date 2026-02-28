'use client';

import { useState } from 'react';
import { normalizeRelatorioPlantio } from '@/lib/normalize-relatorio-plantio';
import HeaderRelatorio from '@/components/HeaderRelatorio';
import DashboardTalhao, { type RelatorioPlantioData } from './DashboardTalhao';
import PlantabilidadeEstande from './PlantabilidadeEstande';
import DiagnosticoIntegrado from './DiagnosticoIntegrado';
import RelatorioTecnicoPdf from './RelatorioTecnicoPdf';
import ReportPageSaaS, { type ReportPageSaaSData } from '@/components/saas/ReportPageSaaS';
type TabId = 'dashboard' | 'plantabilidade' | 'diagnostico' | 'pdf';

const tabs: { id: TabId; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard Talhão' },
  { id: 'plantabilidade', label: 'Plantabilidade + Estande' },
  { id: 'diagnostico', label: 'Diagnóstico Integrado' },
  { id: 'pdf', label: 'Relatório PDF' },
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
  const normalized = normalizeRelatorioPlantio(relatorio as Record<string, unknown>);
  const data = normalized as RelatorioPlantioData;
  const meta = (normalized.meta || {}) as { dataGeracao?: string; safra?: string; tecnico?: string; tecnicoCrea?: string; id?: string; versao?: number; status?: string };
  const prop = (normalized.propriedade || {}) as { fazenda?: string; proprietario?: string; municipio?: string; estado?: string };
  const talhao = (normalized.talhao || {}) as { nome?: string; cultura?: string };
  const contextoSafra = (normalized.contextoSafra || {}) as { materialVariedade?: string; empresa?: string };
  const assinaturaTecnica = (normalized.assinaturaTecnica || {}) as { nome?: string; crea?: string; dataAssinatura?: string; cidade?: string };

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
        <div className="plantio-title-block mb-6 print:hidden">
          <h1>Relatório Agronômico</h1>
          <p className="plantio-breadcrumb">
            Talhão: {talhao.nome || '—'} › {prop.fazenda || '—'} › {talhao.cultura || '—'} › Safra {meta.safra || '—'}
          </p>
        </div>

        {/* Navegação por abas */}
        <nav className="plantio-tabs mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden">
          <div className="flex flex-wrap gap-2">
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
          </div>
        </nav>

        {/* Conteúdo da aba ativa (oculto na impressão) */}
        <div className="relatorio-plantio-content print:hidden">
          {activeTab === 'dashboard' && <DashboardTalhao data={data} relatorioId={relatorioUuid || reportId} />}
          {activeTab === 'plantabilidade' && <PlantabilidadeEstande data={data} />}
          {activeTab === 'diagnostico' && <DiagnosticoIntegrado data={data} />}
          
          {activeTab === 'pdf' && (
            <RelatorioTecnicoPdf
              data={data}
              meta={meta}
              assinaturaTecnica={assinaturaTecnica}
              relatorioId={relatorioUuid || reportId}
            />
          )}
        </div>

        {/* Versão impressão: todas as seções */}
        <div className="hidden print:block">
          <DashboardTalhao data={data} relatorioId={relatorioUuid || reportId} />
          <div className="my-8 border-t-2 border-slate-300" />
          <PlantabilidadeEstande data={data} />
          <div className="my-8 border-t-2 border-slate-300" />
          <DiagnosticoIntegrado data={data} />
          <div className="my-8 border-t-2 border-slate-300" />
          <RelatorioTecnicoPdf
            data={data}
            meta={meta}
            assinaturaTecnica={assinaturaTecnica}
            relatorioId={relatorioUuid || reportId}
          />
        </div>
    </div>
  );
}
