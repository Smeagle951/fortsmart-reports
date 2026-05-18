'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import { applicationsBySide } from '@/lib/lado-a-lado-official/daa';
import { sideLabel, isControlSide } from '@/lib/lado-a-lado-official/selectors';
import { FS } from '@/lib/lado-a-lado-official/theme';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';

function TreatmentCard({
  side,
  title,
  accent,
  events,
  protocolProducts,
}: {
  side: 'A' | 'B';
  title: string;
  accent: string;
  events: ReportApplicationEventV2Json[];
  protocolProducts?: { name: string; dose?: string }[];
}) {
  return (
    <div className="fs-official-card flex flex-col overflow-hidden">
      <div className="border-b border-[#E5E7EB] px-4 py-3" style={{ background: `${accent}14` }}>
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: accent }}>
          Lado {side}
        </p>
        <p className="text-base font-bold text-[#111827]">{title}</p>
      </div>
      <div className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#F8FAFC] text-left text-[11px] font-semibold uppercase text-[#6B7280]">
              <th className="px-3 py-2">Produto / Manejo</th>
              <th className="px-3 py-2">Dose</th>
              <th className="px-3 py-2">Aplicação</th>
              <th className="px-3 py-2">Estádio</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 && (!protocolProducts || protocolProducts.length === 0) ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#9CA3AF]">
                  Sem aplicações registradas
                </td>
              </tr>
            ) : null}
            {events.flatMap((ev, ei) =>
              (ev.products?.length ? ev.products : [{ nomeComercial: ev.type || 'Aplicação' }]).map((p, pi) => (
                <tr key={`${ei}-${pi}`} className="border-t border-[#EEF2F7]">
                  <td className="px-3 py-2 font-medium">{p.nomeComercial || p.nomeAtivo || '—'}</td>
                  <td className="px-3 py-2">
                    {p.dose != null ? `${p.dose}${p.unidade ? ` ${p.unidade}` : ''}` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {ev.date ? new Date(ev.date).toLocaleDateString('pt-BR') : '—'}
                    {ev.daa != null ? ` · ${ev.daa} DAA` : ''}
                  </td>
                  <td className="px-3 py-2">{ev.stage || '—'}</td>
                </tr>
              )),
            )}
            {protocolProducts?.map((p, i) => (
              <tr key={`proto-${i}`} className="border-t border-[#EEF2F7] bg-[#FAFBFC]">
                <td className="px-3 py-2">{p.name} (protocolo)</td>
                <td className="px-3 py-2">{p.dose || '—'}</td>
                <td className="px-3 py-2">—</td>
                <td className="px-3 py-2">—</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SideBySideTreatments({ data }: { data: SideBySideReportData }) {
  const proto = data.treatment_protocol?.sides ?? [];
  const protoA = proto.find((s) => s.side === 'A')?.products?.map((p) => ({
    name: p.name,
    dose: p.dose != null ? String(p.dose) : undefined,
  }));
  const protoB = proto.find((s) => s.side === 'B')?.products?.map((p) => ({
    name: p.name,
    dose: p.dose != null ? String(p.dose) : undefined,
  }));

  const design = data.experiment_design;

  return (
    <section className="fs-section">
      <h2 className="fs-official-section-title">Tratamentos Aplicados</h2>
      <p className="fs-official-section-sub">Protocolo e execução em campo por lado.</p>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TreatmentCard
          side="A"
          title={sideLabel(data, 'A')}
          accent={FS.sideA}
          events={applicationsBySide(data, 'A')}
          protocolProducts={protoA}
        />
        <TreatmentCard
          side="B"
          title={sideLabel(data, 'B')}
          accent={FS.sideB}
          events={applicationsBySide(data, 'B')}
          protocolProducts={protoB}
        />
      </div>
      {design ? (
        <div className="mt-4 fs-official-card p-4 text-sm text-[#4B5563]">
          <p className="font-semibold text-[#111827]">Metodologia do ensaio</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {design.delineamento ? <li>Delineamento: {design.delineamento}</li> : null}
            {design.numero_repeticoes != null ? <li>Repetições: {design.numero_repeticoes}</li> : null}
            {design.cultivar_hibrido ? <li>Cultivar: {design.cultivar_hibrido}</li> : null}
            {design.data_plantio ? <li>Plantio: {design.data_plantio}</li> : null}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

