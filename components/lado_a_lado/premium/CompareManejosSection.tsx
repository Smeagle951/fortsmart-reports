'use client';

import { motion } from 'framer-motion';
import type { SideBySideReportData } from '@/components/SideBySideReportContent';
import type { ReportPhotoWeb } from '@/types/side-by-side-report';
import {
  COLOR_SIDE_A,
  COLOR_SIDE_B,
  isColheitaJson,
  isCustoJson,
  pickHeroPhoto,
} from '@/components/lado_a_lado/ladoALadoHelpers';
import { formatNumber } from '@/utils/format';
import { winnerFromJson } from './premiumInference';

type Side = 'A' | 'B';

const COMPARATIVO_SUBTITLE_DEFAULT =
  'Comparação lado a lado na mesma hierarquia visual (A azul, B verde). O selo de melhor desempenho segue a conclusão técnica registada na avaliação; se não existir, o sistema pode destacar o manejo com melhor conjunto de indicadores, desde que não seja empate.';

function comparativoSubtitle(data: SideBySideReportData): string {
  const t = data.comparativo_intro?.trim();
  return t && t.length > 0 ? t : COMPARATIVO_SUBTITLE_DEFAULT;
}

function Dot({ tone }: { tone: 'good' | 'mid' | 'bad' | 'neutral' }) {
  const cls =
    tone === 'good'
      ? 'bg-emerald-400'
      : tone === 'mid'
        ? 'bg-amber-400'
        : tone === 'bad'
          ? 'bg-red-400'
          : 'bg-white/25';
  return <span className={`inline-block h-2.5 w-2.5 shrink-0 rounded-full ${cls}`} aria-hidden />;
}

type KpisLite = NonNullable<NonNullable<SideBySideReportData['sideA']>['kpis']>;

function vigorTone(kpis: KpisLite | undefined, phenVigor?: string): 'good' | 'mid' | 'bad' | 'neutral' {
  if (kpis?.vigorCulturaPct != null && Number.isFinite(kpis.vigorCulturaPct)) {
    if (kpis.vigorCulturaPct >= 70) return 'good';
    if (kpis.vigorCulturaPct >= 40) return 'mid';
    return 'bad';
  }
  const vr = kpis?.vigorRating;
  const mx = vr?.max ?? 0;
  if (vr?.score != null && mx > 0) {
    const r = vr.score / mx;
    if (r >= 0.7) return 'good';
    if (r >= 0.4) return 'mid';
    return 'bad';
  }
  if (phenVigor?.trim()) return 'mid';
  return 'neutral';
}

function sanidadeTone(kpis: KpisLite | undefined): 'good' | 'mid' | 'bad' | 'neutral' {
  const ft = kpis?.fitotoxidez;
  const mx = ft?.max ?? 10;
  if (ft?.score != null && Number.isFinite(ft.score) && mx > 0) {
    const ratio = ft.score / mx;
    if (ratio <= 0.35) return 'good';
    if (ratio <= 0.65) return 'mid';
    return 'bad';
  }
  const cd = kpis?.controleDaninhasPct;
  if (cd != null && Number.isFinite(cd)) {
    if (cd >= 75) return 'good';
    if (cd >= 45) return 'mid';
    return 'bad';
  }
  return 'neutral';
}

function primaryProductLine(side: Side, data: SideBySideReportData): string | null {
  const s = data.treatment_protocol?.sides?.find((x) => x.side === side);
  const p = s?.products?.[0];
  if (!p?.name?.trim()) return null;
  const dose =
    p.dose != null
      ? `${p.dose}${p.dose_unit ? ` ${p.dose_unit}` : ''}`
      : p.dose_value != null
        ? `${p.dose_value}${p.dose_unit ? ` ${p.dose_unit}` : ''}`
        : '';
  return dose ? `${p.name.trim()} · ${dose}` : p.name.trim();
}

function costForSide(data: SideBySideReportData, side: Side): number | null {
  const custo = isCustoJson(data.custo) ? data.custo : null;
  const row = custo?.by_side?.find((b) => b.side === side);
  return row?.costPerHa != null && Number.isFinite(row.costPerHa) ? row.costPerHa : null;
}

function productivityForSide(
  data: SideBySideReportData,
  side: Side,
): { kgHa: number; sourceLabel: string } | null {
  const colheita = isColheitaJson(data.colheita) ? data.colheita : null;
  const row = colheita?.sides?.find((s) => s.side === side);
  if (row?.yieldKgHa != null && Number.isFinite(row.yieldKgHa)) {
    return { kgHa: row.yieldKgHa, sourceLabel: 'Colheita publicada' };
  }
  const kgSack = colheita?.kgPerSack;
  if (row?.yieldScHa != null && kgSack != null && kgSack > 0 && Number.isFinite(row.yieldScHa)) {
    return { kgHa: row.yieldScHa * kgSack, sourceLabel: 'Colheita (kg/ha a partir de sc/ha)' };
  }
  const kpis = side === 'A' ? data.sideA?.kpis : data.sideB?.kpis;
  if (kpis?.estimatedYieldKgHa != null && Number.isFinite(kpis.estimatedYieldKgHa)) {
    return { kgHa: kpis.estimatedYieldKgHa, sourceLabel: 'Produtividade estimada (KPIs)' };
  }
  return null;
}

function isWitnessSide(data: SideBySideReportData, side: Side): boolean {
  return data.treatment_protocol?.sides?.find((x) => x.side === side)?.is_control_side === true;
}

/** Destaque do card: vencedor declarado no JSON; se ausente, usa `engineOverallWinner` (exceto empate). */
function compareHighlight(data: SideBySideReportData): {
  side: Side | null;
  badge: 'tecnico' | 'motor' | null;
} {
  const app = winnerFromJson(data);
  if (app === 'A' || app === 'B') return { side: app, badge: 'tecnico' };
  const eng = data.decision_layer?.engineOverallWinner;
  if (eng === 'A' || eng === 'B') return { side: eng, badge: 'motor' };
  return { side: null, badge: null };
}

function ManejoCard({
  side,
  data,
  photo,
  isWinnerPick,
  badgeKind,
  dimPeer,
  productivity,
  witness,
}: {
  side: Side;
  data: SideBySideReportData;
  photo: ReportPhotoWeb | undefined;
  isWinnerPick: boolean;
  badgeKind: 'tecnico' | 'motor' | null;
  dimPeer: boolean;
  productivity: { kgHa: number; sourceLabel: string } | null;
  witness: boolean;
}) {
  const isA = side === 'A';
  const name = (isA ? data.sideA?.name : data.sideB?.name) || `Manejo ${side}`;
  const kpis = isA ? data.sideA?.kpis : data.sideB?.kpis;
  const phen = isA ? data.phenology?.sideA : data.phenology?.sideB;
  const vt = vigorTone(kpis, phen?.vigor);
  const st = sanidadeTone(kpis);
  const prod = primaryProductLine(side, data);
  const cost = costForSide(data, side);
  const border = isA ? 'border-blue-200' : 'border-emerald-200';
  const headBg = isA ? 'from-blue-700 to-blue-900' : 'from-emerald-700 to-emerald-900';

  const badgeText =
    isWinnerPick && badgeKind === 'tecnico'
      ? 'Melhor desempenho'
      : isWinnerPick && badgeKind === 'motor'
        ? 'Motor multifator'
        : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-24px' }}
      className={`flex flex-col rounded-2xl border-2 bg-white shadow-md overflow-hidden transition-transform duration-200 ${border} ${
        isWinnerPick
          ? 'ring-2 ring-emerald-600 ring-offset-2 ring-offset-slate-100 md:scale-[1.02] shadow-lg z-[1]'
          : ''
      } ${dimPeer ? 'opacity-75 md:opacity-70' : ''}`}
    >
      <div
        className={`flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-r ${headBg} text-white`}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest opacity-90">Manejo {side}</p>
          <p className="font-bold text-lg truncate">{name}</p>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {witness ? (
            <span className="rounded-full bg-white/20 text-white text-[10px] font-semibold px-2 py-0.5 border border-white/30">
              Testemunha
            </span>
          ) : null}
          {badgeText ? (
            <span className="rounded-full bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1">
              {badgeText}
            </span>
          ) : null}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-4">
        {photo?.url ? (
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-100">
            <img src={photo.url} alt={photo.caption || name} className="h-full w-full object-cover" />
          </div>
        ) : (
          <div className="aspect-[4/3] rounded-xl bg-slate-100 flex items-center justify-center text-sm text-slate-400">
            Foto não publicada
          </div>
        )}
        <div>
          <p className="text-[10px] font-bold uppercase text-slate-500 tracking-wide">Produto principal</p>
          <p className="text-sm font-semibold text-slate-900 mt-0.5 leading-snug">
            {prod ?? 'Protocolo não detalhado no relatório'}
          </p>
        </div>
        {productivity ? (
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
            <p className="text-[10px] font-bold uppercase text-slate-500">Produtividade</p>
            <p className="text-lg font-bold tabular-nums text-slate-900" style={{ color: isA ? COLOR_SIDE_A : COLOR_SIDE_B }}>
              {formatNumber(productivity.kgHa, { decimals: 0 })} kg/ha
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">{productivity.sourceLabel}</p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Vigor</p>
            <p className="mt-1 flex items-center gap-2 text-slate-800">
              <Dot tone={vt} />
              <span className="text-slate-600">
                {phen?.vigor?.trim() ||
                  (kpis?.vigorCulturaPct != null
                    ? `${formatNumber(kpis.vigorCulturaPct, { decimals: 0 })}%`
                    : kpis?.vigorRating && (kpis.vigorRating.max ?? 0) > 0
                      ? `${kpis.vigorRating.score}/${kpis.vigorRating.max}`
                      : 'sem métrica')}
              </span>
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-slate-500">Sanidade</p>
            <p className="mt-1 flex items-center gap-2 text-slate-800">
              <Dot tone={st} />
              <span className="text-slate-600">
                {kpis?.fitotoxidez?.score != null
                  ? `Fitotox ${formatNumber(kpis.fitotoxidez.score, { decimals: 0 })}/${kpis.fitotoxidez.max ?? 10}`
                  : kpis?.controleDaninhasPct != null
                    ? `Daninhas ${formatNumber(kpis.controleDaninhasPct, { decimals: 0 })}%`
                    : 'sem métrica'}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-auto pt-2 border-t border-slate-100">
          <p className="text-[10px] font-bold uppercase text-slate-500">Custo publicado</p>
          <p
            className="text-xl font-bold tabular-nums mt-0.5"
            style={{ color: isA ? COLOR_SIDE_A : COLOR_SIDE_B }}
          >
            {cost != null ? `R$ ${formatNumber(cost, { decimals: 2 })}/ha` : 'não informado'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function CompareManejosSection({ data }: { data: SideBySideReportData }) {
  const { side: pickSide, badge } = compareHighlight(data);
  const photosA = data.sideA?.photos ?? [];
  const photosB = data.sideB?.photos ?? [];
  const heroA = pickHeroPhoto(photosA);
  const heroB = pickHeroPhoto(photosB);
  const winA = pickSide === 'A';
  const winB = pickSide === 'B';
  const dimA = Boolean(pickSide) && !winA;
  const dimB = Boolean(pickSide) && !winB;

  return (
    <section id="comparativo-premium" className="scroll-mt-28">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Comparativo visual</h2>
        <p className="mt-2 text-slate-600 text-sm max-w-2xl leading-relaxed">{comparativoSubtitle(data)}</p>
      </motion.div>
      <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-stretch">
        <ManejoCard
          side="A"
          data={data}
          photo={heroA ?? undefined}
          isWinnerPick={winA}
          badgeKind={winA ? badge : null}
          dimPeer={dimA}
          productivity={productivityForSide(data, 'A')}
          witness={isWitnessSide(data, 'A')}
        />
        <ManejoCard
          side="B"
          data={data}
          photo={heroB ?? undefined}
          isWinnerPick={winB}
          badgeKind={winB ? badge : null}
          dimPeer={dimB}
          productivity={productivityForSide(data, 'B')}
          witness={isWitnessSide(data, 'B')}
        />
      </div>
    </section>
  );
}
