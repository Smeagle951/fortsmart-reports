'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

/** Painel sobre o mapa (resumo, relatórios, placeholders) — não substitui a barra lateral. */
export function DashboardNavOverlay({ title, children, onClose }: Props) {
  return (
    <div
      className="absolute inset-0 z-[1050] flex flex-col overflow-hidden bg-slate-100/97 backdrop-blur-[2px] print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-nav-overlay-title"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <h2 id="dashboard-nav-overlay-title" className="font-['Poppins',system-ui,sans-serif] text-base font-bold text-slate-900">
          {title}
        </h2>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Fechar painel">
          <X className="h-5 w-5" />
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
    </div>
  );
}
