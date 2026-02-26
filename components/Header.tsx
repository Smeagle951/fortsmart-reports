import React from 'react';
import { formatDate } from '../utils/format';

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

export default function Header({ meta, propriedade, talhao, reportId }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-title">FortSmart Agro</span>
        {meta.appVersion && <span className="brand-subtitle">v{meta.appVersion}</span>}
      </div>
      <div className="header-meta">
        <div className="meta-row">
          <div className="meta-left">
            <div className="meta-fazenda">{propriedade.fazenda || '—'}</div>
            <div className="meta-talhao">{talhao.nome || '—'} — {talhao.cultura || '—'}</div>
          </div>
          <div className="meta-right">
            <div className="meta-date">{formatDate(meta.dataGeracao)}</div>
            {meta.tecnico && <div className="meta-tecnico">{meta.tecnico}{meta.tecnicoCrea ? ` • CREA ${meta.tecnicoCrea}` : ''}</div>}
            <div className="meta-id">ID: {meta.id || reportId || '—'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}

export function ReportFooter({ meta, reportId }: { meta: Meta; reportId?: string }) {
  return (
    <footer className="footer">
      <div>Relatório gerado pelo FortSmart Agro</div>
      <div>
        ID: {meta.id || reportId || '—'} • {meta.appVersion || ''}
        {meta.versao != null ? ` • Versão ${meta.versao}` : ''}
      </div>
    </footer>
  );
}
