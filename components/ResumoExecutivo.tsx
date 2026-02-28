'use client';

import { MetricasTalhao, NivelClassificacao } from '@/lib/types/monitoring';
import { formatPercent2, formatDecimal2 } from '@/utils/format';

interface ResumoExecutivoProps {
    metricas: MetricasTalhao;
    talhaoNome: string;
    area_ha: number;
    ultimoMonitoramento: string;
}

const CLASSIF: Record<NivelClassificacao, string> = {
    CONTROLADO: 'Controlado',
    ATENCAO: 'Atenção',
    ALTO_RISCO: 'Alto Risco',
    CRITICO: 'Crítico',
};

const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

export default function ResumoExecutivo({ metricas, talhaoNome, area_ha, ultimoMonitoramento }: ResumoExecutivoProps) {
    return (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
                Resumo do talhão
            </div>
            <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                <Row label="Pontos amostrados" value={String(metricas.totalPontos)} />
                <Row label="Total de ocorrências" value={String(metricas.totalOcorrencias)} />
                <Row label="Índice geral" value={formatPercent2(metricas.indiceOcorrencia)} bold />
                <Row label="Classificação" value={CLASSIF[metricas.classificacao]} />
                <Row label="Área (ha)" value={(area_ha != null && Number(area_ha) > 0) ? formatDecimal2(area_ha) : '—'} />
                <Row label="Último monitoramento" value={ultimoMonitoramento} />
            </div>
        </div>
    );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: bold ? 700 : 600, color: '#1E293B' }}>{value}</div>
        </div>
    );
}
