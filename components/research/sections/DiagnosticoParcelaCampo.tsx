'use client';

import React from 'react';
import { Microscope } from 'lucide-react';
import type { ResearchProReportDiagnosticoParcela } from '../../../types/research-report';

type Props = {
    itens: ResearchProReportDiagnosticoParcela[];
};

function fmtData(iso: string) {
    if (!iso || iso.length < 8) return iso;
    const p = iso.split('-');
    if (p.length >= 3) return `${p[2]}/${p[1]}/${p[0]}`;
    return iso;
}

export default function DiagnosticoParcelaCampo({ itens }: Props) {
    if (!itens.length) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                Nenhum diagnóstico estruturado por parcela registrado neste experimento.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                <Microscope className="text-emerald-700" size={22} />
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Diagnóstico por parcela</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Causa provável e resultado da ação (pós-avaliação), vindos do app FortSmart Research Pro.
                    </p>
                </div>
            </div>
            <div className="p-4 lg:p-6 space-y-4">
                {itens.map((row, idx) => (
                    <div
                        key={`${row.data_avaliacao}-${row.parcela}-${idx}`}
                        className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-4"
                    >
                        <div className="flex flex-wrap items-baseline gap-2 gap-y-1 mb-3">
                            <span className="font-mono text-sm font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                                {row.parcela}
                            </span>
                            <span className="text-sm text-gray-600">
                                {fmtData(row.data_avaliacao)}
                                {row.dae != null ? ` · DAE ${row.dae}` : ''}
                            </span>
                            {row.diagnostico_tipo ? (
                                <span className="text-xs font-semibold uppercase tracking-wide text-emerald-800 bg-white/80 border border-emerald-200 px-2 py-0.5 rounded">
                                    {row.diagnostico_tipo}
                                </span>
                            ) : null}
                        </div>
                        <dl className="grid gap-3 text-sm sm:grid-cols-1">
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Causa provável
                                </dt>
                                <dd className="text-gray-900 leading-relaxed">
                                    {row.causa_provavel?.trim() ? row.causa_provavel : '—'}
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                    Resultado da ação (pós)
                                </dt>
                                <dd>
                                    <span
                                        className={`inline-flex font-medium px-2.5 py-1 rounded-md text-sm ${
                                            row.resultado_acao_codigo === 'resolvido'
                                                ? 'bg-green-100 text-green-900'
                                                : row.resultado_acao_codigo === 'parcial'
                                                  ? 'bg-amber-100 text-amber-900'
                                                  : row.resultado_acao_codigo === 'nao_resolveu' ||
                                                      row.resultado_acao_codigo === 'piorou'
                                                    ? 'bg-red-100 text-red-900'
                                                    : 'bg-gray-100 text-gray-700'
                                        }`}
                                    >
                                        {row.resultado_acao || '—'}
                                    </span>
                                </dd>
                            </div>
                            {(row.agente_causador_label || row.agente_causador_detalhe) && (
                                <div>
                                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Agente causador
                                    </dt>
                                    <dd className="text-gray-800">
                                        {[row.agente_causador_label, row.agente_causador_detalhe]
                                            .filter(Boolean)
                                            .join(' · ') || '—'}
                                    </dd>
                                </div>
                            )}
                            {(row.natureza || row.distribuicao || row.severidade) && (
                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                    {row.natureza ? (
                                        <span className="bg-white border border-gray-200 rounded px-2 py-1">
                                            Natureza: <strong className="text-gray-800">{row.natureza}</strong>
                                        </span>
                                    ) : null}
                                    {row.distribuicao ? (
                                        <span className="bg-white border border-gray-200 rounded px-2 py-1">
                                            Distribuição:{' '}
                                            <strong className="text-gray-800">{row.distribuicao}</strong>
                                        </span>
                                    ) : null}
                                    {row.severidade ? (
                                        <span className="bg-white border border-gray-200 rounded px-2 py-1">
                                            Severidade:{' '}
                                            <strong className="text-gray-800">{row.severidade}</strong>
                                        </span>
                                    ) : null}
                                </div>
                            )}
                            {row.sintomas_resumo ? (
                                <div>
                                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Sintomas (resumo)
                                    </dt>
                                    <dd className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {row.sintomas_resumo}
                                    </dd>
                                </div>
                            ) : null}
                            {row.recomendacao_resumo ? (
                                <div>
                                    <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                                        Recomendação (resumo)
                                    </dt>
                                    <dd className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                                        {row.recomendacao_resumo}
                                    </dd>
                                </div>
                            ) : null}
                        </dl>
                    </div>
                ))}
            </div>
        </div>
    );
}
