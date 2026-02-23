'use client';

import { useEffect, useState } from 'react';
import { RelatorioMonitoramento } from '@/lib/types/monitoring';
import { mockRelatorio } from '@/lib/data/mock_monitoring';
import ReportHeader from '@/components/ReportHeader';
import TalhaoBloco from '@/components/TalhaoBloco';
import { calcularMetricasTalhao, corClassificacao } from '@/lib/calculations';

export default function HomePage() {
  const [relatorio, setRelatorio] = useState<RelatorioMonitoramento>(mockRelatorio);
  const [source, setSource] = useState<'sqlite' | 'mock' | 'loading'>('loading');
  const [dbPath, setDbPath] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingBottom: 60 }}>

      {/* Navegação lateral */}
      <nav className="nav-lateral no-print">
        {relatorio.talhoes.map(t => (
          <a key={t.id} href={`#talhao-${t.id}`} title={t.nome} className="nav-dot"
            onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
          />
        ))}
      </nav>

      <div id="relatorio-content" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0' }}>

        {/* Header */}
        <ReportHeader relatorio={relatorio} onExportPDF={handleExportPDF} onExportExcel={handleExportExcel} />

        {/* Badge de fonte dos dados */}
        <div className="animate-slideDown" style={{
          marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        }}>
          {source === 'loading' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#94A3B8' }}>
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#CBD5E1', animation: 'shimmer 1s infinite' }} />
              Carregando dados do banco…
            </div>
          ) : source === 'sqlite' ? (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#E8F5E9', border: '1.5px solid #2E7D32', borderRadius: 99,
              padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#1B5E20',
            }}>
              ✅ Dados reais do SQLite
              {dbPath && <span style={{ fontWeight: 400, opacity: 0.7, fontSize: 10 }}>· {dbPath.split(/[\\/]/).slice(-3).join('/')}</span>}
            </div>
          ) : (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: '#FFF9C4', border: '1.5px solid #F9A825', borderRadius: 99,
              padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#8B6914',
            }}>
              🔵 Dados de demonstração
              <span style={{ fontWeight: 400, fontSize: 10 }}>· Execute o app Flutter para usar dados reais</span>
            </div>
          )}
        </div>

        {/* Sumário multi-talhão */}
        {relatorio.talhoes.length > 0 && (
          <div className="card animate-fadeInUp delay-200" style={{ marginBottom: 28, padding: '16px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'linear-gradient(135deg,#1565C0,#1E88E5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <span style={{ fontSize: 22 }}>📋</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1A2332' }}>
                  Relatório Multi-Talhão · {relatorio.talhoes.length} talhão{relatorio.talhoes.length !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
                  {relatorio.talhoes.map(t => t.nome).join(' · ')} · Total:{' '}
                  {relatorio.talhoes.reduce((s, t) => s + (t.area_ha ?? 0), 0).toFixed(1)} ha
                </div>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {relatorio.talhoes.map(t => {
                  const m = calcularMetricasTalhao(t);
                  const cor = corClassificacao(m.classificacao);
                  return (
                    <a key={t.id} href={`#talhao-${t.id}`}
                      onClick={e => { e.preventDefault(); document.getElementById(`talhao-${t.id}`)?.scrollIntoView({ behavior: 'smooth' }); }}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none', cursor: 'pointer' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: cor }}>{m.indiceOcorrencia}%</div>
                      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 500 }}>{t.nome}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Talhões */}
        {relatorio.talhoes.map((talhao, idx) => (
          <TalhaoBloco key={talhao.id} talhao={talhao} index={idx + 1} total={relatorio.talhoes.length} data={relatorio.data} />
        ))}

        {/* Rodapé */}
        <footer style={{ textAlign: 'center', padding: '32px 0', borderTop: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8' }}>
            🌿 FortSmart Agro · Relatório gerado em {relatorio.data} · {relatorio.tecnico}
          </div>
          <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 6 }}>
            Este relatório possui validade técnica conforme data de emissão. Para dúvidas, consulte seu engenheiro agrônomo.
          </div>
        </footer>
      </div>
    </div>
  );
}
