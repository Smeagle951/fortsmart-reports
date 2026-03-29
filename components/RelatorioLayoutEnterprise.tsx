'use client';

import React from 'react';
import FortSmartLogo from './FortSmartLogo';

export interface RelatorioRelacionadoLink {
  href: string;
  label: string;
}

interface RelatorioLayoutEnterpriseProps {
  /** Nome da fazenda para breadcrumb */
  fazenda: string;
  /** Nome do talhão para breadcrumb */
  talhaoNome: string;
  /** Nome do técnico para sidebar e header */
  tecnico: string;
  /** CREA (opcional) para exibir no sidebar */
  crea?: string;
  /** ID do relatório (ex: FS-ENT-2026-000014) para o header */
  reportId?: string;
  /** Callback ao clicar em Compartilhar (opcional) */
  onShare?: () => void;
  /** URL do logo/ícone da fazenda (perfil fazenda); sem valor mostra iniciais */
  farmLogoUrl?: string | null;
  /** Linha extra no topo do main (ex.: cultura · monitoramento) */
  headerSubtitle?: string;
  /** Outros relatórios de monitoramento na mesma data (links para /r/token ou URL absoluta) */
  relacionadosMesmaData?: RelatorioRelacionadoLink[];
  /** Conteúdo principal (page-content) */
  children: React.ReactNode;
}

/** Iniciais do técnico para o avatar (2 primeiras letras ou iniciais) */
function iniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return (nome.slice(0, 2) || 'FS').toUpperCase();
}

export default function RelatorioLayoutEnterprise({
  fazenda,
  talhaoNome,
  tecnico,
  crea,
  reportId,
  onShare,
  farmLogoUrl,
  headerSubtitle,
  relacionadosMesmaData,
  children,
}: RelatorioLayoutEnterpriseProps) {
  return (
    <div className="relatorio-enterprise">
      <div className="layout-relatorio">
        {/* Sidebar (base: relatorio.html educacional) */}
        <aside className="sidebar-relatorio">
          <div className="sidebar-logo">
            <FortSmartLogo size={36} />
            <div>
              <div className="sidebar-logo-text">FortSmart</div>
              <span className="sidebar-logo-sub">Gestão Agrícola</span>
            </div>
          </div>
          <div className="sidebar-user">
            <div className="user-avatar" style={farmLogoUrl && farmLogoUrl.trim() ? { overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' } : undefined}>
              {farmLogoUrl && farmLogoUrl.trim() ? (
                <img src={farmLogoUrl} alt={fazenda} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
              ) : (
                iniciais(fazenda)
              )}
            </div>
            <div className="user-name">Fazenda: {fazenda}</div>
            <div className="user-role" style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
              <span>
                {tecnico && tecnico.trim()
                  ? `Eng.: ${tecnico.trim()}`
                  : 'Eng.: —'}
              </span>
              {crea && crea.trim() ? (
                <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>CREA: {crea.trim()}</span>
              ) : null}
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Navegação</div>
            <a className="nav-item active" href="#resumo">
              <span className="nav-icon">📋</span> Visão Geral
            </a>
            <a className="nav-item" href="#propriedade">
              <span className="nav-icon">🗺️</span> Mapa do Talhão
            </a>
            <a className="nav-item" href="#dados-plantio">
              <span className="nav-icon">🌱</span> Avaliação do Plantio
            </a>
            <a className="nav-item" href="#evolucao-fenologica">
              <span className="nav-icon">📅</span> Evolução Fenológica
            </a>
            <a className="nav-item" href="#propriedade">
              <span className="nav-icon">📍</span> Ocorrências
            </a>
            <a className="nav-item" href="#galeria">
              <span className="nav-icon">🖼️</span> Galeria de Imagens
            </a>
            <a className="nav-item" href="#diagnostico">
              <span className="nav-icon">📝</span> Diagnóstico Agronômico
            </a>
            <a className="nav-item" href="#recomendacoes">
              <span className="nav-icon">✓</span> Recomendações
            </a>
            <a className="nav-item" href="#iqf">
              <span className="nav-icon">📊</span> Score (IQF)
            </a>
            <a className="nav-item" href="#risco">
              <span className="nav-icon">⚠️</span> Avaliação de Risco
            </a>
            <a className="nav-item" href="#auditoria">
              <span className="nav-icon">🔒</span> Auditoria
            </a>
          </nav>
        </aside>

        {/* Main (base: relatorio.html) */}
        <main className="main-relatorio">
          <header className="top-header">
            <div className="header-left">
              <nav className="breadcrumb">
                <span>{fazenda}</span>
                <span className="breadcrumb-sep">›</span>
                <span>{talhaoNome}</span>
                <span className="breadcrumb-sep">›</span>
                <span className="breadcrumb-current">Relatório Técnico</span>
              </nav>
              {headerSubtitle && headerSubtitle.trim() ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{headerSubtitle.trim()}</div>
              ) : null}
              <span className="status-badge finalizado">
                <span className="dot" /> Finalizado
              </span>
            </div>
            <div className="header-right no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {reportId && <span className="meta-tag">{reportId}</span>}
              {relacionadosMesmaData != null && relacionadosMesmaData.length > 0 && (
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ whiteSpace: 'nowrap' }}>Mesma data</span>
                  <select
                    className="btn-action outline"
                    style={{ padding: '6px 8px', fontSize: 12, cursor: 'pointer', maxWidth: 220 }}
                    defaultValue=""
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v) window.location.href = v;
                    }}
                    aria-label="Abrir outro relatório de monitoramento da mesma data"
                  >
                    <option value="">Outros monitoramentos…</option>
                    {relacionadosMesmaData.map((r) => (
                      <option key={r.href} value={r.href}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {onShare != null && (
                <button type="button" onClick={onShare} className="btn-action outline">
                  🔗 Compartilhar
                </button>
              )}
            </div>
          </header>

          <div className="page-content" id="relatorio-fitossanitario-content">
            {children}
          </div>

          {/* Footer (estilo educacional) */}
          <footer className="page-footer">
            <strong style={{ color: 'var(--text-main)' }}>FortSmart Agro</strong>
            {' · '}
            Relatório de Monitoramento Fitossanitário
          </footer>
        </main>
      </div>
    </div>
  );
}
