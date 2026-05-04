'use client';

import {
  Activity,
  FileText,
  LayoutDashboard,
  Leaf,
  Map,
  Package,
  PanelLeftClose,
  PanelLeft,
  Settings,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';

import { COLORS } from '@/lib/dashboard-mapa/constants';
import { cn } from '@/lib/utils';

import type { DashboardNavId } from '@/lib/dashboard-mapa/types';
import type { PropertyAlert, PropertySummary } from '@/lib/dashboard-mapa/types';

import { PropertySummaryCard } from './PropertySummaryCard';

const NAV: { id: DashboardNavId; label: string; icon: typeof Map }[] = [
  { id: 'resumo', label: 'Resumo geral', icon: LayoutDashboard },
  { id: 'talhoes', label: 'Talhões', icon: Map },
  { id: 'monitoramento', label: 'Monitoramento', icon: Activity },
  { id: 'atividades', label: 'Atividades', icon: ClipboardList },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'insumos', label: 'Insumos', icon: Package },
  { id: 'config', label: 'Configurações', icon: Settings },
];

type Props = {
  activeNav: DashboardNavId;
  onNav: (id: DashboardNavId) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  summary: PropertySummary;
  alerts: PropertyAlert[];
  classicMapHref: string;
  fazendaNome?: string | null;
  usuarioNome?: string | null;
};

export function SidebarFarm({
  activeNav,
  onNav,
  collapsed,
  onToggleCollapsed,
  summary,
  alerts,
  classicMapHref,
  fazendaNome,
  usuarioNome,
}: Props) {
  return (
    <>
      <aside
        className={cn(
          'flex shrink-0 flex-col overflow-hidden text-white shadow-xl transition-[width] duration-200 ease-out',
          collapsed ? 'w-0 min-w-0 opacity-0 lg:w-0' : 'w-[260px] opacity-100',
        )}
        style={{
          background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
        }}
      >
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
              <Leaf className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="font-['Poppins',system-ui,sans-serif] text-sm font-bold tracking-tight">FortSmart</p>
              <p className="truncate text-[10px] text-emerald-200/90" title={fazendaNome ?? undefined}>
                {fazendaNome?.trim() ? fazendaNome : 'Agronegócio'}
              </p>
              {usuarioNome?.trim() ? (
                <p className="truncate text-[9px] text-emerald-200/60" title={usuarioNome}>
                  {usuarioNome}
                </p>
              ) : null}
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="shrink-0 rounded-lg p-2 text-emerald-100 hover:bg-white/10 hover:text-white"
            title="Recolher menu"
            aria-label="Recolher menu lateral"
          >
            <PanelLeftClose className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = item.id === activeNav;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNav(item.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  active
                    ? 'bg-white/12 font-medium text-white'
                    : 'text-emerald-100/75 hover:bg-white/5 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <PropertySummaryCard summary={summary} alerts={alerts} />

          <Link
            href={classicMapHref}
            className="mt-3 block rounded-lg border border-white/20 bg-white/5 px-3 py-2 text-center text-xs font-medium text-emerald-100 hover:bg-white/10"
          >
            Mapa clássico (GeoJSON + calculadora)
          </Link>
        </div>
      </aside>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="fixed left-2 top-[4.5rem] z-[1200] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-md print:hidden hover:bg-slate-50"
          title="Abrir menu"
          aria-label="Abrir menu lateral"
        >
          <PanelLeft className="h-5 w-5 text-slate-700" />
        </button>
      ) : null}
    </>
  );
}
