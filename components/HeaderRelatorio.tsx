import React from 'react';
import { formatDate } from '@/utils/format';

type Meta = {
  dataGeracao?: string;
  safra?: string;
  tecnico?: string;
  tecnicoCrea?: string;
  id?: string;
  appVersion?: string;
  versao?: number;
};

type Propriedade = { fazenda?: string };
type Talhao = { nome?: string; cultura?: string };

interface HeaderProps {
  meta: Meta;
  propriedade: Propriedade;
  talhao: Talhao;
  reportId?: string;
}

export default function HeaderRelatorio({ meta, propriedade, talhao, reportId }: HeaderProps) {
  return (
    <header className="header header-relatorio">
      <div className="brand">
        <div className="brand-logo">FortSmart Agro</div>
        {meta.appVersion && <div className="brand-subtitle">v{meta.appVersion}</div>}
      </div>
      <div className="report-meta">
        <div className="report-meta-left">
          <div className="meta-fazenda">{propriedade.fazenda || '—'}</div>
          <div className="meta-talhao">{talhao.nome || '—'} • {talhao.cultura || '—'}</div>
        </div>
        <div className="report-meta-right">
          <div className="meta-date">{formatDate(meta.dataGeracao)}</div>
          {meta.tecnico && <div className="meta-tecnico">{meta.tecnico}{meta.tecnicoCrea ? ` • CREA ${meta.tecnicoCrea}` : ''}</div>}
          <div className="meta-id">ID: {meta.id || reportId || '—'}</div>
        </div>
      </div>
    </header>
  );
}

