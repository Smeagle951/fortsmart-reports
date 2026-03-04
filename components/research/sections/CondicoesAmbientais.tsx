import React from 'react';
import { CloudRain, ThermometerSun, TestTube2, Droplet, MountainSnow } from 'lucide-react';
import { ResearchProReportAmbiente } from '../../../types/research-report';

type Props = {
    data: ResearchProReportAmbiente;
};

export default function CondicoesAmbientais({ data }: Props) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

                <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <MountainSnow size={16} />
                        <span className="text-xs font-semibold uppercase">Solo</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{data.solo}</span>
                    <span className="text-xs text-gray-500 mt-1">{data.textura}</span>
                </div>

                <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <TestTube2 size={16} />
                        <span className="text-xs font-semibold uppercase">pH</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.ph}</span>
                </div>

                <div className="flex flex-col p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-2 mb-2 text-gray-500">
                        <Droplet size={16} />
                        <span className="text-xs font-semibold uppercase">Mat. Orgânica</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{data.mo}%</span>
                </div>

                <div className="flex flex-col p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-700">
                        <CloudRain size={16} />
                        <span className="text-xs font-semibold uppercase">Precipitação</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-900">{data.chuva_total_mm} <span className="text-sm font-medium">mm</span></span>
                </div>

                <div className="flex flex-col p-4 bg-orange-50 rounded-lg border border-orange-100">
                    <div className="flex items-center gap-2 mb-2 text-orange-700">
                        <ThermometerSun size={16} />
                        <span className="text-xs font-semibold uppercase">Temp. Média</span>
                    </div>
                    <span className="text-2xl font-bold text-orange-900">{data.temperatura_media}°C</span>
                </div>

            </div>
        </div>
    );
}
