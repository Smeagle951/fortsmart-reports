'use client';

import { useState } from 'react';
import { Infestacao, PontoMonitoramento } from '@/lib/types/monitoring';

interface GaleriaOcorrenciasProps {
    pontos: PontoMonitoramento[];
}

export default function GaleriaOcorrencias({ pontos }: GaleriaOcorrenciasProps) {
    const [modalImg, setModalImg] = useState<{
        imagem: string; nome: string; ponto: string; terco: string; severidade: number; lat: number; lng: number
    } | null>(null);

    const items = pontos.flatMap(p =>
        p.infestacoes
            .filter(inf => inf.imagem)
            .map(inf => ({ ...inf, pontoId: p.identificador, lat: p.lat, lng: p.lng }))
    );

    if (items.length === 0) return null;

    return (
        <div>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 14 }}>
                📷 Galeria de Ocorrências
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {items.map((item, idx) => (
                    <div
                        key={idx}
                        className={`animate-fadeInUp delay-${Math.min(idx * 100 + 100, 600)}`}
                        onClick={() => setModalImg({
                            imagem: item.imagem!,
                            nome: item.nome,
                            ponto: item.pontoId,
                            terco: item.terco,
                            severidade: item.severidade,
                            lat: item.lat,
                            lng: item.lng,
                        })}
                        style={{
                            borderRadius: 12, overflow: 'hidden', cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,.08)',
                            transition: 'transform .2s, box-shadow .2s',
                            background: '#fff',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.03)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,.15)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,.08)';
                        }}
                    >
                        <div style={{ position: 'relative', height: 110, overflow: 'hidden' }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={item.imagem}
                                alt={item.nome}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            <div style={{
                                position: 'absolute', top: 6, right: 6,
                                background: 'rgba(0,0,0,.55)', borderRadius: 99,
                                padding: '2px 7px', fontSize: 10, fontWeight: 700, color: '#fff',
                            }}>
                                {item.severidade}%
                            </div>
                        </div>
                        <div style={{ padding: '8px 10px' }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: '#1A2332', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.nome}
                            </div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
                                {item.pontoId} · {item.terco}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {modalImg && (
                <div className="gallery-modal-overlay" onClick={() => setModalImg(null)}>
                    <div className="gallery-modal-content" onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                            <div>
                                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2332' }}>{modalImg.nome}</div>
                                <div style={{ fontSize: 12, color: '#94A3B8' }}>Ponto {modalImg.ponto} · Terço: {modalImg.terco}</div>
                            </div>
                            <button
                                onClick={() => setModalImg(null)}
                                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16 }}
                            >
                                ✕
                            </button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={modalImg.imagem}
                            alt={modalImg.nome}
                            style={{ width: '100%', borderRadius: 12, maxHeight: 320, objectFit: 'cover', marginBottom: 14 }}
                        />
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <InfoTag icon="📍" label="Coordenadas" value={`${modalImg.lat.toFixed(4)}, ${modalImg.lng.toFixed(4)}`} />
                            <InfoTag icon="📈" label="Severidade" value={`${modalImg.severidade}%`} />
                            <InfoTag icon="🌱" label="Terço" value={modalImg.terco} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function InfoTag({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div style={{ background: '#F8FAFC', borderRadius: 8, padding: '6px 12px' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px' }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{value}</div>
        </div>
    );
}
