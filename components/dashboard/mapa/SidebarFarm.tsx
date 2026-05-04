'use client';

import {
  Activity,
  CloudSun,
  FileText,
  LayoutDashboard,
  Leaf,
  Map,
  Package,
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
  { id: 'clima', label: 'Clima', icon: CloudSun },
  { id: 'config', label: 'Configurações', icon: Settings },
];

type Props = {
  activeNav: DashboardNavId;
  summary: PropertySummary;
  alerts: PropertyAlert[];
  classicMapHref: string;
  /** Nome da fazenda (perfil / payload do relatório) */
  fazendaNome?: string | null;
  /** Nome do utilizador responsável (perfil / payload) */
  usuarioNome?: string | null;
};

export function SidebarFarm({
  activeNav,
  summary,
  alerts,
  classicMapHref,
  fazendaNome,
  usuarioNome,
}: Props) {
  return (
    <aside
      className="flex w-[260px] shrink-0 flex-col text-white shadow-xl"
      style={{ background: `linear-gradient(180deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)` }}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300">
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

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeNav;
          return (
            <button
              key={item.id}
              type="button"
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
  );
}
