'use client';

import React, { useState } from 'react';

export interface RelatorioSectionProps {
  id: string;
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
  /** Se true, não mostra botão de expandir/colapsar (sempre aberto). */
  noCollapse?: boolean;
  className?: string;
}

export default function RelatorioSection({
  id,
  title,
  icon,
  defaultOpen = true,
  children,
  noCollapse = false,
  className = '',
}: RelatorioSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section
      id={id}
      className={`relatorio-section ${open ? 'relatorio-section--open' : 'relatorio-section--closed'} ${className}`.trim()}
      data-section-id={id}
    >
      <h2 id={`${id}-heading`} className="relatorio-section-header">
        <a href={`#${id}`} className="relatorio-section-anchor" aria-hidden="true">
          #
        </a>
        {!noCollapse && (
          <button
            type="button"
            className="relatorio-section-toggle"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-controls={`${id}-content`}
          >
            <span className="relatorio-section-toggle-icon" aria-hidden>{open ? '▼' : '▶'}</span>
            <span className="relatorio-section-toggle-text">
              {icon && <span className="relatorio-section-icon">{icon}</span>}
              {title}
            </span>
          </button>
        )}
        {noCollapse && (
          <span className="relatorio-section-title-static">
            {icon && <span className="relatorio-section-icon">{icon}</span>}
            {title}
          </span>
        )}
      </h2>
      <div
        id={`${id}-content`}
        className="relatorio-section-content"
        role="region"
        aria-labelledby={`${id}-heading`}
        hidden={!noCollapse && !open}
      >
        {children}
      </div>
    </section>
  );
}
