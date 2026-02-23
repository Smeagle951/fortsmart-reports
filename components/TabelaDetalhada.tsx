'use client';

import { useState } from 'react';
import { Infestacao, PontoMonitoramento, TipoOrganismo } from '@/lib/types/monitoring';

interface TabelaDetalhadaProps {
    pontos: PontoMonitoramento[];
}

type FiltroTipo = 'todos' | TipoOrganismo;

interface LinhaTabela {
    pontoId: string;
    tipo: TipoOrganismo;
    nome: string;
    terco: string;
    quantidade: number | null;
    severidade: number;
}

const TIPO_LABEL: Record<TipoOrganismo, string> = {
    praga: 'Praga', doenca: 'Doença', daninha: 'Daninha',
};

const TIPO_COLOR: Record<TipoOrganismo, { bg: string; text: string }> = {
    praga: { bg: '#FFEBEE', text: '#C62828' },
    doenca: { bg: '#F3E5F5', text: '#7B1FA2' },
    daninha: { bg: '#E8F5E9', text: '#2E7D32' },
};

function getSevStyle(sev: number) {
    if (sev < 10) return { label: 'Baixo', color: '#2E7D32' };
    if (sev < 25) return { label: 'Médio', color: '#F9A825' };
    if (sev < 40) return { label: 'Alto', color: '#E65100' };
    return { label: 'Crítico', color: '#C62828' };
}

const PAGE_SIZE = 8;

export default function TabelaDetalhada({ pontos }: TabelaDetalhadaProps) {
    const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
    const [ordenacao, setOrdenacao] = useState<keyof LinhaTabela>('pontoId');
    const [asc, setAsc] = useState(true);
    const [pagina, setPagina] = useState(1);

    // Montar linhas
    const linhas: LinhaTabela[] = pontos.flatMap(p =>
        p.infestacoes.map(inf => ({
            pontoId: p.identificador,
            tipo: inf.tipo,
            nome: inf.nome,
            terco: inf.terco,
            quantidade: inf.quantidade,
            severidade: inf.severidade,
        }))
    );

    const filtradas = linhas.filter(l => filtroTipo === 'todos' || l.tipo === filtroTipo);
    const ordenadas = [...filtradas].sort((a, b) => {
        const va = a[ordenacao] ?? '', vb = b[ordenacao] ?? '';
        if (va < vb) return asc ? -1 : 1;
        if (va > vb) return asc ? 1 : -1;
        return 0;
    });

    const totalPags = Math.ceil(ordenadas.length / PAGE_SIZE);
    const pagSelected = ordenadas.slice((pagina - 1) * PAGE_SIZE, pagina * PAGE_SIZE);

    const handleSort = (col: keyof LinhaTabela) => {
        if (ordenacao === col) setAsc(!asc);
        else { setOrdenacao(col); setAsc(true); }
        setPagina(1);
    };

    const handleExportCSV = () => {
        const header = ['Ponto', 'Tipo', 'Infestação', 'Terço', 'Quantidade', 'Severidade (%)'];
        const rows = filtradas.map(l => [
            l.pontoId, TIPO_LABEL[l.tipo], l.nome, l.terco,
            l.quantidade ?? 'N/A', l.severidade,
        ]);
        const csv = [header, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'monitoramento.csv';
        a.click();
    };

    const SortIcon = ({ col }: { col: keyof LinhaTabela }) => (
        <span style={{ marginLeft: 4, color: ordenacao === col ? '#1B5E20' : '#CBD5E1', fontSize: 10 }}>
            {ordenacao === col ? (asc ? '▲' : '▼') : '⇅'}
        </span>
    );

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '.5px', margin: 0 }}>
                    📋 Tabela Detalhada
                </h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Filtro */}
                    {(['todos', 'praga', 'doenca', 'daninha'] as FiltroTipo[]).map(t => (
                        <button
                            key={t}
                            onClick={() => { setFiltroTipo(t); setPagina(1); }}
                            style={{
                                padding: '4px 12px', borderRadius: 99, border: 'none', cursor: 'pointer',
                                fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                                background: filtroTipo === t ? '#1B5E20' : '#F1F5F9',
                                color: filtroTipo === t ? '#fff' : '#64748B',
                                transition: 'all .15s',
                            }}
                        >
                            {t === 'todos' ? 'Todos' : t === 'doenca' ? 'Doenças' : t === 'praga' ? 'Pragas' : 'Daninhas'}
                        </button>
                    ))}
                    <button
                        onClick={handleExportCSV}
                        style={{
                            padding: '4px 14px', borderRadius: 99, border: '1.5px solid #1B5E20',
                            background: 'transparent', color: '#1B5E20', cursor: 'pointer',
                            fontSize: 11, fontWeight: 700,
                        }}
                    >
                        ⬇ CSV
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                        <thead>
                            <tr style={{ background: '#F8FAFC', borderBottom: '1.5px solid #E2E8F0' }}>
                                {[
                                    { key: 'pontoId', label: 'Ponto' },
                                    { key: 'tipo', label: 'Tipo' },
                                    { key: 'nome', label: 'Infestação' },
                                    { key: 'terco', label: 'Terço' },
                                    { key: 'quantidade', label: 'Qtde' },
                                    { key: 'severidade', label: 'Severidade' },
                                ].map(({ key, label }) => (
                                    <th
                                        key={key}
                                        onClick={() => handleSort(key as keyof LinhaTabela)}
                                        style={{
                                            padding: '10px 14px', textAlign: 'left', fontWeight: 700,
                                            color: '#475569', cursor: 'pointer', whiteSpace: 'nowrap',
                                            fontSize: 11, textTransform: 'uppercase', letterSpacing: '.4px',
                                        }}
                                    >
                                        {label}<SortIcon col={key as keyof LinhaTabela} />
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {pagSelected.map((l, idx) => {
                                const sev = getSevStyle(l.severidade);
                                const tipo = TIPO_COLOR[l.tipo];
                                return (
                                    <tr
                                        key={idx}
                                        style={{ borderBottom: '1px solid #F1F5F9', transition: 'background .1s' }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#FAFBFF'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                                    >
                                        <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1B5E20' }}>{l.pontoId}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ background: tipo.bg, color: tipo.text, padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
                                                {TIPO_LABEL[l.tipo]}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 14px', fontWeight: 500, color: '#1A2332' }}>{l.nome}</td>
                                        <td style={{ padding: '10px 14px', color: '#64748B' }}>{l.terco}</td>
                                        <td style={{ padding: '10px 14px', color: '#64748B' }}>{l.quantidade ?? 'N/A'}</td>
                                        <td style={{ padding: '10px 14px' }}>
                                            <span style={{ color: sev.color, fontWeight: 700 }}>{l.severidade}%</span>
                                            <span style={{ fontSize: 10, background: sev.color + '22', color: sev.color, padding: '1px 6px', borderRadius: 99, marginLeft: 6, fontWeight: 600 }}>
                                                {sev.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                            {pagSelected.length === 0 && (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#94A3B8', fontSize: 13 }}>
                                        Nenhum dado para exibir.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                {totalPags > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderTop: '1px solid #F1F5F9' }}>
                        {Array.from({ length: totalPags }, (_, i) => i + 1).map(p => (
                            <button
                                key={p}
                                onClick={() => setPagina(p)}
                                style={{
                                    width: 30, height: 30, borderRadius: '50%', border: 'none', cursor: 'pointer',
                                    background: pagina === p ? '#1B5E20' : '#F1F5F9',
                                    color: pagina === p ? '#fff' : '#64748B',
                                    fontWeight: 700, fontSize: 12, transition: 'all .15s',
                                }}
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
