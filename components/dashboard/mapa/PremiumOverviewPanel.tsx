'use client';

import type { FeatureCollection } from 'geojson';
import { Activity, AlertTriangle, Bug, CalendarClock, Leaf, MapPinned, Sprout } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SEVERITY_BADGE_CLASS } from '@/lib/dashboard-mapa/constants';
import type { DashboardMonitorEvent, PropertyAlert, PropertySummary } from '@/lib/dashboard-mapa/types';
import { cn } from '@/lib/utils';

import { SubareaComparisonPanel } from './SubareaComparisonPanel';

function asNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function asText(v: unknown): string | null {
  const s = v == null ? '' : String(v).trim();
  return s || null;
}

function daysAgo(dateIso: string): string {
  const eventDate = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(eventDate.getTime())) return dateIso;
  const diff = Math.max(0, Math.round((Date.now() - eventDate.getTime()) / 86_400_000));
  if (diff === 0) return 'hoje';
  if (diff === 1) return 'há 1 dia';
  return `há ${diff} dias`;
}

function severityLabel(s: DashboardMonitorEvent['severity']): string {
  if (s === 'alto') return 'ALTO';
  if (s === 'medio') return 'MÉDIO';
  if (s === 'normal') return 'NORMAL';
  return 'BAIXO';
}

function featureStats(fc: FeatureCollection | null | undefined) {
  const cultura = new Map<string, number>();
  const estandes: number[] = [];
  const daps: number[] = [];

  for (const feature of fc?.features ?? []) {
    const p = (feature.properties as Record<string, unknown> | null | undefined) ?? {};
    const c = asText(p.cultura);
    if (c && c !== '—') cultura.set(c, (cultura.get(c) ?? 0) + 1);
    const estande = asNumber(p.estande_pl_ha ?? p.plantas_por_ha ?? p.populacao_estande);
    if (estande) estandes.push(estande);
    const dap = asNumber(p.dap ?? p.dae);
    if (dap) daps.push(dap);
  }

  const mainCulture = Array.from(cultura.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const avg = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : null;

  return { mainCulture, avgStand: avg(estandes), avgDap: avg(daps) };
}

type Props = {
  summary: PropertySummary;
  alerts: PropertyAlert[];
  events: DashboardMonitorEvent[];
  featureCollection: FeatureCollection | null;
  hasMonitoramentoPayload: boolean;
};

export function PremiumOverviewPanel({
  summary,
  alerts,
  events,
  featureCollection,
  hasMonitoramentoPayload,
}: Props) {
  const stats = featureStats(featureCollection);
  const criticalAlerts = alerts.filter((alert) => alert.tone === 'danger').length;
  const lastEvents = [...events].sort((a, b) => b.dateIso.localeCompare(a.dateIso)).slice(0, 5);
  const kpis = [
    { label: 'Área total mapeada', value: `${summary.totalHa.toLocaleString('pt-BR')} ha`, icon: MapPinned },
    { label: 'Talhões', value: summary.talhaoCount.toLocaleString('pt-BR'), icon: Sprout },
    { label: 'Subáreas', value: summary.subareaCount.toLocaleString('pt-BR'), icon: Leaf },
    { label: 'Eventos 7 dias', value: summary.eventsLast7Days.toLocaleString('pt-BR'), icon: CalendarClock },
    { label: 'Alertas críticos', value: criticalAlerts.toLocaleString('pt-BR'), icon: AlertTriangle },
    { label: 'Cultura principal', value: stats.mainCulture, icon: Leaf },
    {
      label: 'Estande médio',
      value: stats.avgStand ? `${stats.avgStand.toLocaleString('pt-BR')} pl/ha` : '—',
      icon: Activity,
    },
    { label: 'DAP médio', value: stats.avgDap ? `${stats.avgDap} dias` : '—', icon: Sprout },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((item) => (
          <Card key={item.label} className="rounded-2xl border-slate-200 bg-white shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                <item.icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">{item.label}</p>
                <p className="truncate text-lg font-bold text-slate-950">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
        <SubareaComparisonPanel featureCollection={featureCollection} events={events} compact />

        <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bug className="h-4 w-4 text-emerald-700" />
              Últimos eventos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastEvents.length ? (
              lastEvents.map((event, index) => (
                <div key={event.id}>
                  {index > 0 ? <Separator className="mb-3" /> : null}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {event.title} — {event.talhaoLabel}
                        {event.areaLabel ? `/${event.areaLabel}` : ''}
                      </p>
                      <p className="text-xs text-slate-500">{daysAgo(event.dateIso)}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('shrink-0 rounded-full text-[10px] font-bold', SEVERITY_BADGE_CLASS[event.severity])}
                    >
                      {severityLabel(event.severity)}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
                {hasMonitoramentoPayload
                  ? 'Nenhum evento de monitoramento carregado neste relatório.'
                  : 'Nenhum evento de monitoramento carregado. Abra o dashboard por `?token=` para visualizar monitoramento.'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
