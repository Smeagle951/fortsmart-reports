import React from 'react';
import { PayloadVisitaTecnica } from '@/components/RelatorioVisitaTecnicaContent';

interface DashboardResumoVTProps {
    relatorio: PayloadVisitaTecnica;
    talhao: Record<string, unknown>;
    fenologia: Record<string, unknown>;
    populacao?: Record<string, unknown>;
    diagnostico?: Record<string, unknown>;
    pragasCount: number;
}

export default function DashboardResumoVT({ relatorio, talhao, fenologia, populacao, diagnostico, pragasCount }: DashboardResumoVTProps) {
    const getRiscoGeral = () => {
        const nivelRiscoStr = String(diagnostico?.nivelRisco || '').toLowerCase();
        if (nivelRiscoStr.includes('alto') || nivelRiscoStr.includes('crítico')) return { label: 'Alto Risco', color: '#EF4444', bg: '#FEF2F2' };
        if (nivelRiscoStr.includes('médio') || nivelRiscoStr.includes('medio') || nivelRiscoStr.includes('atenção')) return { label: 'Atenção', color: '#F59E0B', bg: '#FFFBEB' };
        return { label: 'Saudável', color: '#10B981', bg: '#ECFDF5' };
    };

    const estagio = String(fenologia.estadio || fenologia.estagio || 'Não avaliado');
    const daps = relatorio.contextoSafra?.dap || fenologia.dap || '—';

    const risco = getRiscoGeral();

    const eficiencia = typeof populacao?.eficienciaPct === 'number' ? populacao.eficienciaPct : null;
    const targetPlPlantasHa = typeof relatorio.contextoSafra?.populacaoAlvoPlHa === 'number' ? relatorio.contextoSafra.populacaoAlvoPlHa : null;
    const currentPlantasHa = typeof populacao?.plantasHa === 'number' ? populacao.plantasHa : null;

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 28 }}>
            {/* Card 1: Saúde da Lavoura */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${risco.color}40`, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: risco.color }} />
                    DIAGNÓSTICO GERAL
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, color: risco.color, marginBottom: 4 }}>{risco.label}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                    {pragasCount} ocorrência(s) fitossanitária(s) registradas nesta visita.
                </div>
            </div>

            {/* Card 2: Estande e Eficiência */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>ESTANDE DA CULTURA</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#0F172A' }}>
                        {eficiencia !== null ? `${eficiencia}%` : (currentPlantasHa !== null ? `${currentPlantasHa} pl/ha` : '—')}
                    </div>
                    {eficiencia !== null && <div style={{ fontSize: 13, color: '#10B981', fontWeight: 600 }}>Eficiência</div>}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                    {targetPlPlantasHa ? `Alvo projetado: ${targetPlPlantasHa} pl/ha` : (populacao?.situacao ? String(populacao.situacao) : 'Dados de população não coletados')}
                </div>
            </div>

            {/* Card 3: Desenvolvimento (Fenologia) */}
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginBottom: 8 }}>DESENVOLVIMENTO</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#1E40AF', marginBottom: 4 }}>{estagio}</div>
                <div style={{ fontSize: 13, color: '#475569' }}>
                    {daps !== '—' ? `${daps} dias após o plantio (DAP)` : 'Fase fenológica reportada'}
                </div>
            </div>
        </div>
    );
}
