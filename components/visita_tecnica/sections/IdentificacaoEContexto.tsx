import React from 'react';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{value}</div>
        </div>
    );
}

export const sectionTitleStyle: React.CSSProperties = {
    padding: '16px 24px',
    background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
    borderBottom: '1px solid #BBF7D0',
    fontSize: 15,
    fontWeight: 700,
    color: '#166534',
    letterSpacing: '-0.01em',
};

export const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: 12,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};

interface IdentificacaoEContextoProps {
    talhao: Record<string, unknown>;
    contextoSafra?: Record<string, unknown>;
}

export default function IdentificacaoEContexto({ talhao, contextoSafra }: IdentificacaoEContextoProps) {
    return (
        <>
            <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
                <div style={sectionTitleStyle}>1. Identificação do talhão</div>
                <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
                    <Row label="Talhão" value={String(talhao.nome ?? talhao.numero ?? '—')} />
                    <Row label="Cultura" value={String(talhao.cultura ?? '—')} />
                    {talhao.area != null && <Row label="Área (ha)" value={String(talhao.area)} />}
                    {talhao.dataPlantio != null && <Row label="Data do plantio" value={String(talhao.dataPlantio)} />}
                </div>
            </section>

            {contextoSafra && (contextoSafra.materialVariedade != null || contextoSafra.dae != null || contextoSafra.espacamentoCm != null) && (
                <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
                    <div style={sectionTitleStyle}>2. Contexto da safra</div>
                    <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20 }}>
                        {contextoSafra.materialVariedade != null && <Row label="Material / Variedade" value={String(contextoSafra.materialVariedade)} />}
                        {contextoSafra.empresa != null && <Row label="Empresa" value={String(contextoSafra.empresa)} />}
                        {contextoSafra.espacamentoCm != null && <Row label="Espaçamento (cm)" value={String(contextoSafra.espacamentoCm)} />}
                        {contextoSafra.populacaoAlvoPlHa != null && <Row label="População alvo (pl/ha)" value={String(contextoSafra.populacaoAlvoPlHa)} />}
                        {contextoSafra.dae != null && <Row label="DAE" value={String(contextoSafra.dae)} />}
                        {contextoSafra.dap != null && <Row label="DAP" value={String(contextoSafra.dap)} />}
                    </div>
                </section>
            )}
        </>
    );
}
