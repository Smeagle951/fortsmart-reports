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

const NIVEL_ORDER: NivelRecomendacao[] = ['ACAO_IMEDIATA', 'ALTO_RISCO', 'MONITORAR', 'PREVENTIVO'];

function hasContent(rec: Recomendacao): boolean {
    const acao = (rec.acao ?? '').trim();
    return acao.length > 0 && acao !== '—' && acao !== '-';
}

/** Agrupa recomendações por nível e gera um resumo curto por nível (máx. 2 ações resumidas). */
function buildResumoGeral(recomendacoes: Recomendacao[]): { nivel: NivelRecomendacao; texto: string }[] {
    const list = recomendacoes.filter(hasContent);
    if (list.length === 0) return [];

    const porNivel: Record<NivelRecomendacao, string[]> = {
        ACAO_IMEDIATA: [],
        ALTO_RISCO: [],
        MONITORAR: [],
        PREVENTIVO: [],
    };
    for (const rec of list) {
        const acao = (rec.acao ?? '').trim();
        if (acao && porNivel[rec.nivel]) {
            porNivel[rec.nivel].push(acao);
        }
    }

    const out: { nivel: NivelRecomendacao; texto: string }[] = [];
    for (const nivel of NIVEL_ORDER) {
        const acoes = porNivel[nivel];
        if (acoes.length === 0) continue;
        const texto = acoes.length <= 2
            ? acoes.join(' ')
            : acoes.slice(0, 2).join(' ') + (acoes.length > 2 ? ' (e mais ' + (acoes.length - 2) + ')' : '');
        out.push({ nivel, texto });
    }
    return out;
}

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    const resumo = buildResumoGeral(recomendacoes);
    if (resumo.length === 0) {
        return (
            <section aria-labelledby="rec-tec-title">
                <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                    Recomendações técnicas
                </h2>
                <p style={{ color: '#94A3B8', fontSize: 13, margin: 0 }}>Nenhuma recomendação registrada para este talhão.</p>
            </section>
        );
    }

    return (
        <section aria-labelledby="rec-tec-title">
            <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                Recomendações técnicas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {resumo.map(({ nivel, texto }, idx) => {
                    const cor = NIVEL_COLOR[nivel];
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '12px 14px',
                                background: '#FAFBFC',
                                border: '1px solid #E2E8F0',
                                borderRadius: 8,
                                borderLeft: `4px solid ${cor}`,
                            }}
                        >
                            <span
                                style={{
                                    display: 'inline-block',
                                    marginBottom: 6,
                                    padding: '2px 8px',
                                    borderRadius: 6,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    background: `${cor}18`,
                                    color: cor,
                                }}
                            >
                                {NIVEL_LABEL[nivel]}
                            </span>
                            <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.5, margin: 0 }}>
                                {texto}
                            </p>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}
