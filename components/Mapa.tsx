import React from 'react';

type MapaData = {
  viewBox?: string;
  path?: string;
  pontos?: Array<{ x: number; y: number; index?: number; severidade?: string }>;
};

interface MapaProps {
  mapa: MapaData;
  relatorioId?: string;
  className?: string;
}

/** Cor do alfinete por severidade (igual ao polígono do talhão em destaque) */
function pinColor(severidade?: string): string {
  const s = (severidade || '').toLowerCase();
  if (s === 'media') return '#facc15';
  if (s === 'alta' || s === 'critica') return '#ef6c00';
  return '#2e7d32';
}

/** Alfinete SVG: ponta em (x, y), corpo acima. Raio ~7, altura total ~18. */
function PinAlfinete({ x, y, fill, index }: { x: number; y: number; fill: string; index?: number }) {
  const tipY = y;
  const headY = y - 14;
  const r = 6;
  const label = index != null ? `P${index}` : null;
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Corpo do alfinete: triângulo da ponta até o “círculo” */}
      <path
        d={`M 0 0 L -5 ${-10} L -${r} ${-12} A ${r} ${r} 0 1 1 ${r} ${-12} L 5 ${-10} Z`}
        fill={fill}
        stroke="#fff"
        strokeWidth="1.5"
      />
      {/* Etiqueta P1, P2… acima do alfinete */}
      {label && (
        <text
          y={-16}
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill="#1f2937"
          style={{ fontFamily: 'inherit' }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

export default function Mapa({ mapa, relatorioId, className = '' }: MapaProps) {
  if (!mapa.viewBox && !mapa.path) return null;

  const viewBox = mapa.viewBox || '0 0 400 300';

  return (
    <section className={`section mapa-section ${className}`}>
      <h2 className="section-title">Mapa do talhão — pontos georreferenciados</h2>
      <div className="mapa-wrap">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox={viewBox}
          className="mapa-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect width="100%" height="100%" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" />
          {mapa.path && (
            <path d={mapa.path} fill="#e8f5e9" stroke="#2e7d32" strokeWidth="2" />
          )}
          {mapa.pontos?.map((p, i) => (
            <PinAlfinete
              key={i}
              x={p.x}
              y={p.y}
              fill={pinColor(p.severidade)}
              index={p.index}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
