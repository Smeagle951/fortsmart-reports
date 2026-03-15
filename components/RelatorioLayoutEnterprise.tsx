'use client';

import React from 'react';
import FortSmartLogo from './FortSmartLogo';

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
  /** Callback ao clicar em Exportar PDF */
  onExportPDF: () => void;
  /** Callback ao clicar em Exportar Excel (opcional) */
  onExportExcel?: () => void;
  /** Callback ao clicar em Compartilhar (opcional) */
  onShare?: () => void;
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
  onExportPDF,
  onExportExcel,
  onShare,
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
            <div className="user-avatar">{iniciais(fazenda)}</div>
            <div className="user-name">{fazenda}</div>
            <div className="user-role">
              {tecnico && tecnico.trim() ? (crea ? `${tecnico.trim()} · CREA ${crea}` : tecnico.trim()) : (crea ? `Eng. Agrônomo · CREA ${crea}` : 'Relatório Técnico')}
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
            <div className="nav-section-label" style={{ marginTop: '1rem' }}>Exportar</div>
            <button
              type="button"
              className="nav-item"
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', font: 'inherit' }}
              onClick={onExportPDF}
            >
              <span className="nav-icon">🖨️</span> Exportar PDF
            </button>
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
              <span className="status-badge finalizado">
                <span className="dot" /> Finalizado
              </span>
            </div>
            <div className="header-right no-print" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              {reportId && <span className="meta-tag">{reportId}</span>}
              <button type="button" onClick={onExportPDF} className="btn-action outline">
                🖨️ Exportar PDF
              </button>
              {onExportExcel != null && (
                <button type="button" onClick={onExportExcel} className="btn-action outline">
                  📊 Exportar Excel
                </button>
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
