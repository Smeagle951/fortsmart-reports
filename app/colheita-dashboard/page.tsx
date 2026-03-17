"use client";

import React, { useRef, useMemo } from 'react';

const harvestData = [
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT ACTIVE (+ VERANGO)", media: 82.07, tipo: "tratamento" },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "TESTEMUNHA / LALNIX", media: 78.69, tipo: "testemunha" },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + TRUST", media: 78.44, tipo: "tratamento" },
  
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "TESTEMUNHO AGRIVALLE", media: 84.22, tipo: "testemunha" },
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "AGRIVALLE", media: 83.45, tipo: "tratamento" },
  
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "TESTEMUNHO (1)", media: 80.22, tipo: "testemunha" },
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "VERANGO", media: 78.91, tipo: "tratamento" },
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "TESTEMUNHO (2)", media: 77.55, tipo: "testemunha" },
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "CROPBIO", media: 69.18, tipo: "tratamento" },

  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "TESTEMUNHO", media: 77.57, tipo: "testemunha" },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "VERANGO", media: 67.95, tipo: "tratamento" },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "ADUBO FOSFORO", media: 64.08, tipo: "tratamento" },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "BARRETO ALL TEC", media: 63.94, tipo: "tratamento" },

  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "COM VERANGO", media: 75.33, tipo: "tratamento" },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "SEM VERANGO (TESTEMUNHA)", media: 74.81, tipo: "testemunha" },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "ESTIMULATE", media: 74.74, tipo: "tratamento" },

  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "FÓSFORO NA LINHA", media: 71.55, tipo: "tratamento" },
  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "TESTEMUNHO", media: 70.17, tipo: "testemunha" },
  
  // Novos dados integrados
  { talhao: "T-16", variedade: "ATAQUE", produto: "VICTRATO (Teste)", media: 84.11, tipo: "tratamento" },
  { talhao: "T-16", variedade: "ATAQUE", produto: "VICTRATO (Testemunha)", media: 81.41, tipo: "testemunha" },
  
  { talhao: "T-17", variedade: "HO COARI", produto: "DOTTE OURO FINO", media: 76.84, tipo: "tratamento" },
  { talhao: "T-17", variedade: "HO COARI", produto: "VIOVAN (Padrão Fazenda)", media: 69.75, tipo: "testemunha" },
  { talhao: "T-17", variedade: "HO COARI", produto: "ADAMA (ExpertGrow e Armero)", media: 78.35, tipo: "testemunha" }
];

export default function SoybeanHarvestDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);

  const { groupedData } = useMemo(() => {
    const groups = harvestData.reduce((acc: Record<string, typeof harvestData>, curr) => {
      const key = `${curr.talhao} - ${curr.variedade}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(curr);
      return acc;
    }, {});

    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => b.media - a.media);
    });

    return { groupedData: groups };
  }, []);

  const exportPDF = async () => {
    if (typeof window === "undefined") return;
    const html2pdf = (await import('html2pdf.js')).default;
    const element = reportRef.current;
    if (!element) return;

    // Clone do elemento para não alterar o original durante a limpeza
    const container = document.createElement('div');
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Forçar visibilidade das divs pdf-only no clone
    clone.style.display = 'block';
    clone.querySelectorAll('.pdf-only').forEach((el: any) => {
      el.style.display = 'block';
    });
    
    // Limpeza de estilos não suportados (ex: oklch do Tailwind v4)
    // Isso percorre o clone e substitui oklch por versões seguras se necessário
    const allElements = clone.querySelectorAll('*');
    allElements.forEach((el: any) => {
      const styles = window.getComputedStyle(el);
      // html2canvas falha com cores oklch. Precisamos garantir cores seguras.
      // Aqui apenas garantimos que o clone tenha um fundo branco se necessário
      if (el.classList.contains('bg-white')) el.style.backgroundColor = '#ffffff';
      if (el.classList.contains('bg-slate-900')) el.style.backgroundColor = '#0f172a';
      if (el.classList.contains('text-slate-900')) el.style.color = '#0f172a';
    });

    const opt = {
      margin: [15, 10] as [number, number],
      filename: `Relatorio_Colheita_FortSmart_${new Date().getFullYear()}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().from(clone).set(opt).save();
    } catch (err) {
      console.error("Erro ao gerar PDF:", err);
      // Fallback: tentar imprimir direto se html2pdf falhar
      window.print();
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-6 md:p-16 font-sans text-slate-900">
      
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Cabeçalho Corporativo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-900 pb-10 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-1 bg-green-800"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">Relatório de Precisão</span>
            </div>
            <h1 className="text-4xl font-[900] tracking-tighter uppercase leading-none">
              Informativo de <span className="text-green-800">Colheita</span>
            </h1>
            <p className="text-slate-500 mt-4 font-bold uppercase text-[11px] tracking-widest">
              Unidade de Pesquisa & Desenvolvimento • Safra 2025/2026
            </p>
          </div>
          
          <button 
            onClick={exportPDF}
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
            Gerar Arquivo PDF
          </button>
        </div>

        {/* Glossário Técnico */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 border border-slate-200">
          {[
            { label: "Líder de Produtividade", value: "🏆", sub: "Melhor Média Local" },
            { label: "Área de Controle", value: "TS", sub: "Referência (Testemunha)" },
            { label: "Unidade de Medida", value: "sc/ha", sub: "Sacas de 60kg / Hectare" },
            { label: "Variação Técnica", value: "Δ Dif", sub: "Ganho Absoluto sobre TS" }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 flex flex-col items-center text-center">
              <div className="text-xl font-black mb-2">{item.value}</div>
              <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{item.label}</h3>
              <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{item.sub}</p>
            </div>
          ))}
        </div>

        {/* Conteúdo Técnico */}
        <div ref={reportRef} className="space-y-16 bg-white p-0">
          
          {/* Header para Impressão */}
          <div className="hidden pdf-only block p-12 border-b-4 border-slate-900">
             <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Relatório Técnico Processado</h2>
                  <p className="text-green-800 font-black text-xs uppercase tracking-[0.3em] mt-1">FortSmart Agro Intelligence</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Referência</p>
                  <p className="text-lg font-black text-slate-900">{new Date().toLocaleDateString('pt-BR')}</p>
                </div>
             </div>
          </div>

          <div className="p-0 md:p-0">
            {Object.entries(groupedData).map(([groupName, items]) => {
              const [talhao, variedade] = groupName.split(' - ');
              const witness = items.find(i => i.tipo === 'testemunha');
              const witnessMedia = witness?.media || 0;

              return (
                <div key={groupName} className="mb-20 break-inside-avoid">
                  
                  {/* Cabeçalho do Talhão - Estilo Tabela Técnica */}
                  <div className="bg-slate-900 text-white px-8 py-5 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-green-500 uppercase tracking-[0.3em] block mb-1">Identificação do Lote</span>
                      <h3 className="text-xl font-black uppercase tracking-tight">Talhão {talhao} • {variedade}</h3>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status da Amostragem</span>
                      <span className="text-xs font-black uppercase tracking-widest">Consolidado</span>
                    </div>
                  </div>

                  <div className="border-x border-b border-slate-200">
                    <table className="w-full text-left border-collapse table-fixed">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-20">Pos</th>
                          <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">Produto / Tratamento</th>
                          <th className="py-4 px-8 text-[10px] font-black text-slate-500 uppercase tracking-widest w-40">Tipo</th>
                          <th className="py-4 px-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest w-32">Dif. sc/ha</th>
                          <th className="py-4 px-8 text-right text-[10px] font-black text-slate-500 uppercase tracking-widest w-32">Média sc/ha</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const isWin = index === 0;
                          const isWitness = item.tipo === 'testemunha';
                          const diff = item.media - witnessMedia;
                          const diffStr = diff === 0 ? "-" : `${diff > 0 ? '+' : ''}${diff.toFixed(2).replace('.', ',')}`;
                          
                          return (
                            <tr key={item.produto} className={`border-b border-slate-100 last:border-0 ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                              <td className="py-5 px-8">
                                <span className={`text-xs font-black ${isWin ? 'text-green-700' : 'text-slate-400'}`}>
                                  {index + 1}º
                                </span>
                              </td>
                              <td className="py-5 px-8">
                                <span className={`text-sm font-black tracking-tight ${isWitness ? 'text-slate-400 italic font-medium' : 'text-slate-900 uppercase'}`}>
                                  {item.produto}
                                </span>
                              </td>
                              <td className="py-5 px-8">
                                <span className={`text-[9px] font-black uppercase tracking-widest py-1 px-2 border ${isWitness ? 'bg-slate-100 border-slate-200 text-slate-400' : 'bg-green-50 border-green-100 text-green-700 font-black'}`}>
                                  {isWitness ? 'Testemunha' : 'Tratamento'}
                                </span>
                              </td>
                              <td className="py-5 px-8 text-right">
                                <span className={`text-sm font-black tabular-nums ${diff > 0 ? 'text-green-700' : diff < 0 ? 'text-red-700' : 'text-slate-300'}`}>
                                  {diffStr}
                                </span>
                              </td>
                              <td className="py-5 px-8 text-right bg-slate-50/50">
                                <div className="flex flex-col items-end">
                                  <span className={`text-base font-black tabular-nums ${isWin ? 'text-green-800' : 'text-slate-900'}`}>
                                    {item.media.toFixed(2).replace('.', ',')}
                                  </span>
                                  {isWin && (
                                    <span className="text-[8px] font-black text-green-600 uppercase tracking-[0.2em] leading-none mt-1">Líder</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Rodapé de Insight do Talhão */}
                  <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2">
                    <span>Relatório Automatizado FortSmart</span>
                    <span>Safra Atualizada: {new Date().getFullYear()}/{(new Date().getFullYear() + 1).toString().slice(-2)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Assinaturas Técnicas PDF */}
          <div className="hidden pdf-only grid grid-cols-2 gap-32 pt-24 mt-24 border-t-4 border-slate-900">
             <div className="text-center">
                <div className="h-0.5 bg-slate-300 w-full mb-4"></div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Responsável Técnico • Engenheiro Agrônomo</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Registro CREA / ART Correspondente</p>
             </div>
             <div className="text-center">
                <div className="h-0.5 bg-slate-300 w-full mb-4"></div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Certificação do Produtor / Fazenda</p>
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Validação de Resultados em Campo</p>
             </div>
          </div>

          <div className="hidden pdf-only text-center py-12">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.5em]">
              FortSmart Agro Technologies • Sistema de Relatórios Integrados • V2.0.4
            </p>
          </div>
        </div>
        
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
        
        body { 
          font-family: 'Outfit', sans-serif !important; 
          background-color: #F0F2F5 !important;
          color: #1a1a1a !important;
        }

        @media print {
          .no-print { display: none !important; }
          .break-inside-avoid { break-inside: avoid; }
          .pdf-only { display: block !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          table { border-collapse: collapse !important; }
        }
        
        .pdf-only { display: none; }

        /* Ajustes de tipografia para números tabulares */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}
