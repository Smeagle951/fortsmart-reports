import React from 'react';
import { Layers, ListChecks, TrendingUp, AlertTriangle, Target, Award } from 'lucide-react';
import { ResearchProReportResumoExecutivo } from '../../../types/research-report';

type Props = {
    data: ResearchProReportResumoExecutivo;
};

export default function DashboardResumo({ data }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target size={20} className="text-blue-600" />
                Sumário Executivo
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                {/* Card 1 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Layers size={16} />
                        <span className="text-xs font-semibold uppercase">Tratamentos</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.programas}</span>
                </div>

                {/* Card 2 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <ListChecks size={16} />
                        <span className="text-xs font-semibold uppercase">Parcelas</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.parcelas}</span>
                </div>

                {/* Card 3 */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col justify-between">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Grid size={16} />
                        <span className="text-xs font-semibold uppercase">Blocos</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.blocos}</span>
                </div>

                {/* Card 4 - Variabilidade */}
                <div className={`rounded-lg p-4 border flex flex-col justify-between 
          ${data.cv_percentual < 10 ? 'bg-green-50 border-green-100' :
                        data.cv_percentual < 20 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'}`}>
                    <div className="flex items-center gap-2 mb-2 text-gray-700">
                        <AlertTriangle size={16} className={data.cv_percentual < 10 ? 'text-green-600' : data.cv_percentual < 20 ? 'text-yellow-600' : 'text-red-600'} />
                        <span className="text-xs font-semibold uppercase">CV Geral (%)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-gray-900">{data.cv_percentual}</span>
                        <span className="text-xs font-medium text-gray-500">{data.cv_percentual < 10 ? '(Baixo)' : data.cv_percentual < 20 ? '(Médio)' : '(Alto)'}</span>
                    </div>
                </div>

                {/* Card 5 & 6 - Melhor Tratamento */}
                <div className="col-span-2 bg-blue-50 rounded-lg p-4 border border-blue-100 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-blue-800">
                            <Award size={16} />
                            <span className="text-xs font-bold uppercase tracking-wide">Melhor Programa</span>
                        </div>
                        <div className="flex items-center gap-1 text-green-700 bg-green-100 px-2.5 py-0.5 rounded text-xs font-bold">
                            <TrendingUp size={12} />
                            MÁX: {data.produtividade_max.toFixed(2)}
                        </div>
                    </div>
                    <span className="text-lg font-bold text-blue-900 truncate" title={data.melhor_programa}>
                        {data.melhor_programa}
                    </span>
                </div>

            </div>
        </div>
    );
}

const Grid = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7"></rect>
        <rect x="14" y="3" width="7" height="7"></rect>
        <rect x="14" y="14" width="7" height="7"></rect>
        <rect x="3" y="14" width="7" height="7"></rect>
    </svg>
);
