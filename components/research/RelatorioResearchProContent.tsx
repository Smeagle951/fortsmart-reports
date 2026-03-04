'use client';

import React, { useState } from 'react';
import { ResearchProReportPayload } from '../../types/research-report';
import SidebarMenu from './SidebarMenu';

// Secoes (Componentes)
import HeaderExecutivo from './sections/HeaderExecutivo';
import DashboardResumo from './sections/DashboardResumo';
import CondicoesAmbientais from './sections/CondicoesAmbientais';
import DelineamentoExperimental from './sections/DelineamentoExperimental';
import CroquiExperimental from './sections/CroquiExperimental';
import ListaTratamentos from './sections/ListaTratamentos';
import HistoricoAplicacoes from './sections/HistoricoAplicacoes';
import AvaliacoesTecnicas from './sections/AvaliacoesTecnicas';
import EstatisticaAvancada from './sections/EstatisticaAvancada';
import GaleriaCientifica from './sections/GaleriaCientifica';
import ConclusaoAssinatura from './sections/ConclusaoAssinatura';

type Props = {
    relatorio: ResearchProReportPayload;
    reportId: string;
};

export default function RelatorioResearchProContent({ relatorio, reportId }: Props) {
    // Verificacao de fallback, se o relatorio nao vier preenchido
    if (!relatorio || !relatorio.core) {
        return <div className="p-10 text-center text-red-500">Relatório vazio ou formato inválido.</div>;
    }

    return (
        <div className="flex bg-[#F1F5F9] min-h-screen font-sans text-gray-800">

            {/* Sidebar - Fixo na lateral esquerda (escondido no mobile) */}
            <SidebarMenu />

            {/* Conteudo Principal */}
            <main className="flex-1 lg:ml-[260px] p-4 lg:p-8 max-w-[1200px] overflow-hidden">

                <div id="visao-geral" className="scroll-mt-6">
                    <HeaderExecutivo data={relatorio.cabecalho} core={relatorio.core} />
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
                    <ListaTratamentos data={relatorio.programas_manejo} />
                </section>

                <section id="aplicacoes" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Aplicações Realizadas</h2>
                    <HistoricoAplicacoes programas={relatorio.programas_manejo} />
                </section>

                <section id="avaliacoes" className="mt-8 scroll-mt-6">
                    <h2 className="text-xl font-bold text-[#0D2438] mb-4">Avaliações Técnicas em Campo</h2>
                    <AvaliacoesTecnicas data={relatorio.avaliacoes} />
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
