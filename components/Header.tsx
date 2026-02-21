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

export default function Header({ meta, propriedade, talhao, reportId }: HeaderProps) {
  return (
    <header className="header">
      <div className="brand">
        <span className="brand-title">FortSmart Agro</span>
      </div>
      <div className="header-meta">
        <div>{formatDate(meta.dataGeracao)}</div>
        <div>{propriedade.fazenda}</div>
        <div>{talhao.nome} — {meta.safra}</div>
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
