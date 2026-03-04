import React from 'react';
import { Map } from 'lucide-react';
import { ResearchProReportCroqui, ResearchProReportProgramaManejo } from '../../../types/research-report';

type Props = {
    data: ResearchProReportCroqui;
    programas: ResearchProReportProgramaManejo[];
};

export default function CroquiExperimental({ data, programas }: Props) {
    // Mapa de cores fixas baseadas no índice do programa
    const colorMap = [
        'bg-blue-100 border-blue-300 text-blue-800',
        'bg-green-100 border-green-300 text-green-800',
        'bg-purple-100 border-purple-300 text-purple-800',
        'bg-orange-100 border-orange-300 text-orange-800',
        'bg-pink-100 border-pink-300 text-pink-800',
        'bg-teal-100 border-teal-300 text-teal-800',
    ];

    const getProgramInfo = (progId: string) => {
        const idx = programas.findIndex(p => p.id === progId) || 0;
        const p = programas[idx];
        return {
            name: p ? p.nome : progId,
            color: p?.categoria === 'testemunha' ? 'bg-gray-100 border-gray-300 text-gray-800' : colorMap[idx % colorMap.length],
        };
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

            {/* Legenda */}
            <div className="mb-6 flex flex-wrap gap-3">
                {programas.map((p, idx) => {
                    const color = p.categoria === 'testemunha' ? 'bg-gray-100 border-gray-300' : colorMap[idx % colorMap.length];
                    return (
                        <div key={p.id} className="flex items-center gap-2 text-sm text-gray-700">
                            <div className={`w-4 h-4 rounded border ${color}`}></div>
                            <span>{p.id}: {p.nome}</span>
                        </div>
                    );
                })}
            </div>

            {/* Renderização dos Blocos */}
            <div className="space-y-8 overflow-x-auto pb-4">
                {data.blocos.map((bloco) => {
                    // Agrupa parcelas por linha
                    const linhasMap: Record<number, any[]> = {};
                    let maxColuna = 0;

                    bloco.parcelas.forEach(parcela => {
                        if (!linhasMap[parcela.linha]) linhasMap[parcela.linha] = [];
                        linhasMap[parcela.linha].push(parcela);
                        if (parcela.coluna > maxColuna) maxColuna = parcela.coluna;
                    });

                    const linhasSorted = Object.keys(linhasMap).map(Number).sort((a, b) => a - b);

                    return (
                        <div key={bloco.bloco} className="min-w-max">
                            <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Map size={16} className="text-blue-600" />
                                Bloco {bloco.bloco}
                            </h4>
                            <div className="flex flex-col gap-1.5 p-3 bg-gray-50 border border-gray-200 rounded-xl w-fit">
                                {linhasSorted.map(linha => {
                                    const parcelasNaLinha = linhasMap[linha].sort((a, b) => a.coluna - b.coluna);
                                    return (
                                        <div key={linha} className="flex gap-1.5">
                                            {parcelasNaLinha.map(parcela => {
                                                const info = getProgramInfo(parcela.programa);
                                                return (
                                                    <div
                                                        key={parcela.id}
                                                        title={`${parcela.id} - ${info.name}`}
                                                        className={`
                              w-16 h-12 md:w-20 md:h-16 flex flex-col items-center justify-center rounded-md border-2 
                              transition-transform hover:scale-105 cursor-pointer shadow-sm
                              ${info.color}
                            `}
                                                    >
                                                        <span className="text-[10px] md:text-xs font-bold opacity-75 mb-0.5">{parcela.id}</span>
                                                        <span className="text-xs md:text-sm font-black">{parcela.programa}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
}
