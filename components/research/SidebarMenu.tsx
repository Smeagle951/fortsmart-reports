import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Grid, Beaker, CalendarClock, Activity, BarChart, Image as ImageIcon, FileText, PenTool } from 'lucide-react';

const MENU_ITEMS = [
    { id: 'visao-geral', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'croqui', label: 'Croqui Experimental', icon: Grid },
    { id: 'tratamentos', label: 'Programas de Manejo', icon: Beaker },
    { id: 'aplicacoes', label: 'Aplicações Realizadas', icon: CalendarClock },
    { id: 'avaliacoes', label: 'Avaliações Técnicas', icon: Activity },
    { id: 'estatistica', label: 'Estatística Avançada', icon: BarChart },
    { id: 'galeria', label: 'Galeria Fotográfica', icon: ImageIcon },
    { id: 'conclusao', label: 'Conclusão Técnica', icon: FileText },
];

export default function SidebarMenu() {
    const [activeId, setActiveId] = useState('');

    // Rastreia o scroll para ativar o menu correspondente
    useEffect(() => {
        const handleScroll = () => {
            let currentId = '';
            const offset = window.scrollY + 100;

            for (const item of [...MENU_ITEMS, { id: 'resumo' }, { id: 'ambiente' }, { id: 'delineamento' }]) {
                const element = document.getElementById(item.id);
                if (element) {
                    const { top, bottom } = element.getBoundingClientRect();
                    const elemTop = top + window.scrollY;
                    if (offset >= elemTop && offset < elemTop + element.offsetHeight + 100) {
                        currentId = item.id;
                    }
                }
            }

            if (currentId && currentId !== activeId) {
                if (['resumo', 'ambiente', 'delineamento'].includes(currentId)) {
                    setActiveId('visao-geral');
                } else {
                    setActiveId(currentId);
                }
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        handleScroll(); // Verifica no primeiro load
        return () => window.removeEventListener('scroll', handleScroll);
    }, [activeId]);

    const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
        e.preventDefault();
        const element = document.getElementById(id);
        if (element) {
            const top = element.getBoundingClientRect().top + window.scrollY - 30;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <aside className="hidden lg:flex flex-col w-[260px] h-screen bg-white shadow-xl fixed left-0 top-0 pt-8 pb-4">
            {/* Logo Placeholder */}
            <div className="px-6 mb-8">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">FS</span>
                    </div>
                    <span className="font-bold text-gray-800 text-lg">FortSmart<br /><span className="text-sm font-normal text-gray-500">Research Pro</span></span>
                </div>
            </div>

            {/* Nav Menu */}
            <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 px-2">Sumário Executivo</div>

                {MENU_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeId === item.id;

                    return (
                        <a
                            key={item.id}
                            href={`#${item.id}`}
                            onClick={(e) => scrollToSection(e, item.id)}
                            className={`
                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200
                ${isActive
                                    ? 'bg-blue-50 text-blue-700 font-medium'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
                        >
                            <Icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400'} />
                            <span>{item.label}</span>
                            {isActive && (
                                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                            )}
                        </a>
                    );
                })}
            </nav>

            {/* Assinatura */}
            <div className="mt-auto px-6 border-t border-gray-100 pt-4">
                <a
                    href="#conclusao"
                    onClick={(e) => scrollToSection(e, 'conclusao')}
                    className="flex items-center gap-3 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <PenTool size={14} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-gray-700">Assinar Relatório</span>
                        <span className="text-xs">Responsável Técnico</span>
                    </div>
                </a>
            </div>
        </aside>
    );
}
