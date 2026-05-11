'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  Camera,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Leaf,
  MapPinned,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import FortSmartLogo from '@/components/FortSmartLogo';
import ModalImagem from '@/components/ModalImagem';
import MapaTalhaoClientMount from '@/components/visita_tecnica/MapaTalhaoClientMount';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import { formatCoordinate, formatVisitDate, normalizeTechnicalVisitReport } from '@/lib/technical-visit-report/technicalVisitReportMapper';
import type { TechnicalVisitField, TechnicalVisitOccurrence, TechnicalVisitReport } from '@/lib/technical-visit-report/technicalVisitReport.types';
import type { PayloadVisitaTecnica } from '@/types/payload-visita-tecnica';

type Props = {
  relatorio: PayloadVisitaTecnica;
  reportId?: string;
  relatorioUuid?: string;
  shareToken?: string;
};

const toneMap = {
  neutral: 'border-slate-200 bg-white text-slate-900',
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
  ['Resumo', '#resumo', Sparkles],
  ['Mapa', '#mapa', MapPinned],
  ['Ocorrências', '#ocorrencias', AlertTriangle],
  ['Fotos', '#fotos', Camera],
  ['Conclusão', '#conclusao', FileText],
];

function hasText(value?: string): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value !== 'Não informado';
}

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
    <section id={id} className={`rounded-[22px] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)] print:break-inside-avoid ${full ? 'lg:col-span-12' : 'lg:col-span-6'}`}>
      <div className="mb-5 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">{icon}</span>
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">{eyebrow}</div>
          <h2 className="text-lg font-black tracking-tight text-slate-950">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function FieldGrid({ fields }: { fields: TechnicalVisitField[] }) {
  if (fields.length === 0) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Não informado.</p>;
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((item) => (
        <div key={`${item.label}-${item.value}`} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">{item.label}</div>
          <div className="mt-1 text-sm font-bold text-slate-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}

function TechnicalVisitReportHero({ report }: { report: TechnicalVisitReport }) {
  const meta = [
    hasText(report.plotName) ? report.plotName : undefined,
    report.cropName,
    report.seasonName,
    formatVisitDate(report.visitDate),
  ].filter(Boolean);
  return (
    <section className="relative overflow-hidden rounded-[30px] bg-slate-950 text-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] print:break-inside-avoid">
      {report.heroImage ? (
        <img src={report.heroImage} alt={report.plotName} className="absolute inset-0 h-full w-full object-cover opacity-55" />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(34,197,94,0.42),transparent_34%),linear-gradient(135deg,#052e1a,#0f172a_62%,#111827)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/92 via-slate-950/68 to-slate-950/30" />
      <div className="relative grid min-h-[390px] gap-8 p-7 md:grid-cols-[1fr_260px] md:p-10">
        <div className="flex max-w-4xl flex-col justify-end">
          <div className="mb-5 flex flex-wrap gap-2">
            {report.status && <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-bold backdrop-blur">{report.status}</span>}
            {report.technicianName && <span className="rounded-full border border-emerald-300/30 bg-emerald-300/15 px-3 py-1 text-xs font-bold text-emerald-50 backdrop-blur">{report.technicianName}</span>}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-emerald-200">FortSmart Agro · Visita Técnica</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">{report.farmName}</h1>
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-semibold text-slate-100">
            {meta.map((item) => (
              <span key={item} className="rounded-full bg-white/10 px-3 py-1.5 backdrop-blur">{item}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-[24px] border border-white/15 bg-white/10 p-5 backdrop-blur-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {report.farmLogoUrl ? (
                <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white/20 bg-white shadow-sm">
                  <img src={report.farmLogoUrl} alt={`Logo ${report.farmName}`} className="h-full w-full object-contain p-1.5" />
                </div>
              ) : null}
              <div className="grid h-14 w-14 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <FortSmartLogo size={38} />
              </div>
            </div>
            <QrCode size={30} className="text-emerald-100" />
          </div>
          <div className="space-y-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Fazenda</div>
              <div className="mt-1 text-base font-black text-white">{report.farmName}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">ID do relatório</div>
              <div className="mt-1 break-all text-sm font-bold text-white">{report.reportKey ?? 'Não informado'}</div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">Emissão</div>
              <div className="mt-1 text-sm font-bold text-white">{formatVisitDate(report.generatedAt) ?? 'Não informado'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TechnicalVisitExecutiveSummary({ report }: { report: TechnicalVisitReport }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {report.kpis.map((item) => (
        <div key={item.label} className={`rounded-[20px] border p-4 shadow-sm ${toneMap[item.tone]}`}>
          <div className="text-[11px] font-black uppercase tracking-[0.18em] opacity-60">{item.label}</div>
          <div className="mt-3 text-2xl font-black tracking-tight">{item.value}</div>
          {item.detail && <div className="mt-1 text-xs font-bold opacity-70">{item.detail}</div>}
        </div>
      ))}
    </div>
  );
}

function TechnicalVisitMapSection({ report }: { report: TechnicalVisitReport }) {
  const hasMap = (report.polygon?.length ?? 0) >= 3 || report.points.length > 0;
  return (
    <SectionShell id="mapa" eyebrow="GIS operacional" title="Mapa da visita" icon={<MapPinned size={20} />} full>
      {hasMap ? (
        <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-slate-100">
          <MapaTalhaoClientMount polygon={report.polygon} pontos={report.points} hideSectionTitle />
        </div>
      ) : (
        <div className="rounded-[22px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
          Esta visita não possui dados georreferenciados registrados.
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitDashboard({ report }: { report: TechnicalVisitReport }) {
  const rows = [
    { label: 'Ocorrências', value: report.occurrences.length, tone: 'bg-amber-500' },
    { label: 'Pontos GPS', value: report.points.length, tone: 'bg-sky-500' },
    { label: 'Fotos', value: report.photos.length, tone: 'bg-emerald-500' },
    { label: 'Recomendações', value: report.recommendations.length, tone: 'bg-slate-700' },
  ].filter((item) => item.value > 0);
  const max = Math.max(...rows.map((item) => item.value), 1);

  return (
    <SectionShell eyebrow="Dashboard" title="Painel agronômico" icon={<Sparkles size={20} />} full>
      {rows.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Sem indicadores suficientes para montar painel agronômico desta visita.</p>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4 rounded-[22px] border border-slate-100 bg-slate-50 p-5">
            {rows.map((row) => (
              <div key={row.label}>
                <div className="mb-2 flex items-center justify-between text-sm font-bold text-slate-700">
                  <span>{row.label}</span>
                  <span>{row.value}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white">
                  <div className={`h-full rounded-full ${row.tone}`} style={{ width: `${Math.max(8, (row.value / max) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[22px] border border-slate-100 bg-white p-5">
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Rastreabilidade</div>
            <div className="mt-4 space-y-3">
              <InfoPill label="Talhão" value={report.plotName} />
              {report.cropName && <InfoPill label="Cultura" value={report.cropName} />}
              {report.visitDate && <InfoPill label="Data da visita" value={formatVisitDate(report.visitDate) ?? report.visitDate} />}
            </div>
          </div>
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitOccurrences({ occurrences }: { occurrences: TechnicalVisitOccurrence[] }) {
  if (occurrences.length === 0) {
    return (
      <SectionShell eyebrow="Ocorrências" title="Registros técnicos" icon={<AlertTriangle size={20} />} full>
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Nenhuma ocorrência técnica registrada nesta visita.</p>
      </SectionShell>
    );
  }
  return (
    <SectionShell eyebrow="Ocorrências" title="Registros técnicos" icon={<AlertTriangle size={20} />} full>
      <div className="space-y-3">
        {occurrences.map((occ, index) => (
          <article key={occ.id ?? `${occ.name}-${index}`} className={`rounded-[20px] border border-slate-200 border-l-4 bg-white p-4 shadow-sm ${severityBorder[occ.severityTone]}`}>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap gap-2">
                  {occ.type && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-slate-600">{occ.type}</span>}
                  {occ.severity && <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-red-700">{occ.severity}</span>}
                  {occ.priority && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-amber-700">{occ.priority}</span>}
                </div>
                <h3 className="mt-3 text-xl font-black text-slate-950">{occ.name}</h3>
                {occ.observation && <p className="mt-2 max-w-4xl text-sm font-medium leading-6 text-slate-600">{occ.observation}</p>}
              </div>
              {occ.latitude != null && occ.longitude != null && (
                <div className="rounded-2xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-500">
                  {formatCoordinate(occ.latitude, occ.longitude)}
                </div>
              )}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {occ.incidence && <InfoPill label="Incidência" value={occ.incidence} />}
              {occ.status && <InfoPill label="Status" value={occ.status} />}
              {occ.affectedArea && <InfoPill label="Área afetada" value={occ.affectedArea} />}
              {occ.probableCause && <InfoPill label="Causa provável" value={occ.probableCause} />}
              {occ.responsible && <InfoPill label="Responsável" value={occ.responsible} />}
              {occ.deadline && <InfoPill label="Prazo" value={occ.deadline} />}
            </div>
            {occ.recommendation && (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Recomendação</div>
                <p className="mt-1 text-sm font-semibold leading-6 text-emerald-950">{occ.recommendation}</p>
              </div>
            )}
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">{label}</div>
      <div className="mt-1 text-sm font-bold text-slate-900">{value}</div>
    </div>
  );
}

function TechnicalVisitPhotoGallery({ report, onPhotoClick }: { report: TechnicalVisitReport; onPhotoClick: (index: number) => void }) {
  const visible = report.photos.filter((photo) => photo.url);
  return (
    <SectionShell eyebrow="Registro visual" title="Galeria georreferenciada" icon={<Camera size={20} />} full>
      {visible.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Esta visita não possui fotos com URL pública para exibição.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((photo, index) => (
            <button key={`${photo.url}-${index}`} type="button" onClick={() => onPhotoClick(index)} className="group relative aspect-[4/3] overflow-hidden rounded-[22px] bg-slate-100 text-left shadow-sm">
              <img src={photo.url} alt={photo.description ?? `Foto ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.035]" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/82 via-slate-950/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-100">{photo.category ?? 'Registro'}</div>
                {photo.description && <div className="mt-1 line-clamp-2 text-sm font-bold">{photo.description}</div>}
                <div className="mt-2 text-[11px] font-semibold text-slate-200">
                  {[photo.plotName, formatVisitDate(photo.date), photo.latitude != null && photo.longitude != null ? formatCoordinate(photo.latitude, photo.longitude) : undefined].filter(Boolean).join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitRecommendations({ report }: { report: TechnicalVisitReport }) {
  return (
    <SectionShell eyebrow="Direcionamento" title="Recomendações técnicas" icon={<ShieldCheck size={20} />}>
      {report.recommendations.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Esta visita não possui recomendações registradas.</p>
      ) : (
        <div className="space-y-3">
          {report.recommendations.map((rec, index) => (
            <div key={`${rec.text}-${index}`} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-sm font-bold leading-6 text-slate-900">{rec.text}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">
                {rec.priority && <span>{rec.priority}</span>}
                {rec.deadline && <span>{rec.deadline}</span>}
                {rec.occurrence && <span>{rec.occurrence}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitActionPlan({ report }: { report: TechnicalVisitReport }) {
  return (
    <SectionShell eyebrow="Execução" title="Plano de ação" icon={<ClipboardList size={20} />}>
      {report.actions.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Esta visita ainda não possui plano de ação registrado.</p>
      ) : (
        <div className="space-y-3">
          {report.actions.map((action, index) => (
            <div key={`${action.action}-${index}`} className="rounded-2xl border border-slate-100 p-4">
              <div className="text-sm font-black text-slate-950">{action.action}</div>
              <div className="mt-3 grid gap-2 text-xs font-bold text-slate-500 sm:grid-cols-2">
                {action.priority && <span>Prioridade: {action.priority}</span>}
                {action.deadline && <span>Prazo: {action.deadline}</span>}
                {action.responsible && <span>Responsável: {action.responsible}</span>}
                {action.status && <span>Status: {action.status}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitTimeline({ report }: { report: TechnicalVisitReport }) {
  return (
    <SectionShell eyebrow="Rastreabilidade" title="Linha do tempo" icon={<CalendarDays size={20} />}>
      {report.timeline.length === 0 ? (
        <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Sem eventos suficientes para montar histórico da visita.</p>
      ) : (
        <div className="space-y-4">
          {report.timeline.map((item, index) => (
            <div key={`${item.label}-${index}`} className="relative pl-7">
              <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-50" />
              {index < report.timeline.length - 1 && <span className="absolute left-[5px] top-5 h-full w-px bg-slate-200" />}
              <div className="text-sm font-black text-slate-950">{item.label}</div>
              <div className="mt-1 text-xs font-bold text-slate-500">{formatVisitDate(item.date) ?? item.date}</div>
              {item.detail && <div className="mt-1 text-xs font-semibold text-slate-500">{item.detail}</div>}
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function TechnicalVisitConclusion({ report }: { report: TechnicalVisitReport }) {
  return (
    <SectionShell eyebrow="Fechamento" title="Conclusão e assinatura" icon={<FileText size={20} />} full>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[22px] bg-slate-50 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Conclusão técnica</div>
          <p className="mt-3 whitespace-pre-wrap text-sm font-semibold leading-7 text-slate-800">{report.conclusion ?? 'Conclusão não registrada.'}</p>
        </div>
        <div className="rounded-[22px] border border-slate-200 p-5">
          <div className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Responsabilidade técnica</div>
          <div className="mt-6 border-t border-slate-300 pt-4">
            <div className="text-lg font-black text-slate-950">{report.technicianName ?? 'Assinatura não registrada.'}</div>
            {report.technicianCrea && <div className="mt-1 text-sm font-bold text-slate-500">CREA {report.technicianCrea}</div>}
          </div>
        </div>
      </div>
    </SectionShell>
  );
}

export default function TechnicalVisitEnterpriseReport({ relatorio, reportId, relatorioUuid, shareToken }: Props) {
  const report = useMemo(() => normalizeTechnicalVisitReport(relatorio, { reportId, relatorioUuid }), [relatorio, reportId, relatorioUuid]);
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
          filename: `visita_tecnica_${(report.farmName || 'relatorio').replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.96 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['css', 'legacy'], avoid: ['section', 'article'] },
        } as Record<string, unknown>)
        .from(el)
        .save();
      if (shareToken?.trim()) {
        void postReportAnalytics({ shareToken: shareToken.trim(), eventType: 'download', module: 'visita_tecnica' });
      }
    } finally {
      document.body.classList.remove('exporting-pdf');
    }
  }, [report.farmName, shareToken]);

  const lightboxImg = lightboxIndex != null ? visiblePhotos[lightboxIndex] : null;

  return (
    <div className="min-h-screen bg-[#f4f7f5] font-sans text-slate-950 print:bg-white">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="no-print hidden bg-[#071711] p-6 text-white lg:block">
          <div className="flex items-center gap-3">
            {report.farmLogoUrl ? (
              <div className="grid h-11 w-11 place-items-center overflow-hidden rounded-2xl bg-white">
                <img src={report.farmLogoUrl} alt={`Logo ${report.farmName}`} className="h-full w-full object-contain p-1.5" />
              </div>
            ) : (
              <FortSmartLogo size={42} />
            )}
            <div>
              <div className="text-sm font-black">{report.farmName}</div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200">Enterprise Report</div>
            </div>
          </div>
          <nav className="mt-10 space-y-1 text-sm font-bold text-slate-300">
            {navItems.map(([label, href, Icon]) => (
              <a key={label} href={href} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition hover:bg-white/8 hover:text-white">
                <Icon size={17} />
                {label}
              </a>
            ))}
          </nav>
          <div className="mt-10 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-3">
              <UserRound size={20} className="text-emerald-200" />
              <div>
                <div className="text-sm font-black">{report.technicianName ?? 'Técnico não informado'}</div>
                <div className="text-xs font-semibold text-slate-400">{report.technicianCrea ? `CREA ${report.technicianCrea}` : 'Responsável técnico'}</div>
              </div>
            </div>
          </div>
        </aside>

        <main>
          <header className="no-print sticky top-0 z-30 border-b border-slate-200 bg-white/85 px-4 py-3 backdrop-blur md:px-8">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-bold text-slate-400">Relatórios / Consultor Agronômico</div>
                <div className="text-lg font-black text-slate-950">Relatório de visita técnica</div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => window.history.back()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  <ArrowLeft size={16} /> Voltar
                </button>
                <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50">
                  <Share2 size={16} /> Compartilhar
                </button>
                <button type="button" onClick={handleExportPDF} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-3 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-800">
                  <Download size={16} /> Exportar PDF
                </button>
              </div>
            </div>
          </header>

          <div id="technical-visit-enterprise-report" className="mx-auto max-w-7xl space-y-6 p-4 md:p-8">
            <TechnicalVisitReportHero report={report} />
            <section id="resumo" className="space-y-4">
              <TechnicalVisitExecutiveSummary report={report} />
            </section>
            <div className="grid gap-6 lg:grid-cols-12">
              <SectionShell eyebrow="Identificação" title="Dados da fazenda" icon={<Sprout size={20} />}>
                <FieldGrid fields={report.farmFields} />
              </SectionShell>
              <SectionShell eyebrow="Operação" title="Dados da visita" icon={<CheckCircle2 size={20} />}>
                <FieldGrid fields={report.visitFields} />
              </SectionShell>
              <SectionShell eyebrow="Ambiente" title="Condições de campo" icon={<Leaf size={20} />} full>
                <FieldGrid fields={report.fieldConditionFields} />
              </SectionShell>
              <TechnicalVisitDashboard report={report} />
              <TechnicalVisitMapSection report={report} />
              <div id="ocorrencias" className="contents">
                <TechnicalVisitOccurrences occurrences={report.occurrences} />
              </div>
              <TechnicalVisitRecommendations report={report} />
              <TechnicalVisitActionPlan report={report} />
              <TechnicalVisitTimeline report={report} />
              <SectionShell eyebrow="Diagnóstico" title="Síntese técnica" icon={<Sparkles size={20} />}>
                {report.diagnosis?.mainProblem || report.diagnosis?.probableCause || report.diagnosis?.observations ? (
                  <div className="space-y-3">
                    {report.diagnosis.mainProblem && <InfoPill label="Problema principal" value={report.diagnosis.mainProblem} />}
                    {report.diagnosis.probableCause && <InfoPill label="Causa provável" value={report.diagnosis.probableCause} />}
                    {report.diagnosis.risk && <InfoPill label="Risco" value={report.diagnosis.risk} />}
                    {report.diagnosis.urgency && <InfoPill label="Urgência" value={report.diagnosis.urgency} />}
                    {report.diagnosis.observations && <InfoPill label="Observações" value={report.diagnosis.observations} />}
                  </div>
                ) : (
                  <p className="rounded-2xl bg-slate-50 p-5 text-sm font-semibold text-slate-500">Diagnóstico não registrado.</p>
                )}
              </SectionShell>
              <div id="fotos" className="contents">
                <TechnicalVisitPhotoGallery report={report} onPhotoClick={setLightboxIndex} />
              </div>
              <div id="conclusao" className="contents">
                <TechnicalVisitConclusion report={report} />
              </div>
            </div>
            <footer className="flex items-center justify-between border-t border-slate-200 py-6 text-xs font-bold text-slate-500">
              <span>FortSmart Agro · relatório técnico agrícola</span>
              <FortSmartLogo size={30} />
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
