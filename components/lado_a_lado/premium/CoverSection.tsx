'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

type Props = {
  data: SideBySideReportData;
  reportId?: string;
};

/**
 * Capa / metadados — equivalente conceitual a `EvaluationMetaDto` no spec HTML.
 * Fontes: `farm`, `meta`, `coleta`, `branding` (ver `premiumSpecDataMap.ts`).
 */
export default function CoverSection({ data, reportId }: Props) {
  const farm = data.farm || {};
  const meta = data.meta || {};
  const coleta = data.coleta;
  const idDisplay = meta.reportId || reportId;
  const title =
    data.branding?.title?.trim() ||
    coleta?.ensaioName?.trim() ||
    farm.objective?.trim() ||
    'Avaliação comparativa de manejos';
  const subtitleParts: string[] = [];
  if (farm.culture?.trim()) subtitleParts.push(farm.culture.trim());
  if (coleta?.soyMaturityGroup?.trim()) subtitleParts.push(`GMR ${coleta.soyMaturityGroup.trim()}`);
  if (coleta?.milhoCicloHint?.trim()) subtitleParts.push(`Ciclo ${coleta.milhoCicloHint.trim()}`);
  if (coleta?.estadio?.trim()) subtitleParts.push(coleta.estadio.trim());
  if (coleta?.dae != null && Number.isFinite(coleta.dae)) subtitleParts.push(`${coleta.dae} DAE`);
  const generated =
    meta.createdAt != null
      ? new Date(meta.createdAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : null;
  const consultant = meta.generatedBy?.name?.trim();

  const cells: { k: string; v: string }[] = [];
  if (farm.culture) cells.push({ k: 'Cultura', v: farm.culture });
  if (farm.fieldName || farm.areaHa != null) {
    const area =
      farm.areaHa != null && Number.isFinite(farm.areaHa)
        ? `${formatArea(farm.areaHa)} ha`
        : '';
    const tal = [farm.fieldName, area].filter(Boolean).join(' · ');
    if (tal) cells.push({ k: 'Talhão / Área', v: tal });
  }
  if (farm.season) cells.push({ k: 'Safra', v: farm.season });
  if (coleta?.dataPlantio?.trim()) {
    cells.push({ k: 'Plantio', v: coleta.dataPlantio.trim() });
  }
  if (farm.city || farm.state) {
    cells.push({ k: 'Município', v: [farm.city, farm.state].filter(Boolean).join(', ') });
  }
  if (consultant) cells.push({ k: 'Técnico responsável', v: consultant });
  if (generated) cells.push({ k: 'Gerado em', v: generated });

  return (
    <section
      className="premium-font-serif text-white"
      style={{
        background: 'linear-gradient(135deg, var(--fs-forest, #1b4332) 0%, var(--fs-forest-md, #2d6a4f) 100%)',
      }}
      aria-labelledby="premium-cover-title"
    >
      <div className="mx-auto max-w-[1140px] px-6 py-10 sm:py-12">
        {idDisplay ? (
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">
            ID · FS-{idDisplay}
          </p>
        ) : (
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">Relatório premium</p>
        )}
        <h1 id="premium-cover-title" className="text-2xl sm:text-3xl md:text-[2rem] leading-tight font-normal">
          {title}
        </h1>
        {data.branding?.subtitle?.trim() ? (
          <p className="mt-2 text-sm text-white/65 leading-relaxed max-w-3xl">{data.branding.subtitle.trim()}</p>
        ) : null}
        {subtitleParts.length > 0 ? (
          <p className="mt-2 text-sm sm:text-base text-white/50 italic">{subtitleParts.join(' · ')}</p>
        ) : null}

        {cells.length > 0 ? (
          <div
            className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-lg overflow-hidden border border-white/10"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            {cells.map((c) => (
              <div key={c.k} className="bg-black/20 px-4 py-3 sm:px-5 sm:py-3.5">
                <p className="text-[9px] uppercase tracking-wider text-white/40">{c.k}</p>
                <p className="mt-1 text-sm font-medium text-white/95">{c.v}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function formatArea(ha: number): string {
  return Number.isInteger(ha) ? String(ha) : ha.toFixed(1);
}
