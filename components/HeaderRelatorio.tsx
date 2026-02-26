import React from 'react';
import { formatDate, formatArea } from '@/utils/format';
import HeaderInstitucionalPlantio from './plantio/HeaderInstitucionalPlantio';

type Meta = {
  dataGeracao?: string;
  safra?: string;
  tecnico?: string;
  tecnicoCrea?: string;
  id?: string;
  appVersion?: string;
  versao?: number;
  status?: string;
};

type Propriedade = { fazenda?: string; proprietario?: string; municipio?: string; estado?: string };
type Talhao = { nome?: string; cultura?: string; area?: number; dataPlantio?: string };
type ContextoSafra = { materialVariedade?: string; empresa?: string }; 

interface HeaderProps {
  meta: Meta;
  propriedade: Propriedade;
  talhao: Talhao;
  contextoSafra?: ContextoSafra;
  reportId?: string;
  variant?: 'default' | 'plantio';
}

export default function HeaderRelatorio({ meta, propriedade, talhao, contextoSafra, reportId, variant = 'default' }: HeaderProps) {
  if (variant === 'plantio') {
    return (
      <HeaderInstitucionalPlantio
        meta={meta}
        propriedade={propriedade}
        talhao={talhao}
        contextoSafra={contextoSafra}
        reportId={reportId}
      />
    );
  }

  const municipioUf = [propriedade.municipio, propriedade.estado].filter(Boolean).join(' / ');

  return (
    <header className="header header-relatorio header-relatorio--pro">
      <div className="header-relatorio__top">
        <div className="brand">
          <div className="brand-logo">FortSmart Agro</div>
        </div>
        <div className="header-relatorio__meta">
          <div className="meta-fazenda">{propriedade.fazenda || '—'}</div>
          <div className="meta-talhao">{talhao.nome || '—'} • {talhao.cultura || '—'}</div>
          <div className="meta-date">{formatDate(meta.dataGeracao)}</div>
          {meta.tecnico && <div className="meta-tecnico">{meta.tecnico}{meta.tecnicoCrea ? ` • CREA ${meta.tecnicoCrea}` : ''}</div>}
          <div className="meta-id">ID: {meta.id || reportId || '—'}</div>
        </div>
        <div className="ml-4 flex items-start">
          <button
            type="button"
            title="Abrir Relatório Web"
            aria-label="Abrir Relatório Web"
            onClick={() => {
              const token = meta.id || reportId;
              const url = token ? `/r/${token}` : '/r';
              window.open(url, '_blank');
            }}
            className="ml-2 inline-flex items-center justify-center rounded-md p-2 text-slate-600 hover:bg-slate-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 010 5.656l-1.414 1.414a4 4 0 01-5.656-5.656l1.414-1.414m6.364-6.364l4.243 4.243M3 12h3m12 0h3" />
            </svg>
          </button>
        </div>
      </div>
      <div className="header-relatorio__identificacao">
        <table className="header-relatorio__table">
          <tbody>
            <tr>
              <th>Fazenda</th>
              <td>{propriedade.fazenda || '—'}</td>
              <th>Talhão</th>
              <td>{talhao.nome || '—'}</td>
            </tr>
            <tr>
              <th>Cultura</th>
              <td>{talhao.cultura || '—'}</td>
              <th>Safra</th>
              <td>{meta.safra || '—'}</td>
            </tr>
            <tr>
              <th>Área</th>
              <td>{formatArea(talhao.area as number | string)}</td>
              <th>Município/UF</th>
              <td>{municipioUf || '—'}</td>
            </tr>
            <tr>
              <th>Proprietário</th>
              <td>{propriedade.proprietario || '—'}</td>
              <th>Técnico</th>
              <td>{meta.tecnico || '—'}{meta.tecnicoCrea ? ` (CREA ${meta.tecnicoCrea})` : ''}</td>
            </tr>
            <tr>
              <th>Data plantio</th>
              <td>{formatDate(talhao.dataPlantio as string) || '—'}</td>
              <th>Data relatório</th>
              <td>{formatDate(meta.dataGeracao as string)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </header>
  );
}
