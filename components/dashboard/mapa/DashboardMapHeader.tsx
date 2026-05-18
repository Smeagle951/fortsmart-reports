'use client';

import { Bell, CloudUpload, HelpCircle, Share2 } from 'lucide-react';

function initialsFromName(name: string): string {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return `${p[0][0] ?? ''}${p[p.length - 1][0] ?? ''}`.toUpperCase() || '?';
}

type Props = {
  safraBadge: string;
  fazendaNome?: string | null;
  usuarioNome?: string | null;
  tecnicoNome?: string | null;
  notificationCount?: number;
};

export function DashboardMapHeader({
  safraBadge,
  fazendaNome,
  usuarioNome,
  tecnicoNome,
  notificationCount = 0,
}: Props) {
  const displayName = usuarioNome?.trim() || tecnicoNome?.trim() || 'Utilizador';
  const roleLabel = tecnicoNome?.trim()
    ? usuarioNome?.trim() && usuarioNome.trim() !== tecnicoNome.trim()
      ? `Téc.: ${tecnicoNome}`
      : 'Técnico'
    : 'Perfil';

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 bg-white px-4 py-2 shadow-sm">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0">
          <h1 className="truncate font-['Poppins',system-ui,sans-serif] text-lg font-bold text-slate-900">
            Mapa de talhões
          </h1>
          {fazendaNome?.trim() ? (
            <p className="truncate text-xs text-slate-600" title={fazendaNome}>
              {fazendaNome}
            </p>
          ) : null}
        </div>
        <span className="shrink-0 self-start rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-900 sm:self-center">
          Safra {safraBadge}
        </span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Enviar dados"
          aria-label="Enviar dados"
        >
          <CloudUpload className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Partilhar"
          aria-label="Partilhar"
        >
          <Share2 className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Ajuda"
          aria-label="Ajuda"
        >
          <HelpCircle className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          title="Notificações"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {notificationCount > 0 ? (
            <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          ) : null}
        </button>
        <div className="ml-1 hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 sm:flex">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white"
            aria-hidden
          >
            {initialsFromName(displayName)}
          </div>
          <div className="min-w-0 text-left leading-tight">
            <p className="truncate text-xs font-semibold text-slate-900">{displayName}</p>
            <p className="truncate text-[10px] text-slate-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
