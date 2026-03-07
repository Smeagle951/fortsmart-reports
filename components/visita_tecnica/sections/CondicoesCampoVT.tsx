import React from 'react';
import { cardStyle, sectionTitleStyle } from './IdentificacaoEContexto';

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{value}</div>
        </div>
    );
}

interface CondicoesCampoVTProps {
    condicoes: Record<string, unknown>;
}

export default function CondicoesCampoVT({ condicoes }: CondicoesCampoVTProps) {
    if (
        condicoes.temperatura == null &&
        condicoes.umidade == null &&
        condicoes.vento == null &&
        condicoes.soloUmidade == null &&
        condicoes.vigorCultura == null
    ) return null;

    return (
        <section style={{ ...cardStyle, marginBottom: 24, overflow: 'hidden' }}>
            <div style={sectionTitleStyle}>4. Condições de campo</div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
                {condicoes.temperatura != null && <Row label="Temperatura" value={`${condicoes.temperatura} °C`} />}
                {condicoes.umidade != null && <Row label="Umidade" value={`${condicoes.umidade}%`} />}
                {condicoes.vento != null && <Row label="Vento" value={String(condicoes.vento)} />}
                {condicoes.nebulosidade != null && <Row label="Nebulosidade" value={String(condicoes.nebulosidade)} />}
                {condicoes.soloUmidade != null && <Row label="Solo / Umidade" value={String(condicoes.soloUmidade)} />}
                {condicoes.palhada != null && <Row label="Palhada" value={String(condicoes.palhada)} />}
                {condicoes.compactacao != null && <Row label="Compactação" value={String(condicoes.compactacao)} />}
                {condicoes.vigorCultura != null && <Row label="Vigor da Cultura" value={String(condicoes.vigorCultura)} />}
                {condicoes.uniformidade != null && <Row label="Uniformidade" value={String(condicoes.uniformidade)} />}
                {condicoes.sintomas != null && <Row label="Sintomas Observados" value={String(condicoes.sintomas)} />}
            </div>
        </section>
    );
}
