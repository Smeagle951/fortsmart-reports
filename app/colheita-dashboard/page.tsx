"use client";

import React, { useRef, useMemo } from 'react';

const harvestData = [
  // T-15 (DM79K80 CE)
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + ACTIVE + VERANGO", hectares: 30.29, media: 82.07, tipo: "tratamento", pa: "Bacillus + Fluopiram", classe: "Nematicida", categoria: "Misto", segmento: "Solo/TS", modo: "Bio + SDHI", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "SOIL ACTIVE", valor: 40, moeda: "BRL", dose_ha: 1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "PADRAO FAZENDA / LALNIX RESIST + VERANGO", hectares: 33.46, media: 78.69, tipo: "testemunha", pa: "B. licheniformis + Fluopiram", classe: "Nematicida", categoria: "Misto", segmento: "Solo/TS", modo: "Bio + SDHI", composicao_custos: [{ produto: "LALNIX RESIST", valor: 475, moeda: "BRL", dose_ha: 0.1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + TRUST", hectares: 27.3, media: 78.44, tipo: "tratamento", pa: "Bacillus + Trichoderma", classe: "Nematicida", categoria: "Biológico", segmento: "Solo", modo: "Antagonismo", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "TRUST", valor: 90, moeda: "BRL", dose_ha: 1 }] },

  // T-12 (BREV 5830 CE)
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "VERANGO", hectares: 3.43, media: 84.22, tipo: "testemunha", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "AGRIVALLE", hectares: 3.83, media: 83.45, tipo: "tratamento", pa: "Metabólitos microbianos", classe: "Bioestimulante", categoria: "Biológico", segmento: "Foliar", modo: "Estímulo Fisiol.", composicao_custos: [{ produto: "AGRIVALLE", valor: 65, moeda: "BRL", dose_ha: 1 }] },

  // T-12 (NEO 810 I2X)
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "PADRAO FAZENDA", hectares: 7.17, media: 77.57, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "VERANGO", hectares: 6.46, media: 67.95, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "ADUBO FOSFORO", hectares: 9.62, media: 64.08, tipo: "tratamento", pa: "P2O5 (Fósforo)", classe: "Fertilizante", categoria: "Químico", segmento: "Solo", modo: "Nutrição", composicao_custos: [{ produto: "ADUBO", valor: 200, moeda: "BRL", dose_ha: 1 }] },

  // T-13 (BREV 5830 CE)
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "PADRAO FAZENDA (1)", hectares: 11, media: 80.22, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "VERANGO", hectares: 11.15, media: 78.91, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },

  // PIVO-02 (BALSAMO TMG)
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "COM VERANGO", hectares: 3.59, media: 75.33, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "SEM VERANGO (Pad. Fazenda)", hectares: 3.6, media: 74.81, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "ESTIMULATE", hectares: 3.44, media: 74.74, tipo: "tratamento", pa: "Citocinina + GA + Auxina", classe: "Bioestimulante", categoria: "Químico", segmento: "Foliar", modo: "Regulador Cresc.", composicao_custos: [{ produto: "ESTIMULATE", valor: 120, moeda: "BRL", dose_ha: 1 }] },

  // PIVO-05 (BALSAMO TMG)
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "COM VERANGO", hectares: 10, media: 78.00, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "SEM VERANGO (Pad. Fazenda)", hectares: 10, media: 75.00, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },

  // T-09 (BALSAMO TMG)
  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "FÓSFORO NA LINHA", hectares: 48, media: 71.55, tipo: "tratamento", pa: "P2O5 (Fósforo)", classe: "Fertilizante", categoria: "Químico", segmento: "Solo", modo: "Nutrição", composicao_custos: [{ produto: "FOSFORO", valor: 200, moeda: "BRL", dose_ha: 1 }] },
  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "PADRAO FAZENDA", hectares: 27.26, media: 70.17, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },

  // T-11 (BREV 5830 CE)
  { talhao: "T-11", variedade: "BREV 5830 CE", produto: "COM VERANGO", hectares: 110.28, media: 81.63, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-11", variedade: "BREV 5830 CE", produto: "PADRAO FAZENDA", hectares: 10.28, media: 77.34, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },

  // T-16 Data
  { talhao: "T-16", variedade: "VICTRATO", produto: "VICTRATO", hectares: 1.77, media: 84.11, tipo: "tratamento", pa: "Tyclopyrazoflor", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "Sistêmico", composicao_custos: [{ produto: "VIC TRATO", valor: 50.96, moeda: "USD", dose_ha: 1 }] },
  { talhao: "T-16", variedade: "VICTRATO", produto: "PADRAO FAZENDA / LALNIX RESIST + VERANGO", hectares: 2.11, media: 81.41, tipo: "testemunha", pa: "B. licheniformis + Fluopiram", classe: "Nematicida", categoria: "Misto", segmento: "Solo/TS", modo: "Bio + SDHI", composicao_custos: [{ produto: "LALNIX RESIST", valor: 475, moeda: "BRL", dose_ha: 0.1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },

  // T-17 Data
  { talhao: "T-17", variedade: "HO COARI", produto: "DOTTE OURO FINO", hectares: 2.25, media: 76.84, tipo: "tratamento", pa: "B. amyloliquefaciens", classe: "Fungicida", categoria: "Químico", segmento: "Foliar", modo: "Controle de Doenças", composicao_custos: [{ produto: "DOTT", valor: 228, moeda: "BRL", dose_ha: 0.3 }] },
  { talhao: "T-17", variedade: "HO COARI", produto: "VIOVAN (PADRAO FAZENDA)", hectares: 2.41, media: 69.75, tipo: "testemunha", pa: "Picoxistrobina", classe: "Fungicida", categoria: "Químico", segmento: "Foliar", modo: "QoI", composicao_custos: [{ produto: "VIOVAN", valor: 22, moeda: "USD", dose_ha: 0.6 }] },
  { talhao: "T-17", variedade: "HO COARI", produto: "ADAMA (ExpertGrow e Armero)", hectares: 3.92, media: 78.35, tipo: "tratamento", pa: "Protioconazol + B. ativos", classe: "Fungicida", categoria: "Químico", segmento: "Foliar", modo: "DMI", composicao_custos: [{ produto: "ARMEO", valor: 12.81, moeda: "USD", dose_ha: 1 }] }
];

const productInsights: Record<string, { alvo: string, proposta: string, bio: string }> = {
  "NEM-OUT + ACTIVE + VERANGO": { alvo: "Nematoides de Galha e Cisto", proposta: "Nematicida químico-biológico convergente.", bio: "Ação: Inibidor SDHI + Antagonismo Bacillus." },
  "PADRAO FAZENDA / LALNIX RESIST + VERANGO": { alvo: "Nematoides de Galha e Cisto", proposta: "Indução de Resistência e Nematicida.", bio: "Colonização e supressão via B. licheniformis." },
  "NEM-OUT + TRUST": { alvo: "Nematoides e Patógenos de Solo", proposta: "Controle biológico + Competição radicular.", bio: "Ação combinada Bacillus + Trichoderma." },
  "VERANGO": { alvo: "Nematoides de Galha e Cisto", proposta: "Inibidor da respiração mitocondrial (SDHI).", bio: "Fluopiram: Proteção radicular de longa persistência." },
  "AGRIVALLE": { alvo: "Estímulo Fisiológico e Ativação", proposta: "Ativação biológica e vigor radicular.", bio: "Bioestimulante via metabólitos microbianos." },
  "DOTTE OURO FINO": { alvo: "Doenças Foliares (Antracnose/Manchas)", proposta: "Controle fungicida sistêmico complementar.", bio: "Posicionamento foliar químico competitivo." },
  "VIOVAN (PADRAO FAZENDA)": { alvo: "Manchas e Ferrugem (QoI)", proposta: "Inibidor da respiração mitocondrial.", bio: "Picoxistrobina: Proteção sistêmica de baixeiro." },
  "ADAMA (ExpertGrow e Armero)": { alvo: "Doenças Foliar (DMI)", proposta: "Inibidor da biossíntese de ergosterol.", bio: "Protioconazol: Máxima eficiência contra doenças de final de ciclo." },
  "ESTIMULATE": { alvo: "Crescimento Vegetal", proposta: "Regulador de crescimento (Aux/Gib/Cit).", bio: "Equilíbrio hormonal para arranque vigoroso." },
  "VICTRATO": { alvo: "Controle Sistêmico de Nematoides", proposta: "Tyclopyrazoflor: Ação sistêmica radicular.", bio: "Nova tecnologia de alta performance via TS." },
  "ADUBO FOSFORO": { alvo: "Nutrição Mineral (P2O5)", proposta: "Suplementação energética via fósforo.", bio: "Arranque inicial e estruturação de planta." },
  "FÓSFORO NA LINHA": { alvo: "Suplementação de Fósforo", proposta: "Fósforo mineralizado para arranque.", bio: "Nutrição essencial P2O5 para energia celular." },
};

export default function SoybeanHarvestDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  // Formatação de Núm e Moeda
  const formatBRL = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const formatNum = (v: number) => new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  const [cotacaoDolar, setCotacaoDolar] = React.useState(5.20);
  const [precoSaca, setPrecoSaca] = React.useState(80);
  const [focoEnsaio, setFocoEnsaio] = React.useState<string>("Nematicida");
  const [viewMode, setViewMode] = React.useState<"Principal" | "Geral">("Principal");
  const [filtroCategoria, setFiltroCategoria] = React.useState<string>("TODOS");
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => { setMounted(true); }, []);

  const { groupedData, summaryMetrics, allProductClasses } = useMemo(() => {
    try {
      const classes = Array.from(new Set(harvestData.map(item => item.classe))).filter(c => c !== "Baseline");

      const processedData = harvestData.map(item => {
        const key = `${item.talhao} - ${item.variedade}`;
        const witnessGroup = harvestData.filter(h => `${h.talhao} - ${h.variedade}` === key);
        const witness = witnessGroup.find(h => h.tipo === 'testemunha') || witnessGroup[0];

        let custoHaBRL = 0;
        item.composicao_custos?.forEach((c: any) => {
          const valorBRL = c.moeda === 'USD' ? c.valor * cotacaoDolar : c.valor;
          custoHaBRL += valorBRL * (c.dose_ha || 1);
        });

        const rec_sc_ha = item.media;
        const rec_tot_rs = rec_sc_ha * precoSaca * item.hectares;
        const custo_tot_rs = custoHaBRL * item.hectares;
        const lucro_tot_rs = rec_tot_rs - custo_tot_rs;

        const diff_prod = item.media - witness.media;
        const payback_sc = custoHaBRL / precoSaca;

        // ROI Incremental: (Lucro Extra / Investimento Extra)
        const lucro_incremental = (diff_prod * precoSaca) - custoHaBRL;
        const roi = custoHaBRL > 0 ? (lucro_incremental / custoHaBRL) * 100 : 0;

        return {
          ...item,
          groupKey: key,
          custoHa: custoHaBRL,
          custoTot: custo_tot_rs,
          recTot: rec_tot_rs,
          lucroTot: lucro_tot_rs,
          roi,
          diff_prod,
          payback_sc,
          comparavel: item.classe === focoEnsaio
        };
      });

      const groups = processedData.reduce((acc: Record<string, any[]>, curr) => {
        if (!acc[curr.groupKey]) acc[curr.groupKey] = [];
        acc[curr.groupKey].push(curr);
        return acc;
      }, {});

      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => b.media - a.media);
      });

      const treatmentsOnly = processedData.filter(t => t.tipo === 'tratamento');

      // Filtro de Categoria Dinâmico
      const matchesFilter = (t: any) => {
        if (filtroCategoria === "TODOS") return true;
        if (filtroCategoria === "NEMATICIDA") return t.classe === "Nematicida";
        if (filtroCategoria === "FUNGICIDAS") return t.classe === "Fungicida";
        if (filtroCategoria === "NEM. QUÍMICO") return t.classe === "Nematicida" && t.categoria === "Químico";
        if (filtroCategoria === "NEM. BIOLÓGICO") return t.classe === "Nematicida" && t.categoria === "Biológico";
        return true;
      };

      // Ranking de Produtividade: Se houver filtro específico de categoria, ignoramos o 'Foco' para mostrar os resultados solicitados
      const filteredResults = treatmentsOnly.filter(t => {
        const passCat = matchesFilter(t);
        if (!passCat) return false;
        if (filtroCategoria !== "TODOS") return true; // Se escolheu categoria, mostra ela independente do Foco
        return viewMode === "Geral" || t.comparavel;   // Se tá em TODOS, respeita Modo Principal (Foco) vs Geral
      });

      const summary = {
        topProdutividade: [...filteredResults].sort((a, b) => b.media - a.media).slice(0, 3),
        topROI: [...filteredResults].filter(t => t.custoHa > 0).sort((a, b) => b.roi - a.roi).slice(0, 3),
        topLucro: [...filteredResults].sort((a, b) => b.lucroTot - a.lucroTot).slice(0, 3),
      };

      return { groupedData: groups, summaryMetrics: summary, allProductClasses: classes };
    } catch (e) {
      console.error("Critical Analysis Error:", e);
      return { groupedData: {}, summaryMetrics: { topProdutividade: [], topROI: [], topLucro: [] }, allProductClasses: [] };
    }
  }, [cotacaoDolar, precoSaca, focoEnsaio, viewMode, filtroCategoria]);

  const exportPDF = async () => {
    if (typeof window === "undefined") return;
    setIsExporting(true);
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;
      const opt = {
        margin: 5,
        filename: `Relatorio_Colheita_${new Date().getTime()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#F0F2F5",
          letterRendering: true,
          logging: false,
          onclone: (doc: Document) => {
            // Sanitizador Cirúrgico: Substitui apenas oklch() por fallbacks hex para evitar crash no canvas
            const styles = doc.querySelectorAll('style');
            styles.forEach(styleTag => {
              styleTag.innerHTML = styleTag.innerHTML.replace(/oklch\([^)]+\)/g, '#94a3b8');
            });

            const s = doc.createElement('style');
            s.innerHTML = `
              * { font-family: 'Inter', Arial, sans-serif !important; -webkit-print-color-adjust: exact; }
              .no-print { display: none !important; }
              .pdf-only { display: block !important; }
              .screen-only { display: none !important; }
              /* Ajuste de largura para o painel lateral em modo paisagem A4 */
              .lg\\:w-80 { width: 280px !important; flex-shrink: 0 !important; }
              .flex-1 { flex: 1 !important; }
              table { width: 100% !important; border-collapse: collapse !important; }
              .break-inside-avoid { break-inside: avoid !important; }
            `;
            doc.head.appendChild(s);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (err) { console.error("PDF Fail:", err); }
    finally { setIsExporting(false); }
  };

  if (!mounted) return <div className="p-20 text-center font-black uppercase text-slate-400">Iniciando Motor...</div>;

  return (
    <div className="min-h-screen bg-[#F0F2F5] p-4 md:p-8 font-sans text-slate-900 overflow-x-hidden">
      <div ref={reportRef} className="max-w-7xl mx-auto space-y-6 bg-[#F0F2F5]">

        {/* Header - SaaS Mode */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-slate-900 pb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-1 bg-green-800"></div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inteligência Estratégica Field Pro</span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">
              Informativo de <span className="text-green-800">Colheita Final</span>
            </h1>
            <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Base Consolidada • Safra 2025/2026</p>
          </div>
          <div className="flex gap-4">
            <button onClick={exportPDF} className="bg-slate-900 hover:bg-black text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest no-print shadow-xl transition-all active:scale-95">
              {isExporting ? 'Processando...' : 'Exportar Relatório'}
            </button>
          </div>
        </div>

        {/* RANKING DE PERFORMANCE & CONFIGURAÇÕES (Lado a Lado) */}
        <div className="flex flex-col lg:flex-row gap-4 mt-4">
          {/* LADO ESQUERDO: Cards de Performance */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-pink-400"></span>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Ranking de Performance ({viewMode.toUpperCase()})</h3>
            </div>
            
            <div className="flex flex-wrap gap-3">
              {/* Card 1: Produtividade */}
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 border-blue-800 shadow-sm min-h-[160px]">
                <p className="text-[9px] font-black uppercase text-blue-800/60 mb-3 flex items-center gap-1">
                  <span className="text-xs">🏆</span> Top Produtividade
                </p>
                <div className="space-y-3">
                  {summaryMetrics.topProdutividade.map((t, idx) => (
                    <div key={idx} className="flex flex-col leading-none">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[8px] flex items-center justify-center font-black">{idx + 1}º</span>
                        <span className="text-[10px] font-black uppercase truncate">{t.produto}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 ml-6">{t.media.toFixed(2)} sc/ha</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: ROI */}
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 border-green-600 shadow-sm min-h-[160px]">
                <p className="text-[9px] font-black uppercase text-green-600/60 mb-3 flex items-center gap-1">
                  <span className="text-xs">🚀</span> Top ROI %
                </p>
                <div className="space-y-3">
                  {summaryMetrics.topROI.map((t, idx) => (
                    <div key={idx} className="flex flex-col leading-none">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-green-600 text-white text-[8px] flex items-center justify-center font-black">{idx + 1}º</span>
                        <span className="text-[10px] font-black uppercase truncate">{t.produto}</span>
                      </div>
                      <span className="text-[9px] font-black text-green-700 ml-6">{Math.round(t.roi)}% ROI</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Lucro/HA */}
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 border-indigo-700 shadow-sm min-h-[160px]">
                <p className="text-[9px] font-black uppercase text-indigo-700/60 mb-3 flex items-center gap-1">
                  <span className="text-xs">💰</span> Top Lucro/HA
                </p>
                <div className="space-y-3">
                  {summaryMetrics.topLucro.map((t, idx) => (
                    <div key={idx} className="flex flex-col leading-none">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-indigo-700 text-white text-[8px] flex items-center justify-center font-black">{idx + 1}º</span>
                        <span className="text-[10px] font-black uppercase truncate">{t.produto}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 ml-6">R$ {formatNum(t.lucroTot / t.hectares)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Recomendação */}
              <div className="flex-1 min-w-[220px] bg-amber-50 p-4 border-t-2 border-l-4 border-orange-500 shadow-sm min-h-[160px]">
                <p className="text-[9px] font-black uppercase text-orange-600/60 mb-3 flex items-center gap-1">
                  <span className="text-xs">✨</span> Recomendação
                </p>
                {summaryMetrics.topROI[0] && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-orange-900 leading-tight">
                      {summaryMetrics.topROI[0].produto}
                    </p>
                    <p className="text-[9px] italic text-orange-700 leading-tight">
                      "Excelente equilíbrio entre produtividade e baixo custo."
                    </p>
                    <div className="mt-2 bg-orange-500 text-white text-[8px] font-black px-2 py-1 uppercase text-center rounded-sm">
                      Altamente Recomendado
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* LADO DIREITO: Painel de Configurações */}
          <div className="w-full lg:w-80 bg-white p-6 border border-slate-200 shadow-sm space-y-6 relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs">⚙️</span>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Configurações</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Dólar (USD)</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-sm overflow-hidden">
                  <span className="px-2 text-[10px] font-bold text-slate-400">R$</span>
                  <input type="number" step="0.01" value={cotacaoDolar} onChange={(e) => setCotacaoDolar(Number(e.target.value))} className="bg-transparent p-2 w-full font-black text-xs outline-none no-print" />
                  <span className="hidden pdf-only p-2 font-black text-xs">{cotacaoDolar.toFixed(2)}</span>
                </div>
              </div>
              <div>
                <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block mb-1">Soja (R$/sc)</label>
                <div className="flex items-center bg-slate-50 border border-slate-100 rounded-sm overflow-hidden">
                  <span className="px-2 text-[10px] font-bold text-slate-400">R$</span>
                  <input type="number" value={precoSaca} onChange={(e) => setPrecoSaca(Number(e.target.value))} className="bg-transparent p-2 w-full font-black text-xs outline-none no-print" />
                  <span className="hidden pdf-only p-2 font-black text-xs">{precoSaca}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Filtros de Performance</label>
              <div className="grid grid-cols-2 gap-1.5">
                {["TODOS", "NEMATICIDA", "FUNGICIDAS", "NEM. QUÍMICO", "NEM. BIOLÓGICO"].map(btn => (
                  <button 
                    key={btn} 
                    onClick={() => setFiltroCategoria(btn)} 
                    className={`px-2 py-2 text-[8px] font-black uppercase border transition-all rounded-sm flex items-center justify-center text-center leading-none ${filtroCategoria === btn ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-400'}`}
                    style={{ minHeight: '32px' }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
               <button onClick={() => setViewMode(viewMode === "Principal" ? "Geral" : "Principal")} className="flex-1 px-3 py-2 text-[8px] font-black uppercase bg-slate-50 border border-slate-200 text-slate-600 rounded-sm flex items-center justify-center gap-2">
                 <span className={`w-2 h-2 rounded-full ${viewMode === "Principal" ? "bg-green-500" : "bg-blue-500"}`}></span>
                 {viewMode === "Principal" ? "ROI > 0" : "Top 3 Geral"}
               </button>
               <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>
          </div>
        </div>

        <div className="space-y-10 bg-[#F0F2F5] pb-10">

          {/* Grid de Talhões */}
          {Object.entries(groupedData).map(([groupKey, products]) => {
            const [talhao, variedade] = (groupKey as string).split(' - ');
            const typedProducts = products as any[];
            const bestInGroup = typedProducts[0];
            const witness = typedProducts.find((p: any) => p.tipo === 'testemunha') || typedProducts[typedProducts.length - 1];

            return (
              <div key={groupKey} className="bg-white border-y md:border border-slate-200 overflow-hidden shadow-sm break-inside-avoid">
                <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[3px] text-slate-400">Identificação do Lote</span>
                    <h3 className="text-xl font-black uppercase tracking-tighter">Talhão {talhao} • {variedade}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Status da Amostragem</span>
                    <span className="text-xs font-black uppercase tracking-widest border border-green-500 text-green-500 px-3 py-1">Consolidado</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50 border-b-2 border-slate-900">
                        <th className="py-4 px-4 text-[9px] font-black uppercase text-slate-400 text-center">Pos</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase text-slate-400">Produto / <span className="lowercase text-slate-300">categoria</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Prod. <br /><span className="text-[7px]">sc/ha</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Dif. <br /><span className="text-[7px]">sc/ha</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Custo <br /><span className="text-[7px]">r$/ha</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Área <br /><span className="text-[7px]">ha</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400 bg-slate-100">Prod Tot <br /><span className="text-[7px]">sc</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400 bg-slate-100">Rec. Tot <br /><span className="text-[7px]">r$</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400 bg-slate-100">Custo Tot <br /><span className="text-[7px]">r$</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400 bg-slate-100/50">Lucro Tot <br /><span className="text-[7px]">r$</span></th>
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">ROI <br /><span className="text-[7px]">%</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {typedProducts.map((item: any, idx) => {
                        const isWinner = idx === 0;
                        const isWitness = item.tipo === 'testemunha';
                        const diff = item.diff_prod;

                        return (
                          <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isWinner ? 'bg-green-50/20' : ''}`}>
                            <td className="py-4 px-4 text-center font-black text-xs text-slate-400">{idx + 1}º</td>
                            <td className="py-4 px-4">
                              <p className="text-[11px] font-black uppercase leading-tight">{item.produto}</p>
                              <div className="flex gap-1 mt-1">
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 uppercase">{item.pa}</span>
                                <span className={`text-[8px] font-bold px-1 py-0.5 border uppercase ${item.categoria === 'Misto' ? 'border-blue-700 text-blue-700' : item.categoria === 'Químico' ? 'border-orange-700 text-orange-700' : 'border-green-700 text-green-700'}`}>{item.categoria}</span>
                                {item.segmento !== "-" && <span className="text-[8px] font-bold px-1 py-0.5 bg-slate-800 text-white uppercase">{item.segmento}</span>}
                                {item.modo !== "-" && <span className="text-[8px] font-bold px-1 py-0.5 border border-slate-400 text-slate-400 uppercase">{item.modo}</span>}
                                {isWitness && <span className="text-[8px] font-black px-1 py-0.5 bg-slate-900 text-white uppercase">Padrão Fazenda</span>}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center font-bold text-xs tabular-nums">{item.media.toFixed(2)}</td>
                            <td className="py-4 px-4 text-center">
                              {!isWitness && (
                                <>
                                  <p className={`text-xs font-black ${diff >= 0 ? 'text-green-700' : 'text-red-700'}`}>{diff >= 0 ? '+' : ''}{diff.toFixed(2)}</p>
                                  <p className="text-[8px] text-slate-400 font-bold uppercase italic mt-1">Payback: {item.payback_sc.toFixed(1)}sc</p>
                                </>
                              )}
                              {isWitness && <span className="text-slate-200 font-black">-</span>}
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-bold tabular-nums border-x border-slate-50">{item.custoHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="py-4 px-4 text-center text-xs font-bold tabular-nums text-slate-500">{item.hectares}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.media * item.hectares)}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.recTot)}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.custoTot)}</td>
                            <td className={`py-4 px-4 text-center font-black text-xs bg-slate-100/60 tabular-nums ${item.lucroTot >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatNum(item.lucroTot)}</td>
                            <td className="py-4 px-4 text-center">
                              {isWitness ? (
                                <span className="text-slate-300 font-black">-</span>
                              ) : (
                                <div className={`text-xs font-black border-2 px-1 py-0.5 rounded ${item.roi >= 0 ? 'border-green-800 text-green-800' : 'border-red-700 text-red-700'}`}>
                                  {Math.round(item.roi)}%
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Duplo: Insights Agonômicos & Proposta */}
                <div className="p-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-8">

                  {/* LADO ESQUERDO: Veredito Técnico */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-[10px]">1</div>
                      <h4 className="text-sm font-black uppercase tracking-tighter">Veredito Técnico do Talhão</h4>
                    </div>
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-sm italic text-[11px] leading-relaxed text-slate-700 font-medium">
                      "Nesta área, a estratégia de manejo evidenciou que o {bestInGroup.lucroTot > witness.lucroTot ? 'investimento tecnológico superou a base econômica' : 'custo fixo de alguns tratamentos não foi compensado pelo ganho produtivo marginal'}.
                      O tratamento {bestInGroup.produto} apresentou {bestInGroup.diff_prod > 0 ? `incremento de ${bestInGroup.diff_prod.toFixed(2)} sc/ha` : 'resultado estável'}, provendo {bestInGroup.roi > 0 ? `ROI positivo de ${Math.round(bestInGroup.roi)}%` : 'proteção técnica contra patógenos'} mesmo sob pressão de custo."
                    </div>
                  </div>

                  {/* LADO DIREITO: Proposta Tecnológica */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-[10px]">2</div>
                      <h4 className="text-sm font-black uppercase tracking-tighter">Proposta Tecnológica</h4>
                    </div>
                    <div className="space-y-4">
                      {products.slice(0, 3).map((item, pi) => {
                        const insight = productInsights[item.produto];
                        if (!insight) return null;
                        return (
                          <div key={pi} className="border-l-4 border-blue-700 pl-3 py-0.5">
                            <p className="text-[10px] font-black uppercase text-blue-900">{item.produto}</p>
                            <p className="text-[9px] text-slate-600 mt-1"><span className="font-bold text-slate-900">Alvo:</span> {insight.alvo}</p>
                            <p className="text-[9px] text-slate-500 italic mt-0.5">{insight.proposta}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Rodapé Corporativo */}
          <div className="border-t-2 border-slate-200 pt-8 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Relatório Automatizado FortSmart • Veredito em Campo</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Safra Atualizada: 2025/2026</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap');
        body { font-family: 'Inter', sans-serif !important; margin: 0; padding: 0; }
        .tabular-nums { font-variant-numeric: tabular-nums; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-thumb { background: #0f172a; }
        @media print {
          body { background-color: #ffffff !important; Zoom: 0.8 !important; }
          .no-print { display: none !important; }
          .pdf-only { display: block !important; }
          .break-inside-avoid { break-inside: avoid !important; }
          .overflow-x-auto { overflow-x: visible !important; }
        }
        .pdf-only { display: none; }
      `}</style>
    </div>
  );
}
