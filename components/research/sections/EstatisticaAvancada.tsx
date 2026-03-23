import React from 'react';
import { BarChart3, TrendingUp, AlertCircle, Info, Calculator } from 'lucide-react';
import { ResearchProReportEstatistica } from '../../../types/research-report';

type Props = {
    data: ResearchProReportEstatistica;
};

export default function EstatisticaAvancada({ data }: Props) {
    if (!data || !data.variaveis || data.variaveis.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-500">
                Nenhum dado estatístico processado para este relatório.
            </div>
        );
    }

    // Cores de grupo de Tukey
    const tukeyColors: Record<string, string> = {
        'A': 'bg-green-100 text-green-800 border-green-200',
        'AB': 'bg-blue-100 text-blue-800 border-blue-200',
        'B': 'bg-amber-100 text-amber-800 border-amber-200',
        'BC': 'bg-orange-100 text-orange-800 border-orange-200',
        'C': 'bg-red-100 text-red-800 border-red-200',
    };

    const getTukeyColor = (group: string) => {
        return tukeyColors[group] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <BarChart3 className="text-blue-600" size={24} />
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">Painel Estatístico Avançado</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Análise de Variância (ANOVA) e Teste de Médias (Tukey)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm">
                    <AlertCircle size={14} className="text-blue-500" />
                    Nível de Significância <span className="font-bold text-gray-900 ml-1">α = 5% (p &lt; 0.05)</span>
                </div>
            </div>

            <div className="p-6 space-y-12">
                {data.variaveis.map((varStats, idx) => {

                    const isSignificativo = varStats.anova.significativo;

                    return (
                        <div key={idx} className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">

                            {/* Header da Variavel */}
                            <div className="bg-slate-50 border-b border-gray-200 p-5 flex flex-wrap gap-6 justify-between items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-widest uppercase">
                                            Agro Analytics
                                        </span>
                                        <h4 className="font-bold text-slate-900 text-lg">{varStats.nome}</h4>
                                    </div>
                                    <span className="text-sm text-slate-500">
                                        Unidade: <strong className="text-slate-700">{varStats.unidade}</strong>
                                    </span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    {/* KPI: p-value */}
                                    <div className={`flex flex-col border rounded-lg px-3 py-2
                    ${isSignificativo ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">p-value</span>
                                        <span className={`text-sm font-bold ${isSignificativo ? 'text-green-700' : 'text-red-700'}`}>
                                            {varStats.anova.p_value.toFixed(4)}
                                        </span>
                                    </div>

                                    {/* KPI: CV% */}
                                    <div className={`flex flex-col border rounded-lg px-3 py-2
                    ${varStats.cv_percentual < 15 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">CV (%)</span>
                                        <span className={`text-sm font-bold ${varStats.cv_percentual < 15 ? 'text-emerald-700' : 'text-amber-700'}`}>
                                            {varStats.cv_percentual.toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* KPI: DMS */}
                                    <div className="flex flex-col bg-white border border-gray-200 rounded-lg px-3 py-2">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">DMS</span>
                                        <span className="text-sm font-bold text-gray-700">
                                            {varStats.dms.toFixed(3)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela ANOVA (Fonte, GL, SQ, QM, F, p) */}
                            {varStats.anova_tabela && varStats.anova_tabela.length > 0 && (
                                <div className="overflow-x-auto p-5 border-b border-gray-100">
                                    <h5 className="text-sm font-semibold text-gray-700 mb-3">Tabela de Análise de Variância (DBC)</h5>
                                    <table className="w-full text-sm text-left text-gray-600 rounded-lg overflow-hidden border border-gray-200">
                                        <thead className="bg-[#f8fafc] text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2 border-b border-gray-200">Fonte</th>
                                                <th className="px-4 py-2 border-b border-gray-200 border-l text-right">GL</th>
                                                <th className="px-4 py-2 border-b border-gray-200 border-l text-right">SQ</th>
                                                <th className="px-4 py-2 border-b border-gray-200 border-l text-right">QM</th>
                                                <th className="px-4 py-2 border-b border-gray-200 border-l text-right">F</th>
                                                <th className="px-4 py-2 border-b border-gray-200 border-l text-right">p</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {varStats.anova_tabela.map((linha, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 font-medium text-gray-900">{linha.fonte}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{linha.gl}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{linha.sq.toFixed(3)}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{linha.qm > 0 ? linha.qm.toFixed(3) : '—'}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{linha.f != null ? linha.f.toFixed(3) : '—'}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{linha.p != null ? linha.p.toFixed(4) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Tabela de Tukey */}
                            <div className="overflow-x-auto p-5">

                                {!isSignificativo && (
                                    <div className="mb-4 bg-gray-50 border border-gray-200 text-gray-600 text-sm px-4 py-3 rounded-lg flex items-center gap-3">
                                        <Info size={16} className="text-gray-400" />
                                        <strong>Sem diferença significativa:</strong> Como p &gt; 0.05, estatisticamente os tratamentos apresentaram comportamentos semelhantes para esta variável.
                                    </div>
                                )}

                                <table className="w-full text-sm text-left text-gray-600 rounded-lg overflow-hidden border border-gray-200">
                                    <thead className="bg-[#f8fafc] text-xs uppercase text-gray-500 font-semibold tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 border-b border-gray-200">Programa / Tratamento</th>
                                            <th className="px-5 py-3 border-b border-gray-200 border-l text-right">Média</th>
                                            <th className="px-5 py-3 border-b border-gray-200 border-l w-48 text-center">Teste de Médias (Tukey)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {varStats.tukey.map((t, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-5 py-4 border-r border-gray-100 font-medium text-gray-900">
                                                    {t.programa}
                                                </td>
                                                <td className="px-5 py-4 border-r border-gray-100 text-right font-mono text-base font-semibold text-blue-900">
                                                    {t.media.toFixed(3)}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    {isSignificativo ? (
                                                        <span className={`inline-flex items-center justify-center font-bold text-sm px-3 py-1 rounded border shadow-sm ${getTukeyColor(t.grupo)}`}>
                                                            {t.grupo}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center justify-center font-bold text-sm px-3 py-1 rounded border bg-gray-50 text-gray-400 border-gray-200">
                                                            A
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className="mt-3 flex items-start gap-2 text-xs text-gray-400 bg-gray-50/50 p-2 rounded">
                                    <Calculator size={14} className="shrink-0 mt-0.5" />
                                    <p>
                                        Médias seguidas pela mesma letra não diferem estatisticamente entre si pelo teste de Tukey a 5% de probabilidade.
                                        DMS = Diferença Mínima Significativa. CV = Coeficiente de Variação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
