'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import mc from './vt-mobile-collapsible.module.css';

type Props = {
  /** Texto do botão quando fechado (mobile) */
  labelExpandir: string;
  /** Texto do botão quando aberto */
  labelRecolher: string;
  children: React.ReactNode;
  /** id estável para aria-controls */
  panelId?: string;
};

export default function VtMobileCollapsibleDetails({
  labelExpandir,
  labelRecolher,
  children,
  panelId = 'vt-detalhe-colapsavel',
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        className={mc.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? labelRecolher : labelExpandir}</span>
        <ChevronDown className={`${mc.chevron} ${open ? mc.chevronOpen : ''}`} size={18} strokeWidth={2.5} aria-hidden />
      </button>
      <div
        id={panelId}
        className={`${mc.panel} ${mc.panelCollapsed} ${open ? mc.panelOpen : ''}`}
        role="region"
        aria-label={labelExpandir}
      >
        {children}
      </div>
    </div>
  );
}
