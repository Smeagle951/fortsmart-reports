import React from 'react';
import { Download, Share2 } from 'lucide-react';
import { ResearchProReportCabecalho, ResearchProReportCore } from '../../../types/research-report';

type Props = {
    data: ResearchProReportCabecalho;
    core: ResearchProReportCore;
    onShare?: () => void | Promise<void>;
    onExportPdf?: () => void | Promise<void>;
};

export default function HeaderExecutivo({ data, core, onShare, onExportPdf }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Top Accent Bar */}
            <div className="h-2 w-full bg-blue-700"></div>

            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">

                    {/* Logo & Title */}
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-xl bg-gray-50 flex flex-col justify-center items-center border border-gray-200 shadow-sm">
                            <span className="text-xl font-bold text-blue-800">FS</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl font-bold text-gray-900">{data.empresa}</h1>
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border 
                  ${core.status === 'finalizado' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                                    {core.status.toUpperCase()}
                                </span>
                            </div>
                            <h2 className="text-md text-gray-500 font-medium tracking-wide">Relatório Técnico Experimental • {core.report_id}</h2>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => void onShare?.()}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <Share2 size={16} />
                            <span className="hidden sm:inline">Compartilhar</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => void onExportPdf?.()}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            <span>Baixar PDF</span>
                        </button>
                    </div>
                </div>

                {/* Divider */}
                <div className="my-6 border-b border-gray-100"></div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Local</span>
                        <span className="text-sm font-medium text-gray-900">{data.fazenda}</span>
                        <span className="text-sm text-gray-600">{data.municipio} - {data.estado}</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Cultura</span>
                        <span className="text-sm font-medium text-gray-900">{data.cultura}</span>
                        <span className="text-sm text-gray-600">{data.cultivar}</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Semeadura</span>
                        <span className="text-sm font-medium text-gray-900">{new Date(data.data_plantio).toLocaleDateString('pt-BR')}</span>
                        <span className="text-sm text-gray-600">{data.populacao_planejada.toLocaleString('pt-BR')} pls/ha</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500 mb-1 uppercase tracking-wider font-semibold">Responsável</span>
                        <span className="text-sm font-medium text-gray-900">{data.responsavel}</span>
                        <span className="text-sm text-gray-600">RT</span>
                    </div>
                </div>

            </div>
        </div>
    );
}
