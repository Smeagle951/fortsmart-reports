'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RelatorioMonitoramento } from '@/lib/types/monitoring';
import { mockRelatorio } from '@/lib/data/mock_monitoring';
import ReportHeader from '@/components/ReportHeader';
import TalhaoBloco from '@/components/TalhaoBloco';
import { calcularMetricasTalhao, corClassificacao } from '@/lib/calculations';

function HomeContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token');
  const [relatorio, setRelatorio] = useState<RelatorioMonitoramento>(mockRelatorio);
  const [source, setSource] = useState<'sqlite' | 'mock' | 'loading'>('loading');
  const [dbPath, setDbPath] = useState<string | null>(null);

  // Se tiver ?token= na URL, redireciona para /r/[token] (relatório publicado)
  useEffect(() => {
    if (tokenFromUrl && typeof window !== 'undefined') {
      window.location.href = `/r/${tokenFromUrl}`;
      return;
    }
  }, [tokenFromUrl]);

  useEffect(() => {
    if (tokenFromUrl) return;
    fetch('/api/relatorio')
      .then(r => r.json())
      .then(data => {
        setRelatorio(data.relatorio);
        setSource(data.source);
        setDbPath(data.dbPath ?? null);
      })
      .catch(() => {
        setRelatorio(mockRelatorio);
        setSource('mock');
      });
  }, [tokenFromUrl]);

  const handleExportPDF = async () => {
    const { default: html2pdf } = await import('html2pdf.js');
    const element = document.getElementById('relatorio-content');
    if (!element) return;
    html2pdf().set({
      margin: [10, 10, 10, 10],
      filename: `FortSmart_Relatorio_${relatorio.fazenda.replace(/\s/g, '_')}_${relatorio.data.replace(/\//g, '-')}.pdf`,
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(element).save();
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();
    relatorio.talhoes.forEach(t => {
      const rows: (string | number | null)[][] = [
        ['Ponto', 'Tipo', 'Infestação', 'Terço', 'Quantidade', 'Severidade (%)'],
      ];
      t.pontos.forEach(p => {
        p.infestacoes.forEach(i => {
          rows.push([p.identificador, i.tipo, i.nome, i.terco, i.quantidade ?? 'N/A', i.severidade]);
        });
      });
      const sheet = XLSX.utils.aoa_to_sheet(rows);
      sheet['!cols'] = [{ wch: 8 }, { wch: 10 }, { wch: 22 }, { wch: 12 }, { wch: 10 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, sheet, t.nome.substring(0, 31));
    });
    XLSX.writeFile(wb, `FortSmart_${relatorio.data.replace(/\//g, '-')}.xlsx`);
  };

  const cardStyle = { background: '#fff', borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' };

  if (tokenFromUrl) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Redirecionando para o relatório…</div>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', paddingBottom: 60 }}>

      <nav className="nav-lateral no-print">
        {relatorio.talhoes.map(t => (
          <a key={t.id} href={`#talhao-${t.id}`} title={t.nome} className="nav-dot"
            onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
          />
        ))}
      </nav>

      <div id="relatorio-content" style={{ maxWidth: 960, margin: '0 auto', padding: '24px 24px 0' }}>

        <ReportHeader relatorio={relatorio} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />

        <div className="no-print" style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <a href="/monitoramento/preview" style={{ fontSize: 12, color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}>Preview Monitoramento</a>
          <a href="/visita/preview" style={{ fontSize: 12, color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}>Preview Visita Técnica</a>
          <a href="/plantio/preview" style={{ fontSize: 12, color: '#1B5E20', textDecoration: 'underline', fontWeight: 500 }}>Preview Plantio</a>
        </div>

        {source === 'loading' && (
          <div style={{ marginBottom: 16, fontSize: 12, color: '#64748B' }}>Carregando dados…</div>
        )}
        {source === 'sqlite' && (
          <div style={{ marginBottom: 16, fontSize: 11, color: '#64748B', padding: '6px 12px', background: '#E8F5E9', borderRadius: 6, display: 'inline-block' }}>
            Dados do banco local{dbPath ? ` · ${dbPath.split(/[\\/]/).slice(-2).join('/')}` : ''}
          </div>
        )}
        {source === 'mock' && (
          <div style={{ marginBottom: 16, fontSize: 11, color: '#64748B', padding: '6px 12px', background: '#F1F5F9', borderRadius: 6, display: 'inline-block' }}>
            Dados de demonstração
          </div>
        )}

        {relatorio.talhoes.length > 0 && (
          <div style={{ ...cardStyle, marginBottom: 28, overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', fontSize: 13, fontWeight: 600, color: '#475569' }}>
              Resumo dos talhões
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#FAFBFC' }}>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Talhão</th>
                  <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Área (ha)</th>
                  <th style={{ padding: 12, textAlign: 'right', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Índice</th>
                  <th style={{ padding: 12, textAlign: 'left', fontWeight: 600, color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {relatorio.talhoes.map(t => {
                  const m = calcularMetricasTalhao(t);
                  const cor = corClassificacao(m.classificacao);
                  return (
                    <tr key={t.id} style={{ borderBottom: '1px solid #E2E8F0' }}>
                      <td style={{ padding: 12, borderBottom: '1px solid #E2E8F0' }}>
                        <a href={`#talhao-${t.id}`} onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} style={{ color: '#1B5E20', fontWeight: 600, textDecoration: 'none' }}>
                          {t.nome}
                        </a>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #E2E8F0' }}>{(t.area_ha ?? 0).toFixed(1)}</td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #E2E8F0', fontWeight: 700, color: cor }}>{m.indiceOcorrencia}%</td>
                      <td style={{ padding: 12, borderBottom: '1px solid #E2E8F0' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: `${cor}18`, color: cor }}>{m.classificacao.replace('_', ' ')}</span>
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#F8FAFC' }}>
                  <td style={{ padding: 12, fontWeight: 600 }}>Total</td>
                  <td style={{ padding: 12, textAlign: 'right', fontWeight: 600 }}>{relatorio.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0).toFixed(1)}</td>
                  <td colSpan={2} style={{ padding: 12 }} />
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {relatorio.talhoes.map((talhao, idx) => (
          <TalhaoBloco key={talhao.id} talhao={talhao} index={idx + 1} total={relatorio.talhoes.length} data={relatorio.data} />
        ))}

        <footer style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid #E2E8F0', fontSize: 12, color: '#64748B' }}>
          FortSmart Agro · Relatório gerado em {relatorio.data} · {relatorio.tecnico}
        </footer>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#64748B' }}>Carregando…</div>}>
      <HomeContent />
    </Suspense>
  );
}
