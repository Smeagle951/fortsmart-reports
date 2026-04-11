'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { formatDate, formatNumber, formatPercent, situacaoLabel } from '@/utils/format';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json, ReportPhotoWeb } from '@/types/side-by-side-report';
import FortSmartLogo from '@/components/FortSmartLogo';
import { postReportAnalytics } from '@/lib/report-analytics-client';
import {
  COLOR_SIDE_A,
  COLOR_SIDE_B,
  distinctApplicationDaas,
  evolutionSeriesFromApplications,
  formatWind,
  isColheitaJson,
  isCustoJson,
  lastMeaningfulClimate,
  performanceIndexFromKpis,
  pickHeroPhoto,
  pressaoFitossanitariaMedia,
  rootPctFromKpis,
  vigorPctFromKpis,
} from '@/components/lado_a_lado/ladoALadoHelpers';

type SideData = NonNullable<SideBySideReportData['sideA']>;

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-40px' },
  transition: { duration: 0.35 },
};

/** Âncoras da nav (scroll + destaque) — fluxo premium tipo produto. */
const NAV_SECTIONS: { id: string; label: string }[] = [
  { id: 'visao-geral', label: 'Geral' },
  { id: 'comparativo', label: 'Comparativo' },
  { id: 'avaliacoes-daa', label: 'Avaliações' },
  { id: 'aplicacoes', label: 'Aplicações' },
  { id: 'kpis', label: 'KPIs' },
  { id: 'radicular', label: 'Radicular' },
  { id: 'fitossanidade', label: 'Fitossanidade' },
  { id: 'evidencias', label: 'Evidências' },
  { id: 'tratamento', label: 'Tratamento' },
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'economico', label: 'Econômico' },
  { id: 'conclusao', label: 'Conclusão' },
];

function comparativoInsightText(
  conclusionSummary: string | undefined,
  resumoCurta: string | undefined,
  kpisA: SideData['kpis'],
  kpisB: SideData['kpis'],
  sideAName: string,
  sideBName: string,
): string | null {
  const t = conclusionSummary?.trim() || resumoCurta?.trim();
  if (t) return t;
  const ea = kpisA?.eficienciaPct;
  const eb = kpisB?.eficienciaPct;
  if (ea != null && eb != null && Math.abs(ea - eb) >= 1) {
    return eb > ea
      ? `${sideBName} apresentou maior eficiência de plantio (${eb.toFixed(0)}% frente a ${ea.toFixed(0)}%).`
      : `${sideAName} apresentou maior eficiência de plantio (${ea.toFixed(0)}% frente a ${eb.toFixed(0)}%).`;
  }
  const ha = kpisA?.avgHeightCm;
  const hb = kpisB?.avgHeightCm;
  if (ha != null && hb != null && Math.abs(ha - hb) >= 5) {
    return hb > ha
      ? `${sideBName} com maior altura média (${formatNumber(hb, { decimals: 0 })} cm vs ${formatNumber(ha, { decimals: 0 })} cm).`
      : `${sideAName} com maior altura média (${formatNumber(ha, { decimals: 0 })} cm vs ${formatNumber(hb, { decimals: 0 })} cm).`;
  }
  return null;
}

function vigorCell(kpis?: SideData['kpis'], phenologySide?: { vigor?: string }) {
  if (phenologySide?.vigor) return phenologySide.vigor;
  const vr = kpis?.vigorRating;
  const vmax = vr?.max ?? 0;
  if (vr && vmax > 0) return `${vr.score} / ${vmax}`;
  return '—';
}

function rootCell(kpis?: SideData['kpis']) {
  const rr = kpis?.rootRating;
  const rmax = rr?.max ?? 0;
  if (rr && rmax > 0) return `${rr.score} / ${rmax}`;
  return '—';
}

function PhotoWithHotspots({ ph, accentClass }: { ph: ReportPhotoWeb; accentClass: string }) {
  return (
    <figure className="rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-shadow bg-white">
      {ph.url ? (
        <div className="relative w-full aspect-[4/3] bg-slate-100">
          <img src={ph.url} alt={ph.caption || 'Evidência'} className="w-full h-full object-cover" />
          {ph.hotspots?.map((h, i) => (
            <div
              key={i}
              className="absolute w-3.5 h-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-400 border-2 border-white shadow-md z-10"
              style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
              title={[h.label, h.detail].filter(Boolean).join(' — ') || undefined}
            />
          ))}
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-slate-100 flex items-center justify-center text-slate-400 text-xs">Sem imagem</div>
      )}
      {ph.caption && <figcaption className={`p-2 text-xs truncate ${accentClass}`}>{ph.caption}</figcaption>}
    </figure>
  );
}

export default function RelatorioLadoALadoDashboard({
  data,
  reportId,
  shareToken,
}: {
  data: SideBySideReportData;
  reportId?: string;
  shareToken?: string;
}) {
  const meta = data.meta || {};
  const farm = data.farm || {};
  const coleta = data.coleta;
  const sideA = data.sideA || ({} as SideData);
  const sideB = data.sideB || ({} as SideData);
  const conclusion = data.conclusion || {};
  const kpisA = sideA.kpis || {};
  const kpisB = sideB.kpis || {};
  const phenology = data.phenology;
  const diagnostics = data.diagnostics;
  const diagnosis = data.diagnosis;
  const ocorrencias = data.ocorrencias || [];
  const aplicacoes = data.aplicacoes || [];
  const applications = data.applications ?? [];
  const points = data.points || [];
  const photosA = sideA.photos || [];
  const photosB = sideB.photos || [];
  const resumo = data.resumo;
  const custoParsed = isCustoJson(data.custo) ? data.custo : null;
  const colheitaParsed = isColheitaJson(data.colheita) ? data.colheita : null;
  const economia = data.economia;

  const hasTreatment = (data.treatment_protocol?.sides?.length ?? 0) > 0;
  const hasExec = applications.length > 0 || (applications.length === 0 && aplicacoes.length > 0);
  const productsResult = data.products_result;
  const hasEcon = !!(
    custoParsed?.by_side?.length ||
    colheitaParsed?.sides?.length ||
    economia?.preco_saca_brl != null ||
    (productsResult && productsResult.length > 0)
  );

  const [activeNav, setActiveNav] = useState('visao-geral');

  useEffect(() => {
    const els = NAV_SECTIONS.map((n) => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top < b.boundingClientRect.top ? -1 : 1))[0];
        if (hit?.target?.id) setActiveNav(hit.target.id);
      },
      { rootMargin: '-42% 0px -42% 0px', threshold: [0, 0.1, 0.25] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const hasCategoryInPhotos = [...photosA, ...photosB].some((p) => p?.category);
  const categoryOrder = ['estande', 'raiz', 'sanidade', 'daninha', 'aplicacao', 'geral'] as const;
  const categoryLabels: Record<string, string> = {
    estande: 'Estande',
    raiz: 'Raiz',
    sanidade: 'Sanidade / doenças',
    daninha: 'Daninhas',
    aplicacao: 'Aplicação',
    geral: 'Geral',
  };
  const photosByCategory = hasCategoryInPhotos
    ? categoryOrder
        .map((cat) => ({
          category: cat,
          label: categoryLabels[cat] || cat,
          photosA: photosA.filter((p) => (p?.category || 'geral') === cat),
          photosB: photosB.filter((p) => (p?.category || 'geral') === cat),
        }))
        .filter((g) => g.photosA.length > 0 || g.photosB.length > 0)
    : [];

  const sideAName = sideA.name || 'Lado A';
  const sideBName = sideB.name || 'Lado B';
  const popA = kpisA.finalPopulationPlHa ?? 0;
  const popB = kpisB.finalPopulationPlHa ?? 0;
  const yieldA = kpisA.estimatedYieldKgHa ?? 0;
  const yieldB = kpisB.estimatedYieldKgHa ?? 0;
  const diffYield = yieldA > 0 ? ((yieldB - yieldA) / yieldA) * 100 : null;

  const climateHero = lastMeaningfulClimate(applications);
  const evolutionData = evolutionSeriesFromApplications(applications);
  const heroPhotoA = pickHeroPhoto(photosA);
  const heroPhotoB = pickHeroPhoto(photosB);
  const daaTimeline = distinctApplicationDaas(applications);
  const daaSteps = useMemo(() => {
    const steps: { key: 'pre' | number; label: string }[] = [];
    if (coleta?.dataPlantio || daaTimeline.length > 0) {
      steps.push({ key: 'pre', label: 'Pré-aplicação' });
    }
    for (const d of daaTimeline) {
      steps.push({ key: d, label: `${d} DAA` });
    }
    return steps;
  }, [coleta?.dataPlantio, daaTimeline]);

  const [selectedDaa, setSelectedDaa] = useState<'pre' | number>('pre');
  useEffect(() => {
    if (daaSteps.length === 0) return;
    setSelectedDaa((prev) => (daaSteps.some((s) => s.key === prev) ? prev : daaSteps[0].key));
  }, [daaSteps]);

  const appsForSelectedDaa = useMemo(() => {
    if (selectedDaa === 'pre') return [] as ReportApplicationEventV2Json[];
    return applications.filter((a) => a.daa === selectedDaa);
  }, [applications, selectedDaa]);

  const perfIdxA = performanceIndexFromKpis(kpisA);
  const perfIdxB = performanceIndexFromKpis(kpisB);
  const pressaoFito = pressaoFitossanitariaMedia(ocorrencias);

  const insightComparativo = comparativoInsightText(
    conclusion.summary,
    resumo?.conclusaoCurta,
    kpisA,
    kpisB,
    sideAName,
    sideBName,
  );
  const subCaptionA = [coleta?.dae != null ? `${coleta.dae} DAE` : null, phenology?.sideA?.estadio]
    .filter(Boolean)
    .join(' · ');
  const subCaptionB = [coleta?.dae != null ? `${coleta.dae} DAE` : null, phenology?.sideB?.estadio]
    .filter(Boolean)
    .join(' · ');

  const vigorNum = (v: string | undefined) =>
    v === 'Alto' || v === 'alto' ? 100 : v === 'Médio' || v === 'medio' ? 60 : v ? 30 : 0;
  const radarRows: { subject: string; A: number; B: number; fullMark: number }[] = [
    {
      subject: 'Vigor',
      A: vigorNum(phenology?.sideA?.vigor) || vigorPctFromKpis(kpisA) || (kpisA.vigorRating?.score ?? 0) * 25,
      B: vigorNum(phenology?.sideB?.vigor) || vigorPctFromKpis(kpisB) || (kpisB.vigorRating?.score ?? 0) * 25,
      fullMark: 100,
    },
    {
      subject: 'Uniformidade',
      A: vigorNum(phenology?.sideA?.uniformidade),
      B: vigorNum(phenology?.sideB?.uniformidade),
      fullMark: 100,
    },
    {
      subject: 'Raiz',
      A: rootPctFromKpis(kpisA) || (kpisA.rootRating?.score ?? 0) * 20,
      B: rootPctFromKpis(kpisB) || (kpisB.rootRating?.score ?? 0) * 20,
      fullMark: 100,
    },
    {
      subject: 'Altura',
      A: Math.min(100, (kpisA.avgHeightCm ?? 0) * 2),
      B: Math.min(100, (kpisB.avgHeightCm ?? 0) * 2),
      fullMark: 100,
    },
    {
      subject: 'Estande',
      A: kpisA.eficienciaPct ?? 0,
      B: kpisB.eficienciaPct ?? 0,
      fullMark: 100,
    },
  ];
  if (yieldA > 0 || yieldB > 0) {
    const maxY = Math.max(yieldA, yieldB, 1);
    radarRows.push({
      subject: 'Produtividade',
      A: yieldA > 0 ? Math.min(100, (yieldA / maxY) * 100) : 0,
      B: yieldB > 0 ? Math.min(100, (yieldB / maxY) * 100) : 0,
      fullMark: 100,
    });
  }
  const radarData = radarRows.filter((r) => r.A > 0 || r.B > 0);

  const barKpis = [
    { name: 'Altura (cm)', a: kpisA.avgHeightCm ?? 0, b: kpisB.avgHeightCm ?? 0 },
    { name: 'Pop. (pl/ha)', a: kpisA.finalPopulationPlHa ?? 0, b: kpisB.finalPopulationPlHa ?? 0 },
    { name: 'Estande ef.', a: kpisA.estandeEfetivo ?? 0, b: kpisB.estandeEfetivo ?? 0 },
    { name: 'Eficiência %', a: kpisA.eficienciaPct ?? 0, b: kpisB.eficienciaPct ?? 0 },
    { name: 'Raiz (cm)', a: kpisA.profundidadeRaizCm ?? 0, b: kpisB.profundidadeRaizCm ?? 0 },
    { name: 'Peso raiz (g)', a: kpisA.pesoRaizG ?? 0, b: kpisB.pesoRaizG ?? 0 },
    { name: 'Prod. est. (kg/ha)', a: kpisA.estimatedYieldKgHa ?? 0, b: kpisB.estimatedYieldKgHa ?? 0 },
  ].filter((r) => r.a > 0 || r.b > 0);

  const ocorrenciasChart = ocorrencias.map((o, i) => ({
    name: (o.nomeAlvo || `Ocorrência ${i + 1}`).slice(0, 12),
    incidencia: o.incidenciaPct ?? 0,
  }));

  const kgPerSack = colheitaParsed?.kgPerSack ?? 60;
  const precoSaca = economia?.preco_saca_brl;

  const receitaPorLado = useMemo(() => {
    if (precoSaca == null || precoSaca <= 0 || !colheitaParsed?.sides?.length) return null;
    return colheitaParsed.sides.map((s) => {
      let sc: number | null = s.yieldScHa ?? null;
      if (sc == null && s.yieldKgHa != null && kgPerSack > 0) sc = s.yieldKgHa / kgPerSack;
      const receita = sc != null ? sc * precoSaca : null;
      return { side: s.side, sideName: s.sideName, sc, receita };
    });
  }, [colheitaParsed, precoSaca, kgPerSack]);

  const handlePrint = () => window.print();
  const handleExportPdf = async () => {
    const el = document.getElementById('relatorio-lado-a-lado-content');
    if (!el) {
      window.print();
      return;
    }
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 10,
          filename: `relatorio-lado-a-lado-${meta.reportId || reportId || 'report'}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(el)
        .save();
      if (shareToken?.trim()) {
        void postReportAnalytics({
          shareToken: shareToken.trim(),
          eventType: 'download',
          module: 'avaliacao_lado_a_lado',
        });
      }
    } catch {
      window.print();
    }
  };

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const treatmentSides = [...(data.treatment_protocol?.sides ?? [])].sort((a, b) => {
    if (a.side === 'A') return -1;
    if (b.side === 'A') return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white">
      <div className="sticky top-0 z-30 flex justify-end gap-2 px-4 py-2 bg-white/95 border-b border-slate-200 print:hidden backdrop-blur-sm">
        <button
          type="button"
          onClick={handlePrint}
          className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Imprimir
        </button>
        <button
          type="button"
          onClick={handleExportPdf}
          className="px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 border border-emerald-700 rounded-lg hover:bg-emerald-700"
        >
          Exportar PDF
        </button>
      </div>

      <div id="relatorio-lado-a-lado-content" className="overflow-x-hidden print:overflow-visible">
        <header className="relative border-b border-slate-200/80 print:border-slate-200 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-200/90 via-emerald-50/40 to-blue-50/50 pointer-events-none"
            aria-hidden
          />
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="flex items-center gap-4">
                <FortSmartLogo size={52} />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-800/90">FortSmart Agro</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-1">
                    RELATÓRIO AGRONÔMICO LADO A LADO
                  </h1>
                </div>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {farm.farmName && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase">Fazenda</span>
                  <p className="font-semibold text-slate-900">{farm.farmName}</p>
                </div>
              )}
              {farm.culture && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase">Cultura</span>
                  <p className="font-semibold text-slate-900">{farm.culture}</p>
                </div>
              )}
              {farm.fieldName && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase">Talhão</span>
                  <p className="font-semibold text-slate-900">{farm.fieldName}</p>
                </div>
              )}
              {coleta?.estadio && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm ring-2 ring-blue-100">
                  <span className="text-slate-500 text-xs uppercase">Estádio</span>
                  <p className="font-semibold text-blue-900">{coleta.estadio}</p>
                </div>
              )}
              {(farm.city || farm.state) && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase">Região</span>
                  <p className="font-semibold text-slate-900">
                    {[farm.city, farm.state].filter(Boolean).join(' — ')}
                  </p>
                </div>
              )}
              {(coleta?.dae != null || coleta?.dap != null || coleta?.dataPlantio || meta.createdAt) && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm">
                  <span className="text-slate-500 text-xs uppercase">DAE / data</span>
                  <p className="font-semibold text-slate-900">
                    {coleta?.dae != null ? `${coleta.dae} DAE` : coleta?.dap != null ? `${coleta.dap} DAP` : ''}
                    {coleta?.dataPlantio && (
                      <span className="block text-sm font-normal text-slate-600 mt-0.5">
                        Plantio: {formatDate(coleta.dataPlantio)}
                      </span>
                    )}
                    {!coleta?.dataPlantio && meta.createdAt && (
                      <span className="block text-sm font-normal text-slate-600 mt-0.5">
                        Relatório: {formatDate(meta.createdAt)}
                      </span>
                    )}
                  </p>
                </div>
              )}
              {climateHero && (
                <div className="rounded-xl bg-white/90 border border-slate-200/80 px-4 py-3 shadow-sm sm:col-span-2 lg:col-span-1">
                  <span className="text-slate-500 text-xs uppercase">Clima (última aplicação registrada)</span>
                  <p className="font-medium text-slate-800 mt-1">
                    {[
                      climateHero.temperature != null ? `${climateHero.temperature}°C` : null,
                      climateHero.humidity != null ? `${climateHero.humidity}% umid.` : null,
                      climateHero.wind != null ? `Vento ${formatWind(climateHero.wind)}` : null,
                      climateHero.derivaRisco ? `Deriva: ${climateHero.derivaRisco}` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ') || '—'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav className="sticky top-[49px] z-20 print:hidden border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-sm">
          <div className="max-w-6xl mx-auto px-2 sm:px-4 flex flex-wrap gap-1 py-2">
            {NAV_SECTIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToId(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors border-b-2 -mb-px ${
                  activeNav === item.id
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-600'
                    : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-14 print:space-y-8">
          <motion.section id="visao-geral" {...fadeIn} className="scroll-mt-36 space-y-8">
            <h2 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-emerald-600 pl-3">Visão geral do ensaio</h2>
            <p className="text-sm text-slate-600 mb-6">Contexto, responsáveis e condições — leitura rápida antes do comparativo técnico.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {coleta?.ensaioName && (
                <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Ensaio</p>
                  <p className="font-semibold text-slate-900 mt-1">{coleta.ensaioName}</p>
                </div>
              )}
              {(farm.culture || farm.season) && (
                <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Cultura / safra</p>
                  <p className="font-semibold text-slate-900 mt-1">
                    {[farm.culture, farm.season].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
              )}
              {(meta.generatedBy?.name || meta.generatedBy?.role) && (
                <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase text-slate-500">Responsável técnico</p>
                  <p className="font-semibold text-slate-900 mt-1">{meta.generatedBy?.name || '—'}</p>
                  {meta.generatedBy?.role && <p className="text-xs text-slate-600 mt-0.5">{meta.generatedBy.role}</p>}
                </div>
              )}
              {farm.objective && (
                <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Objetivo do ensaio</p>
                  <p className="text-sm text-slate-800 mt-1 leading-relaxed">{farm.objective}</p>
                </div>
              )}
              {climateHero &&
                (climateHero.temperature != null ||
                  climateHero.humidity != null ||
                  climateHero.wind != null ||
                  climateHero.derivaRisco) && (
                  <div className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm sm:col-span-2 lg:col-span-3">
                    <p className="text-xs font-semibold uppercase text-slate-500">Condições (última aplicação com clima registrado)</p>
                    <p className="text-sm text-slate-800 mt-1">
                      {[
                        climateHero.temperature != null ? `${climateHero.temperature}°C` : null,
                        climateHero.humidity != null ? `${climateHero.humidity}% umidade` : null,
                        climateHero.wind != null ? `Vento ${formatWind(climateHero.wind)}` : null,
                        climateHero.derivaRisco ? `Deriva: ${climateHero.derivaRisco}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                )}
              {daaTimeline.length > 0 && (
                <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200/80 p-4 shadow-sm sm:col-span-2 lg:col-span-3">
                  <p className="text-xs font-semibold uppercase text-emerald-900">DAA registrados nas aplicações</p>
                  <p className="text-sm text-emerald-950 mt-1 font-medium">{daaTimeline.map((d) => `${d} DAA`).join(' · ')}</p>
                </div>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 border-l-4 border-slate-300 pl-3">Resumo executivo</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                {(conclusion.summary || resumo?.conclusaoCurta) && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500 mb-1">Resultado</p>
                    <p className="text-lg font-semibold text-slate-900 leading-snug">
                      {conclusion.summary || resumo?.conclusaoCurta}
                    </p>
                  </div>
                )}
                {diagnosis?.problemaPrincipal && (
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-800">Diagnóstico: </span>
                    {diagnosis.problemaPrincipal}
                  </p>
                )}
                {!conclusion.summary && !resumo?.conclusaoCurta && !diagnosis?.problemaPrincipal && (
                  <p className="text-sm text-slate-500">Nenhum resumo textual registrado neste relatório.</p>
                )}
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase text-slate-500 mb-3">Indicadores-chave (KPIs)</p>
                <ul className="space-y-2 text-sm">
                  <li className="flex justify-between gap-4">
                    <span className="text-slate-600">Produtividade est. (kg/ha)</span>
                    <span>
                      <span className="font-semibold" style={{ color: COLOR_SIDE_A }}>
                        {kpisA.estimatedYieldKgHa != null ? formatNumber(kpisA.estimatedYieldKgHa, { decimals: 0 }) : '—'}
                      </span>
                      {' vs '}
                      <span className="font-semibold" style={{ color: COLOR_SIDE_B }}>
                        {kpisB.estimatedYieldKgHa != null ? formatNumber(kpisB.estimatedYieldKgHa, { decimals: 0 }) : '—'}
                      </span>
                    </span>
                  </li>
                  {diffYield != null && Math.abs(diffYield) >= 0.5 && yieldA > 0 && (
                    <li className="text-slate-700">
                      Diferença entre tratamentos (base kg/ha):{' '}
                      <strong>
                        {diffYield > 0 ? '+' : ''}
                        {diffYield.toFixed(1)}% ({sideBName} vs {sideAName})
                      </strong>
                    </li>
                  )}
                  <li className="flex justify-between gap-4">
                    <span className="text-slate-600">População (pl/ha)</span>
                    <span className="font-medium text-slate-800">
                      {formatNumber(popA, { decimals: 0 })} / {formatNumber(popB, { decimals: 0 })}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.section>

          <motion.section id="comparativo" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-xl font-bold text-slate-900 mb-1 text-center tracking-tight">Comparativo de desempenho</h2>
            <p className="text-sm text-slate-500 text-center mb-8">Evidência em campo e indicadores registrados por manejo (dados do relatório).</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white ring-2 ring-blue-100">
                <div className="bg-blue-600 text-white px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Manejo A</p>
                  <p className="font-bold text-lg">{sideAName}</p>
                  {subCaptionA ? <p className="text-xs opacity-90 mt-1 font-normal">{subCaptionA}</p> : null}
                </div>
                <div className="p-3 sm:p-4">
                  {heroPhotoA ? (
                    <PhotoWithHotspots ph={heroPhotoA} accentClass="text-slate-600" />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 aspect-[4/3] flex items-center justify-center text-sm text-slate-400">
                      Sem foto para este manejo
                    </div>
                  )}
                </div>
                <ul className="px-4 pb-4 space-y-2 text-sm border-t border-slate-100 pt-3">
                  {(kpisA.eficienciaPct != null || kpisB.eficienciaPct != null) && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Eficiência de plantio</span>
                      <span className="font-semibold" style={{ color: COLOR_SIDE_A }}>
                        {kpisA.eficienciaPct != null ? `${kpisA.eficienciaPct.toFixed(0)}%` : '—'}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-600">Vigor</span>
                    <span className="font-semibold text-right" style={{ color: COLOR_SIDE_A }}>
                      {vigorCell(kpisA, phenology?.sideA)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-600">Sanidade de raiz</span>
                    <span className="font-semibold" style={{ color: COLOR_SIDE_A }}>
                      {rootCell(kpisA)}
                    </span>
                  </li>
                  {(kpisA.avgHeightCm != null || kpisB.avgHeightCm != null) && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Altura média</span>
                      <span className="font-semibold" style={{ color: COLOR_SIDE_A }}>
                        {kpisA.avgHeightCm != null ? `${formatNumber(kpisA.avgHeightCm, { decimals: 0 })} cm` : '—'}
                      </span>
                    </li>
                  )}
                  {phenology?.sideA?.estadio && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Estádio (fenologia)</span>
                      <span className="font-semibold text-right" style={{ color: COLOR_SIDE_A }}>
                        {phenology.sideA.estadio}
                      </span>
                    </li>
                  )}
                  {phenology?.sideA?.uniformidade && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Uniformidade</span>
                      <span className="font-semibold text-right" style={{ color: COLOR_SIDE_A }}>
                        {phenology.sideA.uniformidade}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-white ring-2 ring-emerald-100">
                <div className="bg-emerald-600 text-white px-4 py-3 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Manejo B</p>
                  <p className="font-bold text-lg">{sideBName}</p>
                  {subCaptionB ? <p className="text-xs opacity-90 mt-1 font-normal">{subCaptionB}</p> : null}
                </div>
                <div className="p-3 sm:p-4">
                  {heroPhotoB ? (
                    <PhotoWithHotspots ph={heroPhotoB} accentClass="text-slate-600" />
                  ) : (
                    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 aspect-[4/3] flex items-center justify-center text-sm text-slate-400">
                      Sem foto para este manejo
                    </div>
                  )}
                </div>
                <ul className="px-4 pb-4 space-y-2 text-sm border-t border-slate-100 pt-3">
                  {(kpisA.eficienciaPct != null || kpisB.eficienciaPct != null) && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Eficiência de plantio</span>
                      <span className="font-semibold" style={{ color: COLOR_SIDE_B }}>
                        {kpisB.eficienciaPct != null ? `${kpisB.eficienciaPct.toFixed(0)}%` : '—'}
                      </span>
                    </li>
                  )}
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-600">Vigor</span>
                    <span className="font-semibold text-right" style={{ color: COLOR_SIDE_B }}>
                      {vigorCell(kpisB, phenology?.sideB)}
                    </span>
                  </li>
                  <li className="flex justify-between gap-2">
                    <span className="text-slate-600">Sanidade de raiz</span>
                    <span className="font-semibold" style={{ color: COLOR_SIDE_B }}>
                      {rootCell(kpisB)}
                    </span>
                  </li>
                  {(kpisA.avgHeightCm != null || kpisB.avgHeightCm != null) && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Altura média</span>
                      <span className="font-semibold" style={{ color: COLOR_SIDE_B }}>
                        {kpisB.avgHeightCm != null ? `${formatNumber(kpisB.avgHeightCm, { decimals: 0 })} cm` : '—'}
                      </span>
                    </li>
                  )}
                  {phenology?.sideB?.estadio && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Estádio (fenologia)</span>
                      <span className="font-semibold text-right" style={{ color: COLOR_SIDE_B }}>
                        {phenology.sideB.estadio}
                      </span>
                    </li>
                  )}
                  {phenology?.sideB?.uniformidade && (
                    <li className="flex justify-between gap-2">
                      <span className="text-slate-600">Uniformidade</span>
                      <span className="font-semibold text-right" style={{ color: COLOR_SIDE_B }}>
                        {phenology.sideB.uniformidade}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
            {insightComparativo && (
              <div className="mt-6 rounded-xl bg-slate-100 border border-slate-200 px-5 py-4 text-sm text-slate-800 text-center leading-relaxed">
                {insightComparativo}
              </div>
            )}
            {(coleta?.dataPlantio || daaTimeline.length > 0) && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase text-slate-500 text-center mb-3">Linha do tempo (dados registrados)</p>
                <div className="flex flex-wrap justify-center items-center gap-2">
                  {coleta?.dataPlantio && (
                    <span className="px-3 py-2 rounded-full text-xs font-medium bg-white text-slate-700 border border-slate-200 shadow-sm">
                      Pré · plantio {formatDate(coleta.dataPlantio)}
                    </span>
                  )}
                  {daaTimeline.map((d) => (
                    <span
                      key={d}
                      className="px-3 py-2 rounded-full text-xs font-semibold bg-blue-600 text-white shadow-sm"
                    >
                      {d} DAA
                    </span>
                  ))}
                </div>
                {applications.length > 0 && (
                  <p className="text-center text-xs text-slate-400 mt-3">
                    DAA extraídos das aplicações registradas. Use a seção <strong>Avaliações</strong> para focar cada momento e <strong>Aplicações</strong> para o registro completo.
                  </p>
                )}
              </div>
            )}
          </motion.section>

          <motion.section id="avaliacoes-daa" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-indigo-600 pl-3">Avaliações por momento (DAA)</h2>
            <p className="text-sm text-slate-600 mb-6">
              Selecione o momento da linha do tempo. O comparativo numérico usa os dados consolidados do relatório; por DAA você vê as aplicações e o contexto daquele dia.
            </p>
            {daaSteps.length === 0 ? (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhum DAA informado nas aplicações. Ao registrar <strong>applications</strong> com o campo <strong>daa</strong>, esta linha do tempo fica ativa.
              </p>
            ) : (
              <div className="space-y-8">
                <div className="flex flex-wrap justify-center gap-2">
                  {daaSteps.map((s) => {
                    const active = selectedDaa === s.key;
                    return (
                      <motion.button
                        key={String(s.key)}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedDaa(s.key)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-semibold border shadow-sm transition-colors ${
                          active
                            ? 'bg-blue-600 text-white border-blue-700 ring-2 ring-blue-200'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                  {selectedDaa === 'pre' ? (
                    <div className="text-sm text-slate-700 space-y-2">
                      <p className="font-semibold text-slate-900">Referência pré-aplicação</p>
                      {coleta?.dataPlantio ? (
                        <p>
                          Data de plantio: <strong>{formatDate(coleta.dataPlantio)}</strong>
                          {coleta.dae != null && (
                            <span className="text-slate-600">
                              {' '}
                              · {coleta.dae} DAE
                            </span>
                          )}
                          {coleta.dap != null && (
                            <span className="text-slate-600">
                              {' '}
                              · {coleta.dap} DAP
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="text-slate-500">Sem data de plantio registrada — use este ponto como visão geral antes dos DAA com aplicações.</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Aplicações em <span className="text-blue-700">{selectedDaa} DAA</span>
                      </p>
                      {appsForSelectedDaa.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum evento de aplicação com este DAA no JSON.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase mb-2" style={{ color: COLOR_SIDE_A }}>
                              {sideAName}
                            </p>
                            <div className="space-y-3">
                              {appsForSelectedDaa
                                .filter((e) => e.side === 'A')
                                .map((ev, i) => (
                                  <ExecutionEventCard key={ev.id || `a-${i}`} ev={ev} compact />
                                ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold uppercase mb-2" style={{ color: COLOR_SIDE_B }}>
                              {sideBName}
                            </p>
                            <div className="space-y-3">
                              {appsForSelectedDaa
                                .filter((e) => e.side === 'B')
                                .map((ev, i) => (
                                  <ExecutionEventCard key={ev.id || `b-${i}`} ev={ev} compact />
                                ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <p className="text-xs text-slate-500 border-t border-slate-100 pt-4">
                    Comparativo visual e KPIs consolidados continuam na seção <strong>Comparativo</strong>. Quando o app passar a enviar{' '}
                    <strong>avaliações por DAA</strong> no JSON, estes números poderão ser específicos de cada momento.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-xl border-2 border-blue-100 overflow-hidden shadow-sm bg-slate-50/50"
                    >
                      <div className="bg-blue-600 text-white text-center text-xs font-semibold py-2">{sideAName}</div>
                      <div className="p-3">{heroPhotoA ? <PhotoWithHotspots ph={heroPhotoA} accentClass="text-slate-600" /> : null}</div>
                    </motion.div>
                    <motion.div
                      whileHover={{ y: -2 }}
                      className="rounded-xl border-2 border-emerald-100 overflow-hidden shadow-sm bg-slate-50/50"
                    >
                      <div className="bg-emerald-600 text-white text-center text-xs font-semibold py-2">{sideBName}</div>
                      <div className="p-3">{heroPhotoB ? <PhotoWithHotspots ph={heroPhotoB} accentClass="text-slate-600" /> : null}</div>
                    </motion.div>
                  </div>
                </div>

                {evolutionData && evolutionData.length >= 2 && (
                  <motion.div
                    whileHover={{ boxShadow: '0 12px 40px -12px rgb(0 0 0 / 0.12)' }}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm transition-shadow"
                  >
                    <h3 className="text-base font-semibold text-slate-900 mb-1">Evolução da avaliação (volume de registros)</h3>
                    <p className="text-xs text-slate-500 mb-4">
                      Número de aplicações registradas por DAA (quando informado). Para curvas de controle ou vigor por visita, o backend pode enviar séries dedicadas sem alterar os campos atuais.
                    </p>
                    <div className="h-64 w-full" style={{ minHeight: 220 }}>
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={evolutionData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="A" name={`${sideAName} (nº)`} stroke={COLOR_SIDE_A} strokeWidth={2} dot />
                          <Line type="monotone" dataKey="B" name={`${sideBName} (nº)`} stroke={COLOR_SIDE_B} strokeWidth={2} dot />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.section>

          <motion.section id="aplicacoes" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-amber-500 pl-3">Aplicações em campo</h2>
            <p className="text-sm text-slate-600 mb-6">
              Rastreabilidade por data, estágio, responsável, clima e produtos (inclui classe, ativo, dose e custo/ha quando informados).
            </p>
            {!hasExec ? (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhuma aplicação registrada neste relatório.
              </p>
            ) : (
              <div className="space-y-4">
                {applications.length > 0 ? (
                  applications.map((ev, i) => (
                    <ExecutionEventCard key={ev.id || i} ev={ev} />
                  ))
                ) : (
                  aplicacoes.map((a, i) => (
                    <div
                      key={i}
                      className="flex gap-4 items-start border-l-4 border-slate-300 pl-4 py-3 bg-white rounded-r-xl border border-slate-200 shadow-sm"
                    >
                      <div className="text-sm font-medium text-slate-600 shrink-0 w-28">{formatDate(a.data)}</div>
                      <div className="text-sm min-w-0">
                        <span className="font-semibold text-slate-900">{a.tipo || 'Aplicação'}</span>
                        {a.classe && <span className="text-slate-500"> · {a.classe}</span>}
                        {a.doseResumo && <span className="text-slate-600"> · Dose: {a.doseResumo}</span>}
                        <p className="text-slate-600 mt-1 break-words">{a.produtos || '—'}</p>
                        <p className="text-xs text-amber-700 mt-2">Formato resumido (legado) — sem detalhe climático/técnico no JSON.</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </motion.section>

          <motion.section id="kpis" {...fadeIn} className="scroll-mt-36 space-y-10">
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-violet-600 pl-3">KPIs e análise agronômica</h2>
            <p className="text-sm text-slate-600">
              Indicadores consolidados, radar comparativo e critérios numéricos — leitura técnica centralizada.
            </p>

            {(perfIdxA != null || perfIdxB != null || pressaoFito != null) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {perfIdxA != null && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/80 p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">Índice geral (A)</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: COLOR_SIDE_A }}>
                      {perfIdxA.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Peso: estande 40% · vigor 30% · raiz 30% (calculado no relatório web).</p>
                  </motion.div>
                )}
                {perfIdxB != null && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/80 p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">Índice geral (B)</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: COLOR_SIDE_B }}>
                      {perfIdxB.toFixed(0)}
                    </p>
                    <p className="text-xs text-slate-500 mt-2">Mesma fórmula do lado A para comparar manejos.</p>
                  </motion.div>
                )}
                {pressaoFito != null && (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="rounded-2xl border border-orange-100 bg-white p-5 shadow-sm"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">Pressão fitossanitária (média)</p>
                    <p className="text-3xl font-bold text-orange-700 mt-1">{pressaoFito.toFixed(0)}%</p>
                    <p className="text-xs text-slate-500 mt-2">Média das incidências declaradas nas ocorrências.</p>
                  </motion.div>
                )}
              </div>
            )}

            <div>
              <h3 className="text-base font-semibold text-slate-800 mb-4">Indicadores agronômicos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Altura média (cm)', a: kpisA.avgHeightCm, b: kpisB.avgHeightCm },
                  { label: 'População final (pl/ha)', a: kpisA.finalPopulationPlHa, b: kpisB.finalPopulationPlHa },
                  { label: 'Estande efetivo', a: kpisA.estandeEfetivo, b: kpisB.estandeEfetivo },
                  { label: 'Eficiência (%)', a: kpisA.eficienciaPct, b: kpisB.eficienciaPct },
                  { label: 'Profundidade raiz (cm)', a: kpisA.profundidadeRaizCm, b: kpisB.profundidadeRaizCm },
                  { label: 'Peso raiz (g)', a: kpisA.pesoRaizG, b: kpisB.pesoRaizG },
                  {
                    label: 'Vigor',
                    a: phenology?.sideA?.vigor || kpisA.vigorRating?.label,
                    b: phenology?.sideB?.vigor || kpisB.vigorRating?.label,
                    isText: true,
                  },
                  { label: 'Produtividade est. (kg/ha)', a: kpisA.estimatedYieldKgHa, b: kpisB.estimatedYieldKgHa },
                ]
                  .filter((r) => r.a != null || r.b != null)
                  .map((item, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.01 }}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm"
                    >
                      <p className="text-xs font-medium text-slate-500 mb-2">{item.label}</p>
                      {'isText' in item && item.isText ? (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: COLOR_SIDE_A }}>{String(item.a || '—')}</span>
                          <span style={{ color: COLOR_SIDE_B }}>{String(item.b || '—')}</span>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between text-sm font-medium mb-1">
                            <span style={{ color: COLOR_SIDE_A }}>
                              {item.a != null ? formatNumber(item.a as number, { decimals: 1 }) : '—'}
                            </span>
                            <span style={{ color: COLOR_SIDE_B }}>
                              {item.b != null ? formatNumber(item.b as number, { decimals: 1 }) : '—'}
                            </span>
                          </div>
                          <div className="flex gap-1 h-2 rounded overflow-hidden bg-slate-100">
                            <div
                              className="h-full rounded-l"
                              style={{
                                backgroundColor: COLOR_SIDE_A,
                                width:
                                  item.a != null && item.b != null
                                    ? (() => {
                                        const numA = Number(item.a);
                                        const numB = Number(item.b);
                                        return numA + numB > 0 ? `${(numA / (numA + numB)) * 100}%` : '50%';
                                      })()
                                    : '50%',
                              }}
                            />
                            <div
                              className="h-full rounded-r flex-1"
                              style={{ backgroundColor: COLOR_SIDE_B }}
                            />
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>{sideAName}</span>
                        <span>{sideBName}</span>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {Array.isArray(data.criteriosEstatistica) && data.criteriosEstatistica.length > 0 && (
              <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-1">Critérios numéricos (entre pontos)</h3>
                <p className="text-xs text-slate-600 mb-4">
                  Indicativo — não substitui delineamento experimental formal.
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-amber-300/80 text-left text-slate-600">
                        <th className="py-2 pr-3">Critério</th>
                        <th className="py-2 pr-3">Média A</th>
                        <th className="py-2 pr-3">Média B</th>
                        <th className="py-2 pr-3">DP A</th>
                        <th className="py-2 pr-3">DP B</th>
                        <th className="py-2 pr-3">CV% A</th>
                        <th className="py-2 pr-3">CV% B</th>
                        <th className="py-2 pr-3">Destaque</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.criteriosEstatistica.map((row, i) => (
                        <tr key={i} className="border-b border-amber-200/60">
                          <td className="py-2 pr-3 font-medium text-slate-800">
                            {row.criterio || '—'}
                            {row.unidade ? <span className="text-slate-500 font-normal"> ({row.unidade})</span> : null}
                          </td>
                          <td className="py-2 pr-3">{row.mediaA != null ? formatNumber(row.mediaA, { decimals: 2 }) : '—'}</td>
                          <td className="py-2 pr-3">{row.mediaB != null ? formatNumber(row.mediaB, { decimals: 2 }) : '—'}</td>
                          <td className="py-2 pr-3">{row.dpA != null ? formatNumber(row.dpA, { decimals: 2 }) : '—'}</td>
                          <td className="py-2 pr-3">{row.dpB != null ? formatNumber(row.dpB, { decimals: 2 }) : '—'}</td>
                          <td className="py-2 pr-3">{row.cvPctA != null ? `${row.cvPctA.toFixed(1)}%` : '—'}</td>
                          <td className="py-2 pr-3">{row.cvPctB != null ? `${row.cvPctB.toFixed(1)}%` : '—'}</td>
                          <td className="py-2 pr-3">
                            {row.diferencaIndicativa ? (
                              <span className="text-amber-800 font-semibold">Sim</span>
                            ) : (
                              <span className="text-slate-500">Não</span>
                            )}
                            {row.estabilidadeDpDiff != null && (
                              <div className="text-xs text-slate-500 mt-0.5">
                                Estab. (DP B−A): {formatNumber(row.estabilidadeDpDiff, { decimals: 2 })}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {data.criteriosEstatistica.some((r) => r.notaRegra) && (
                  <p className="text-xs text-slate-500 mt-3 italic">
                    {data.criteriosEstatistica.find((r) => r.notaRegra)?.notaRegra}
                  </p>
                )}
              </div>
            )}

            {radarData.length > 0 && (
              <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden"
              >
                <h3 className="text-base font-semibold text-slate-900 mb-1">Radar agronômico (A vs B)</h3>
                <p className="text-xs text-slate-500 mb-4">Eixos normalizados no front a partir dos KPIs e fenologia — mesmo contrato JSON.</p>
                <div className="h-64 w-full" style={{ minHeight: 240 }}>
                  <ResponsiveContainer width="100%" height={240}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={sideAName} dataKey="A" stroke={COLOR_SIDE_A} fill={COLOR_SIDE_A} fillOpacity={0.25} strokeWidth={2} />
                      <Radar name={sideBName} dataKey="B" stroke={COLOR_SIDE_B} fill={COLOR_SIDE_B} fillOpacity={0.25} strokeWidth={2} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            )}

            {(coleta?.espacamento != null ||
              coleta?.populacaoAlvo != null ||
              kpisA.finalPopulationPlHa != null ||
              kpisB.finalPopulationPlHa != null) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Contexto de plantio</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                  {coleta?.espacamento != null && (
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatNumber(coleta.espacamento, { decimals: 1 })} cm</p>
                      <p className="text-xs text-slate-500">Espaçamento</p>
                    </div>
                  )}
                  {coleta?.populacaoAlvo != null && (
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{formatNumber(coleta.populacaoAlvo, { decimals: 0 })}</p>
                      <p className="text-xs text-slate-500">Pop. alvo (pl/ha)</p>
                    </div>
                  )}
                  {kpisA.finalPopulationPlHa != null && (
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLOR_SIDE_A }}>
                        {formatNumber(kpisA.finalPopulationPlHa, { decimals: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">{sideAName}</p>
                    </div>
                  )}
                  {kpisB.finalPopulationPlHa != null && (
                    <div>
                      <p className="text-2xl font-bold" style={{ color: COLOR_SIDE_B }}>
                        {formatNumber(kpisB.finalPopulationPlHa, { decimals: 0 })}
                      </p>
                      <p className="text-xs text-slate-500">{sideBName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {points.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Pontos de avaliação</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 font-medium text-slate-600">Ponto</th>
                        <th className="text-left py-2 font-medium text-slate-600">Nome</th>
                        <th className="text-left py-2 font-medium text-slate-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {points.map((p, i) => (
                        <tr key={i} className="border-b border-slate-100">
                          <td className="py-2">{p.indexNo ?? i + 1}</td>
                          <td className="py-2">{p.name || '—'}</td>
                          <td className="py-2">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                (p.status || '').toLowerCase() === 'ok'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : (p.status || '').toLowerCase() === 'monitorar'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {situacaoLabel(p.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {phenology && (phenology.sideA || phenology.sideB) && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-900 mb-4">Fenologia</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {phenology.sideA && (
                    <div className="border rounded-xl p-4" style={{ borderColor: `${COLOR_SIDE_A}44`, background: `${COLOR_SIDE_A}0d` }}>
                      <p className="font-medium mb-2" style={{ color: COLOR_SIDE_A }}>
                        {sideAName}
                      </p>
                      <ul className="text-sm space-y-1">
                        {phenology.sideA.estadio && (
                          <li>
                            <span className="text-slate-500">Estádio:</span> {phenology.sideA.estadio}
                          </li>
                        )}
                        {phenology.sideA.vigor && (
                          <li>
                            <span className="text-slate-500">Vigor:</span> {phenology.sideA.vigor}
                          </li>
                        )}
                        {phenology.sideA.uniformidade && (
                          <li>
                            <span className="text-slate-500">Uniformidade:</span> {phenology.sideA.uniformidade}
                          </li>
                        )}
                        {phenology.sideA.observacao && (
                          <li>
                            <span className="text-slate-500">Obs.:</span> {phenology.sideA.observacao}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  {phenology.sideB && (
                    <div className="border rounded-xl p-4" style={{ borderColor: `${COLOR_SIDE_B}44`, background: `${COLOR_SIDE_B}0d` }}>
                      <p className="font-medium mb-2" style={{ color: COLOR_SIDE_B }}>
                        {sideBName}
                      </p>
                      <ul className="text-sm space-y-1">
                        {phenology.sideB.estadio && (
                          <li>
                            <span className="text-slate-500">Estádio:</span> {phenology.sideB.estadio}
                          </li>
                        )}
                        {phenology.sideB.vigor && (
                          <li>
                            <span className="text-slate-500">Vigor:</span> {phenology.sideB.vigor}
                          </li>
                        )}
                        {phenology.sideB.uniformidade && (
                          <li>
                            <span className="text-slate-500">Uniformidade:</span> {phenology.sideB.uniformidade}
                          </li>
                        )}
                        {phenology.sideB.observacao && (
                          <li>
                            <span className="text-slate-500">Obs.:</span> {phenology.sideB.observacao}
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

          </motion.section>

          <motion.section id="radicular" {...fadeIn} className="scroll-mt-36 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-teal-600 pl-3">Sistema radicular</h2>
            <p className="text-sm text-slate-600">Profundidade, peso e sanidade radicular comparados entre os manejos.</p>

            {(kpisA.profundidadeRaizCm != null ||
              kpisB.profundidadeRaizCm != null ||
              kpisA.pesoRaizG != null ||
              kpisB.pesoRaizG != null ||
              kpisA.rootRating ||
              kpisB.rootRating) ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                {barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso')).length > 0 ? (
                  <div className="h-56 w-full overflow-x-auto" style={{ minHeight: 200 }}>
                    <ResponsiveContainer width="100%" height={200} minWidth={280}>
                      <BarChart
                        data={barKpis.filter((r) => r.name.includes('Raiz') || r.name.includes('Peso'))}
                        layout="vertical"
                        margin={{ left: 80 }}
                      >
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="name" width={70} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="a" name={sideAName} fill={COLOR_SIDE_A} radius={[0, 4, 4, 0]} />
                        <Bar dataKey="b" name={sideBName} fill={COLOR_SIDE_B} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  {kpisA.rootRating && (
                    <div>
                      <span className="text-slate-500">Sanidade raiz {sideAName}: </span>
                      {kpisA.rootRating.label} ({kpisA.rootRating.score}/{kpisA.rootRating.max})
                    </div>
                  )}
                  {kpisB.rootRating && (
                    <div>
                      <span className="text-slate-500">Sanidade raiz {sideBName}: </span>
                      {kpisB.rootRating.label} ({kpisB.rootRating.score}/{kpisB.rootRating.max})
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhum dado radicular (profundidade, peso ou sanidade) foi registrado neste relatório.
              </p>
            )}
          </motion.section>

          <motion.section id="fitossanidade" {...fadeIn} className="scroll-mt-36 space-y-6">
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-orange-600 pl-3">Fitossanidade</h2>
            <p className="text-sm text-slate-600">Principais problemas e incidência declarada no relatório.</p>
            {ocorrencias.length > 0 ? (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...ocorrencias]
                    .sort((a, b) => (b.incidenciaPct ?? 0) - (a.incidenciaPct ?? 0))
                    .map((o, i) => (
                      <motion.div
                        key={i}
                        whileHover={{ y: -3 }}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <p className="text-xs font-semibold uppercase text-slate-500">Problema / alvo</p>
                        <p className="text-lg font-bold text-slate-900 mt-1">{o.nomeAlvo || 'Alvo não nomeado'}</p>
                        {o.tipo && <p className="text-sm text-slate-600 mt-1">Tipo: {o.tipo}</p>}
                        <div className="mt-3 flex flex-wrap gap-3 text-sm">
                          {o.incidenciaPct != null && (
                            <span className="inline-flex items-center rounded-lg bg-orange-50 text-orange-900 px-3 py-1 font-semibold border border-orange-100">
                              {formatPercent(o.incidenciaPct)} incidência
                            </span>
                          )}
                          {o.severidade && (
                            <span className="inline-flex items-center rounded-lg bg-slate-100 text-slate-800 px-3 py-1 font-medium border border-slate-200">
                              Severidade: {o.severidade}
                            </span>
                          )}
                        </div>
                        {o.recomendacao && (
                          <p className="text-sm text-slate-700 mt-3 pt-3 border-t border-slate-100">
                            <span className="font-medium text-slate-800">Recomendação: </span>
                            {o.recomendacao}
                          </p>
                        )}
                      </motion.div>
                    ))}
                </div>
                {ocorrenciasChart.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-800 mb-3">Distribuição (incidência %)</h3>
                    <div className="h-44 w-full" style={{ minHeight: 160 }}>
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={ocorrenciasChart}>
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="incidencia" name="Incidência %" fill="#E65100" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhuma ocorrência registrada.
              </p>
            )}
          </motion.section>

          <motion.section id="evidencias" {...fadeIn} className="scroll-mt-36 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-l-4 border-sky-600 pl-3">Evidências fotográficas</h2>
            <p className="text-sm text-slate-600">Comparativo visual por categoria, quando as fotos estão classificadas no JSON.</p>
            {photosA.length > 0 || photosB.length > 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm overflow-hidden">
                {photosByCategory.length > 0 ? (
                  <div className="space-y-8">
                    {photosByCategory.map((group) => (
                      <div key={group.category}>
                        <h4 className="text-sm font-medium text-slate-600 mb-3">{group.label}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-xs font-semibold mb-2" style={{ color: COLOR_SIDE_A }}>
                              {sideAName}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {group.photosA.map((ph, i) => (
                                <PhotoWithHotspots key={i} ph={ph} accentClass="text-slate-600" />
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold mb-2" style={{ color: COLOR_SIDE_B }}>
                              {sideBName}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {group.photosB.map((ph, i) => (
                                <PhotoWithHotspots key={i} ph={ph} accentClass="text-slate-600" />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="font-medium mb-3" style={{ color: COLOR_SIDE_A }}>
                        {sideAName}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {photosA.map((ph, i) => (
                          <PhotoWithHotspots key={i} ph={ph} accentClass="text-slate-600" />
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-3" style={{ color: COLOR_SIDE_B }}>
                        {sideBName}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {photosB.map((ph, i) => (
                          <PhotoWithHotspots key={i} ph={ph} accentClass="text-slate-600" />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhuma foto de evidência foi anexada a este relatório.
              </p>
            )}
          </motion.section>

          <motion.section id="tratamento" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-blue-600 pl-3">Protocolo do ensaio (plano)</h2>
            <p className="text-sm text-slate-600 mb-6">Tratamento planejado antes da execução em campo.</p>
            {!hasTreatment ? (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhum protocolo planejado foi registrado para este relatório.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {treatmentSides.map((s) => {
                  const isA = s.side === 'A';
                  const headerBg = isA ? 'bg-blue-600' : 'bg-emerald-600';
                  const borderRing = isA ? 'ring-blue-200' : 'ring-emerald-200';
                  const plannedSum = (s.products ?? []).reduce((acc, p) => acc + (p.cost_per_ha ?? 0), 0);
                  const protocolPhoto = pickHeroPhoto(isA ? photosA : photosB);
                  return (
                    <motion.div
                      key={s.side + s.name}
                      whileHover={{ y: -2 }}
                      className={`rounded-2xl overflow-hidden border border-slate-200 shadow-md ring-2 ${borderRing} bg-white`}
                    >
                      <div className={`${headerBg} text-white px-4 py-3 flex items-center gap-2`}>
                        <span className="font-bold">
                          [{s.side}] {s.name}
                        </span>
                      </div>
                      {protocolPhoto?.url ? (
                        <div className="px-3 pt-3">
                          <PhotoWithHotspots ph={protocolPhoto} accentClass="text-slate-500" />
                        </div>
                      ) : null}
                      <div className="p-5 space-y-3 text-sm">
                        {s.description && (
                          <p>
                            <span className="text-slate-500">Descrição: </span>
                            {s.description}
                          </p>
                        )}
                        {s.expected_result && (
                          <p>
                            <span className="text-slate-500">Resultado esperado: </span>
                            {s.expected_result}
                          </p>
                        )}
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-500 mb-2">Produtos</p>
                          <ul className="space-y-3">
                            {(s.products ?? []).map((p, i) => (
                              <li key={i} className="border border-slate-100 rounded-lg p-3 bg-slate-50/80">
                                <p className="font-semibold text-slate-900">{p.name}</p>
                                {p.active_ingredient && (
                                  <p className="text-xs text-slate-600 mt-0.5">Ingrediente ativo: {p.active_ingredient}</p>
                                )}
                                <p className="text-xs text-slate-600 mt-1">
                                  Dose: {p.dose != null ? String(p.dose) : '—'}
                                  {p.cost_per_ha != null && (
                                    <span className="ml-2 font-medium text-slate-800">
                                      · R$ {formatNumber(p.cost_per_ha, { decimals: 2 })}/ha
                                    </span>
                                  )}
                                </p>
                              </li>
                            ))}
                          </ul>
                        </div>
                        {plannedSum > 0 && (
                          <p className="text-sm font-medium text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2 inline-block">
                            Soma custos planejados (itens): R$ {formatNumber(plannedSum, { decimals: 2 })}/ha
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.section>

          <motion.section id="diagnostico" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-2 border-l-4 border-rose-600 pl-3">Diagnóstico técnico</h2>
            <p className="text-sm text-slate-600 mb-6">Síntese estruturada para decisão em campo.</p>
            {diagnosis?.problemaPrincipal ||
            diagnosis?.causaProvavel ||
            diagnosis?.urgencia ||
            diagnosis?.planoAcao ||
            (diagnosis?.problemasSecundarios && diagnosis.problemasSecundarios.length > 0) ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnosis?.problemaPrincipal && (
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2"
                  >
                    <p className="text-xs font-semibold uppercase text-slate-500">Problema principal</p>
                    <p className="text-base font-semibold text-slate-900 mt-1">{diagnosis.problemaPrincipal}</p>
                  </motion.div>
                )}
                {diagnosis?.problemasSecundarios && diagnosis.problemasSecundarios.length > 0 && (
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:col-span-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Problemas secundários</p>
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-800 space-y-1">
                      {diagnosis.problemasSecundarios.map((x, i) => (
                        <li key={i}>{x}</li>
                      ))}
                    </ul>
                  </motion.div>
                )}
                {diagnosis?.causaProvavel && (
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-slate-500">Causa provável</p>
                    <p className="text-sm text-slate-800 mt-2 leading-relaxed">{diagnosis.causaProvavel}</p>
                  </motion.div>
                )}
                {diagnosis?.urgencia && (
                  <motion.div whileHover={{ y: -2 }} className="rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase text-amber-900">Urgência</p>
                    <p className="text-sm font-semibold text-amber-950 mt-2">{diagnosis.urgencia}</p>
                  </motion.div>
                )}
                {diagnosis?.planoAcao && (
                  <motion.div
                    whileHover={{ y: -2 }}
                    className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-sm md:col-span-2"
                  >
                    <p className="text-xs font-semibold uppercase text-emerald-900">Plano de ação</p>
                    <p className="text-sm text-slate-800 mt-2 leading-relaxed">{diagnosis.planoAcao}</p>
                  </motion.div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhum bloco de diagnóstico estruturado foi enviado neste relatório.
              </p>
            )}
          </motion.section>

          <motion.section id="economico" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-6 border-l-4 border-amber-600 pl-3">Econômico</h2>
            {!hasEcon ? (
              <p className="text-sm text-slate-500 rounded-2xl border border-dashed border-slate-200 bg-white p-6">
                Nenhum dado econômico disponível neste relatório (custos, colheita, preço de saca ou resultado por produto).
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {custoParsed?.by_side && custoParsed.by_side.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4">
                    <h3 className="font-semibold text-slate-900">Custos</h3>
                    {custoParsed.by_side.map((row, i) => (
                      <div
                        key={i}
                        className="border border-slate-100 rounded-xl p-4"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: row.side === 'A' ? COLOR_SIDE_A : COLOR_SIDE_B,
                        }}
                      >
                        <p className="font-medium text-slate-900">
                          [{row.side}] {row.sideName || `Tratamento ${row.side}`}
                        </p>
                        {row.costPerHa != null && (
                          <p className="text-sm text-slate-700 mt-1">R$ {formatNumber(row.costPerHa, { decimals: 2 })}/ha</p>
                        )}
                        {row.totalCost != null && (
                          <p className="text-xs text-slate-500">Total: R$ {formatNumber(row.totalCost, { decimals: 2 })}</p>
                        )}
                      </div>
                    ))}
                    {custoParsed.deltaCostPerHa_B_vs_A != null && (
                      <p className="text-sm font-medium text-slate-800 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                        Δ custo (B − A): R$ {formatNumber(custoParsed.deltaCostPerHa_B_vs_A, { decimals: 2 })}/ha
                      </p>
                    )}
                  </div>
                )}

                {colheitaParsed?.sides && colheitaParsed.sides.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-3">
                    <h3 className="font-semibold text-slate-900">Colheita / produtividade</h3>
                    {colheitaParsed.sides.map((s, i) => (
                      <div key={i} className="text-sm border-b border-slate-100 pb-2 last:border-0">
                        <p className="font-medium text-slate-800">
                          [{s.side}] {s.sideName || `Tratamento ${s.side}`}
                        </p>
                        {s.yieldScHa != null && <p>Produtividade: {formatNumber(s.yieldScHa, { decimals: 2 })} sc/ha</p>}
                        {s.yieldKgHa != null && <p>Produtividade: {formatNumber(s.yieldKgHa, { decimals: 0 })} kg/ha</p>}
                        {s.areaHa != null && <p className="text-slate-500 text-xs">Área: {formatNumber(s.areaHa, { decimals: 2 })} ha</p>}
                      </div>
                    ))}
                  </div>
                )}

                {economia?.preco_saca_brl != null && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm md:col-span-2">
                    <h3 className="font-semibold text-slate-900 mb-2">Preço de referência (saca)</h3>
                    <p className="text-lg font-bold text-emerald-800">
                      R$ {formatNumber(economia.preco_saca_brl, { decimals: 2 })}/sc
                    </p>
                    {economia.fonte_preco && <p className="text-xs text-slate-500 mt-1">Fonte: {economia.fonte_preco}</p>}
                    {receitaPorLado && receitaPorLado.some((r) => r.receita != null) && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {receitaPorLado.map((r, i) =>
                          r.receita != null ? (
                            <div key={i} className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm">
                              <p className="font-medium text-slate-800">{r.sideName || `Lado ${r.side}`}</p>
                              <p>
                                Receita bruta estimada: <strong>R$ {formatNumber(r.receita, { decimals: 2 })}/ha</strong>
                              </p>
                              {r.sc != null && (
                                <p className="text-xs text-slate-500">Base: {formatNumber(r.sc, { decimals: 2 })} sc/ha</p>
                              )}
                            </div>
                          ) : null,
                        )}
                      </div>
                    )}
                  </div>
                )}

                {productsResult && productsResult.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm md:col-span-2">
                    <h3 className="font-semibold text-slate-900 mb-2">Resultado por produto (`products_result`)</h3>
                    <pre className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto">
                      {JSON.stringify(productsResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </motion.section>

          <motion.section id="conclusao" {...fadeIn} className="scroll-mt-36">
            <h2 className="text-lg font-bold text-slate-900 mb-4 border-l-4 border-slate-800 pl-3">Conclusão</h2>
            <p className="text-sm text-slate-600 mb-4">Síntese final, recomendações e assinatura técnica.</p>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm space-y-4 text-sm">
              {conclusion.summary && <p className="text-slate-800 leading-relaxed">{conclusion.summary}</p>}
              {diagnostics?.recommendations && diagnostics.recommendations.length > 0 && (
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {diagnostics.recommendations.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              )}
              {conclusion.recommendations && conclusion.recommendations.length > 0 && (
                <div>
                  <p className="font-medium text-slate-800 mb-2">Recomendações</p>
                  <ol className="list-decimal list-inside text-slate-700 space-y-1">
                    {conclusion.recommendations.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ol>
                </div>
              )}
              {conclusion.signature && (conclusion.signature.name || conclusion.signature.crea || conclusion.signature.city) && (
                <div className="pt-4 border-t border-slate-200">
                  <p className="font-semibold text-slate-900">{conclusion.signature.name}</p>
                  {conclusion.signature.crea && <p className="text-sm text-slate-600">CREA: {conclusion.signature.crea}</p>}
                  {conclusion.signature.city && <p className="text-sm text-slate-600">{conclusion.signature.city}</p>}
                </div>
              )}
            </div>
          </motion.section>

          <footer className="text-center text-sm text-slate-500 py-8 border-t border-slate-200">
            <p>Relatório gerado pelo FortSmart Agro</p>
            <p className="mt-1">
              {formatDate(meta.createdAt)} · {meta.appVersion || '—'} · ID: {meta.reportId || reportId || '—'}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}

function ExecutionEventCard({ ev, compact }: { ev: ReportApplicationEventV2Json; compact?: boolean }) {
  const c = ev.climate;
  const t = ev.applicationTech;
  const pad = compact ? 'p-4' : 'p-5';
  return (
    <motion.div
      whileHover={{ x: 2 }}
      className={`relative pl-5 border-l-4 border-emerald-500 border-y border-r border-slate-200 bg-white rounded-r-2xl shadow-sm ${pad}`}
    >
      <div className="flex flex-wrap gap-2 items-baseline justify-between">
        <div>
          <span className="text-xs font-semibold uppercase text-slate-500">Data</span>
          <p className="font-semibold text-slate-900">{ev.date ? formatDate(ev.date) : '—'}</p>
        </div>
        {ev.daa != null && (
          <span className="text-sm font-medium bg-slate-100 text-slate-800 px-2 py-1 rounded-lg">{ev.daa} DAA</span>
        )}
        <span
          className={`text-xs font-bold px-2 py-1 rounded ${
            ev.side === 'A' ? 'bg-blue-100 text-blue-900' : 'bg-emerald-100 text-emerald-900'
          }`}
        >
          Lado {ev.side}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <p className="font-medium text-slate-800">{ev.type || 'Aplicação'}</p>
        {ev.stage && (
          <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
            {ev.stage}
          </span>
        )}
      </div>
      {ev.responsible && <p className="text-xs text-slate-500 mt-1">Responsável: {ev.responsible}</p>}
      {!compact && ev.scope && <p className="text-xs text-slate-500">Escopo: {ev.scope}</p>}
      {!compact && ev.point_ids && ev.point_ids.length > 0 && (
        <p className="text-xs text-slate-500">Pontos: {ev.point_ids.join(', ')}</p>
      )}
      {c && (c.temperature != null || c.humidity != null || c.wind != null || c.derivaRisco) && (
        <div className="mt-3 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
          <span className="font-semibold text-slate-600">Clima: </span>
          {[
            c.temperature != null ? `${c.temperature}°C` : null,
            c.humidity != null ? `${c.humidity}%` : null,
            c.wind != null ? `Vento ${formatWind(c.wind)}` : null,
            c.derivaRisco || null,
          ]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
      {(t?.bico != null || t?.vazao != null || t?.pressao != null) && (
        <div className="mt-2 text-sm text-slate-700">
          <span className="font-semibold text-slate-600">Tecnologia: </span>
          {[t?.bico && `Bico ${t.bico}`, t?.vazao != null && `Vazão ${t.vazao} L/min`, t?.pressao != null && `Pressão ${t.pressao}`]
            .filter(Boolean)
            .join(' · ')}
        </div>
      )}
      {ev.products && ev.products.length > 0 && (
        <ul className="mt-4 space-y-2">
          {ev.products.map((p, j) => (
            <li key={j} className="text-sm border border-slate-100 rounded-lg p-3 bg-slate-50/80">
              <div className="flex flex-wrap gap-2 justify-between items-start">
                <span className="font-semibold text-slate-900">{p.nomeComercial || 'Produto'}</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {p.classe && (
                    <span className="text-xs font-medium bg-white text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                      {p.classe}
                    </span>
                  )}
                  {p.linkedProtocolItemId ? (
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full">
                      Protocolo
                    </span>
                  ) : null}
                </div>
              </div>
              {p.nomeAtivo && <p className="text-xs text-slate-600 mt-1">→ Ativo: {p.nomeAtivo}</p>}
              <p className="text-xs text-slate-600 mt-1">
                → Dose:{' '}
                {p.dose != null && p.unidade ? `${p.dose} ${p.unidade}` : p.dose != null ? String(p.dose) : '—'}
                {p.custoHa != null && (
                  <span className="ml-2 font-medium text-slate-800">
                    · R$ {formatNumber(p.custoHa, { decimals: 2 })}/ha
                  </span>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
