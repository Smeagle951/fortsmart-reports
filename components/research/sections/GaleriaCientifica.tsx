import React, { useState } from 'react';
import { Camera, MapPin, Maximize2, X } from 'lucide-react';
import { ResearchProReportGaleriaItem } from '../../../types/research-report';

type Props = {
    data: ResearchProReportGaleriaItem[];
};

export default function GaleriaCientifica({ data }: Props) {
    const [selectedImage, setSelectedImage] = useState<ResearchProReportGaleriaItem | null>(null);

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                Nenhum registro fotográfico disponível para este experimento.
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <Camera className="text-blue-600" size={20} />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Registros Fotográficos</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Evidências visuais de campo com contexto agronômico</p>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {data.map((item, idx) => (
                            <div
                                key={idx}
                                className="group relative bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => setSelectedImage(item)}
                            >
                                {/* Image Container */}
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    <img
                                        src={item.url}
                                        alt={item.descricao}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />

                                    {/* Overlay Tags */}
                                    <div className="absolute top-3 left-3 flex gap-2">
                                        <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                            DAE {item.dae}
                                        </span>
                                        <span className="bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm">
                                            {item.parcela}
                                        </span>
                                    </div>

                                    {/* Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <div className="bg-white/90 p-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform">
                                            <Maximize2 size={20} className="text-gray-900" />
                                        </div>
                                    </div>
                                </div>

                                {/* Info Container */}
                                <div className="p-4">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-3">
                                        {item.descricao}
                                    </p>

                                    {item.gps && (
                                        <div className="flex items-center gap-1.5 text-xs font-mono text-gray-500 bg-gray-50 px-2 py-1.5 rounded w-fit border border-gray-100">
                                            <MapPin size={12} className="text-gray-400" />
                                            {item.gps.lat.toFixed(6)}, {item.gps.lon.toFixed(6)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal / Lightbox */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-sm">

                    <button
                        className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-black/50 hover:bg-black/80 p-2 rounded-full z-10"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>

                    <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden shadow-2xl">

                        {/* Imagem Expandida */}
                        <div className="flex-1 bg-black flex items-center justify-center min-h-[40vh]">
                            <img
                                src={selectedImage.url}
                                alt={selectedImage.descricao}
                                className="max-w-full max-h-[90vh] object-contain"
                            />
                        </div>

                        {/* Sidebar Contexto (Desktop) / Bottom Context (Mobile) */}
                        <div className="w-full md:w-80 bg-white p-6 flex flex-col border-l border-gray-100 shrink-0">

                            <div className="flex items-center gap-2 mb-6">
                                <Camera className="text-blue-600" size={20} />
                                <h4 className="font-bold text-gray-900">Contexto Técnico</h4>
                            </div>

                            <p className="text-gray-700 text-sm leading-relaxed mb-6">
                                {selectedImage.descricao}
                            </p>

                            <div className="space-y-4 mt-auto">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">DAE</span>
                                    <span className="font-bold text-gray-900">{selectedImage.dae} dias</span>
                                </div>

                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500 uppercase">Parcela ID</span>
                                    <span className="font-medium font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">{selectedImage.parcela}</span>
                                </div>

                                {selectedImage.gps && (
                                    <div className="flex flex-col py-2 border-b border-gray-100">
                                        <span className="text-xs font-semibold text-gray-500 uppercase mb-1 flex items-center gap-1.5"><MapPin size={12} /> Coordenadas GPS</span>
                                        <span className="font-mono text-xs text-slate-700">
                                            {selectedImage.gps.lat}, {selectedImage.gps.lon}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <button
                                className="mt-8 w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-lg text-sm transition-colors border border-gray-200"
                                onClick={() => setSelectedImage(null)}
                            >
                                Fechar
                            </button>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
