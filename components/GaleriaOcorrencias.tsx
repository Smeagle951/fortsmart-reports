'use client';

import { useState } from 'react';

interface InfoTagProps {
    label: string;
    value: string;
}

function InfoTag({ label, value }: InfoTagProps) {
    return (
        <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '6px 12px', borderRadius: '6px' }}>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A2332' }}>{value}</div>
        </div>
    );
}

interface GaleriaProps {
    imagens: Array<{
        url?: string;
        descricao?: string;
        lat?: number;
        lng?: number;
        severidade?: number;
        terco?: string;
        identificadorPonto?: string;
    }>;
}

export default function GaleriaOcorrencias({ imagens }: GaleriaProps) {
    const [modalImg, setModalImg] = useState<any>(null);

    const validImages = imagens.filter(i => !!i.url);
    if (validImages.length === 0) return null;

    return (
        <div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {validImages.map((img, idx) => (
                    <div
                        key={idx}
                        onClick={() => setModalImg(img)}
                        className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer bg-white shadow-sm hover:shadow-md transition-shadow relative"
                    >
                        <div className="relative h-40 overflow-hidden bg-gray-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img.url}
                                alt={img.descricao || 'Imagem do monitoramento'}
                                className="w-full h-full object-cover"
                            />
                            {img.severidade != null && typeof img.severidade === 'number' && (
                                <div className="absolute top-2 right-2 bg-black/60 rounded-full px-2 py-0.5 text-xs font-bold text-white">
                                    {img.severidade}%
                                </div>
                            )}
                        </div>
                        <div className="p-3">
                            <div className="text-sm font-semibold text-gray-800 truncate">
                                {img.descricao || 'Ocorrência'}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                                {img.identificadorPonto ? `Ponto: ${img.identificadorPonto}` : 'Ponto Mapeado'} {img.terco ? `· ${img.terco}` : ''}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Zoom */}
            {modalImg && (
                <div
                    className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setModalImg(null)}
                >
                    <div
                        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{modalImg.descricao || 'Ocorrência Identificada'}</h3>
                                <p className="text-sm text-gray-500">
                                    {modalImg.identificadorPonto ? `Ponto ${modalImg.identificadorPonto}` : 'Fazenda'}
                                    {modalImg.terco ? ` · Terço: ${modalImg.terco}` : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => setModalImg(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-auto p-4 bg-gray-50 flex justify-center items-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={modalImg.url}
                                alt={modalImg.descricao}
                                className="max-w-full rounded-lg max-h-[60vh] object-contain shadow-sm"
                            />
                        </div>

                        {(modalImg.lat != null || modalImg.lng != null || modalImg.severidade != null || modalImg.terco != null) && (
                            <div className="p-4 border-t border-gray-100 bg-white flex gap-3 flex-wrap">
                                {modalImg.lat != null && modalImg.lng != null && (
                                    <InfoTag label="Coordenadas" value={`${Number(modalImg.lat).toFixed(5)}, ${Number(modalImg.lng).toFixed(5)}`} />
                                )}
                                {modalImg.severidade != null && (
                                    <InfoTag label="Severidade" value={`${modalImg.severidade}%`} />
                                )}
                                {modalImg.terco && (
                                    <InfoTag label="Terço" value={modalImg.terco} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
