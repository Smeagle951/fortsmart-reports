import React, { useState, useEffect, useRef } from 'react';

type MapaPoint = {
  x: number;
  y: number;
  index?: number;
  severidade?: string;
  descricao?: string;
  data?: string;
  [k: string]: any;
};

type MapaData = {
  viewBox?: string;
  path?: string;
  pontos?: Array<MapaPoint>;
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
function PinAlfinete({ x, y, fill, index, onClick, onKey }: { x: number; y: number; fill: string; index?: number; onClick?: (e: React.MouseEvent) => void; onKey?: (e: React.KeyboardEvent) => void }) {
  const tipY = y;
  const headY = y - 14;
  const r = 6;
  const label = index != null ? `P${index}` : null;
  return (
    <g transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} role="button" aria-label={label || 'Ponto'} tabIndex={0} onClick={onClick} onKeyDown={onKey}>
      {/* Corpo do alfinete: triângulo da ponta até o “círculo” */}
      <path
        d={`M 0 0 L -5 ${-10} L -${r} ${-12} A ${r} ${r} 0 1 1 ${r} ${-12} L 5 ${-10} Z`}
        fill={fill}
        stroke="#fff"
        strokeWidth="1.5"
      />
      <title>{label ? `${label} — ${fill}` : `Ponto — ${fill}`}</title>
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
  const [selected, setSelected] = useState<MapaPoint | null>(null);
  const [overlayPos, setOverlayPos] = useState<{ left: number; top: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelected(null);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
          {/* Background only; clicking background clears selection */}
          <rect width="100%" height="100%" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1" onClick={() => setSelected(null)} />
          {mapa.path ? (
            <path d={mapa.path} fill="#e8f5e9" stroke="#2e7d32" strokeWidth="2" />
          ) : null}

          {mapa.pontos?.map((p, i) => (
            <PinAlfinete
              key={i}
              x={p.x}
              y={p.y}
              fill={pinColor(p.severidade)}
              index={p.index}
              onClick={(e) => {
                e.stopPropagation();
                // compute overlay position
                const svg = svgRef.current;
                const wrap = wrapRef.current;
                if (svg && wrap) {
                  const rect = svg.getBoundingClientRect();
                  const wrapRect = wrap.getBoundingClientRect();
                  const vb = (viewBox || '0 0 400 300').trim().split(/\s+|,/).map(Number);
                  const vbX = vb[0] ?? 0;
                  const vbY = vb[1] ?? 0;
                  const vbW = vb[2] ?? (vb[0] === 0 ? 400 : vb[2]);
                  const vbH = vb[3] ?? 300;
                  const scaleX = rect.width / vbW;
                  const scaleY = rect.height / vbH;
                  const px = rect.left + (p.x - vbX) * scaleX;
                  const py = rect.top + (p.y - vbY) * scaleY;
                  setOverlayPos({ left: Math.round(px - wrapRect.left), top: Math.round(py - wrapRect.top) });
                } else {
                  setOverlayPos(null);
                }
                setSelected(p);
              }}
              onKey={(e) => {
                if ((e as React.KeyboardEvent).key === 'Enter' || (e as React.KeyboardEvent).key === ' ') {
                  (e as React.KeyboardEvent).preventDefault();
                  const p = (e.currentTarget as any).__point as MapaPoint;
                  setSelected(p);
                }
              }}
            />
          ))}

          {/* Optional drop shadow filter */}
          <defs>
            <filter id="drop-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(0,0,0,0.12)" />
            </filter>
          </defs>
        </svg>

        {/* HTML overlay popup — positioned relative to .mapa-wrap */}
        {selected && overlayPos && (
          <div className="mapa-overlay" style={{ left: overlayPos.left, top: overlayPos.top - 90 }} role="dialog" aria-modal="false">
            <div className="mapa-overlay-card">
              <div className="mapa-overlay-header">
                <strong>{selected.index != null ? `P${selected.index}` : 'Ponto'}</strong>
                <button className="btn btn-secondary" onClick={() => { setSelected(null); setOverlayPos(null); }}>Fechar</button>
              </div>
              {selected.descricao && <div className="mapa-overlay-desc">{selected.descricao}</div>}
              {selected.data && <div className="mapa-overlay-meta">{selected.data}</div>}
              <div className="mapa-overlay-actions">
                <button className="btn btn-primary" onClick={() => {
                  // Try to find associated DOM element and scroll to it
                  const idx = selected.index;
                  const selectors = [
                    `#ponto-${idx}`,
                    `[data-ponto-index="${idx}"]`,
                    `[data-point-index="${idx}"]`,
                    `[data-map-point-index="${idx}"]`,
                  ];
                  let el: Element | null = null;
                  for (const s of selectors) {
                    el = document.querySelector(s);
                    if (el) break;
                  }
                  if (el) {
                    const target = el as HTMLElement;
                    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    target.classList.add('highlighted-map-target');
                    setTimeout(() => target.classList.remove('highlighted-map-target'), 3000);
                  } else {
                    // dispatch an event in case other code handles navigation
                    window.dispatchEvent(new CustomEvent('mapPointGoto', { detail: { point: selected } }));
                  }
                }}>
                  Ir ao registro
                </button>
              </div>
            </div>
          </div>
        )}
        {!mapa.path && (
          <div className="mapa-placeholder" title="Polígono do talhão não disponível">
            Polígono do talhão não disponível
          </div>
        )}
      </div>
    </section>
  );
}
