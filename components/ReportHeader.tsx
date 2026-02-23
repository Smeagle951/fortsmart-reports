'use client';

import React from 'react';
import { RelatorioMonitoramento } from '@/lib/types/monitoring';

interface ReportHeaderProps {
    relatorio: RelatorioMonitoramento;
    onExportPDF: () => void;
    onExportExcel: () => void;
}

export default function ReportHeader({ relatorio, onExportPDF, onExportExcel }: ReportHeaderProps) {
    return (
        <header className="card animate-slideDown mb-6 print:rounded-none print:shadow-none">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                {/* Logo + identidade */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{
                        width: 52, height: 52, borderRadius: 12,
                        background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                    }}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity=".9" />
                            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                            <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 800, color: '#1B5E20', lineHeight: 1.1 }}>
                            FortSmart
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, letterSpacing: '.5px', textTransform: 'uppercase' }}>
                            Relatório de Monitoramento
                        </div>
                    </div>
                </div>

                {/* Metadados centrais */}
                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
                    <MetaItem icon="🏡" label="Fazenda" value={relatorio.fazenda} />
                    <MetaItem icon="🌱" label="Safra" value={relatorio.safra} />
                    <MetaItem icon="📅" label="Data" value={relatorio.data} />
                    <MetaItem icon="👨‍🌾" label="Técnico" value={`${relatorio.tecnico}${relatorio.crea ? ` | ${relatorio.crea}` : ''}`} />
                </div>

                {/* Botões exportar + QR */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }} className="no-print">
                    <button
                        onClick={onExportPDF}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: 'linear-gradient(135deg, #C62828, #E53935)',
                            color: '#fff', border: 'none', borderRadius: 10,
                            padding: '9px 18px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 2px 8px rgba(198,40,40,.3)',
                            transition: 'transform .15s, box-shadow .15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                    >
                        <DownloadIcon /> Exportar PDF
                    </button>
                    <button
                        onClick={onExportExcel}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 7,
                            background: 'linear-gradient(135deg, #1B5E20, #2E7D32)',
                            color: '#fff', border: 'none', borderRadius: 10,
                            padding: '9px 18px', cursor: 'pointer',
                            fontSize: 13, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                            boxShadow: '0 2px 8px rgba(27,94,32,.3)',
                            transition: 'transform .15s, box-shadow .15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                    >
                        <GridIcon /> Exportar Excel
                    </button>

                    {/* QR Code simulado */}
                    <div style={{
                        width: 52, height: 52, borderRadius: 10, border: '2px solid #E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: '#F8FAFC', flexShrink: 0,
                    }} title="QR Code de Validação">
                        <QRIcon />
                    </div>
                </div>
            </div>
        </header>
    );
}

function MetaItem({ icon, label, value }: { icon: string; label: string; value: string }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 2 }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>{value}</div>
        </div>
    );
}

function DownloadIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function GridIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
        </svg>
    );
}

function QRIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" /><rect x="18" y="14" width="3" height="3" />
            <rect x="14" y="18" width="3" height="3" /><rect x="18" y="18" width="3" height="3" />
        </svg>
    );
}
