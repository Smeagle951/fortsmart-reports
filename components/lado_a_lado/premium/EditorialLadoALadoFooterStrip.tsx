'use client';

import type { SideBySideReportData } from '@/components/SideBySideReportContent';

function initials(name: string): string {
  const p = name.split(/\s+/).filter(Boolean).slice(0, 2);
  return p.map((x) => x[0]?.toUpperCase() ?? '').join('') || '?';
}

export default function EditorialLadoALadoFooterStrip({
  data,
  shareToken,
}: {
  data: SideBySideReportData;
  shareToken?: string;
}) {
  const sig = data.conclusion?.signature;
  const meta = data.meta ?? {};
  const name = sig?.name?.trim() || meta.generatedBy?.name?.trim() || 'Responsável técnico';
  const roleLine = [meta.generatedBy?.role?.trim(), sig?.crea?.trim() ? `CREA ${sig.crea}` : null]
    .filter(Boolean)
    .join(' · ');
  const schema = data.schemaVersion ?? '2.1';
  const created = meta.createdAt
    ? new Date(meta.createdAt).toLocaleDateString('pt-BR')
    : null;
  const tok = shareToken?.trim();

  return (
    <div className="fs-l2-footer-bar print:break-inside-avoid">
      <div className="fs-l2-footer-inner">
        <div className="flex items-center gap-3">
          <div className="fs-l2-consultant-avatar" aria-hidden>
            {initials(name)}
          </div>
          <div>
            <div className="font-semibold text-white">{name}</div>
            {roleLine ? <div className="text-white/70">{roleLine}</div> : null}
            {sig?.city?.trim() ? (
              <div className="mt-0.5 text-xs text-white/55">{sig.city.trim()}</div>
            ) : null}
          </div>
        </div>
        <div className="text-right text-xs leading-relaxed text-white/60">
          FortSmart Agro · relatório web
          <br />
          Schema v{schema}
          {created ? ` · ${created}` : ''}
          {tok ? (
            <>
              <br />
              <span className="font-mono text-[11px] text-white/45">Token · {tok.slice(0, 8)}…</span>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
