import React, { useState } from 'react';
import { Search, Info } from 'lucide-react';
import { ResearchProReportProgramaManejo } from '../../../types/research-report';

type Props = {
    data: ResearchProReportProgramaManejo[];
};

export default function ListaTratamentos({ data }: Props) {
    const [busca, setBusca] = useState('');

    const filtrados = data.filter(p =>
        p.nome.toLowerCase().includes(busca.toLowerCase()) ||
        p.empresa.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

            {/* Header com Filtro */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Buscar tratamento ou empresa..."
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 transition-colors"
                    />
                    <Search size={16} className="absolute left-3 top-2.5 text-gray-400" />
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-1.5">
                    <Info size={14} />
                    {filtrados.length} listados
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                    <thead className="bg-[#f8fafc] text-xs uppercase text-gray-500 border-b border-gray-100 font-semibold tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Tratamento</th>
                            <th className="px-6 py-4">Empresa / Categoria</th>
                            <th className="px-6 py-4">Protocolo de Aplicações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filtrados.map((programa, idx) => (
                            <tr key={programa.id} className="hover:bg-gray-50/50 transition-colors group">
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs
                      ${programa.categoria === 'testemunha' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'}`}>
                                            {programa.id}
                                        </div>
                                        <span className="font-semibold text-gray-900">{programa.nome}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="block text-gray-900 font-medium mb-1">{programa.empresa}</span>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full w-fit
                    ${programa.categoria === 'testemunha' ? 'bg-gray-100 text-gray-600' :
                                            programa.categoria === 'produtor' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                        {programa.categoria.toUpperCase()}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    {programa.aplicacoes.length === 0 ? (
                                        <span className="text-gray-400 italic">Nenhuma aplicação (Testemunha absoluta)</span>
                                    ) : (
                                        <div className="space-y-3">
                                            {programa.aplicacoes.map(app => (
                                                <div key={app.ordem} className="flex flex-wrap items-start gap-2">
                                                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs px-2 font-medium shrink-0">
                                                        {app.ordem}ª App (DAE {app.dae})
                                                    </span>
                                                    <div className="flex flex-wrap items-center gap-1.5 flex-1">
                                                        {app.produtos.map((prod, i) => (
                                                            <React.Fragment key={i}>
                                                                <div className="text-xs bg-white border border-gray-200 px-2 py-1 rounded-md shadow-sm">
                                                                    <span className="text-gray-900 font-medium">{prod.nome}</span>
                                                                    <span className="text-blue-600 font-semibold ml-1.5">{prod.dose.toFixed(2)}</span>
                                                                    <span className="text-gray-500 ml-0.5">{prod.unidade}</span>
                                                                </div>
                                                                {i < app.produtos.length - 1 && <span className="text-gray-300 font-bold">+</span>}
                                                            </React.Fragment>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {filtrados.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                    Nenhum tratamento encontrado para a busca "{busca}".
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
