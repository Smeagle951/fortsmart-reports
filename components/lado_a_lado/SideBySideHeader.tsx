'use client';

import {
  Building2,
  CalendarRange,
  FileDown,
  Map,
  Sprout,
  Target,
  User,
} from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { LocalQrCode } from '@/components/LocalQrCode';
import { reportStatus } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
  onExportPdf?: () => void;
};

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Map;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#6B7280]" strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#9CA3AF]">{label}</p>
        <p className="text-sm font-medium leading-snug text-[#111827]">{value}</p>
      </div>
    </div>
  );
}

export default function SideBySideHeader({ data, reportId, shareToken, onExportPdf }: Props) {
  const status = reportStatus(data);
  const farm = data.farm;
  const meta = data.meta ?? {};
  const id = meta.reportId || reportId || '—';
  const created = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR');
  const sig = data.conclusion?.signature;
  const responsible =
    sig?.name?.trim() ||
    meta.generatedBy?.name?.trim() ||
    data.experiment_design?.technician_name?.trim() ||
    'Responsável técnico';
  const crea = sig?.crea?.trim() ? `CREA ${sig.crea}` : meta.generatedBy?.role || '';
  const objective =
    farm?.objective?.trim() ||
    data.experiment_design?.objective_text?.trim() ||
    'Comparativo de tratamentos em campo.';

  const reportUrl = shareToken
    ? `https://fortsmartagro.com.br/r/${shareToken}`
    : 'https://fortsmartagro.com.br';

  return (
    <header className="border-b border-[#E5E7EB] bg-white print:border-[#E5E7EB]">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight" style={{ color: FS.green }}>
              FortSmart
            </span>
            <span className="text-xl font-black tracking-tight text-[#111827]">Agro</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#111827] sm:text-[2rem]">
            Avaliação Lado a Lado
          </h1>
          <p className="mt-1 text-base font-medium text-[#6B7280]">
            Relatório Técnico de Ensaio de Produtos
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
          <span
            className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
            style={{
              background: status === 'concluido' ? FS.greenSoft : FS.orangeSoft,
              color: status === 'concluido' ? FS.green : FS.orange,
            }}
          >
            {status === 'concluido' ? 'Concluído' : 'Em andamento'}
          </span>
          <p className="text-xs font-medium text-[#6B7280]">ID {id}</p>
          <LocalQrCode
            data={reportUrl}
            size={72}
            alt="QR Code do relatório"
            className="rounded-lg border border-[#E5E7EB] bg-white"
          />
          {onExportPdf ? (
            <button
              type="button"
              onClick={onExportPdf}
              className="fs-print-hide inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
              style={{ background: FS.green }}
            >
              <FileDown className="h-4 w-4" />
              Baixar PDF
            </button>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid max-w-[1600px] gap-4 border-t border-[#EEF2F7] bg-[#FAFBFC] px-5 py-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 sm:px-6">
        <MetaItem icon={Building2} label="Fazenda" value={farm?.farmName?.trim() || '—'} />
        <MetaItem icon={Map} label="Talhão" value={farm?.fieldName?.trim() || '—'} />
        <MetaItem icon={CalendarRange} label="Safra" value={farm?.season?.trim() || '—'} />
        <MetaItem icon={Sprout} label="Cultura" value={farm?.culture?.trim() || '—'} />
        <MetaItem icon={CalendarRange} label="Data avaliação" value={created} />
        <MetaItem
          icon={User}
          label="Responsável"
          value={crea ? `${responsible} · ${crea}` : responsible}
        />
        <MetaItem
          icon={Target}
          label="Objetivo"
          value={objective.length > 80 ? `${objective.slice(0, 77)}…` : objective}
        />
      </div>
    </header>
  );
}
