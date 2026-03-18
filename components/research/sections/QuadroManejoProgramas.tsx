import React from 'react';
import {
  ResearchProReportPayload,
  ResearchProReportProgramaManejo,
  ResearchProReportProgramaAplicacao,
} from '../../../types/research-report';

type Props = {
  relatorio: ResearchProReportPayload;
};

function formatDateBR(date: Date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

function parsePlantio(dateStr: string | undefined) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

export default function QuadroManejoProgramas({ relatorio }: Props) {
  const cabecalho = relatorio.cabecalho;
  const programas = relatorio.programas_manejo ?? [];

  const plantioDate = parsePlantio(cabecalho.data_plantio);

  const daeSet = new Set<number>();
  programas.forEach((p) => {
    (p.aplicacoes ?? []).forEach((a) => {
      if (typeof a.dae === 'number' && Number.isFinite(a.dae)) daeSet.add(a.dae);
    });
  });
  const daeColumns = Array.from(daeSet).sort((a, b) => a - b);

  if (programas.length === 0 || daeColumns.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
        Quadro de Manejo indisponível: registre pelo menos 1 aplicação com DAE em `Programas de Manejo`.
      </div>
    );
  }

  const getAplicacaoPorDae = (
    p: ResearchProReportProgramaManejo,
    dae: number,
  ): ResearchProReportProgramaAplicacao | undefined => {
    return (p.aplicacoes ?? []).find((a) => a.dae === dae);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Projeto Manejo {cabecalho.cultura ? `• ${cabecalho.cultura}` : ''}
          </div>
          <div className="text-sm font-bold text-gray-900">
            {cabecalho.fazenda}
            {cabecalho.municipio ? ` • ${cabecalho.municipio}` : ''}
            {cabecalho.estado ? ` - ${cabecalho.estado}` : ''}
          </div>
          <div className="text-xs text-gray-600">
            Cultivares: <span className="font-semibold text-gray-800">{cabecalho.cultivar}</span>
          </div>
        </div>
        <div className="mt-3 text-right text-[11px] font-semibold text-gray-500">
          FortSmart
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full text-xs text-gray-700 border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left font-bold text-gray-800 border-r border-gray-200 w-[220px]">
                Tratamentos
              </th>
              {daeColumns.map((dae) => {
                const dt = plantioDate
                  ? new Date(plantioDate.getTime() + dae * 24 * 60 * 60 * 1000)
                  : null;
                return (
                  <th
                    key={dae}
                    className="px-3 py-3 text-center font-bold text-gray-900 border-r border-gray-200"
                  >
                    <div>DAE {dae}</div>
                    {dt ? (
                      <div className="text-[10px] font-semibold text-gray-500 mt-0.5">
                        {formatDateBR(dt)}
                      </div>
                    ) : (
                      <div className="text-[10px] text-gray-400 mt-0.5">—</div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {programas.map((p, idx) => {
              return (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50/40">
                  <td className="sticky left-0 z-0 bg-white px-3 py-3 align-top border-r border-gray-200">
                    <div className="font-bold text-gray-900 flex items-start gap-2">
                      <span className="min-w-[20px] text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {idx + 1}
                      </span>
                      <span className="leading-tight">{p.nome}</span>
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {p.empresa}
                      {p.categoria ? ` • ${String(p.categoria).toUpperCase()}` : ''}
                    </div>
                  </td>

                  {daeColumns.map((dae) => {
                    const app = getAplicacaoPorDae(p, dae);
                    const produtos = app?.produtos ?? [];
                    return (
                      <td
                        key={`${p.id}-${dae}`}
                        className="px-3 py-3 text-center border-r border-gray-200 align-top"
                      >
                        {produtos.length === 0 ? (
                          <span className="text-gray-300">—</span>
                        ) : (
                          <div className="space-y-1">
                            {produtos.slice(0, 3).map((prod, i) => (
                              <div
                                key={i}
                                className="bg-white border border-gray-200 rounded px-2 py-1 shadow-sm"
                              >
                                <div className="font-semibold text-gray-900 truncate">{prod.nome}</div>
                                <div className="text-gray-600">
                                  {Number.isFinite(prod.dose)
                                    ? `${prod.dose.toFixed(2)}`.replace('.', ',')
                                    : prod.dose}{' '}
                                  {prod.unidade}
                                </div>
                              </div>
                            ))}
                            {produtos.length > 3 && (
                              <div className="text-[10px] text-gray-500">+{produtos.length - 3} itens</div>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

