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

interface HeaderInstitucionalVisitaTecnicaProps {
  meta: Meta;
  propriedade: Propriedade;
  talhao: Talhao;
  contextoSafra?: ContextoSafra;
  reportId?: string;
}

/** Cabeçalho institucional para Relatório Técnico de Visita — padrão SaaS, sem versão do app */
export default function HeaderInstitucionalVisitaTecnica({
  meta,
  propriedade,
  talhao,
  contextoSafra = {},
  reportId,
}: HeaderInstitucionalVisitaTecnicaProps) {
  const cliente = propriedade.proprietario;
  const culturaHibrido = [talhao.cultura, contextoSafra.materialVariedade].filter(Boolean).join(' / ');
  const status = meta.status || 'Final';

  return (
    <header className="visita-header-institucional">
      <div className="visita-header-institucional__logo">
        <div className="visita-header-institucional__logo-icon">
          <FortSmartLogo size={48} />
        </div>
        <div>
          <div className="visita-header-institucional__empresa">FortSmart Agro</div>
          <div className="visita-header-institucional__tipo">Relatório Técnico de Visita</div>
        </div>
      </div>

      <div className="visita-header-institucional__grid">
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Consultor</span>
          <span className="visita-header-institucional__value">
            {meta.tecnico || '—'}
            {meta.tecnicoCrea ? ` • CREA ${meta.tecnicoCrea}` : ''}
          </span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Cliente</span>
          <span className="visita-header-institucional__value">{cliente || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Fazenda</span>
          <span className="visita-header-institucional__value">{propriedade.fazenda || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Talhão</span>
          <span className="visita-header-institucional__value">{talhao.nome || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Safra</span>
          <span className="visita-header-institucional__value">{meta.safra || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Cultura / Híbrido</span>
          <span className="visita-header-institucional__value">{culturaHibrido || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Data da visita</span>
          <span className="visita-header-institucional__value">{formatDate(meta.dataGeracao) || '—'}</span>
        </div>
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Código do relatório</span>
          <span className="visita-header-institucional__value">{meta.id || reportId || '—'}</span>
        </div>
        {meta.versao != null && (
          <div className="visita-header-institucional__item">
            <span className="visita-header-institucional__label">Versão do documento</span>
            <span className="visita-header-institucional__value">{meta.versao}</span>
          </div>
        )}
        <div className="visita-header-institucional__item">
          <span className="visita-header-institucional__label">Status</span>
          <span className="visita-header-institucional__value visita-header-institucional__status">{status}</span>
        </div>
      </div>
    </header>
  );
}
