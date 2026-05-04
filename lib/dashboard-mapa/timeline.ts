import type { FeatureCollection } from 'geojson';

import type { DashboardMonitorEvent, DashboardTimelineEvent, MonitorEventSeverity } from './types';

function asText(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function asDateIso(v: unknown): string | null {
  const s = asText(v);
  if (!s) return null;
  const d = new Date(s.length <= 10 ? `${s}T12:00:00` : s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function eventStatus(severity?: MonitorEventSeverity): string | undefined {
  if (!severity) return undefined;
  if (severity === 'alto') return 'ALTO';
  if (severity === 'medio') return 'MÉDIO';
  if (severity === 'normal') return 'NORMAL';
  return 'BAIXO';
}

function featureLabel(p: Record<string, unknown>): string {
  return asText(p.talhao) || asText(p.nome) || asText(p.name) || asText(p.talhao_id) || 'Talhão';
}

export function buildOperationalTimeline(params: {
  events: DashboardMonitorEvent[];
  featureCollection?: FeatureCollection | null;
}): DashboardTimelineEvent[] {
  const items: DashboardTimelineEvent[] = params.events.map((event) => ({
    id: `timeline-${event.id}`,
    sourceEventId: event.id,
    type: 'monitoramento',
    dateIso: event.dateIso,
    talhaoLabel: event.talhaoLabel,
    areaLabel: event.areaLabel,
    title: event.title,
    description: event.observation || 'Monitoramento registrado no relatório.',
    severity: event.severity,
    status: eventStatus(event.severity),
    imageUrl: event.imageUrl,
  }));

  for (const [index, feature] of (params.featureCollection?.features ?? []).entries()) {
    const p = (feature.properties as Record<string, unknown> | null | undefined) ?? {};
    const plantio = asDateIso(p.data_plantio ?? p.plantio ?? p.dataPlantio);
    if (plantio) {
      const material = asText(p.material) || asText(p.hibrido) || asText(p.variedade);
      items.push({
        id: `plantio-${asText(p.talhao_id) || index}-${plantio}`,
        type: 'plantio',
        dateIso: plantio,
        talhaoLabel: featureLabel(p),
        areaLabel: asText(p.subarea) || asText(p.subtipo) || undefined,
        title: 'Plantio',
        description: material ? `Plantio registrado com ${material}.` : 'Plantio registrado no GeoJSON.',
        status: 'PLANTIO',
      });
    }

    const imageUrl = asText(p.imageUrl ?? p.image_url ?? p.foto_url ?? p.thumbnail);
    const imageDate = asDateIso(p.imageDate ?? p.image_date ?? p.data_foto ?? p.data_plantio) ?? plantio;
    if (imageUrl && imageDate) {
      items.push({
        id: `foto-${asText(p.talhao_id) || index}-${imageDate}`,
        type: 'foto',
        dateIso: imageDate,
        talhaoLabel: featureLabel(p),
        areaLabel: asText(p.subarea) || asText(p.subtipo) || undefined,
        title: 'Imagem enviada',
        description: 'Imagem operacional vinculada ao talhão.',
        status: 'FOTO',
        imageUrl,
      });
    }
  }

  return items.sort((a, b) => b.dateIso.localeCompare(a.dateIso));
}
