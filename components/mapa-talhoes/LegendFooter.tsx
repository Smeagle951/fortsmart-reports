'use client';

type Item = { k: string; c: string };

type Props = {
  items: Item[];
  showSubareaHint: boolean;
};

export function LegendFooter({ items, showSubareaHint }: Props) {
  if (items.length === 0) return null;
  return (
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-[900] print:relative print:mt-2">
      <div className="mx-2 mb-10 rounded-xl border border-slate-600/70 bg-slate-950/95 px-3 py-2 shadow-lg backdrop-blur print:mb-2 print:border print:bg-white print:shadow-none sm:mb-12">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 print:text-slate-600">
          Híbrido / material
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
          {items.map(({ k, c }) => (
            <li key={k} className="flex items-center gap-1.5 text-[11px] text-slate-100 print:text-slate-800">
              <span
                className="h-2.5 w-5 shrink-0 rounded-sm ring-1 ring-white/10"
                style={{ background: c }}
              />
              <span className="max-w-[140px] truncate" title={k}>
                {k}
              </span>
            </li>
          ))}
        </ul>
        {showSubareaHint ? (
          <p className="mt-2 border-t border-slate-700/60 pt-1.5 text-[10px] text-slate-500 print:text-slate-600">
            <span className="inline-block h-0 w-6 border-t-2 border-dashed border-sky-400/80 align-middle" /> Subáreas:
            tracejado + preenchimento suave (manejo)
          </p>
        ) : null}
      </div>
    </div>
  );
}
