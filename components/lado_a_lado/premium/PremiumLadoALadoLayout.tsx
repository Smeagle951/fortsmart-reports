'use client';

import React, { useMemo } from 'react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { formatDate, formatDateTime } from '@/utils/format';
import { climateLineFromApplications } from '@/lib/lado-a-lado-premium';
import {
  ReportExecutiveShell,
  ReportContextChips,
  initialsFromName,
  type ReportTabDefinition,
  type ContextChipItem,
} from '@/components/report-shell';

export type LadoALadoTabId = 'resumo' | 'tratamento' | 'execucao' | 'avaliacao' | 'economico' | 'conclusao';

export const LADO_A_LADO_TABS: readonly ReportTabDefinition<LadoALadoTabId>[] = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'tratamento', label: 'Tratamento' },
  { id: 'execucao', label: 'Execução' },
  { id: 'avaliacao', label: 'Avaliação' },
  { id: 'economico', label: 'Econômico' },
  { id: 'conclusao', label: 'Conclusão' },
] as const;

type Props = {
  data: SideBySideReportData;
  onExportPdf: () => void;
  onPrint: () => void;
  slots: Record<LadoALadoTabId, React.ReactNode>;
};

/**
 * Layout avaliação lado a lado — usa {@link ReportExecutiveShell} (compartilhável com outros relatórios).
 */
export default function PremiumLadoALadoLayout({ data, onExportPdf, onPrint, slots }: Props) {
  const farm = data.farm || {};
  const coleta = data.coleta;
  const meta = data.meta || {};
  const climate = climateLineFromApplications(data);

  const daeLine =
    coleta?.dae != null
      ? `${coleta.dae} DAE`
      : coleta?.dap != null
        ? `${coleta.dap} DAP`
        : null;
  const whenLine = [daeLine, meta.createdAt ? formatDate(meta.createdAt) : null].filter(Boolean).join(' — ');

  const people = useMemo(() => {
    const out: { name: string; initials: string }[] = [];
    const g = meta.generatedBy;
    if (g?.name) {
      out.push({ name: g.name, initials: initialsFromName(g.name) });
    }
    const sig = data.conclusion?.signature;
    if (sig?.name && sig.name !== g?.name) {
      out.push({ name: sig.name, initials: initialsFromName(sig.name) });
    }
    return out;
  }, [meta.generatedBy, data.conclusion?.signature]);

  const contextItems = useMemo((): ContextChipItem[] => {
    const items: ContextChipItem[] = [];
    if (farm.farmName) {
      items.push({
        icon: '🌾',
        emphasize: true,
        content: <span className="font-medium text-slate-800">{farm.farmName}</span>,
      });
    }
    if (farm.culture) {
      items.push({ icon: '🌱', content: farm.culture });
    }
    if (farm.city || farm.state) {
      items.push({
        icon: '📍',
        content: [farm.city, farm.state].filter(Boolean).join(' — '),
      });
    }
    if (whenLine) {
      items.push({ icon: '📅', content: whenLine });
    }
    if (climate) {
      items.push({ icon: '🌡️', content: climate, emphasize: true });
    }
    return items;
  }, [farm.farmName, farm.culture, farm.city, farm.state, whenLine, climate]);

  const footerAudit = [data.version, data.generated_at ? formatDateTime(data.generated_at) : null, meta.reportId ? `id ${meta.reportId}` : null]
    .filter(Boolean)
    .join(' · ');

  return (
    <ReportExecutiveShell<LadoALadoTabId>
      shellId="fortsmart-report-lado-a-lado"
      title="Relatório agronômico lado a lado"
      subtitle="FortSmart · dados da avaliação publicada"
      tabs={LADO_A_LADO_TABS}
      defaultTab="resumo"
      slots={slots}
      people={people}
      contextRow={<ReportContextChips items={contextItems} />}
      footerAudit={footerAudit || undefined}
      onPrint={onPrint}
      onExportPdf={onExportPdf}
    />
  );
}
