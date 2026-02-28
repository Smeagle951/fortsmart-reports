'use client';

import { Recomendacao, NivelRecomendacao } from '@/lib/types/monitoring';

interface RecomendacoesTecnicasProps {
    recomendacoes: Recomendacao[];
}

const NIVEL_LABEL: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: 'Ação Imediata',
    ALTO_RISCO: 'Alto Risco',
    MONITORAR: 'Monitorar',
    PREVENTIVO: 'Preventivo',
};

const NIVEL_COLOR: Record<NivelRecomendacao, string> = {
    ACAO_IMEDIATA: '#C62828',
    ALTO_RISCO: '#E65100',
    MONITORAR: '#F59E0B',
    PREVENTIVO: '#2E7D32',
};

const RECOMENDACOES_PADRAO: { nivel: NivelRecomendacao; texto: string }[] = [
    { nivel: 'MONITORAR', texto: 'Realizar monitoramento semanal para acompanhar a evolução do estande e possíveis surtos de pragas e doenças.' },
    { nivel: 'PREVENTIVO', texto: 'Manter registro fotográfico e amostragens representativas para análise de tendências e tomada de decisão em próximas visitas.' },
    { nivel: 'MONITORAR', texto: 'Avaliar condições climáticas e estádio da cultura para alinhar recomendações de manejo ao momento fenológico.' },
];

function hasContent(rec: Recomendacao): boolean {
    const acao = (rec.acao ?? '').trim();
    return acao.length > 0 && acao !== '—' && acao !== '-';
}

/** Lista até 5 recomendações reais; completa com padrões elegantes até ter pelo menos 3 cards. */
function buildCards(recomendacoes: Recomendacao[]): { nivel: NivelRecomendacao; texto: string }[] {
    const list = recomendacoes.filter(hasContent).map(rec => ({
        nivel: rec.nivel,
        texto: (rec.acao ?? '').trim(),
    })).filter(x => x.texto.length > 0);

    const cards: { nivel: NivelRecomendacao; texto: string }[] = [];
    for (const item of list.slice(0, 5)) {
        cards.push({ nivel: item.nivel, texto: item.texto });
    }
    while (cards.length < 3) {
        const idx = cards.length % RECOMENDACOES_PADRAO.length;
        cards.push(RECOMENDACOES_PADRAO[idx]);
    }

    return cards;
}

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    const cards = buildCards(recomendacoes);

    return (
        <section aria-labelledby="rec-tec-title">
            <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                Recomendações técnicas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {cards.map(({ nivel, texto }, idx) => {
                    const cor = NIVEL_COLOR[nivel];
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '16px 18px',
                                background: `linear-gradient(135deg, ${cor}08 0%, #fff 100%)`,
                                border: '1px solid #E2E8F0',
                                borderRadius: 10,
                                borderLeft: `4px solid ${cor}`,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                <span
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: cor,
                                        flexShrink: 0,
                                    }}
                                />
                                <span
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: `${cor}20`,
                                        color: cor,
                                    }}
                                >
                                    {NIVEL_LABEL[nivel]}
                                </span>
                            </div>
                            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.55, margin: 0 }}>
                                {texto}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
