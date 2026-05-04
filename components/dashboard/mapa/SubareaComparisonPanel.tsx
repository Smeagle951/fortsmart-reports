'use client';

import type { FeatureCollection } from 'geojson';
import { FlaskConical, Trophy } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEVERITY_BADGE_CLASS } from '@/lib/dashboard-mapa/constants';
import type { DashboardMonitorEvent, MonitorEventSeverity } from '@/lib/dashboard-mapa/types';
import { cn } from '@/lib/utils';

function asText(v: unknown): string | null {
  const s = v == null ? '' : String(v).trim();
  return s || null;
}

function asNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function rankSeverity(s: MonitorEventSeverity | null): number {
  if (s === 'alto') return 3;
  if (s === 'medio') return 2;
  if (s === 'baixo') return 1;
  return 0;
}

function severityLabel(s: MonitorEventSeverity | null): string {
  if (s === 'alto') return 'ALTO';
  if (s === 'medio') return 'MÉDIO';
  if (s === 'baixo') return 'BAIXO';
  return 'NORMAL';
}

type Row = {
  id: string;
  nome: string;
  tipo: string;
  areaHa: number | null;
  cultura: string;
  material: string;
  estande: number | null;
  eventsCount: number;
  maxSeverity: MonitorEventSeverity | null;
  lastMonitoramento: string | null;
  produtividade: number | null;
  custoHa: number | null;
};

function rowsFromFeatureCollection(fc: FeatureCollection | null, events: DashboardMonitorEvent[]): Row[] {
  const subareas = (fc?.features ?? []).filter((feature) => {
    const p = (feature.properties as Record<string, unknown> | null | undefined) ?? {};
    return String(p.tipo ?? '').toLowerCase() === 'subarea' || !!asText(p.subarea) || !!asText(p.subtipo);
  });

  return subareas.map((feature, index) => {
    const p = (feature.properties as Record<string, unknown> | null | undefined) ?? {};
    const talhao = asText(p.talhao) ?? 'Talhão';
    const nome = asText(p.subarea) ?? asText(p.nome_subarea) ?? asText(p.subtipo) ?? `Subárea ${index + 1}`;
    const matched = events.filter((event) => {
      const hay = `${event.talhaoLabel} ${event.areaLabel ?? ''}`.toLowerCase();
      return hay.includes(talhao.toLowerCase()) || hay.includes(nome.toLowerCase());
    });
    const maxSeverity = matched.reduce<MonitorEventSeverity | null>(
      (current, event) => (rankSeverity(event.severity) > rankSeverity(current) ? event.severity : current),
      null,
    );

    return {
      id: `${asText(p.talhao_id) ?? talhao}-${nome}-${index}`,
      nome,
      tipo: asText(p.subtipo) ?? asText(p.tipo_subarea) ?? 'Tratamento',
      areaHa: asNumber(p.area_ha ?? p.areaHa),
      cultura: asText(p.cultura) ?? '—',
      material: asText(p.material ?? p.hibrido ?? p.variedade) ?? '—',
      estande: asNumber(p.estande_pl_ha ?? p.plantas_por_ha ?? p.populacao_estande),
      eventsCount: matched.length,
      maxSeverity,
      lastMonitoramento: matched.sort((a, b) => b.dateIso.localeCompare(a.dateIso))[0]?.dateIso ?? null,
      produtividade: asNumber(p.produtividade_estimada ?? p.produtividade ?? p.yield_estimated),
      custoHa: asNumber(p.custo_ha ?? p.custoHa ?? p.cost_ha),
    };
  });
}

type Props = {
  featureCollection: FeatureCollection | null;
  events: DashboardMonitorEvent[];
  compact?: boolean;
};

export function SubareaComparisonPanel({ featureCollection, events, compact = false }: Props) {
  const rows = rowsFromFeatureCollection(featureCollection, events);
  const best = [...rows].sort((a, b) => {
    if (a.produtividade && b.produtividade && a.produtividade !== b.produtividade) return b.produtividade - a.produtividade;
    return rankSeverity(a.maxSeverity) - rankSeverity(b.maxSeverity);
  })[0];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <FlaskConical className="h-4 w-4 text-emerald-700" />
          Comparativo de subáreas
        </CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length ? (
          <div className={cn('grid gap-3', compact ? 'md:grid-cols-2' : 'lg:grid-cols-2 xl:grid-cols-3')}>
            {rows.map((row) => {
              const isBest = best?.id === row.id;
              const needsAttention = row.maxSeverity === 'alto';
              return (
                <div key={row.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-950">{row.nome}</p>
                      <p className="text-xs text-slate-500">{row.tipo}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-1">
                      <Badge variant="outline" className="rounded-full bg-white text-[10px]">
                        {row.tipo.toLowerCase().includes('exper') ? 'Experimento' : 'Tratamento'}
                      </Badge>
                      {isBest ? (
                        <Badge className="rounded-full bg-emerald-700 text-[10px]">
                          <Trophy className="mr-1 h-3 w-3" />
                          Melhor resposta
                        </Badge>
                      ) : null}
                      {needsAttention ? <Badge variant="destructive" className="rounded-full text-[10px]">Atenção</Badge> : null}
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                    <div><dt className="text-slate-500">Área</dt><dd className="font-semibold">{row.areaHa ? `${row.areaHa.toLocaleString('pt-BR')} ha` : '—'}</dd></div>
                    <div><dt className="text-slate-500">Cultura</dt><dd className="font-semibold">{row.cultura}</dd></div>
                    <div className="col-span-2"><dt className="text-slate-500">Híbrido/material</dt><dd className="truncate font-semibold">{row.material}</dd></div>
                    <div><dt className="text-slate-500">Estande</dt><dd className="font-semibold">{row.estande ? `${row.estande.toLocaleString('pt-BR')} pl/ha` : '—'}</dd></div>
                    <div><dt className="text-slate-500">Eventos</dt><dd className="font-semibold">{row.eventsCount}</dd></div>
                    <div><dt className="text-slate-500">Severidade máx.</dt><dd><Badge variant="outline" className={cn('rounded-full text-[10px]', SEVERITY_BADGE_CLASS[row.maxSeverity ?? 'normal'])}>{severityLabel(row.maxSeverity)}</Badge></dd></div>
                    <div><dt className="text-slate-500">Último monit.</dt><dd className="font-semibold">{row.lastMonitoramento ? new Date(`${row.lastMonitoramento}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</dd></div>
                  </dl>
                  {!row.produtividade || !row.custoHa ? (
                    <p className="mt-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-500">
                      Dados econômicos ainda não carregados.
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
            Nenhuma subárea experimental encontrada no GeoJSON ou no bundle carregado.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
