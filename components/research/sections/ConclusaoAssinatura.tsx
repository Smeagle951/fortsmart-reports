import React from 'react';
import { PenTool, CheckCircle, Lightbulb } from 'lucide-react';
import { ResearchProReportAssinatura, ResearchProReportConclusao } from '../../../types/research-report';

type Props = {
    conclusao: ResearchProReportConclusao;
    assinatura: ResearchProReportAssinatura;
};

export default function ConclusaoAssinatura({ conclusao, assinatura }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden print-break-inside-avoid">
            <div className="p-6 md:p-8 space-y-8">

                {/* Box da Conclusao */}
                <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100/50 relative">
                    <div className="flex gap-4">
                        <div className="shrink-0 mt-1">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm border border-blue-200">
                                <Lightbulb size={20} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg mb-2">Conclusão Analítica</h4>
                                <p className="text-gray-700 leading-relaxed text-sm md:text-base">
                                    {conclusao.texto}
                                </p>
                            </div>

                            {conclusao.recomendacao && (
                                <div className="bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                                    <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <CheckCircle size={14} className="text-blue-600" />
                                        Recomendação Técnica
                                    </h5>
                                    <p className="font-medium text-gray-800">
                                        {conclusao.recomendacao}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Divisor */}
                <div className="border-t border-gray-100 my-8 w-3/4 mx-auto"></div>

                {/* Area de Assinatura */}
                <div className="flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">

                    <div className="w-64 h-24 bg-gray-50 border-b border-gray-300 rounded mb-2 flex items-end justify-center pb-2">
                        <span className="italic text-gray-300 text-sm">Assinatura Digital / Manuscrita</span>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 text-lg">{assinatura.responsavel}</h4>
                        <span className="block text-gray-500 font-medium text-sm mt-0.5">{assinatura.empresa}</span>
                        <div className="flex items-center justify-center gap-2 mt-2">
                            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                                CREA: {assinatura.registro}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-400 mt-2">
                        <PenTool size={14} />
                        Data de Emissão: {new Date(assinatura.data).toLocaleDateString('pt-BR')}
                    </div>

                </div>

            </div>
        </div>
    );
}
