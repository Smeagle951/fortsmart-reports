'use client';

import React from 'react';
import FortSmartLogo from '@/components/FortSmartLogo';
import { RelatorioMonitoramento } from '@/lib/types/monitoring';

interface ReportHeaderProps {
    relatorio: RelatorioMonitoramento;
    onExportPDF: () => void;
    onExportExcel?: () => void;
    /** Quando true, oculta o botão Exportar Excel (ex.: relatório de monitoramento). */
    hideExcel?: boolean;
}

export default function ReportHeader({ relatorio, onExportPDF, onExportExcel, hideExcel = false }: ReportHeaderProps) {
    return (
        <header style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            marginBottom: 24,
            overflow: 'hidden',
        }}>
            <div style={{ background: 'linear-gradient(180deg, #1B5E20 0%, #2E7D32 100%)', height: 4 }} />
            <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap' }}>
                <div style={{
                    padding: 20,
                    borderRight: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                }}>
                    <FortSmartLogo size={52} />
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1B5E20', letterSpacing: '-0.02em' }}>FortSmart Agro</div>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: 2 }}>
                            Relatório de Monitoramento
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, padding: 20, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                    <MetaItem label="Fazenda" value={relatorio.fazenda} />
                    <MetaItem label="Safra" value={relatorio.safra} />
                    <MetaItem label="Data" value={relatorio.data} />
                    <MetaItem label="Técnico" value={`${relatorio.tecnico}${relatorio.crea ? ` · ${relatorio.crea}` : ''}`} />
                </div>
                <div style={{ padding: 20, borderLeft: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 10 }} className="no-print">
                    <button
                        onClick={onExportPDF}
                        style={{
                            padding: '10px 18px',
                            border: '1px solid #CBD5E1',
                            background: '#fff',
                            borderRadius: 6,
                            cursor: 'pointer',
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#475569',
                        }}
                    >
                        Exportar PDF
                    </button>
                    {!hideExcel && onExportExcel && (
                        <button
                            onClick={onExportExcel}
                            style={{
                                padding: '10px 18px',
                                border: 'none',
                                background: '#1B5E20',
                                color: '#fff',
                                borderRadius: 6,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 600,
                            }}
                        >
                            Exportar Excel
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}

function MetaItem({ label, value }: { label: string; value: string }) {
    const display = (value || '').trim() || '—';
    return (
        <div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: display === '—' ? '#94A3B8' : '#1E293B' }}>{display}</div>
        </div>
    );
}
