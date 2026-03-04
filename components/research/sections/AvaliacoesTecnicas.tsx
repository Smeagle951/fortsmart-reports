import React from 'react';
import { FileBarChart2 } from 'lucide-react';
import { ResearchProReportAvaliacao } from '../../../types/research-report';

type Props = {
    data: ResearchProReportAvaliacao[];
};

export default function AvaliacoesTecnicas({ data }: Props) {
    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                Nenhuma avaliação técnica registrada neste experimento.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileBarChart2 className="text-blue-600" size={20} />
                    <h3 className="text-lg font-bold text-gray-900">Resultados Brutos por Parcela</h3>
                </div>
            </div>

            <div className="p-6">
                <div className="space-y-12">
                    {data.map((av, idx) => {
                        // Conta os tratamentos unicos
                        const programasMap: Record<string, any[]> = {};
                        av.dados.forEach(d => {
                            if (!programasMap[d.programa]) programasMap[d.programa] = [];
                            programasMap[d.programa].push(d);
                        });

                        const programas = Object.keys(programasMap);

                        return (
                            <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">

                                <div className="bg-slate-50 border-b border-gray-100 p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                                            Variável
                                        </span>
                                        <h4 className="font-bold text-slate-800 text-base">{av.variavel}</h4>
                                        <span className="text-sm font-semibold text-slate-500 ml-auto">DAE {av.dae || '-'}</span>
                                    </div>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-600">
                                        <thead className="bg-[#f8fafc] text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                                            <tr>
                                                <th className="px-6 py-3 w-1/3">Programa / Tratamento</th>
                                                <th className="px-6 py-3">Parcela</th>
                                                <th className="px-6 py-3 text-right">Valor Registrado</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {programas.map((prog, i) => {
                                                const dados = programasMap[prog];
                                                return (
                                                    <React.Fragment key={i}>
                                                        {dados.map((d, index) => (
                                                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                                                {index === 0 && (
                                                                    <td className="px-6 py-3 font-semibold text-gray-900 bg-gray-50/30" rowSpan={dados.length}>
                                                                        {prog}
                                                                    </td>
                                                                )}
                                                                <td className="px-6 py-3 font-mono text-xs">{d.parcela}</td>
                                                                <td className="px-6 py-3 text-right font-medium text-blue-900">
                                                                    {d.valor.toLocaleString('pt-BR')} <span className="text-gray-400 font-normal">{av.unidade}</span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
