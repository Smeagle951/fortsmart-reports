'use client';

import React from 'react';
import { formatDate } from '@/utils/format';
import FortSmartLogo from '@/components/FortSmartLogo';

export type MetaLadoALado = {
  reportId?: string;
  createdAt?: string;
  appVersion?: string;
  generatedBy?: { name?: string; role?: string };
};

export type FarmLadoALado = {
  farmName?: string;
  owner?: string;
  city?: string;
  state?: string;
  culture?: string;
  season?: string;
  fieldName?: string;
  areaHa?: number;
  objective?: string;
};

interface HeaderInstitucionalLadoALadoProps {
  meta: MetaLadoALado;
  farm: FarmLadoALado;
  sideAName?: string;
  sideBName?: string;
  reportId?: string;
}

/** Cabeçalho institucional para Relatório de Avaliação Lado a Lado — padrão SaaS RTV */
export default function HeaderInstitucionalLadoALado({
  meta,
  farm,
  sideAName = 'Lado A',
  sideBName = 'Lado B',
  reportId,
}: HeaderInstitucionalLadoALadoProps) {
  const consultor = meta.generatedBy?.name;
  const crea = (meta.generatedBy as { crea?: string })?.crea;
  const cliente = farm.owner;
  const local = [farm.city, farm.state].filter(Boolean).join(' / ') || '—';
  const areaStr = farm.areaHa != null ? `${Number(farm.areaHa).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} ha` : null;
  const codigo = reportId || meta.reportId || '—';

  return (
    <header className="sbs-header-institucional">
      <div className="sbs-header-institucional__logo">
        <div className="sbs-header-institucional__logo-icon">
          <FortSmartLogo size={48} />
        </div>
        <div>
          <div className="sbs-header-institucional__empresa">FortSmart Agro</div>
          <div className="sbs-header-institucional__tipo">Relatório de Avaliação Lado a Lado</div>
        </div>
      </div>

      <div className="sbs-header-institucional__grid">
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Consultor</span>
          <span className="sbs-header-institucional__value">
            {consultor || '—'}
            {crea ? ` • CREA ${crea}` : ''}
          </span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Cliente</span>
          <span className="sbs-header-institucional__value">{cliente || '—'}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Fazenda</span>
          <span className="sbs-header-institucional__value">{farm.farmName || '—'}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Talhão</span>
          <span className="sbs-header-institucional__value">{farm.fieldName || '—'}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Cultura / Material</span>
          <span className="sbs-header-institucional__value">{farm.culture || '—'}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Safra</span>
          <span className="sbs-header-institucional__value">{farm.season || '—'}</span>
        </div>
        {areaStr && (
          <div className="sbs-header-institucional__item">
            <span className="sbs-header-institucional__label">Área</span>
            <span className="sbs-header-institucional__value">{areaStr}</span>
          </div>
        )}
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Local</span>
          <span className="sbs-header-institucional__value">{local}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Data da avaliação</span>
          <span className="sbs-header-institucional__value">{formatDate(meta.createdAt)}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Tratamentos</span>
          <span className="sbs-header-institucional__value">{sideAName} vs {sideBName}</span>
        </div>
        <div className="sbs-header-institucional__item">
          <span className="sbs-header-institucional__label">Código do relatório</span>
          <span className="sbs-header-institucional__value">{codigo}</span>
        </div>
      </div>
    </header>
  );
}
