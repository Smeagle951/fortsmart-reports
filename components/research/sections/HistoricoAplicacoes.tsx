import React from 'react';
import { Calendar, Droplets } from 'lucide-react';
import { ResearchProReportProgramaManejo } from '../../../types/research-report';

type Props = {
    programas: ResearchProReportProgramaManejo[];
};

export default function HistoricoAplicacoes({ programas }: Props) {
    // Extrai todas as aplicações de todos os programas para uma lista plana
    const aplicacoesList: { programaNome: string, programaId: string, ordem: number, dae: number, estagio: string, produtos: any[] }[] = [];

    programas.forEach(p => {
        p.aplicacoes.forEach(app => {
            aplicacoesList.push({
                programaNome: p.nome,
                programaId: p.id,
                ordem: app.ordem,
                dae: app.dae,
                estagio: app.estagio,
                produtos: app.produtos
            });
        });
    });

    // Ordena por DAE
    aplicacoesList.sort((a, b) => a.dae - b.dae);

    if (aplicacoesList.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                Nenhuma aplicação técnica registrada neste experimento.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Calendar className="text-blue-600" size={20} />
                <h3 className="text-lg font-bold text-gray-900">Linha do Tempo de Intervenções</h3>
            </div>

            <div className="p-6">
                <div className="relative border-l-2 border-blue-100 ml-3 space-y-10 pb-4">

                    {aplicacoesList.map((app, idx) => (
                        <div key={`${app.programaId}-${app.ordem}-${idx}`} className="relative pl-8">
                            {/* Timeline dot */}
                            <div className="absolute -left-2.5 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>

                            <div className="flex flex-col md:flex-row md:items-start gap-4">

                                {/* Meta */}
                                <div className="min-w-[120px]">
                                    <span className="block text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 w-fit px-2 py-1 rounded">DAE {app.dae}</span>
                                    <span className="block text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">{app.estagio}</span>
                                </div>

                                {/* Content Card */}
                                <div className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded">{app.ordem}ª Aplicação</span>
                                        <span className="text-sm font-bold text-gray-700">{app.programaNome}</span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {app.produtos.map((prod, i) => (
                                            <div key={i} className="flex items-center gap-3 bg-gray-50 p-2.5 rounded border border-gray-100">
                                                <div className="w-8 h-8 rounded bg-white flex items-center justify-center border border-gray-200 text-blue-500">
                                                    <Droplets size={16} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-semibold text-gray-900">{prod.nome}</span>
                                                    <span className="text-xs text-gray-500">{prod.classe} • <strong className="text-gray-700">{prod.dose} {prod.unidade}</strong></span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}

                </div>
            </div>
        </div>
    );
}
