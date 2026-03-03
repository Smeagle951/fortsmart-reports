import React from 'react';
import { ReportFooter } from './Header';
import HeaderRelatorio from './HeaderRelatorio';
import { formatNumber, formatPercent } from '../utils/format';
import { InfoGrid } from './TabelaDados';
import TabelaDados from './TabelaDados';
import Galeria from './Galeria';
import dynamic from 'next/dynamic';

const MapaTalhao = dynamic(() => import('./MapaTalhao'), { ssr: false });

export type PlantioJson = {
    meta?: Record<string, unknown>;
    propriedade?: Record<string, unknown>;
    talhao?: Record<string, unknown>;
    contextoSafra?: Record<string, unknown>;
    fenologia?: Record<string, unknown>;
    populacao?: Record<string, unknown>;
    plantabilidade?: Record<string, unknown>;
    estande?: Record<string, unknown>;
    evolucaoCultura?: Record<string, unknown>;
    itensTecnicos?: Array<Record<string, unknown>>;
    imagens?: Array<{ url?: string; descricao?: string; categoria?: string }>;
    mapa?: { polygon?: Array<[number, number]> };
    assinaturaTecnica?: Record<string, unknown>;
    conclusao?: string;
};

export default function RelatorioPlantio({ relatorio, reportId }: { relatorio: PlantioJson, reportId?: string }) {
    const meta = relatorio.meta || {};
    const prop = relatorio.propriedade || {};
    const talhao = relatorio.talhao || {};
    const contextoSafra = relatorio.contextoSafra || {};
    const fenologia = relatorio.fenologia || {};
    const populacao = relatorio.populacao || {};
    const plantabilidade = relatorio.plantabilidade || {};
    const evolucaoCultura = relatorio.evolucaoCultura || {};
    const itensTecnicos = relatorio.itensTecnicos || [];
    const imagens = relatorio.imagens || [];
    const mapa = relatorio.mapa || {};
    const assinaturaTecnica = relatorio.assinaturaTecnica || {};
    const conclusao = relatorio.conclusao || '';

    const idForStorage = reportId || (meta.id as string) || '';
    const municipioUf = [prop.municipio, prop.estado].filter(Boolean).join(' / ');

    return (
        <>
            <HeaderRelatorio
                meta={meta as any}
                propriedade={prop as any}
                talhao={talhao as any}
                reportId={reportId || (meta.id as string)}
            />

            <div className="text-center mb-8 mt-4 animate-fade-in-up">
                <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-700 to-green-600 text-transparent bg-clip-text uppercase tracking-wide">
                    Relatório de Operação de Plantio
                </h1>
                <h2 className="text-xl font-bold text-gray-700 mt-2 uppercase tracking-tight">
                    SISTEMA FORTSMART AGRO ANÁLISE PROFISSIONAL
                </h2>
                <div className="flex items-center justify-center gap-2 mt-3 text-sm font-semibold text-gray-500 uppercase">
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{prop.fazenda as string || 'Fazenda'}</span>
                    <span className="bg-gray-100 px-3 py-1 rounded-full">{talhao.nome as string || 'Talhão'}</span>
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200">{talhao.cultura as string || 'Cultura'}</span>
                </div>
            </div>

            <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent my-8 opacity-60"></div>

            <InfoGrid
                title="Identificação e Área"
                items={[
                    ['Talhão', String(talhao.nome ?? '—')],
                    ['Cultura', String(talhao.cultura ?? '—')],
                    ['Safra', String(meta.safra ?? '—')],
                    ['Área', talhao.area ? formatNumber(Number(talhao.area)) + ' ha' : '—'],
                    ['Município/UF', municipioUf || '—'],
                    ['Técnico responsável', String(meta.tecnico ?? '—')],
                ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <InfoGrid
                    title="Contexto da Safra"
                    items={[
                        ['Data de plantio', String(talhao.dataPlantio ?? '—')],
                        ['Material / Variedade', String(contextoSafra.materialVariedade ?? '—')],
                        ['DAE (Dias Após Emergência)', contextoSafra.dae != null ? `${contextoSafra.dae} dias` : '—'],
                        ['DAP (Dias Após Plantio)', contextoSafra.dap != null ? `${contextoSafra.dap} dias` : '—'],
                    ]}
                />

                <InfoGrid
                    title="Fenologia Atual"
                    items={[
                        ['Estádio fenológico', String(fenologia.estadio ?? evolucaoCultura.estadioAtual ?? '—')],
                        ['Estádio previsto', String(evolucaoCultura.estadioPrevisto ?? '—')],
                        ['Atraso / Adiamento', evolucaoCultura.atrasoFenologico != null ? String(evolucaoCultura.atrasoFenologico) : '—'],
                        ['Soma Térmica', evolucaoCultura.somaTermica != null ? formatNumber(Number(evolucaoCultura.somaTermica)) + ' GD' : '—'],
                    ]}
                />
            </div>

            {/* MÉTRICAS DE POPULACAO E ESTANDE */}
            <section className="mb-10 page-break-inside-avoid">
                <h3 className="text-lg font-bold text-gray-800 border-b-2 border-emerald-600 pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                    População e Estande Inicial
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 text-center">População Alvo</span>
                        <span className="text-3xl font-black text-slate-800">{populacao.plantasHa ? formatNumber(Number(populacao.plantasHa)) : '—'}</span>
                        <span className="text-xs text-slate-500 mt-1">pl/ha</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 text-center">Estande Efetivo</span>
                        <span className="text-3xl font-black text-emerald-600">{populacao.estandeEfetivoPlHa ? formatNumber(Number(populacao.estandeEfetivoPlHa)) : '—'}</span>
                        <span className="text-xs text-slate-500 mt-1">pl/ha</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 text-center">Eficiência Real</span>
                        <span className="text-3xl font-black text-blue-600">{populacao.eficienciaPct != null ? formatPercent(Number(populacao.eficienciaPct)) : '—'}</span>
                        <span className="text-xs text-slate-500 mt-1">do estande planejado</span>
                    </div>
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center hover:shadow-md transition-shadow">
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1 text-center">Status Global</span>
                        <span className={`text-2xl mt-1 font-black px-4 py-1 rounded-full ${String(populacao.situacao || '').toLowerCase() === 'ok' ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                            {String(populacao.situacao || '—')}
                        </span>
                    </div>
                </div>
            </section>

            {/* PLANTABILIDADE */}
            {(plantabilidade.cvPercentual != null || plantabilidade.duplasPct != null || plantabilidade.espacamentoRealCm != null) && (
                <section className="mb-10 page-break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-indigo-600 pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path></svg>
                        Plantabilidade e Distribuição Espacial
                    </h3>
                    <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Espaçamento Ideal</div>
                                <div className="text-xl font-bold text-slate-800">{plantabilidade.espacamentoIdealCm ? `${Number(plantabilidade.espacamentoIdealCm).toFixed(1)} cm` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Espaçamento Real</div>
                                <div className="text-xl font-bold text-slate-800">{plantabilidade.espacamentoRealCm ? `${Number(plantabilidade.espacamentoRealCm).toFixed(1)} cm` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Coef. Variação (CV)</div>
                                <div className="text-xl font-bold text-indigo-600">{plantabilidade.cvPercentual ? `${Number(plantabilidade.cvPercentual).toFixed(1)}%` : '—'}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-1">Espaçamentos Aceitáveis</div>
                                <div className="text-xl font-bold text-emerald-600">{plantabilidade.okPct ? `${Number(plantabilidade.okPct).toFixed(1)}%` : '—'}</div>
                            </div>
                        </div>

                        {(plantabilidade.duplasPct != null || plantabilidade.falhasPct != null || plantabilidade.triplasPct != null) && (
                            <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Duplas</div>
                                    <div className="text-lg font-bold text-amber-500">{plantabilidade.duplasPct ? `${Number(plantabilidade.duplasPct).toFixed(1)}%` : '0%'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Triplas</div>
                                    <div className="text-lg font-bold text-orange-500">{plantabilidade.triplasPct ? `${Number(plantabilidade.triplasPct).toFixed(1)}%` : '0%'}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-slate-500 font-semibold uppercase mb-1">Falhas</div>
                                    <div className="text-lg font-bold text-rose-500">{plantabilidade.falhasPct ? `${Number(plantabilidade.falhasPct).toFixed(1)}%` : '0%'}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Tabela de Itens Técnicos */}
            {itensTecnicos.length > 0 && (
                <section className="mb-10 page-break-inside-avoid">
                    <TabelaDados
                        title="Registros e Avaliações Técnicas do Plantio"
                        headers={['Variável Analisada', 'Valor Observado']}
                        rows={itensTecnicos.map(item => [
                            <span key="nome" className="font-semibold text-gray-800">{String(item.nome || '—')}</span>,
                            <span key="valor" className="font-mono text-gray-700">{String(item.valor || '—')} {item.unidade ? String(item.unidade) : ''}</span>
                        ])}
                    />
                </section>
            )}

            {/* Mapa do Talhão (Polygon apenas) */}
            {mapa?.polygon && Array.isArray(mapa.polygon) && (
                <section className="mb-10 page-break-inside-avoid">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-slate-400 pb-2 mb-4 uppercase tracking-wider text-sm">
                        Área Registrada
                    </h3>
                    <div className="h-64 rounded-xl overflow-hidden border border-gray-200">
                        <MapaTalhao
                            pontos={mapa.polygon.map(coord => ({
                                id: String(Math.random()),
                                latitude: coord[0],
                                longitude: coord[1],
                            }))}
                        />
                    </div>
                </section>
            )}

            {/* Galeria de Fotos do Plantio */}
            {imagens.length > 0 && (
                <section className="mb-10 page-break-before-always">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-slate-400 pb-2 mb-4 uppercase tracking-wider text-sm flex items-center">
                        <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        Registro Fotográfico da Operação
                    </h3>
                    <Galeria imagens={imagens as any} relatorioId={idForStorage} />
                </section>
            )}

            {/* Observacoes / Conclusao */}
            {conclusao && (
                <section className="mb-10">
                    <h3 className="text-lg font-bold text-gray-800 border-b-2 border-gray-400 pb-2 mb-4 uppercase tracking-wider text-sm">Conclusão / Observações</h3>
                    <div className="bg-gray-50 border border-gray-200 p-6 rounded-xl text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                        {conclusao}
                    </div>
                </section>
            )}

            <ReportFooter meta={meta as { id?: string; appVersion?: string; versao?: number }} reportId={reportId} />
        </>
    );
}
