'use client';

import React from 'react';
import { formatDate } from '@/utils/format';
import FortSmartLogo from '@/components/FortSmartLogo';

type Meta = {
  id?: string;
  dataGeracao?: string;
  safra?: string;
  tecnico?: string;
  tecnicoCrea?: string;
  versao?: number;
  status?: string;
};

type Propriedade = {
  fazenda?: string;
  proprietario?: string;
  municipio?: string;
  estado?: string;
};

type Talhao = {
  nome?: string;
  cultura?: string;
};

type ContextoSafra = {
  materialVariedade?: string;
  empresa?: string;
};

interface HeaderInstitucionalPlantioProps {
  meta: Meta;
  propriedade: Propriedade;
  talhao: Talhao;
  contextoSafra?: ContextoSafra;
  reportId?: string;
}

/** Cabeçalho institucional técnico obrigatório para relatórios RTV / Pesquisa / Multinacional */
export default function HeaderInstitucionalPlantio({
  meta,
  propriedade,
  talhao,
  contextoSafra = {},
  reportId,
}: HeaderInstitucionalPlantioProps) {
  const cliente = propriedade.proprietario;
  const culturaHibrido = [talhao.cultura, contextoSafra.materialVariedade].filter(Boolean).join(' / ');
  const status = meta.status || 'Final';

  return (
    <header className="plantio-header-institucional">
      <div className="plantio-header-institucional__logo">
        <div className="plantio-header-institucional__logo-icon">
          <FortSmartLogo size={48} />
        </div>
        <div>
          <div className="plantio-header-institucional__empresa">FortSmart Agro</div>
          <div className="plantio-header-institucional__tipo">Relatório Agronômico de Plantio</div>
        </div>
      </div>

      <div className="plantio-header-institucional__grid">
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Consultor</span>
          <span className="plantio-header-institucional__value">
            {meta.tecnico || '—'}
            {meta.tecnicoCrea ? ` • CREA ${meta.tecnicoCrea}` : ''}
          </span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Cliente</span>
          <span className="plantio-header-institucional__value">{cliente || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Fazenda</span>
          <span className="plantio-header-institucional__value">{propriedade.fazenda || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Talhão</span>
          <span className="plantio-header-institucional__value">{talhao.nome || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Safra</span>
          <span className="plantio-header-institucional__value">{meta.safra || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Cultura / Híbrido</span>
          <span className="plantio-header-institucional__value">{culturaHibrido || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Data da visita</span>
          <span className="plantio-header-institucional__value">{formatDate(meta.dataGeracao) || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Código do relatório</span>
          <span className="plantio-header-institucional__value">{meta.id || reportId || '—'}</span>
        </div>
        <div className="plantio-header-institucional__item">
          <span className="plantio-header-institucional__label">Status</span>
          <span className="plantio-header-institucional__value plantio-header-institucional__status">{status}</span>
        </div>
      </div>
    </header>
  );
}
