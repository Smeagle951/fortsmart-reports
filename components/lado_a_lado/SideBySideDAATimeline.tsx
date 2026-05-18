'use client';

import { CheckCircle2 } from 'lucide-react';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { buildDaaTimeline } from '@/lib/lado-a-lado-official/daa';
import { FS } from '@/lib/lado-a-lado-official/theme';

export default function SideBySideDAATimeline({ data }: { data: SideBySideReportData }) {
  const nodes = buildDaaTimeline(data);
  if (nodes.length === 0) return null;

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Metodologia / Cronologia (DAA)</h2>
      <p className="fs-official-section-sub">
        Linha do tempo do ensaio: aplicação, avaliações sequenciais e colheita.
      </p>
      <div className="fs-official-card overflow-x-auto p-6">
        <div className="relative flex min-w-[640px] items-start">
          <div
            className="absolute left-4 right-4 top-3.5 h-1 rounded-full bg-[#E5E7EB]"
            aria-hidden
          />
          {nodes.map((n) => (
            <div key={n.id} className="relative z-[1] flex flex-1 flex-col items-center px-1 text-center">
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full text-white shadow-sm"
                style={{ background: n.completed ? FS.green : '#D1D5DB' }}
              >
                {n.completed ? <CheckCircle2 className="h-4 w-4" /> : null}
              </div>
              <p className="mt-2 text-xs font-bold text-[#111827]">{n.label}</p>
              {n.date ? (
                <p className="text-[10px] text-[#6B7280]">
                  {new Date(n.date).toLocaleDateString('pt-BR')}
                </p>
              ) : null}
              {n.stage ? <p className="text-[10px] text-[#9CA3AF]">{n.stage}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

