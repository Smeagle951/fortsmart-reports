'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Clock3,
  CloudSun,
  Download,
  FileText,
  Leaf,
  MapPinned,
  Navigation,
  Printer,
  Share2,
  ShieldCheck,
  Sprout,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import MapaTalhaoClientMount from '@/components/visita_tecnica/MapaTalhaoClientMount';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import {
  buildExecutiveSummary,
  buildTechnicalConclusion,
  EMPTY_STATES,
  normalizeAgronomicAssessment,
} from '@/lib/technical-visit-report/technicalVisitReportNarratives';
import { formatCoordinate, formatVisitDate, normalizeTechnicalVisitReport } from '@/lib/technical-visit-report/technicalVisitReportMapper';
import type {
  TechnicalVisitDecisionChip,
  TechnicalVisitField,
  TechnicalVisitOccurrence,
  TechnicalVisitReport,
  TechnicalVisitTimelineItem,
} from '@/lib/technical-visit-report/technicalVisitReport.types';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

type Props = {
  relatorio: PayloadVisitaTecnica;
  reportId?: string;
  relatorioUuid?: string;
  shareToken?: string;
};

const chipTone: Record<TechnicalVisitDecisionChip['tone'], string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
};

const severityBorder = {
  low: 'border-l-emerald-500',
  medium: 'border-l-amber-500',
  high: 'border-l-orange-500',
  critical: 'border-l-red-600',
  unknown: 'border-l-slate-300',
};

const navItems: Array<[string, string, LucideIcon]> = [
  ['Resumo', '#resumo', Leaf],
  ['Decisão', '#decisao', CheckCircle2],
  ['Mapa', '#mapa', MapPinned],
  ['Ocorrências', '#ocorrencias', AlertTriangle],
  ['Evidências', '#fotos', Camera],
  ['Conclusão', '#conclusao', FileText],
];

function SectionShell({
  id,
  eyebrow,
  title,
  icon,
  children,
  full = false,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <section
      id={id}
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid md:p-5 ${full ? 'lg:col-span-12' : 'lg:col-span-6'}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-slate-700">{icon}</span>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</div>
          <h2 className="text-base font-bold tracking-tight text-slate-950 md:text-lg">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function CompactTable({ rows }: { rows: TechnicalVisitField[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-slate-100 last:border-0">
              <td className="w-[38%] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</td>
              <td className="px-3 py-2 font-medium text-slate-900">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusChip({ label, value, tone }: TechnicalVisitDecisionChip) {
  return (
    <div className={`rounded-lg border px-3 py-2.5 ${chipTone[tone]}`}>
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-70">{label}</div>
      <div className="mt-1 text-sm font-bold leading-snug">{value}</div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function TechnicalVisitReportHeader({ report, shareToken }: { report: TechnicalVisitReport; shareToken?: string }) {
  const reportUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : shareToken
        ? `https://fortsmartagro.com.br/r/${shareToken}`
        : 'https://fortsmartagro.com.br';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(reportUrl)}`;

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm print:break-inside-avoid md:p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <FortSmartLogo size={36} />
          <div>
            <div className="text-sm font-black text-slate-900">FortSmart Agro</div>
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Consultor Agronômico</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">ID do relatório</div>
            <div className="mt-0.5 break-all text-xs font-bold text-slate-800">{report.reportKey ?? '—'}</div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrUrl} alt="QR Code de validação" className="h-[72px] w-[72px] rounded-md border border-slate-200" />
        </div>
      </div>

      <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">{report.title}</h1>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-600">
        {report.visitDate && (
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={14} className="text-slate-400" />
            {formatVisitDate(report.visitDate)}
          </span>
        )}
        {report.technicianName && (
          <span className="inline-flex items-center gap-1.5">
            <UserRound size={14} className="text-slate-400" />
            {report.technicianName}
          </span>
        )}
        {report.technicianCrea && (
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-slate-400" />
            CREA {report.technicianCrea}
          </span>
        )}
        {report.status && (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-slate-400" />
            {report.status}
          </span>
        )}
        {report.seasonName && (
          <span className="inline-flex items-center gap-1.5">
            <Sprout size={14} className="text-slate-400" />
            Safra {report.seasonName}
          </span>
        )}
      </div>
    </header>
  );
}

function TechnicalVisitExecutiveCover({ report, assessment }: { report: TechnicalVisitReport; assessment: ReturnType<typeof normalizeAgronomicAssessment> }) {
  const coverItems = [
    { label: 'Fazenda', value: report.farmName },
    { label: 'Talhão', value: report.plotName },
    { label: 'Cultura', value: report.cropName },
    { label: 'Área monitorada', value: report.areaHa },
  ].filter((item) => item.value && item.value !== 'Não informado');

  return (
    <section className="relative overflow-hidden rounded-xl border border-slate-200 shadow-sm print:break-inside-avoid">
      {report.heroImage ? (
        <img src={report.heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-700 to-emerald-900" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/60 to-slate-950/30" />
      <div className="relative grid gap-4 p-5 md:grid-cols-[1fr_auto] md:p-6">
        <div className="space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">Capa executiva</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {coverItems.map((item) => (
              <div key={item.label} className="rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-300">{item.label}</div>
                <div className="mt-0.5 text-sm font-bold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-end">
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${chipTone[assessment.riskTone]}`}>
            Risco: {assessment.risk}
          </span>
          <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${chipTone[assessment.urgencyTone === 'danger' ? 'danger' : assessment.urgencyTone === 'warning' ? 'warning' : 'info']}`}>
            Urgência: {assessment.urgency}
          </span>
        </div>
      </div>
    </section>
  );
}

function TechnicalVisitDecisionPanel({ chips }: { chips: TechnicalVisitDecisionChip[] }) {
  const highlights = chips.slice(0, 8);
  const wide = chips.slice(8);
  return (
    <SectionShell id="decisao" eyebrow="Indicadores" title="Painel de decisão agronômica" icon={<CheckCircle2 size={18} />} full>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((chip) => (
          <StatusChip key={chip.label} {...chip} />
        ))}
      </div>
      {wide.length > 0 && (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {wide.map((chip) => (
            <StatusChip key={chip.label} {...chip} />
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitFieldConditions({ report }: { report: TechnicalVisitReport }) {
  const hasData = report.fieldConditionFields.length > 0;
  return (
    <SectionShell eyebrow="Ambiente" title="Condições de campo" icon={<CloudSun size={18} />} full>
      {hasData ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {report.fieldConditionFields.map((item) => (
            <InfoPill key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{EMPTY_STATES.fieldConditions}</p>
      )}
    </SectionShell>
  );
}

function TechnicalVisitHorizontalTimeline({ items }: { items: TechnicalVisitTimelineItem[] }) {
  if (items.length === 0) return null;
  return (
    <SectionShell eyebrow="Rastreabilidade" title="Linha do tempo da visita" icon={<CalendarDays size={18} />} full>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max items-start">
          {items.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex items-start">
              <div className="flex w-32 flex-col items-center px-1 text-center sm:w-36">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                  {index + 1}
                </div>
                <div className="mt-2 text-xs font-bold text-slate-900">{item.label}</div>
                <div className="mt-0.5 text-[10px] font-medium text-slate-500">{formatVisitDate(item.date) ?? item.date}</div>
                {item.detail && <div className="mt-0.5 text-[10px] text-slate-400">{item.detail}</div>}
              </div>
              {index < items.length - 1 && (
                <div className="mt-4 hidden h-0.5 w-8 shrink-0 bg-emerald-300 sm:block" aria-hidden />
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function TechnicalVisitMapSection({ report }: { report: TechnicalVisitReport }) {
  const hasMap = (report.polygon?.length ?? 0) >= 3 || report.points.length > 0;
  const legend = [
    { swatch: 'border-2 border-emerald-500 bg-emerald-500/20', label: 'Limite do talhão' },
    { swatch: 'bg-sky-500', label: 'Ponto monitorado' },
    { swatch: 'bg-amber-400', label: 'Atenção', shape: 'triangle' as const },
    { swatch: 'bg-red-500', label: 'Crítico' },
    { swatch: 'bg-slate-400', label: 'Sem ocorrência' },
  ];

  const mapPoints = report.points.map((p) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    title: p.title,
    description: p.description,
    type: p.type,
    severity: p.severity,
    severityTone: p.severityTone,
    data: p.date,
    imageUrl: p.imageUrl,
    recommendation: p.recommendation,
  }));

  return (
    <SectionShell id="mapa" eyebrow="GIS operacional" title="Mapa operacional da visita" icon={<MapPinned size={18} />} full>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600">
        {report.plotName !== 'Não informado' && <span>Talhão: {report.plotName}</span>}
        {report.areaHa && <span>Área: {report.areaHa}</span>}
        {report.visitDate && <span>Data: {formatVisitDate(report.visitDate)}</span>}
        <span>Pontos: {report.points.length}</span>
      </div>
      {hasMap ? (
        <div className="vt-operational-map overflow-hidden rounded-lg border border-slate-200 bg-slate-900 shadow-inner">
          <MapaTalhaoClientMount
            polygon={report.polygon}
            pontos={mapPoints}
            hideSectionTitle
            mapVariant="operational"
            plotLabel={{
              name: report.plotName !== 'Não informado' ? report.plotName : undefined,
              area: report.areaHa,
            }}
          />
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">{EMPTY_STATES.mapNoData}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
        {legend.map((item) => (
          <span key={item.label} className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
            {item.shape === 'triangle' ? (
              <span className="inline-block h-0 w-0 border-x-[5px] border-b-[9px] border-x-transparent border-b-amber-400" />
            ) : (
              <span className={`h-2.5 w-2.5 rounded-full ${item.swatch.includes('border') ? item.swatch : item.swatch}`} />
            )}
            {item.label}
          </span>
        ))}
      </div>
      {hasMap && report.points.length === 0 && (
        <p className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">{EMPTY_STATES.mapNoPoints}</p>
      )}
    </SectionShell>
  );
}

function TechnicalVisitOccurrences({ occurrences }: { occurrences: TechnicalVisitOccurrence[] }) {
  if (occurrences.length === 0) {
    return (
      <SectionShell id="ocorrencias" eyebrow="Fitossanidade" title="Registros técnicos" icon={<AlertTriangle size={18} />} full>
        <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{EMPTY_STATES.occurrences}</p>
      </SectionShell>
    );
  }
  return (
    <SectionShell id="ocorrencias" eyebrow="Fitossanidade" title="Registros técnicos" icon={<AlertTriangle size={18} />} full>
      <div className="space-y-3">
        {occurrences.map((occ, index) => (
          <article key={occ.id ?? `${occ.name}-${index}`} className={`rounded-lg border border-slate-200 border-l-4 bg-white p-4 ${severityBorder[occ.severityTone]}`}>
            <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Ocorrência {index + 1}
                  {occ.type ? ` — ${occ.type}` : ''}
                </div>
                <h3 className="mt-1 text-base font-bold text-slate-950">{occ.name}</h3>
                {occ.observation && <p className="mt-1 text-sm leading-relaxed text-slate-600">{occ.observation}</p>}
              </div>
              {occ.latitude != null && occ.longitude != null && (
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-500">
                  {formatCoordinate(occ.latitude, occ.longitude)}
                </div>
              )}
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {occ.severity && <InfoPill label="Severidade" value={occ.severity} />}
              {occ.incidence && <InfoPill label="Incidência" value={occ.incidence} />}
              {occ.status && <InfoPill label="Distribuição" value={occ.status} />}
              {occ.affectedArea && <InfoPill label="Área estimada" value={occ.affectedArea} />}
            </div>
            {occ.recommendation && (
              <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Recomendação vinculada</div>
                <p className="mt-1 text-sm font-medium text-emerald-950">{occ.recommendation}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function TechnicalVisitRecommendationsTable({ report }: { report: TechnicalVisitReport }) {
  const hasReal = report.recommendations.some((r) => !r.text.includes('Sem recomendação corretiva imediata'));
  return (
    <SectionShell eyebrow="Direcionamento" title="Recomendações técnicas" icon={<ShieldCheck size={18} />} full>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Recomendação</th>
              <th className="px-3 py-2">Prioridade</th>
              <th className="px-3 py-2">Prazo sugerido</th>
              <th className="px-3 py-2">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {report.recommendations.map((rec, index) => (
              <tr key={`${rec.text}-${index}`} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2.5 font-medium text-slate-900">{rec.text}</td>
                <td className="px-3 py-2.5 text-slate-600">{rec.priority ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{rec.deadline ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{rec.responsible ?? report.technicianName ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasReal && (
        <p className="mt-2 text-xs text-slate-500">Recomendação preventiva gerada com base na ausência de fatores críticos no momento da vistoria.</p>
      )}
    </SectionShell>
  );
}

function TechnicalVisitActionPlanTable({ report }: { report: TechnicalVisitReport }) {
  const hasRealPlan = report.actions.some((a) => !a.source?.includes('preventivo'));
  return (
    <SectionShell eyebrow="Execução" title="Plano de ação" icon={<ClipboardList size={18} />} full>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-bold uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2">Prioridade</th>
              <th className="px-3 py-2">Ação</th>
              <th className="px-3 py-2">Prazo</th>
              <th className="px-3 py-2">Responsável</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {report.actions.map((action, index) => (
              <tr key={`${action.action}-${index}`} className="border-b border-slate-100 last:border-0">
                <td className="px-3 py-2.5 font-medium text-slate-700">{action.priority ?? '—'}</td>
                <td className="px-3 py-2.5 font-medium text-slate-900">{action.action}</td>
                <td className="px-3 py-2.5 text-slate-600">{action.deadline ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{action.responsible ?? '—'}</td>
                <td className="px-3 py-2.5 text-slate-600">{action.status ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!hasRealPlan && (
        <p className="mt-2 text-xs leading-relaxed text-slate-500">{EMPTY_STATES.actionPlan}</p>
      )}
    </SectionShell>
  );
}

function TechnicalVisitPhotoGallery({ report, onPhotoClick }: { report: TechnicalVisitReport; onPhotoClick: (index: number) => void }) {
  const visible = report.photos.filter((photo) => photo.url);
  return (
    <SectionShell id="fotos" eyebrow="Evidências" title="Galeria georreferenciada" icon={<Camera size={18} />}>
      {visible.length === 0 ? (
        <p className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">{EMPTY_STATES.photos}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {visible.map((photo, index) => (
            <button
              key={`${photo.url}-${index}`}
              type="button"
              onClick={() => onPhotoClick(index)}
              className="group relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100 text-left"
            >
              <img src={photo.url} alt={photo.description ?? `Foto ${index + 1}`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 to-transparent p-3 text-white">
                <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-200">{photo.category ?? 'Registro'}</div>
                {photo.description && <div className="mt-0.5 line-clamp-2 text-xs font-semibold">{photo.description}</div>}
                <div className="mt-1 text-[10px] text-slate-300">
                  {[formatVisitDate(photo.date), photo.latitude != null && photo.longitude != null ? formatCoordinate(photo.latitude, photo.longitude) : undefined]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitTechnicalSynthesis({ report, assessment }: { report: TechnicalVisitReport; assessment: ReturnType<typeof normalizeAgronomicAssessment> }) {
  const items = [
    { label: 'Problema principal', value: assessment.mainProblem },
    { label: 'Causa provável', value: assessment.probableCause },
    { label: 'Risco', value: assessment.risk, tone: assessment.riskTone },
    { label: 'Urgência', value: assessment.urgency, tone: assessment.urgencyTone },
    { label: 'Conduta técnica', value: assessment.conduct },
    { label: 'Próxima avaliação', value: assessment.nextEvaluation },
  ];
  return (
    <SectionShell eyebrow="Diagnóstico" title="Síntese técnica" icon={<Leaf size={18} />}>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
            <span
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                item.tone === 'danger' ? 'bg-red-500' : item.tone === 'warning' ? 'bg-amber-400' : item.tone === 'success' ? 'bg-emerald-500' : 'bg-sky-500'
              }`}
            />
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{item.label}</div>
              <div className="text-sm font-semibold text-slate-900">{item.value}</div>
            </div>
          </div>
        ))}
        {report.diagnosis?.observations && (
          <div className="mt-2 rounded-lg bg-white p-3 text-sm text-slate-600">{report.diagnosis.observations}</div>
        )}
      </div>
    </SectionShell>
  );
}

function TechnicalVisitConclusion({ report, conclusionText, shareToken }: { report: TechnicalVisitReport; conclusionText: string; shareToken?: string }) {
  const reportUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : shareToken
        ? `https://fortsmartagro.com.br/r/${shareToken}`
        : 'https://fortsmartagro.com.br';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(reportUrl)}`;

  return (
    <SectionShell id="conclusao" eyebrow="Fechamento" title="Conclusão e responsabilidade técnica" icon={<FileText size={18} />} full>
      <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Conclusão técnica</div>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{conclusionText}</p>
        </div>
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Responsabilidade técnica</div>
          <div className="mt-4 border-t border-dashed border-slate-300 pt-4">
            <div className="text-base font-bold text-slate-950">{report.technicianName ?? 'Responsável técnico'}</div>
            {report.technicianCrea && <div className="mt-0.5 text-sm font-medium text-slate-500">CREA {report.technicianCrea}</div>}
            <div className="mt-1 text-xs text-slate-400">
              Emissão: {formatVisitDate(report.generatedAt) ?? formatVisitDate(report.visitDate) ?? '—'}
            </div>
            <div className="mt-4 h-12 border-b border-slate-400" aria-hidden />
            <div className="mt-1 text-[10px] text-slate-400">Assinatura do responsável técnico</div>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR validação" className="h-16 w-16 rounded border border-slate-200" />
            <div className="text-right">
              <div className="text-[10px] font-bold uppercase text-slate-400">Código</div>
              <div className="text-xs font-bold text-slate-700">{report.reportKey ?? '—'}</div>
            </div>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export default function TechnicalVisitEnterpriseReport({ relatorio, reportId, relatorioUuid, shareToken }: Props) {
  const report = useMemo(() => normalizeTechnicalVisitReport(relatorio, { reportId, relatorioUuid }), [relatorio, reportId, relatorioUuid]);
  const assessment = useMemo(() => normalizeAgronomicAssessment(report), [report]);
  const executiveSummary = useMemo(() => buildExecutiveSummary(report, assessment), [report, assessment]);
  const conclusionText = useMemo(() => buildTechnicalConclusion(report, assessment), [report, assessment]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const visiblePhotos = report.photos.filter((photo) => photo.url);

  const handleShare = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (shareToken?.trim()) {
      void postReportAnalytics({ shareToken: shareToken.trim(), eventType: 'share', module: 'visita_tecnica' });
    }
    if (navigator.share) {
      await navigator.share({ title: report.title, text: report.farmName, url });
      return;
    }
    await navigator.clipboard?.writeText(url);
  }, [report.farmName, report.title, shareToken]);

  const handleExportPDF = useCallback(async () => {
    setLightboxIndex(null);
    const el = document.getElementById('technical-visit-enterprise-report');
    if (!el) return;
    document.body.classList.add('exporting-pdf');
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf()
        .set({
          margin: [8, 8, 8, 8],
          filename: `visita_tecnica_${(report.plotName || report.farmName || 'relatorio').replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['section', 'article', 'tr'] },
        } as Record<string, unknown>)
        .from(el)
        .save();
      if (shareToken?.trim()) {
        void postReportAnalytics({ shareToken: shareToken.trim(), eventType: 'download', module: 'visita_tecnica' });
      }
    } finally {
      document.body.classList.remove('exporting-pdf');
    }
  }, [report.farmName, report.plotName, shareToken]);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const lightboxImg = lightboxIndex != null ? visiblePhotos[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#f5f6f8] font-sans text-slate-950 print:bg-white">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <aside className="no-print hidden bg-[#0f172a] p-5 text-white lg:block">
          <div className="flex items-center gap-2">
            <FortSmartLogo size={36} />
            <div>
              <div className="text-sm font-black">FortSmart Agro</div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Visita Técnica</div>
            </div>
          </div>
          <nav className="mt-8 space-y-0.5 text-sm font-semibold text-slate-300">
            {navItems.map(([label, href, Icon]) => (
              <a key={label} href={href} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition hover:bg-white/8 hover:text-white">
                <Icon size={16} />
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-8 rounded-lg border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-2">
              <UserRound size={18} className="text-slate-400" />
              <div>
                <div className="text-sm font-bold">{report.technicianName ?? 'Técnico'}</div>
                <div className="text-xs text-slate-400">{report.technicianCrea ? `CREA ${report.technicianCrea}` : 'Responsável'}</div>
              </div>
            </div>
          </div>
        </aside>

        <main>
          <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur md:px-6">
            <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs text-slate-400">Consultor Agronômico</div>
                <div className="text-base font-bold text-slate-950">Relatório de visita técnica</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <ArrowLeft size={15} /> Voltar
                </button>
                <button type="button" onClick={handleShare} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Share2 size={15} /> Compartilhar
                </button>
                <button type="button" onClick={handlePrint} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  <Printer size={15} /> Imprimir
                </button>
                <button type="button" onClick={handleExportPDF} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800">
                  <Download size={15} /> Exportar PDF
                </button>
              </div>
            </div>
          </header>

          <div id="technical-visit-enterprise-report" className="mx-auto max-w-5xl space-y-4 p-4 md:space-y-5 md:p-6">
            <TechnicalVisitReportHeader report={report} shareToken={shareToken} />
            <TechnicalVisitExecutiveCover report={report} assessment={assessment} />

            <section id="resumo" className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 print:break-inside-avoid md:p-5">
              <div className="mb-2 flex items-center gap-2 text-emerald-800">
                <Leaf size={18} />
                <h2 className="text-sm font-bold uppercase tracking-wide">Resumo executivo da visita</h2>
              </div>
              <p className="text-sm leading-relaxed text-slate-800">{executiveSummary}</p>
            </section>

            <TechnicalVisitDecisionPanel chips={report.decisionPanel} />

            <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
              <SectionShell eyebrow="Identificação" title="Dados da fazenda e talhão" icon={<Sprout size={18} />}>
                <CompactTable rows={report.identificationRows} />
              </SectionShell>
              <SectionShell eyebrow="Operação" title="Dados da visita" icon={<CalendarDays size={18} />}>
                <CompactTable rows={report.operationRows} />
              </SectionShell>

              <TechnicalVisitFieldConditions report={report} />
              <TechnicalVisitHorizontalTimeline items={report.timeline} />
              <TechnicalVisitMapSection report={report} />
              <TechnicalVisitOccurrences occurrences={report.occurrences} />
              <TechnicalVisitRecommendationsTable report={report} />
              <TechnicalVisitActionPlanTable report={report} />

              <div className="contents lg:col-span-12 lg:grid lg:grid-cols-2 lg:gap-5">
                <TechnicalVisitPhotoGallery report={report} onPhotoClick={setLightboxIndex} />
                <TechnicalVisitTechnicalSynthesis report={report} assessment={assessment} />
              </div>

              <TechnicalVisitConclusion report={report} conclusionText={conclusionText} shareToken={shareToken} />
            </div>

            <footer className="flex items-center justify-between border-t border-slate-200 py-4 text-xs font-medium text-slate-500 print:break-inside-avoid">
              <span>FortSmart Agro · laudo técnico agronômico</span>
              <FortSmartLogo size={28} />
            </footer>
          </div>
        </main>
      </div>

      {lightboxImg?.url && (
        <ModalImagem
          src={lightboxImg.url}
          descricao={lightboxImg.description}
          data={lightboxImg.date}
          onClose={() => setLightboxIndex(null)}
          onPrev={visiblePhotos.length > 1 ? () => setLightboxIndex((prev) => (prev == null ? null : prev === 0 ? visiblePhotos.length - 1 : prev - 1)) : undefined}
          onNext={visiblePhotos.length > 1 ? () => setLightboxIndex((prev) => (prev == null ? null : prev === visiblePhotos.length - 1 ? 0 : prev + 1)) : undefined}
        />
      )}
    </div>
  );
}
