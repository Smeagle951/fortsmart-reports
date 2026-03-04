import React from 'react';
import { Ruler, Maximize, Copy, Grid } from 'lucide-react';
import { ResearchProReportDelineamento } from '../../../types/research-report';

type Props = {
    data: ResearchProReportDelineamento;
};

export default function DelineamentoExperimental({ data }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Descricao */}
                <div className="lg:col-span-4 flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                        <span className="text-sm font-semibold text-gray-900 uppercase tracking-widest">{data.tipo}</span>
                        <p className="text-gray-500 text-sm mt-1">{data.descricao}</p>
                    </div>
                </div>

                {/* Metricas */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Copy size={24} />
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-0.5">Repetições</span>
                        <span className="text-xl font-bold text-gray-900 block">{data.repeticoes}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <Grid size={24} />
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-0.5">Blocos Livres</span>
                        <span className="text-xl font-bold text-gray-900 block">{data.blocos}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                        <LayoutGridIcon size={24} />
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-0.5">Parcelas / Bloco</span>
                        <span className="text-xl font-bold text-gray-900 block">{data.parcelas_por_bloco}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600">
                        <Maximize size={24} />
                    </div>
                    <div>
                        <span className="text-sm text-gray-500 block mb-0.5">Área Útil Parcela</span>
                        <span className="text-xl font-bold text-gray-900 block">{data.area_parcela_m2} m²</span>
                    </div>
                </div>

            </div>
        </div>
    );
}

const LayoutGridIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);
