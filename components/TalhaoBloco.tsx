'use client';

import dynamic from 'next/dynamic';
import { Talhao } from '@/lib/types/monitoring';
import { calcularMetricasTalhao, calcularMetricasPorPonto, corClassificacao, labelClassificacao } from '@/lib/calculations';
import { gerarRecomendacoes } from '@/lib/recommendations';
import ResumoExecutivo from './ResumoExecutivo';
import PrincipaisInfestacoes from './PrincipaisInfestacoes';
import RecomendacoesTecnicas from './RecomendacoesTecnicas';
import IndicesChart from './IndicesChart';
import TabelaDetalhada from './TabelaDetalhada';
import GaleriaOcorrencias from './GaleriaOcorrencias';
import IndicesPorPonto from './IndicesPorPonto';
import CondicoesClimaticasCard from './CondicoesClimaticas';

// SSR desligado para Leaflet
const MapaInterativo = dynamic(() => import('./MapaInterativo'), { ssr: false });

interface TalhaoBlocoProps {
    talhao: Talhao;
    index: number;
    total: number;
    data: string;
}

export default function TalhaoBloco({ talhao, index, total, data }: TalhaoBlocoProps) {
    const metricas = calcularMetricasTalhao(talhao);
    const metricasPorPonto = calcularMetricasPorPonto(talhao);
    const recomendacoes = gerarRecomendacoes(talhao.pontos);
    const cor = corClassificacao(metricas.classificacao);
    const label = labelClassificacao(metricas.classificacao);

    return (
        <section id={`talhao-${talhao.id}`} className="animate-fadeInUp">
            {/* Banner do Talhão */}
            <div style={{
                background: `linear-gradient(135deg, #1B5E20 0%, #2E7D32 60%, #388E3C 100%)`,
                borderRadius: 16, padding: '20px 28px', marginBottom: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
            }}>
                <div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)', fontWeight: 600, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 4 }}>
                        {index}/{total} · Talhão
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
                        {talhao.nome}
                    </div>
                    <div style={{ fontSize: 14, color: 'rgba(255,255,255,.8)', marginTop: 4 }}>
                        {talhao.cultura} · {talhao.variedade ?? ''} {talhao.estagio ? `· ${talhao.estagio}` : ''}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        display: 'inline-block', padding: '6px 16px', borderRadius: 99,
                        background: cor + '33', border: `2px solid ${cor}`,
                        fontSize: 13, fontWeight: 700, color: cor === '#2E7D32' ? '#A5D6A7' : cor,
                        marginBottom: 6,
                    }}>
                        {label}
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>
                        {metricas.indiceOcorrencia}%
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>Índice Geral</div>
                </div>
            </div>

            {/* Grid de 2 colunas: Resumo + Mapa */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <ResumoExecutivo metricas={metricas} talhaoNome={talhao.nome} area_ha={talhao.area_ha} ultimoMonitoramento={data} />
                </div>
                <div className="card" style={{ padding: 20 }}>
                    <MapaInterativo pontos={talhao.pontos} poligono={talhao.poligono_geojson} talhaoId={talhao.id} />
                </div>
            </div>

            {/* Índices + Principais Infestações */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 24, marginBottom: 24 }}>
                <div className="card" style={{ padding: 24 }}>
                    <IndicesChart metricas={metricas} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="card" style={{ padding: 20 }}>
                        <PrincipaisInfestacoes metricas={metricas} />
                    </div>
                    {talhao.condicoes_climaticas && (
                        <div className="card" style={{ padding: 20 }}>
                            <CondicoesClimaticasCard condicoes={talhao.condicoes_climaticas} />
                        </div>
                    )}
                </div>
            </div>

            {/* Recomendações */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <RecomendacoesTecnicas recomendacoes={recomendacoes} />
            </div>

            {/* Índice por Ponto */}
            <div style={{ marginBottom: 24 }}>
                <IndicesPorPonto metricasPorPonto={metricasPorPonto} />
            </div>

            {/* Galeria */}
            <div className="card" style={{ padding: 24, marginBottom: 24 }}>
                <GaleriaOcorrencias pontos={talhao.pontos} />
            </div>

            {/* Tabela Detalhada */}
            <div style={{ marginBottom: 40 }}>
                <TabelaDetalhada pontos={talhao.pontos} />
            </div>

            {/* Separador entre talhões */}
            {index < total && (
                <hr className="talhao-divider" data-label={`Próximo: Talhão ${index + 1}`} />
            )}
        </section>
    );
}
