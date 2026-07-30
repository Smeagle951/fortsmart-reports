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

function hasContent(rec: Recomendacao): boolean {
    const acao = (rec.acao ?? '').trim();
    const org = (rec.organismo ?? '').trim();
    return (acao.length > 0 && acao !== '—' && acao !== '-') || org.length > 0;
}

/** Uma linha por recomendação realmente registrada; nunca completa o layout com texto artificial. */
function buildCards(recomendacoes: Recomendacao[]): { nivel: NivelRecomendacao; organismo: string; tipo: string; texto: string; produto: string; dose: string }[] {
  const comConteudo = recomendacoes.filter(hasContent);
  const porOrganismo = new Map<string, Recomendacao>();
  for (const rec of comConteudo) {
    const chave = (rec.organismo ?? '').trim() || '—';
    if (chave === '—' || chave === 'Recomendação geral') {
      if (!porOrganismo.has('geral')) porOrganismo.set('geral', rec);
      continue;
    }
    if (!porOrganismo.has(chave)) porOrganismo.set(chave, rec);
  }
  const list = Array.from(porOrganismo.entries())
    .filter(([k]) => k !== 'geral')
    .slice(0, 3)
    .map(([, rec]) => ({
      nivel: rec.nivel,
      organismo: (rec.organismo ?? '').trim() || 'Monitoramento',
      tipo: rec.tipo ?? 'praga',
      texto: (rec.acao ?? '').trim() || '—',
      produto: (rec.produto ?? '').trim() || '—',
      dose: (rec.dose ?? '').trim() || '—',
    }));
  if (porOrganismo.has('geral')) {
    const rec = porOrganismo.get('geral')!;
    list.push({
      nivel: rec.nivel,
      organismo: 'Recomendação geral',
      tipo: rec.tipo ?? 'praga',
      texto: (rec.acao ?? '').trim() || '—',
      produto: (rec.produto ?? '').trim() || '—',
      dose: (rec.dose ?? '').trim() || '—',
    });
  }
  return list.slice(0, 3);
}

export default function RecomendacoesTecnicas({ recomendacoes }: RecomendacoesTecnicasProps) {
    const cards = buildCards(recomendacoes);

    return (
        <section aria-labelledby="rec-tec-title">
            <h2 id="rec-tec-title" style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 14 }}>
                Recomendações técnicas
            </h2>
            {cards.length === 0 ? (
                <p style={{ margin: 0, color: '#64748B', fontSize: 13 }}>
                    Nenhuma recomendação técnica registrada para este monitoramento.
                </p>
            ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {cards.map((card, idx) => {
                    const cor = NIVEL_COLOR[card.nivel];
                    return (
                        <div
                            key={idx}
                            style={{
                                padding: '18px 20px',
                                background: `linear-gradient(135deg, ${cor}06 0%, #ffffff 50%)`,
                                border: '1px solid #E2E8F0',
                                borderRadius: 12,
                                borderLeft: `4px solid ${cor}`,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{card.organismo}</span>
                                <span
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: 6,
                                        fontSize: 10,
                                        fontWeight: 700,
                                        background: `${cor}22`,
                                        color: cor,
                                        marginLeft: 'auto',
                                    }}
                                >
                                    {NIVEL_LABEL[card.nivel]}
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                                <div style={{ marginBottom: 8 }}>
                                    <span style={{ fontWeight: 600, color: '#64748B' }}>Controle: </span>
                                    <span style={{ color: '#334155' }}>{card.texto}</span>
                                </div>
                                <div style={{ marginBottom: 4 }}>
                                    <span style={{ fontWeight: 600, color: '#64748B' }}>Produto: </span>
                                    <span style={{ color: '#334155' }}>{card.produto}</span>
                                </div>
                                <div>
                                    <span style={{ fontWeight: 600, color: '#64748B' }}>Dose: </span>
                                    <span style={{ color: '#334155' }}>{card.dose}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            )}
        </section>
    );
}
