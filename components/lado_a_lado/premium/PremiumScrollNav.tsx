'use client';

import React, { useEffect, useState } from 'react';

const LINKS = [
  { id: 'premium-hero', label: 'Topo' },
  { id: 'premium-timeline', label: 'Tempo' },
  { id: 'premium-comparativo', label: 'A × B' },
  { id: 'premium-insight', label: 'Insight' },
  { id: 'premium-evolucao', label: 'Evolução' },
  { id: 'premium-protocolo-tratamento', label: 'Protocolo' },
  { id: 'premium-aplicacoes', label: 'Aplicações' },
  { id: 'premium-fito', label: 'Fito' },
  { id: 'premium-fotos', label: 'Fotos' },
  { id: 'premium-diagnostico', label: 'Dx' },
  { id: 'premium-economico', label: 'Econ.' },
  { id: 'premium-produtos-ensaio', label: 'Produtos' },
  { id: 'premium-resumo', label: 'Resumo' },
];

export default function PremiumScrollNav() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          const idx = LINKS.findIndex((l) => l.id === visible.target.id);
          if (idx >= 0) setActive(idx);
        }
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.25, 0.5] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 print:hidden border-t border-slate-200/90 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-pb"
      aria-label="Navegação do relatório"
    >
      <div className="max-w-7xl mx-auto px-2 py-2 flex gap-1 overflow-x-auto scrollbar-thin items-center justify-start sm:justify-center">
        {LINKS.map((l, i) => (
          <button
            key={l.id}
            type="button"
            onClick={() => scrollTo(l.id)}
            className={`shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium transition-colors ${
              i === active ? 'bg-sky-700 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
