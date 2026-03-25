'use client';

/**
 * Mapa esquemático do talhão (SVG path + viewBox do app Flutter), com pontos de avaliação em coordenadas x/y.
 * Não depende do Leaflet — evita falhas quando só existe desenho vetorial, sem lat/lng.
 */

export type SchematicPonto = {
  x: number;
  y: number;
  label?: string;
  severidade?: string;
};

function parseSchematicPontos(pontos: unknown): SchematicPonto[] {
  if (!Array.isArray(pontos)) return [];
  const out: SchematicPonto[] = [];
  for (let i = 0; i < pontos.length; i++) {
    const p = pontos[i];
    if (p == null || typeof p !== 'object') continue;
    const o = p as Record<string, unknown>;
    if (o.lat != null || o.latitude != null || o.lng != null || o.longitude != null) continue;
    const x = Number(o.x);
    const y = Number(o.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    const label = [o.titulo, o.tipo, o.label].find((v) => v != null && String(v).trim() !== '');
    out.push({
      x,
      y,
      label: label != null ? String(label) : `Ponto ${i + 1}`,
      severidade: o.severidade != null ? String(o.severidade) : undefined,
    });
  }
  return out;
}

interface Props {
  path: string;
  viewBox: string;
  pontos?: unknown[];
  titulo?: string;
}

export default function VisitaMapaSchematicSaaS({
  path,
  viewBox,
  pontos = [],
  titulo = 'Planta do talhão e pontos de avaliação',
}: Props) {
  const dots = parseSchematicPontos(pontos);

  return (
    <section className="saas-section print:break-inside-avoid">
      <div className="mx-auto max-w-7xl">
        <h2 className="saas-section-title">{titulo}</h2>
        <p className="mb-4 text-sm text-slate-600 leading-relaxed max-w-3xl">
          Representação do contorno do talhão e dos locais amostrados na visita técnica (coordenadas do desenho do
          aplicativo). Para mapa georreferenciado em latitude/longitude, os pontos devem incluir lat/lng no payload.
        </p>
        <div className="m3-surface-card overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(27,94,65,0.06)]">
          <div className="bg-gradient-to-b from-slate-50/90 to-white px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Vista esquemática</span>
          </div>
          <div className="p-4 sm:p-6">
            <svg
              viewBox={viewBox}
              className="w-full h-auto max-h-[min(520px,70vh)] text-emerald-800"
              preserveAspectRatio="xMidYMid meet"
              role="img"
              aria-label="Contorno do talhão e pontos de avaliação"
            >
              <defs>
                <linearGradient id="talhao-fill-schematic" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgb(46 125 50 / 0.14)" />
                  <stop offset="100%" stopColor="rgb(27 110 65 / 0.08)" />
                </linearGradient>
              </defs>
              <path
                d={path}
                fill="url(#talhao-fill-schematic)"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
              {dots.map((d, i) => (
                <g key={`${d.x}-${d.y}-${i}`}>
                  <circle cx={d.x} cy={d.y} r={6} fill="#b91c1c" stroke="#fff" strokeWidth={2} />
                  <circle cx={d.x} cy={d.y} r={14} fill="none" stroke="rgb(185 28 28 / 0.25)" strokeWidth={1} />
                </g>
              ))}
            </svg>
            {dots.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                {dots.map((d, i) => (
                  <li
                    key={`leg-${i}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 border border-slate-200/80"
                  >
                    <span className="h-2 w-2 rounded-full bg-red-700 shrink-0" aria-hidden />
                    <span className="font-medium text-slate-800">{d.label}</span>
                    {d.severidade ? <span className="text-slate-500">({d.severidade})</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
