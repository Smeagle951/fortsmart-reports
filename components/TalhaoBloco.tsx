'use client';

import dynamic from 'next/dynamic';
import { Talhao } from '@/lib/types/monitoring';
import { calcularMetricasTalhao, calcularMetricasPorPonto, corClassificacao, labelClassificacao } from '@/lib/calculations';
import ResumoExecutivo from './ResumoExecutivo';
import PrincipaisInfestacoes from './PrincipaisInfestacoes';
import RecomendacoesTecnicas from './RecomendacoesTecnicas';
import TabelaDetalhada from './TabelaDetalhada';
import GaleriaOcorrencias from './GaleriaOcorrencias';
import IndicesPorPonto from './IndicesPorPonto';
import CondicoesClimaticasCard from './CondicoesClimaticas';

const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

interface TalhaoBlocoProps {
    talhao: Talhao;
    index: number;
    total: number;
    data: string;
}

const cardStyle = {
    background: '#fff',
    borderRadius: 8,
    border: '1px solid #E2E8F0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

export default function TalhaoBloco({ talhao, index, total, data }: TalhaoBlocoProps) {
    const metricas = calcularMetricasTalhao(talhao);
    const metricasPorPonto = calcularMetricasPorPonto(talhao);
    const recomendacoes = talhao.recomendacoes || [];
    const cor = corClassificacao(metricas.classificacao);
    const label = labelClassificacao(metricas.classificacao);

    return (
        <section id={`talhao-${talhao.id}`}>
            <div style={{
                ...cardStyle,
                marginBottom: 20,
                overflow: 'hidden',
                borderLeft: `4px solid ${cor}`,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'stretch',
                    flexWrap: 'wrap',
                }}>
                    <div style={{
                        padding: 20,
                        borderRight: '1px solid #E2E8F0',
                        minWidth: 200,
                    }}>
                        <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Talhão {index}/{total}</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>{talhao.nome}</div>
                        <div style={{ fontSize: 13, color: '#64748B', marginTop: 6 }}>{talhao.cultura}{talhao.variedade ? ` · ${talhao.variedade}` : ''}{talhao.estagio ? ` · ${talhao.estagio}` : ''}</div>
                    </div>
                    <div style={{
                        flex: 1,
                        padding: 20,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                        gap: 16,
                        alignItems: 'center',
                    }}>
                        <MetricaItem label="Área" value={talhao.area_ha != null && talhao.area_ha > 0 ? `${talhao.area_ha.toFixed(1)} ha` : '—'} />
                        <MetricaItem label="Pontos" value={String(metricas.totalPontos)} />
                        <MetricaItem label="Ocorrências" value={String(metricas.totalOcorrencias)} />
                        <MetricaItem label="Índice" value={`${metricas.indiceOcorrencia}%`} highlight color={cor} />
                        <div>
                            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>Classificação</div>
                            <span style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: 600,
                                background: `${cor}15`,
                                color: cor,
                            }}>
                                {label}
                            </span>
                        </div>
                    </div>
                    <div style={{
                        padding: 20,
                        borderLeft: '1px solid #E2E8F0',
                        textAlign: 'right',
                        minWidth: 140,
                    }}>
                        <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 4 }}>Último monitoramento</div>
                        <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{data}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <ResumoExecutivo metricas={metricas} talhaoNome={talhao.nome} area_ha={talhao.area_ha} ultimoMonitoramento={data} />
                <div style={{ ...cardStyle, overflow: 'hidden' }}>
                    <MapaInterativo pontos={talhao.pontos} poligono={talhao.poligono_geojson} talhaoId={talhao.id} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: talhao.condicoes_climaticas ? '1fr 1fr' : '1fr', gap: 20, marginBottom: 20 }}>
                <PrincipaisInfestacoes metricas={metricas} />
                {talhao.condicoes_climaticas && <CondicoesClimaticasCard condicoes={talhao.condicoes_climaticas} />}
            </div>

            {(talhao.estagio || talhao.dae != null || talhao.populacao_estande != null || (talhao.condicoes_climaticas && (talhao.condicoes_climaticas.temperatura != null || talhao.condicoes_climaticas.umidade != null))) && (
                <div style={{ ...cardStyle, padding: 16, marginBottom: 20 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Dados complementares</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                        {talhao.estagio && <DadoItem label="Estágio" value={talhao.estagio} />}
                        {talhao.dae != null && Number.isFinite(talhao.dae) && <DadoItem label="DAE" value={String(talhao.dae)} />}
                        {talhao.populacao_estande != null && Number.isFinite(talhao.populacao_estande) && <DadoItem label="Pop. estande" value={`${talhao.populacao_estande} pl/ha`} />}
                        {talhao.condicoes_climaticas?.temperatura != null && Number.isFinite(talhao.condicoes_climaticas.temperatura) && <DadoItem label="Temperatura" value={`${talhao.condicoes_climaticas.temperatura} °C`} />}
                        {talhao.condicoes_climaticas?.umidade != null && Number.isFinite(talhao.condicoes_climaticas.umidade) && <DadoItem label="Umidade" value={`${talhao.condicoes_climaticas.umidade}%`} />}
                    </div>
                </div>
            )}

            <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
                <RecomendacoesTecnicas recomendacoes={recomendacoes} />
            </div>

            <div style={{ marginBottom: 20 }}>
                <IndicesPorPonto metricasPorPonto={metricasPorPonto} pontos={talhao.pontos} />
            </div>

            <div style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
                <GaleriaOcorrencias pontos={talhao.pontos} />
            </div>

            <div style={{ marginBottom: 40 }}>
                <TabelaDetalhada pontos={talhao.pontos} />
            </div>

            {index < total && (
                <div style={{ margin: '40px 0', borderTop: '1px dashed #CBD5E1', position: 'relative' }}>
                    <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#F8FAFC', padding: '0 12px', fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
                        Próximo: Talhão {index + 1}
                    </span>
                </div>
            )}
        </section>
    );
}

function MetricaItem({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
    return (
        <div>
            <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: highlight && color ? color : '#1E293B' }}>{value}</div>
        </div>
    );
}

function DadoItem({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{label}: </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{value}</span>
        </div>
    );
}
