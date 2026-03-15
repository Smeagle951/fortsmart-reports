'use client';

import React from 'react';

export interface BarraTecnicaRelatorioProps {
  fazenda: string;
  talhao: string;
  cultura: string;
  cultivar?: string;
  areaHa?: number;
  dae?: number | string;
  /** Formatar número (ex.: área com 2 decimais). */
  formatNum?: (n: number) => string;
}

const sep = '|';

export default function BarraTecnicaRelatorio({
  fazenda,
  talhao,
  cultura,
  cultivar,
  areaHa,
  dae,
  formatNum = (n) => n.toFixed(2),
}: BarraTecnicaRelatorioProps) {
  const areaStr = areaHa != null && areaHa > 0 ? `${formatNum(areaHa)} ha` : '—';
  const daeStr = dae != null ? (typeof dae === 'number' ? `${dae} DAE` : String(dae)) : '—';
  const cultivarStr = cultivar && cultivar.trim() ? cultivar.trim() : '—';

  return (
    <div className="barra-tecnica-relatorio no-print" role="region" aria-label="Dados técnicos do relatório">
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">Fazenda</span>
        <span className="barra-tecnica-val">{fazenda}</span>
      </div>
      <span className="barra-tecnica-sep" aria-hidden="true">{sep}</span>
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">Talhão</span>
        <span className="barra-tecnica-val">{talhao}</span>
      </div>
      <span className="barra-tecnica-sep" aria-hidden="true">{sep}</span>
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">Cultura</span>
        <span className="barra-tecnica-val">{cultura}</span>
      </div>
      <span className="barra-tecnica-sep" aria-hidden="true">{sep}</span>
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">Cultivar</span>
        <span className="barra-tecnica-val">{cultivarStr}</span>
      </div>
      <span className="barra-tecnica-sep" aria-hidden="true">{sep}</span>
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">Área</span>
        <span className="barra-tecnica-val">{areaStr}</span>
      </div>
      <span className="barra-tecnica-sep" aria-hidden="true">{sep}</span>
      <div className="barra-tecnica-inner">
        <span className="barra-tecnica-label">DAE</span>
        <span className="barra-tecnica-val">{daeStr}</span>
      </div>
    </div>
  );
}
