'use client';

import { Bell, ChevronDown, CloudUpload, HelpCircle, Leaf, Menu, Share2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

import type { PropertyAlert } from '@/lib/dashboard-mapa/types';

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
  onShare: () => void | Promise<void>;
  onUpload: () => void;
  notificationsTitle?: string;
  alerts?: PropertyAlert[];
};

export function DashboardMapHeader({
  safraBadge,
  fazendaNome,
  usuarioNome,
  tecnicoNome,
  notificationCount = 0,
  onShare,
  onUpload,
  notificationsTitle,
  alerts = [],
}: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  const displayName = usuarioNome?.trim() || tecnicoNome?.trim() || '—';
  const roleLabel = tecnicoNome?.trim()
    ? usuarioNome?.trim() && usuarioNome.trim() !== tecnicoNome.trim()
      ? `Téc.: ${tecnicoNome}`
      : 'Técnico'
    : 'Perfil';
  const fazendaLine = fazendaNome?.trim() || '— (use o link com dados do relatório ou ?token=)';

  return (
    <header className="grid h-[72px] shrink-0 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-slate-200 bg-white px-5 shadow-sm">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <Leaf className="h-6 w-6" />
          </span>
          <span className="font-['Poppins',system-ui,sans-serif] text-2xl font-extrabold text-slate-950">FortSmart</span>
        </div>
        <button type="button" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100" aria-label="Menu">
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden min-w-0 items-center gap-4 md:flex">
          <h1 className="truncate font-['Poppins',system-ui,sans-serif] text-lg font-bold text-slate-950">
            Relatório de Talhões
          </h1>
          <span className="shrink-0 rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-900">
          Safra {safraBadge}
          </span>
        </div>
      </div>

      <div className="hidden justify-center lg:flex">
        <button type="button" className="flex min-w-[240px] items-center justify-between gap-4 border-x border-slate-200 px-5 py-2 text-left">
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold text-slate-950">{fazendaLine}</span>
            <span className="block truncate text-xs text-slate-500">120,5 ha · Sorriso/MT</span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </button>
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
          title="Enviar / abrir app para carregar dados"
          aria-label="Enviar dados"
          onClick={onUpload}
        >
          <CloudUpload className="h-5 w-5" />
          <span className="hidden text-[10px] font-medium lg:block">Enviar para app</span>
        </button>
        <button
          type="button"
          className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
          title="Copiar link desta página"
          aria-label="Partilhar — copiar link"
          onClick={() => void onShare()}
        >
          <Share2 className="h-5 w-5" />
          <span className="hidden text-[10px] font-medium lg:block">Compartilhar</span>
        </button>
        <Sheet open={helpOpen} onOpenChange={setHelpOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
              title="Ajuda"
              aria-label="Ajuda"
            >
              <HelpCircle className="h-5 w-5" />
              <span className="hidden text-[10px] font-medium lg:block">Ajuda</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,380px)] sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Ajuda — Mapa de talhões</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <p>
                <strong>Monitoramento e linha do tempo</strong> usam o mesmo payload do{' '}
                <strong>relatório agronómico</strong> publicado na app. Abra esta página com{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">?token=…</code> (o token do «Ver relatório web»).
              </p>
              <p>
                <strong>Plantio / polígonos</strong> podem vir de <code className="rounded bg-slate-100 px-1 text-xs">?file=</code>,{' '}
                <code className="rounded bg-slate-100 px-1 text-xs">?id=</code> ou <code className="rounded bg-slate-100 px-1 text-xs">?source=api</code>{' '}
                — igual ao mapa clássico.
              </p>
              <p>
                Use <strong>Filtros</strong> (botão no mapa) para safra, cultura e modo de visualização. A camada «Eventos»
                na legenda liga ou desliga os pins de monitoramento.
              </p>
            </div>
          </SheetContent>
        </Sheet>
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="relative flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-slate-700 hover:bg-slate-100"
              title={notificationsTitle ?? 'Alertas derivados do relatório'}
              aria-label="Notificações e alertas"
            >
              <Bell className="h-5 w-5" />
              <span className="hidden text-[10px] font-medium lg:block">Notificações</span>
              {notificationCount > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              ) : null}
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100%,380px)] sm:max-w-md">
            <SheetHeader>
              <SheetTitle>Alertas ({notificationCount})</SheetTitle>
            </SheetHeader>
            <p className="mt-3 text-sm text-slate-600">
              Os alertas listados abaixo vêm do resumo do relatório (pragas/doenças). Sem{' '}
              <code className="rounded bg-slate-100 px-1 text-xs">?token=</code> pode não haver dados de monitoramento.
            </p>
            {alerts.length > 0 ? (
              <ul className="mt-4 max-h-[45vh] space-y-2 overflow-y-auto text-sm">
                {alerts.map((a) => (
                  <li
                    key={a.id}
                    className={cn(
                      'rounded-lg border px-3 py-2',
                      a.tone === 'danger' && 'border-red-200 bg-red-50 text-red-950',
                      a.tone === 'warning' && 'border-amber-200 bg-amber-50 text-amber-950',
                      a.tone === 'info' && 'border-sky-200 bg-sky-50 text-sky-950',
                    )}
                  >
                    <p className="font-medium">{a.message}</p>
                    <p className="text-xs opacity-80">{a.talhaoLabel}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Sem alertas neste relatório ou vista atual.</p>
            )}
            <Button type="button" variant="outline" className="mt-4 w-full" onClick={() => void onShare()}>
              Copiar link desta página
            </Button>
          </SheetContent>
        </Sheet>
        <div className="ml-2 hidden items-center gap-3 border-l border-slate-200 pl-4 sm:flex">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white"
            aria-hidden
          >
            {initialsFromName(displayName === '—' ? '?' : displayName)}
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
