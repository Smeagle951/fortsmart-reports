'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportApplicationEventV2Json } from '@/types/side-by-side-report';
import FieldCollectionModulesSection from '@/components/lado_a_lado/premium/FieldCollectionModulesSection';
import EditorialLadoALadoAboveFold from '@/components/lado_a_lado/premium/EditorialLadoALadoAboveFold';
import SidePhotoGallerySection from '@/components/lado_a_lado/premium/SidePhotoGallerySection';
import TreatmentExecutionCombinedSection from '@/components/lado_a_lado/premium/TreatmentExecutionCombinedSection';
import { isColheitaJson, isCustoJson, formatWind } from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatDate, formatNumber } from '@/utils/format';
import { displayWinnerLetter, winnerFromJson } from '@/components/lado_a_lado/premium/premiumInference';

function testName(data: SideBySideReportData, side: 'A' | 'B'): string {
  const n = (side === 'A' ? data.sideA?.name : data.sideB?.name)?.trim();
  if (n) return n;
  const lab = (side === 'A' ? data.sideA?.label : data.sideB?.label)?.trim();
  if (lab) return lab;
  return `Tratamento ${side} (nomeie no app em Nova avaliação)`;
}

function hasFieldCollection(data: SideBySideReportData): boolean {
  const fcm = data.field_collection_modules;
  if (fcm == null || typeof fcm !== 'object' || Array.isArray(fcm)) return false;
  const pts = (fcm as { points?: unknown }).points;
  return Array.isArray(pts) && pts.length > 0;
}

function produtosLinha(ev: ReportApplicationEventV2Json): string {
  return (
    ev.products
      ?.map((p) => {
        const d = p.dose != null ? `${p.dose}${p.unidade ? ` ${p.unidade}` : ''}` : '';
        return [p.nomeComercial || p.nomeAtivo || '—', d].filter(Boolean).join(' · ');
      })
      .join(' | ') || '—'
  );
}

function climaLinha(ev: ReportApplicationEventV2Json): string {
  const c = ev.climate;
  if (!c) return '—';
  const bits = [
    c.temperature != null ? `${c.temperature}°C` : null,
    c.humidity != null ? `${c.humidity}% UR` : null,
    c.wind != null ? `vento ${formatWind(c.wind)}` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(' · ') : '—';
}

function techLinha(ev: ReportApplicationEventV2Json): string {
  const t = ev.applicationTech;
  if (!t) return '—';
  const bits = [
    t.bico ? `bico ${t.bico}` : null,
    t.vazao != null ? `${t.vazao} L/min` : null,
    t.pressao != null ? `pressão ${t.pressao}` : null,
  ].filter(Boolean);
  return bits.length ? bits.join(' · ') : '—';
}

function AgrSection({
  id,
  kicker,
  title,
  subtitle,
  sectionNum,
  children,
}: {
  id: string;
  kicker: string;
  title: string;
  subtitle?: string;
  /** Numeração editorial (mockup HTML + mapa JSON) */
  sectionNum?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0.9, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-32px 0px -8px 0px' }}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="scroll-mt-36 border-b border-slate-200/80 pb-6 pt-6 print:break-inside-avoid sm:pb-7 sm:pt-7"
    >
      {sectionNum ? (
        <header className="mb-4 sm:mb-5">
          <div className="fs-l2-section-head items-start">
            <div className="fs-l2-section-num">{sectionNum}</div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-emerald-900/90">{kicker}</p>
              <h2 className="fs-l2-section-title mt-1 !text-lg sm:!text-xl">{title}</h2>
              {subtitle ? (
                <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">{subtitle}</p>
              ) : null}
            </div>
            <div className="fs-l2-section-rule max-md:hidden mt-4 min-w-[48px]" />
          </div>
        </header>
      ) : (
        <header className="mb-3 sm:mb-4">
          <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-emerald-800">{kicker}</p>
          <h2 className="mt-0.5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-800 bg-clip-text text-lg font-bold tracking-tight text-transparent sm:text-xl">
            {title}
          </h2>
          {subtitle ? <p className="mt-1 max-w-3xl text-xs leading-relaxed text-slate-600 sm:text-sm">{subtitle}</p> : null}
        </header>
      )}
      {children}
    </motion.section>
  );
}

const NAV: { id: string; label: string }[] = [
  { id: 'l2-resumo', label: 'Resumo' },
  { id: 'l2-pontos', label: 'Pontos' },
  { id: 'l2-coleta', label: 'Coleta' },
  { id: 'l2-tratamento', label: 'Tratamento' },
  { id: 'l2-colheita', label: 'Colheita' },
  { id: 'l2-custo', label: 'Custo' },
  { id: 'l2-fotos', label: 'Fotos' },
  { id: 'l2-conclusao', label: 'Conclusão' },
];

export default function LadoALadoRelatorioAgronomico({ data }: { data: SideBySideReportData }) {
  const farm = data.farm ?? {};
  const nameA = testName(data, 'A');
  const nameB = testName(data, 'B');
  const points = data.points ?? [];
  const apps = data.applications ?? [];
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const custosExtra = data.custos ?? [];
  const preco = data.economia?.preco_saca_brl ?? data.market_reference?.price_sack_brl ?? null;
  const winnerLetter = displayWinnerLetter(data);
  const winnerDeclared = winnerFromJson(data);
  const winnerLabel =
    winnerDeclared === 'A' ? nameA : winnerDeclared === 'B' ? nameB : winnerLetter === 'A' ? nameA : winnerLetter === 'B' ? nameB : null;

  const sortedApps = [...apps].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  const kg = colheita?.kgPerSack ?? 60;
  const rowA = colheita?.sides?.find((s) => s.side === 'A');
  const rowB = colheita?.sides?.find((s) => s.side === 'B');
  const sc = (row: typeof rowA) => {
    if (!row) return null;
    if (row.yieldScHa != null) return row.yieldScHa;
    if (row.yieldKgHa != null && kg > 0) return row.yieldKgHa / kg;
    return null;
  };
  const scA = sc(rowA);
  const scB = sc(rowB);

  const showColheita = colheita != null && (colheita.sides?.length ?? 0) > 0;
  const showCusto = (custo != null && custo.by_side?.length) || custosExtra.length > 0 || preco != null;
  const hasFotos = ((data.sideA?.photos?.length ?? 0) + (data.sideB?.photos?.length ?? 0)) > 0;

  return (
    <div className="fs-l2-body-bg">
      <EditorialLadoALadoAboveFold data={data} />

      <nav
        className="fs-l2-nav premium-nav-bar sticky top-[52px] z-30 print:hidden"
        aria-label="Secções do relatório"
      >
        <div className="mx-auto flex max-w-[1200px] gap-0.5 overflow-x-auto px-2 py-1 sm:px-3">
          {NAV.map((n) => (
            <motion.button
              key={n.id}
              type="button"
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="shrink-0 rounded-t-md border-b-2 border-transparent px-2 py-1.5 text-[0.58rem] font-bold uppercase tracking-wide sm:px-2.5 sm:text-[0.6rem]"
            >
              {n.label}
            </motion.button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-[1200px] px-3 pb-12 sm:px-5 sm:pb-14">
        {/* Resumo executivo — tabela única */}
        <AgrSection
          id="l2-resumo"
          sectionNum="02"
          kicker="Visão geral"
          title="Resumo do ensaio"
          subtitle="Leitura rápida com os dados já publicados pelo aplicativo. Complete lacunas na avaliação e regenere o relatório."
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[520px] border-collapse text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <th className="w-48 bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Tratamentos (nomes no app)
                  </th>
                  <td className="px-3 py-2.5 font-medium text-slate-900">
                    {nameA} <span className="text-slate-400">·</span> {nameB}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Pontos de amostragem
                  </th>
                  <td className="px-3 py-2.5">{points.length > 0 ? `${points.length} ponto(s)` : '— não publicados'}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Aplicações registadas
                  </th>
                  <td className="px-3 py-2.5">{apps.length > 0 ? `${apps.length} evento(s)` : '—'}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Produtividade (sc/ha)
                  </th>
                  <td className="px-3 py-2.5">
                    {scA != null || scB != null
                      ? `${nameA}: ${scA != null ? formatNumber(scA, { decimals: 1 }) : '—'} · ${nameB}: ${scB != null ? formatNumber(scB, { decimals: 1 }) : '—'}`
                      : '— publique colheita ou estimativa'}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Custo (R$/ha)
                  </th>
                  <td className="px-3 py-2.5">
                    {custo?.by_side?.length
                      ? custo.by_side
                          .map((r) => {
                            const lab = r.sideName?.trim() || (r.side === 'A' ? nameA : nameB);
                            return `${lab}: ${r.costPerHa != null ? `R$ ${formatNumber(r.costPerHa, { decimals: 2 })}` : '—'}`;
                          })
                          .join(' · ')
                      : '— publique custos por manejo'}
                  </td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-3 py-2.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Indicação técnica
                  </th>
                  <td className="px-3 py-2.5 font-semibold text-emerald-900">
                    {winnerLabel
                      ? `Favorecido neste relatório: ${winnerLabel} (conclusão e/ou indicadores publicados).`
                      : 'Sem vencedor explícito — complete a conclusão no app ou publique mais indicadores comparáveis.'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </AgrSection>

        {/* Pontos */}
        <AgrSection
          id="l2-pontos"
          sectionNum="03"
          kicker="Amostragem"
          title="Pontos da avaliação"
          subtitle="Ordem e estado dos pontos tal como registados na avaliação."
        >
          {points.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Nenhum ponto foi publicado neste JSON. Confirme na avaliação lado a lado se os pontos estão guardados e volte a
              publicar o relatório.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[400px] border-collapse text-left text-sm">
                <thead className="bg-slate-900 text-xs font-bold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Identificação</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {points.map((p, i) => (
                    <tr key={i} className="bg-white">
                      <td className="px-3 py-2 tabular-nums font-semibold">{p.indexNo ?? i + 1}</td>
                      <td className="px-3 py-2">{p.name?.trim() || '—'}</td>
                      <td className="px-3 py-2">{p.status?.trim() || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AgrSection>

        {/* Coleta — módulos (identificação, fenologia, estande, raiz, pragas, etc.) */}
        <AgrSection
          id="l2-coleta"
          sectionNum="04"
          kicker="Coleta em campo"
          title="Coleta por módulo (A vs B)"
          subtitle="Identificação, fenologia, estande, estrutura de plantas, raiz, pragas, doenças, daninhas e demais módulos preenchidos no app — em formato tabular."
        >
          {hasFieldCollection(data) ? (
            <FieldCollectionModulesSection data={data} sectionId="l2-coleta-modulos" compact />
          ) : (
            <p className="rounded-lg border border-dashed border-amber-200 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
              Sem bloco <code className="rounded bg-white/80 px-1 text-xs">field_collection_modules</code> no relatório. Preencha os
              módulos na visita de campo e publique novamente.
            </p>
          )}
        </AgrSection>

        {/* Tratamento: cronologia + detalhe por teste */}
        <div id="l2-tratamento" className="scroll-mt-36 border-b border-slate-200/80 pb-10 pt-8 print:break-inside-avoid">
          <header className="mb-5">
            <div className="fs-l2-section-head items-start">
              <div className="fs-l2-section-num">05</div>
              <div className="min-w-0 flex-1">
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-emerald-900/90">Manejo e aplicações</p>
                <h2 className="fs-l2-section-title mt-1 !text-xl sm:!text-2xl">Tratamento e aplicações</h2>
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
                  Pacote planejado e execuções com clima, equipamento, produtos e{' '}
                  <strong>observações obrigatórias por aplicação</strong> (registadas no app). Se a coluna observações estiver vazia,
                  complete no registo da aplicação e publique de novo.
                </p>
              </div>
              <div className="fs-l2-section-rule max-md:hidden mt-6 min-w-[48px]" />
            </div>
          </header>

          {sortedApps.length > 0 ? (
            <div className="mb-8 overflow-x-auto rounded-lg border border-slate-200">
              <p className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-600">
                Cronologia — todas as aplicações
              </p>
              <table className="w-full min-w-[880px] border-collapse text-left text-xs sm:text-sm">
                <thead className="bg-slate-900 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
                  <tr>
                    <th className="px-2 py-2">Data</th>
                    <th className="px-2 py-2">Teste</th>
                    <th className="px-2 py-2">DAA</th>
                    <th className="px-2 py-2">Tipo</th>
                    <th className="px-2 py-2">Produtos</th>
                    <th className="px-2 py-2">Clima</th>
                    <th className="px-2 py-2">Equipamento</th>
                    <th className="px-2 py-2 min-w-[140px]">Observações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedApps.map((ev, i) => (
                    <tr key={ev.id || `${ev.date}-${i}`} className="bg-white">
                      <td className="whitespace-nowrap px-2 py-2 font-medium">{ev.date ? formatDate(ev.date) : '—'}</td>
                      <td className="px-2 py-2 font-semibold text-slate-900">{ev.side === 'B' ? nameB : nameA}</td>
                      <td className="px-2 py-2 tabular-nums">{ev.daa ?? '—'}</td>
                      <td className="px-2 py-2">{ev.type || '—'}</td>
                      <td className="max-w-[220px] px-2 py-2 text-slate-700">{produtosLinha(ev)}</td>
                      <td className="px-2 py-2 text-slate-600">{climaLinha(ev)}</td>
                      <td className="px-2 py-2 text-slate-600">{techLinha(ev)}</td>
                      <td className="px-2 py-2 text-slate-800">
                        {ev.notes?.trim() ? (
                          <span className="whitespace-pre-wrap">{ev.notes.trim()}</span>
                        ) : (
                          <span className="italic text-amber-800">Sem observação — registar no app</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          <TreatmentExecutionCombinedSection data={data} embedded />
        </div>

        {showColheita ? (
          <AgrSection
            id="l2-colheita"
            sectionNum="06"
            kicker="Resultado de campo"
            title="Colheita"
            subtitle="Produtividade publicada por teste."
          >
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[400px] border-collapse text-left text-sm">
                <thead className="bg-slate-900 text-xs font-bold uppercase tracking-wide text-white">
                  <tr>
                    <th className="px-3 py-2">Teste</th>
                    <th className="px-3 py-2">sc/ha</th>
                    <th className="px-3 py-2">kg/ha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(colheita?.sides ?? []).map((s, i) => (
                    <tr key={i} className="bg-white">
                      <td className="px-3 py-2 font-semibold">
                        {s.sideName?.trim() || (s.side === 'A' ? nameA : s.side === 'B' ? nameB : s.side)}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.yieldScHa != null ? formatNumber(s.yieldScHa, { decimals: 1 }) : '—'}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {s.yieldKgHa != null ? formatNumber(s.yieldKgHa, { decimals: 0 }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AgrSection>
        ) : null}

        {showCusto ? (
          <AgrSection
            id="l2-custo"
            sectionNum="07"
            kicker="Economia de campo"
            title="Custos e referência"
            subtitle="Fechamento por hectare quando existir no payload."
          >
            <div className="space-y-4">
              {preco != null ? (
                <p className="text-sm">
                  <span className="font-semibold text-slate-700">Preço de referência (saca):</span>{' '}
                  <span className="tabular-nums font-bold text-slate-900">R$ {formatNumber(preco, { decimals: 2 })}/sc</span>
                </p>
              ) : null}
              {custo?.by_side?.length ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <table className="w-full min-w-[360px] border-collapse text-left text-sm">
                    <thead className="bg-slate-900 text-xs font-bold uppercase tracking-wide text-white">
                      <tr>
                        <th className="px-3 py-2">Teste</th>
                        <th className="px-3 py-2">R$/ha</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custo.by_side.map((r, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-3 py-2 font-medium">{r.sideName?.trim() || (r.side === 'A' ? nameA : nameB)}</td>
                          <td className="px-3 py-2 tabular-nums">
                            {r.costPerHa != null ? `R$ ${formatNumber(r.costPerHa, { decimals: 2 })}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {custosExtra.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-slate-200">
                  <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold uppercase text-slate-600">
                    Custos por subárea / rubrica
                  </p>
                  <table className="w-full min-w-[520px] border-collapse text-left text-xs sm:text-sm">
                    <thead className="bg-slate-100 text-[10px] font-bold uppercase text-slate-600">
                      <tr>
                        <th className="px-2 py-2">Descrição</th>
                        <th className="px-2 py-2">R$/ha</th>
                        <th className="px-2 py-2">Tratamento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {custosExtra.map((c, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-2 py-2">{c.descricao || c.tipo || '—'}</td>
                          <td className="px-2 py-2 tabular-nums">
                            {c.valor_por_ha != null ? formatNumber(c.valor_por_ha, { decimals: 2 }) : '—'}
                          </td>
                          <td className="px-2 py-2">{c.tratamento ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          </AgrSection>
        ) : null}

        <AgrSection
          id="l2-fotos"
          sectionNum="08"
          kicker="Evidências"
          title="Fotos e legendas"
          subtitle="Imagens publicadas pelo aplicativo, com legenda e categoria quando existirem no registro."
        >
          {hasFotos ? (
            <SidePhotoGallerySection data={data} embedded />
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Nenhuma foto foi publicada neste relatório. Anexe imagens por teste na avaliação e publique novamente.
            </p>
          )}
        </AgrSection>

        {/* Conclusão — sempre visível */}
        <AgrSection
          id="l2-conclusao"
          sectionNum="09"
          kicker="Encerramento"
          title="Conclusão do experimento"
          subtitle="Síntese do agrónomo sobre os dois testes, vantagens e recomendações — texto real do aplicativo."
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
            <p className="text-sm font-semibold text-slate-800">
              {data.conclusion?.headline?.trim() || 'Sem título de conclusão publicado.'}
            </p>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-700">
              {data.conclusion?.summary?.trim() ? (
                <p className="whitespace-pre-wrap">{data.conclusion.summary.trim()}</p>
              ) : (
                <p className="rounded-md border border-amber-200 bg-amber-50/80 px-3 py-2 text-amber-950">
                  Não há texto de conclusão no relatório. No app, na avaliação lado a lado, preencha a conclusão (ambos os lados,
                  vantagens e decisão) e publique novamente.
                </p>
              )}
            </div>
            {(data.conclusion?.recommendations ?? []).filter(Boolean).length > 0 ? (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Recomendações</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {(data.conclusion!.recommendations ?? []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {winnerDeclared ? (
              <p className="mt-5 text-sm font-bold text-emerald-900">
                Manejo indicado na conclusão publicada: {winnerDeclared === 'A' ? nameA : nameB}
              </p>
            ) : null}
            {data.conclusion?.signature?.name ? (
              <p className="mt-4 text-xs text-slate-500">
                Responsável: {data.conclusion.signature.name}
                {data.conclusion.signature.crea ? ` · CREA ${data.conclusion.signature.crea}` : ''}
              </p>
            ) : null}
          </div>
        </AgrSection>
      </div>
    </div>
  );
}
