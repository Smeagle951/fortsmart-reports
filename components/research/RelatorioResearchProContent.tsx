'use client';

import React, { useCallback } from 'react';
import { ResearchProReportPayload } from '../../types/research-report';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import SidebarMenu from './SidebarMenu';

// Secoes (Componentes)
import HeaderExecutivo from './sections/HeaderExecutivo';
import DashboardResumo from './sections/DashboardResumo';
import CondicoesAmbientais from './sections/CondicoesAmbientais';
import DelineamentoExperimental from './sections/DelineamentoExperimental';
import CroquiExperimental from './sections/CroquiExperimental';
import QuadroManejoProgramas from './sections/QuadroManejoProgramas';
import HistoricoAplicacoes from './sections/HistoricoAplicacoes';
import AvaliacoesTecnicas from './sections/AvaliacoesTecnicas';
import DiagnosticoParcelaCampo from './sections/DiagnosticoParcelaCampo';
import EstatisticaAvancada from './sections/EstatisticaAvancada';
import GaleriaCientifica from './sections/GaleriaCientifica';
import ConclusaoAssinatura from './sections/ConclusaoAssinatura';
import InteligenciaAgronomicaPanel from '@/components/InteligenciaAgronomicaPanel';

type Props = {
    relatorio: ResearchProReportPayload;
    reportId: string;
    shareToken?: string;
};

export default function RelatorioResearchProContent({ relatorio, reportId, shareToken }: Props) {
    // Verificacao de fallback, se o relatorio nao vier preenchido
    if (!relatorio || !relatorio.core) {
        return <div className="p-10 text-center text-red-500">Relatório vazio ou formato inválido.</div>;
    }

    const cab = relatorio.cabecalho;
    const core = relatorio.core;

    const handleShare = useCallback(async () => {
        const url = typeof window !== 'undefined' ? window.location.href : '';
        const fire = () => {
            if (shareToken?.trim()) {
                void postReportAnalytics({
                    shareToken: shareToken.trim(),
                    eventType: 'share',
                    module: 'RESEARCH_PRO',
                });
            }
        };
        try {
            if (navigator.share && url) {
                await navigator.share({
                    title: `FortSmart Research Pro — ${cab.empresa}`,
                    text: `${cab.fazenda} · ${core.report_id}`,
                    url,
                });
                fire();
                return;
            }
        } catch {
            /* cancelado */
        }
        try {
            if (url && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(url);
                fire();
            }
        } catch {
            /* ignore */
        }
    }, [shareToken, cab.empresa, cab.fazenda, core.report_id]);

    const handleExportPdf = useCallback(async () => {
        const el = document.getElementById('relatorio-research-pro-content');
        if (!el) return;
        document.body.classList.add('exporting-pdf');
        const safeId = String(core.report_id ?? reportId ?? 'report').replace(/\s/g, '_');
        try {
            const { default: html2pdf } = await import('html2pdf.js');
            await html2pdf()
                .set({
                    margin: [10, 10, 10, 10],
                    filename: `FortSmart_ResearchPro_${safeId}.pdf`,
                    image: { type: 'jpeg', quality: 0.95 },
                    html2canvas: { scale: 2, useCORS: true, logging: false },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                })
                .from(el)
                .save();
            if (shareToken?.trim()) {
                void postReportAnalytics({
                    shareToken: shareToken.trim(),
                    eventType: 'download',
                    module: 'RESEARCH_PRO',
                });
            }
        } finally {
            document.body.classList.remove('exporting-pdf');
        }
    }, [shareToken, core.report_id, reportId]);

    return (
        <div id="relatorio-research-pro-content" className="flex bg-[#F1F5F9] min-h-screen font-sans text-gray-800">

            {/* Sidebar - Fixo na lateral esquerda (escondido no mobile) */}
            <SidebarMenu />

            {/* Conteudo Principal */}
            <main className="flex-1 lg:ml-[260px] p-4 lg:p-8 max-w-[1200px] overflow-hidden">

                <InteligenciaAgronomicaPanel
                    relatorio={relatorio as unknown as Record<string, unknown>}
                    variant="default"
                />

                <div id="visao-geral" className="scroll-mt-6">
                    <HeaderExecutivo
                        data={relatorio.cabecalho}
                        core={relatorio.core}
                        onShare={handleShare}
                        onExportPdf={handleExportPdf}
                    />
                </div>

                <section id="resumo" className="mt-8 scroll-mt-6">
                    <DashboardResumo data={relatorio.resumo_executivo} />
                </section>

                <section id="ambiente" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Condições Ambientais</h2>
                    <CondicoesAmbientais data={relatorio.ambiente} />
                </section>

                <section id="delineamento" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Delineamento Experimental</h2>
                    <DelineamentoExperimental data={relatorio.delineamento} />
                </section>

                <section id="croqui" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Croqui Experimental</h2>
                    <CroquiExperimental data={relatorio.croqui} programas={relatorio.programas_manejo} />
                </section>

                <section id="tratamentos" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Programas de Manejo (Tratamentos)</h2>
                    <QuadroManejoProgramas relatorio={relatorio} />
                </section>

                <section id="aplicacoes" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Aplicações Realizadas</h2>
                    <HistoricoAplicacoes programas={relatorio.programas_manejo} />
                </section>

                <section id="avaliacoes" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Avaliações Técnicas em Campo</h2>
                    <AvaliacoesTecnicas data={relatorio.avaliacoes} />
                </section>

                <section id="diagnostico-parcela" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Diagnóstico agronômico (parcela)</h2>
                    <DiagnosticoParcelaCampo itens={relatorio.diagnosticos_parcela ?? []} />
                </section>

                <section id="estatistica" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Estatística Avançada (ANOVA & Tukey)</h2>
                    <EstatisticaAvancada data={relatorio.estatistica} />
                </section>

                <section id="galeria" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Galeria Fotográfica</h2>
                    <GaleriaCientifica data={relatorio.galeria} />
                </section>

                <section id="conclusao" className="mt-8 mb-20 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Conclusão e Parecer Técnico</h2>
                    <ConclusaoAssinatura conclusao={relatorio.conclusao} assinatura={relatorio.assinatura} />
                </section>

            </main>
        </div>
    );
}
