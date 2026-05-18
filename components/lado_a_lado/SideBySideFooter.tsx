'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideFooter({
  data,
  reportId,
}: {
  data: SideBySideReportData;
  reportId?: string;
}) {
  const meta = data.meta;
  const generated = meta?.createdAt
    ? new Date(meta.createdAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('pt-BR');

  return (
    <footer className="mt-8 border-t border-[#E5E7EB] bg-white py-6 print:break-inside-avoid">
      <div className="fs-section flex flex-col items-center justify-between gap-3 text-center sm:flex-row sm:text-left">
        <div>
          <span className="font-black" style={{ color: FS.green }}>
            FortSmart
          </span>
          <span className="font-black text-[#111827]"> Agro</span>
        </div>
        <p className="text-xs text-[#6B7280]">
          Relatório gerado em {generated} · fortsmartagro.com.br
          {meta?.reportId || reportId ? ` · ID ${meta?.reportId || reportId}` : ''}
        </p>
        <p className="text-xs text-[#9CA3AF]">Página 1 de 1</p>
      </div>
    </footer>
  );
}
