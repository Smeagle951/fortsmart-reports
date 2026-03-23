"use client";

import React, { useRef, useMemo } from 'react';

const harvestData = [
  // T-15 (DM79K80 CE)
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + ACTIVE + VERANGO", hectares: 30.29, media: 82.07, tipo: "tratamento", pa: "B. licheniformis + Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Misto", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "SOIL ACTIVE", valor: 40, moeda: "BRL", dose_ha: 1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "TESTEMUNHA / LALNIX RESIST + VERANGO", hectares: 33.46, media: 78.69, tipo: "testemunha", pa: "B. licheniformis", classe: "Nematicida", acao: "Controle", categoria: "Misto", composicao_custos: [{ produto: "LALNIX RESIST", valor: 475, moeda: "BRL", dose_ha: 0.1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + TRUST", hectares: 27.3, media: 78.44, tipo: "tratamento", pa: "B. subtilis + Trichoderma", classe: "Nematicida", acao: "Nematicida", categoria: "Biológico", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "TRUST", valor: 94, moeda: "BRL", dose_ha: 1 }] },

  // T-12 (BREV 5830 CE)
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "VERANGO", hectares: 3.43, media: 84.22, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "AGRIVALLE", hectares: 3.83, media: 83.45, tipo: "tratamento", pa: "Bio-Ativos", classe: "Nematicida", acao: "Nematicida", categoria: "Biológico", composicao_custos: [{ produto: "AGRIVALLE", valor: 65, moeda: "BRL", dose_ha: 1 }] },

  // T-12 (NEO 810 I2X)
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "TESTEMUNHO", hectares: 7.17, media: 77.57, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "VERANGO", hectares: 6.46, media: 67.95, tipo: "tratamento", pa: "Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-12", variedade: "NEO 810 I2X", produto: "ADUBO FOSFORO", hectares: 9.62, media: 64.08, tipo: "tratamento", pa: "P2O5", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "ADUBO", valor: 200, moeda: "BRL", dose_ha: 1 }] },

  // T-13 (BREV 5830 CE)
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "TESTEMUNHO (1)", hectares: 11, media: 80.22, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },
  { talhao: "T-13", variedade: "BREV 5830 CE", produto: "VERANGO", hectares: 11.15, media: 78.91, tipo: "tratamento", pa: "Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },

  // PIVO-02 (BALSAMO TMG)
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "COM VERANGO", hectares: 3.59, media: 75.33, tipo: "tratamento", pa: "Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "SEM VERANGO (Test.)", hectares: 3.6, media: 74.81, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },
  { talhao: "PIVO-02", variedade: "BALSAMO TMG", produto: "ESTIMULATE", hectares: 3.44, media: 74.74, tipo: "tratamento", pa: "Citocitina + GA", classe: "Nematicida", acao: "Nematicida", categoria: "Biológico", composicao_custos: [{ produto: "ESTIMULATE", valor: 120, moeda: "BRL", dose_ha: 1 }] },

  // PIVO-05 (BALSAMO TMG)
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "COM VERANGO", hectares: 10, media: 78.00, tipo: "tratamento", pa: "Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "SEM VERANGO (Test.)", hectares: 10, media: 75.00, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },

  // T-09 (BALSAMO TMG)
  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "FÓSFORO NA LINHA", hectares: 48, media: 71.55, tipo: "tratamento", pa: "P2O5", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "FOSFORO", valor: 200, moeda: "BRL", dose_ha: 1 }] },
  { talhao: "T-09", variedade: "BALSAMO TMG", produto: "TESTEMUNHO", hectares: 27.26, media: 70.17, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },

  // T-11 (BREV 5830 CE)
  { talhao: "T-11", variedade: "BREV 5830 CE", produto: "COM VERANGO", hectares: 110.28, media: 81.63, tipo: "tratamento", pa: "Fluopirama", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-11", variedade: "BREV 5830 CE", produto: "TESTEMUNHO", hectares: 10.28, media: 77.34, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },

  // T-16 Data
  { talhao: "T-16", variedade: "VICTRATO", produto: "VICTRATO", hectares: 1.77, media: 84.11, tipo: "tratamento", pa: "Tyclopyrazoflor", classe: "Nematicida", acao: "Nematicida", categoria: "Químico", composicao_custos: [{ produto: "VIC TRATO", valor: 50.96, moeda: "USD", dose_ha: 1 }] },
  { talhao: "T-16", variedade: "VICTRATO", produto: "PADRAO FAZENDA", hectares: 2.11, media: 81.41, tipo: "testemunha", pa: "Padrão", classe: "Nematicida", acao: "Controle", categoria: "Baseline", composicao_custos: [] },

  // T-17 Data
  { talhao: "T-17", variedade: "HO COARI", produto: "DOTTE OURO FINO", hectares: 2.25, media: 76.84, tipo: "tratamento", pa: "B. amyloliquefaciens", classe: "Nematicida", acao: "Nematicida", categoria: "Biológico", composicao_custos: [{ produto: "DOTT", valor: 228, moeda: "BRL", dose_ha: 0.3 }] },
  { talhao: "T-17", variedade: "HO COARI", produto: "VIOVAN (Padrão Fazenda)", hectares: 2.41, media: 69.75, tipo: "testemunha", pa: "Picoxistrobina", classe: "Fungicida", acao: "Controle", categoria: "Químico", composicao_custos: [{ produto: "VIOVAN", valor: 22, moeda: "USD", dose_ha: 0.6 }] },
  { talhao: "T-17", variedade: "HO COARI", produto: "ADAMA (ExpertGrow e Armero)", hectares: 3.92, media: 78.35, tipo: "tratamento", pa: "Protioconazol + B. ativos", classe: "Fungicida", acao: "Controle", categoria: "Químico", composicao_custos: [{ produto: "ARMEO", valor: 12.81, moeda: "USD", dose_ha: 1 }] }
];


const productInsights: Record<string, { alvo: string, proposta: string, bio: string }> = {
  "VERANGO": { alvo: "Nematoides de Galha e Cisto", proposta: "Nematicida químico de longa persistência.", bio: "Proteção radicular robusta para soja." },
  "AGRIVALLE": { alvo: "Saúde Radicular e Vigor", proposta: "Bioestimulação focada em mineralização.", bio: "Equilíbrio biológico e explosão de raízes." },
  "DOTTE OURO FINO": { alvo: "Fungos de Solo e Nematoides", proposta: "Biológico multissítio protetor.", bio: "Ação sinérgica entre fungos e bactérias." },
  "VIOVAN (Padrão Fazenda)": { alvo: "Manchas e Ferrugem", proposta: "Controle fungicida sistêmico tradicional.", bio: "Padrão ouro em controle foliar preventivo." },
  "ADAMA (ExpertGrow e Armero)": { alvo: "Doenças e Proteção", proposta: "Protetor multissítio com bioestimulante.", bio: "Redução de estresse e proteção de baixeiro." },
  "NEM-OUT": { alvo: "Supressão de Nematoides", proposta: "Nematicida biológico via solo.", bio: "Colonização rizoférica e parasitismo de ovos." },
  "LALNIX RESIST": { alvo: "Resistência Induzida", proposta: "Inoculante via sulco para vigor.", bio: "Ativação de defesas naturais da planta." },
  "TRUST": { alvo: "Patógenos de Solo", proposta: "Fungicida biológico preventivo.", bio: "Controle de Fusarium e Rhizoctonia." },
  "SOIL ACTIVE": { alvo: "Atividade de Solo", proposta: "Ativador de microbiota benéfica.", bio: "Melhoria na absorção de fósforo e água." },
  "ESTIMULATE": { alvo: "Equilíbrio Hormonal", proposta: "Fisiológico para arranque inicial.", bio: "Sincronismo de germinação e stand uniforme." },
  "VICTRATO": { alvo: "Nematoides e Manchas", proposta: "Tecnologia sistêmica potente.", bio: "Máximo vigor e proteção contra podridões." },
};

export default function SoybeanHarvestDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = React.useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };
  const [cotacaoDolar, setCotacaoDolar] = React.useState(5.20);
  const [precoSaca, setPrecoSaca] = React.useState(80);
  const [filterCategoria, setFilterCategoria] = React.useState<"Todas" | "Nematicida" | "Fungicidas" | "Nem. Químico" | "Nem. Biológico">("Todas");
  const [filterROI, setFilterROI] = React.useState(false);
  const [filterTop3, setFilterTop3] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const { groupedData, summaryMetrics, analysisByProduct } = useMemo(() => {
    try {
      // 1. Agrupamento inicial
      const groups = harvestData.reduce((acc: Record<string, any[]>, curr) => {
        const key = `${curr.talhao} - ${curr.variedade}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push({ ...curr });
        return acc;
      }, {});

      let allTreatments: any[] = [];

      // 2. Cálculos Financeiros por Grupo
      Object.keys(groups).forEach(key => {
        const items = groups[key];
        const witness = items.find((i: any) => i.tipo === 'testemunha') || items[0];
        const witnessMedia = witness?.media || 0;

        items.forEach((item: any) => {
          // Soma todos os componentes convertendo para Reais e multiplicando pela dose
          const custo_total_reais = (item.composicao_custos || []).reduce((acc: number, c: any) => {
            const preco_base = c.moeda === 'USD' ? c.valor * cotacaoDolar : c.valor;
            const dose = c.dose_ha !== undefined ? c.dose_ha : 1;
            return acc + (preco_base * dose);
          }, 0);

          item.custo_ha = custo_total_reais;
          item.receita = item.media * precoSaca;
          item.dif_sc = item.media - witnessMedia;

          item.area = item.hectares || 0; // Usando os hectares precisos por talhão
          item.prod_total = item.media * item.area;
          item.custo_total = item.custo_ha * item.area;
          item.receita_total = item.receita * item.area;
          item.break_even = item.custo_ha > 0 ? (item.custo_ha / precoSaca) : 0;

          if (item.tipo === 'testemunha') {
            item.ganho = 0;
            item.lucro = 0;
            item.roi = 0;
            item.lucro_total = 0;
          } else {
            item.ganho = item.dif_sc * precoSaca;
            item.lucro = item.ganho - item.custo_ha;
            item.lucro_total = item.lucro * item.area;
            item.roi = item.custo_ha > 0 ? (item.lucro / item.custo_ha) * 100 : 0;
            allTreatments.push(item);
          }
        });

        items.sort((a, b) => b.lucro - a.lucro);
      });

      // 3. Filtros
      let filteredGroups: Record<string, any[]> = {};
      let allFilteredTreatments: any[] = [];

      Object.keys(groups).forEach(key => {
        let filteredItems = groups[key].filter((item: any) => {
          if (item.tipo === 'testemunha') return true;

          // Filtros Granulares
          if (filterCategoria === "Nematicida") {
            if (item.classe !== "Nematicida") return false;
          } else if (filterCategoria === "Fungicidas") {
            if (item.classe !== "Fungicida") return false;
          } else if (filterCategoria === "Nem. Químico") {
            if (item.classe !== "Nematicida" || item.categoria !== "Químico") return false;
          } else if (filterCategoria === "Nem. Biológico") {
            if (item.classe !== "Nematicida" || item.categoria !== "Biológico") return false;
          } else if (filterCategoria !== "Todas" && item.categoria !== filterCategoria) {
            return false;
          }
          
          if (filterROI && item.roi <= 0) return false;
          return true;
        });

        if (filterTop3) {
          const wit = filteredItems.find((i: any) => i.tipo === 'testemunha');
          let trts = filteredItems.filter((i: any) => i.tipo === 'tratamento').sort((a: any, b: any) => b.lucro - a.lucro).slice(0, 3);
          filteredItems = wit ? [...trts, wit] : trts;
        }

        if (filteredItems.some((i: any) => i.tipo === 'tratamento')) {
          filteredGroups[key] = filteredItems;
          filteredItems.forEach((i: any) => {
            if (i.tipo === 'tratamento') allFilteredTreatments.push(i);
          });
        }
      });

      // 4. Métricas de Resumo Avançado (Baseado nos filtros)
      const topProd = [...allFilteredTreatments].sort((a, b) => b.media - a.media).slice(0, 3);
      const topRoi = [...allFilteredTreatments].sort((a, b) => b.roi - a.roi).slice(0, 3);
      const topLucro = [...allFilteredTreatments].sort((a, b) => b.lucro - a.lucro).slice(0, 3);

      const worst = [...allFilteredTreatments].sort((a, b) => a.lucro - b.lucro)[0] || null;

      // Recomendação (do 1º lugar do score)
      let recomended: any = null;
      let explanation = "";
      
      if (allFilteredTreatments.length > 0) {
        const maxProd = Math.max(...allFilteredTreatments.map((t: any) => t.media), 1);
        const maxRoi = Math.max(...allFilteredTreatments.map((t: any) => t.roi), 0.01);
        const maxCusto = Math.max(...allFilteredTreatments.map((t: any) => t.custo_ha), 1);

        allFilteredTreatments.forEach((t: any) => {
          const normProd = t.media / maxProd;
          const normRoi = t.roi > 0 ? (t.roi / maxRoi) : 0;
          const normCusto = t.custo_ha / maxCusto;
          t.score = (0.4 * normProd) + (0.5 * normRoi) - (0.1 * normCusto);
        });

        recomended = [...allFilteredTreatments].sort((a, b) => b.score - a.score)[0];

        if (recomended) {
          if (recomended.roi > 100 && recomended.dif_sc > 2) explanation = "Excelente equilíbrio entre produtividade e baixo custo.";
          else if (recomended.roi > 0) explanation = "Tratamento mais equilibrado para este cenário filtrado.";
          else explanation = "Resultados sob pressão, avaliar custo-benefício.";
        }
      }

      // 5. Análise de Rentabilidade Consolidada por Tecnologia (Produto)
      const groupsByTech: { [key: string]: any } = {};
      allTreatments.forEach((t) => {
        if (t.tipo !== 'tratamento' || t.lucro === undefined) return;

        // Remove "COM " ou parecidos se desejar agrupar melhor, ou mantém o nome exato. Aqui usamos o exato.
        const pName = t.produto;

        if (!groupsByTech[pName]) {
          groupsByTech[pName] = {
            produto: pName,
            ensaios: 0,
            hectares_totais: 0,
            ganho_sc_ha: 0,
            custo_ha: 0,
            lucro_total: 0,
            investimento_total: 0,
            vitorias: 0 // Ensaios onde lucro > 0
          };
        }

        groupsByTech[pName].ensaios += 1;
        groupsByTech[pName].hectares_totais += t.hectares;
        groupsByTech[pName].ganho_sc_ha += t.dif_sc;
        groupsByTech[pName].custo_ha += t.custo_ha;
        groupsByTech[pName].lucro_total += t.lucro;
        groupsByTech[pName].investimento_total += (t.custo_ha * t.hectares);
        if (t.lucro > 0) groupsByTech[pName].vitorias += 1;
      });

      const analysisResult = Object.values(groupsByTech).map((g) => {
        g.media_ganho_sc = g.ganho_sc_ha / g.ensaios;
        g.media_custo_ha = g.custo_ha / g.ensaios;
        g.roi_medio = g.investimento_total > 0 ? (g.lucro_total / g.investimento_total) * 100 : 0;
        g.taxa_sucesso = (g.vitorias / g.ensaios) * 100;
        return g;
      });

      analysisResult.sort((a, b) => b.lucro_total - a.lucro_total);

      return {
        groupedData: filteredGroups,
        summaryMetrics: { topProd, topRoi, topLucro, worst, recomended, explanation },
        analysisByProduct: analysisResult
      };
    } catch (e) {
      console.error("Memo Crash:", e);
      return { groupedData: {}, summaryMetrics: { bestProd: null, bestRoi: null, worst: null, recomended: null, explanation: "Erro na análise." }, analysisByProduct: [] };
    }
  }, [cotacaoDolar, precoSaca, filterCategoria, filterROI, filterTop3]);

  const exportPDF = async () => {
    if (typeof window === "undefined" || isExporting) return;
    setIsExporting(true);
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      const element = reportRef.current;
      if (!element) return;

      const opt = {
        margin: [10, 5] as [number, number],
        filename: `Relatorio_Colheita_FortSmart_${new Date().getFullYear()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          letterRendering: true,
          logging: false,
          scrollY: -window.scrollY,
          onclone: (doc: Document) => {
            // ═══════════════════════════════════════════════════════════════
            // SANITIZADOR DEFINITIVO PDF – Tailwind v4 oklch → HEX
            // Estratégia: Remove APENAS o CSS que contém oklch (Tailwind core)
            //             Mantém os <style jsx global> customizados
            //             Injeta stylesheet completo com TODAS as classes usadas
            // ═══════════════════════════════════════════════════════════════

            // 1. Remove apenas stylesheets que contêm oklch
            const allStyles = Array.from(doc.querySelectorAll('style, link[rel="stylesheet"]'));
            allStyles.forEach(tag => {
              if (tag.tagName === 'LINK') {
                tag.remove(); // Links externos (Tailwind etc) 
              } else if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab')) {
                tag.remove(); // Style tags com cores problemáticas
              }
              // Mantém style tags que NÃO contêm oklch (ex: nosso jsx global)
            });

            // 2. Injeta o stylesheet completo que replica TODAS as classes Tailwind usadas
            const s = doc.createElement('style');
            s.innerHTML = `
              /* === RESET & BASE === */
              *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; border: 0 solid #e2e8f0; }
              * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; print-color-adjust: exact !important; }
              html { line-height: 1.5; -webkit-text-size-adjust: 100%; font-family: 'Outfit', 'Inter', Arial, sans-serif; }
              body { font-family: 'Outfit', 'Inter', Arial, sans-serif; color: #0f172a; background: #F0F2F5; }
              table { border-collapse: collapse; }
              img, svg { display: block; max-width: 100%; }
              input { font-family: inherit; font-size: inherit; }

              /* === LAYOUT === */
              .min-h-screen { min-height: 100vh; }
              .max-w-6xl { max-width: 72rem; }
              .mx-auto { margin-left: auto; margin-right: auto; }
              .block { display: block; }
              .hidden { display: none; }
              .inline-block { display: inline-block; }
              .inline { display: inline; }
              .flex { display: flex; }
              .grid { display: grid; }
              .table-fixed { table-layout: fixed; }
              .flex-1 { flex: 1 1 0%; }
              .flex-col { flex-direction: column; }
              .flex-row { flex-direction: row; }
              .flex-wrap { flex-wrap: wrap; }
              .flex-shrink-0 { flex-shrink: 0; }
              .items-center { align-items: center; }
              .items-start { align-items: flex-start; }
              .items-end { align-items: flex-end; }
              .justify-center { justify-content: center; }
              .justify-between { justify-content: space-between; }
              .gap-0\\.5 { gap: 0.125rem; }
              .gap-1 { gap: 0.25rem; }
              .gap-1\\.5 { gap: 0.375rem; }
              .gap-2 { gap: 0.5rem; }
              .gap-3 { gap: 0.75rem; }
              .gap-4 { gap: 1rem; }
              .gap-5 { gap: 1.25rem; }
              .gap-6 { gap: 1.5rem; }
              .gap-8 { gap: 2rem; }
              .gap-32 { gap: 8rem; }
              .gap-px { gap: 1px; }
              .grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
              .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .space-y-2 > :not(:first-child) { margin-top: 0.5rem; }
              .space-y-3 > :not(:first-child) { margin-top: 0.75rem; }
              .space-y-4 > :not(:first-child) { margin-top: 1rem; }
              .space-y-5 > :not(:first-child) { margin-top: 1.25rem; }
              .space-y-12 > :not(:first-child) { margin-top: 3rem; }
              .space-y-16 > :not(:first-child) { margin-top: 4rem; }
              .divide-y > :not(:first-child) { border-top: 1px solid #f1f5f9; }
              .overflow-hidden { overflow: hidden; }
              .relative { position: relative; }
              .absolute { position: absolute; }
              .top-0 { top: 0; }
              .left-0 { left: 0; }
              .inset-0 { inset: 0; }
              .z-10 { z-index: 10; }
              .w-full { width: 100%; }
              .w-1 { width: 0.25rem; }
              .w-3 { width: 0.75rem; }
              .w-4 { width: 1rem; }
              .w-5 { width: 1.25rem; }
              .w-8 { width: 2rem; }
              .w-10 { width: 2.5rem; }
              .h-full { height: 100%; }
              .h-0\\.5 { height: 0.125rem; }
              .h-1 { height: 0.25rem; }
              .h-3 { height: 0.75rem; }
              .h-4 { height: 1rem; }
              .h-5 { height: 1.25rem; }
              .h-px { height: 1px; }
              .min-w-0 { min-width: 0; }
              .min-w-10 { min-width: 2.5rem; }
              .min-w-12 { min-width: 3rem; }
              .break-inside-avoid { break-inside: avoid; }
              .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
              .text-ellipsis { text-overflow: ellipsis; }

              /* === SPACING === */
              .p-0 { padding: 0; }
              .p-2 { padding: 0.5rem; }
              .p-4 { padding: 1rem; }
              .p-6 { padding: 1.5rem; }
              .p-8 { padding: 2rem; }
              .p-12 { padding: 3rem; }
              .px-1 { padding-left: 0.25rem; padding-right: 0.25rem; }
              .px-1\\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
              .px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
              .px-4 { padding-left: 1rem; padding-right: 1rem; }
              .px-8 { padding-left: 2rem; padding-right: 2rem; }
              .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
              .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
              .py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
              .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
              .py-5 { padding-top: 1.25rem; padding-bottom: 1.25rem; }
              .py-8 { padding-top: 2rem; padding-bottom: 2rem; }
              .py-12 { padding-top: 3rem; padding-bottom: 3rem; }
              .pt-1 { padding-top: 0.25rem; }
              .pt-2 { padding-top: 0.5rem; }
              .pt-4 { padding-top: 1rem; }
              .pt-6 { padding-top: 1.5rem; }
              .pt-24 { padding-top: 6rem; }
              .pb-10 { padding-bottom: 2.5rem; }
              .pl-3 { padding-left: 0.75rem; }
              .pl-7 { padding-left: 1.75rem; }
              .pr-2 { padding-right: 0.5rem; }
              .mb-1 { margin-bottom: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mb-3 { margin-bottom: 0.75rem; }
              .mb-4 { margin-bottom: 1rem; }
              .mb-6 { margin-bottom: 1.5rem; }
              .mb-8 { margin-bottom: 2rem; }
              .mb-20 { margin-bottom: 5rem; }
              .mt-0\\.5 { margin-top: 0.125rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-4 { margin-top: 1rem; }
              .mt-6 { margin-top: 1.5rem; }
              .mt-8 { margin-top: 2rem; }
              .mt-24 { margin-top: 6rem; }
              .ml-1 { margin-left: 0.25rem; }
              .my-4 { margin-top: 1rem; margin-bottom: 1rem; }

              /* === TYPOGRAPHY === */
              .font-sans { font-family: 'Outfit', 'Inter', Arial, sans-serif; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
              .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
              .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
              .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
              .text-\\[6px\\] { font-size: 6px; }
              .text-\\[6\\.5px\\] { font-size: 6.5px; }
              .text-\\[7px\\] { font-size: 7px; }
              .text-\\[8px\\] { font-size: 8px; }
              .text-\\[9px\\] { font-size: 9px; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-\\[11px\\] { font-size: 11px; }
              .font-medium { font-weight: 500; }
              .font-bold { font-weight: 700; }
              .font-black { font-weight: 900; }
              .font-\\[900\\] { font-weight: 900; }
              .uppercase { text-transform: uppercase; }
              .lowercase { text-transform: lowercase; }
              .italic { font-style: italic; }
              .tracking-tight { letter-spacing: -0.025em; }
              .tracking-tighter { letter-spacing: -0.05em; }
              .tracking-wider { letter-spacing: 0.05em; }
              .tracking-widest { letter-spacing: 0.1em; }
              .tracking-\\[0\\.2em\\] { letter-spacing: 0.2em; }
              .tracking-\\[0\\.3em\\] { letter-spacing: 0.3em; }
              .tracking-\\[0\\.5em\\] { letter-spacing: 0.5em; }
              .leading-none { line-height: 1; }
              .leading-tight { line-height: 1.25; }
              .leading-relaxed { line-height: 1.625; }
              .text-left { text-align: left; }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
              .underline { text-decoration-line: underline; }
              .decoration-dashed { text-decoration-style: dashed; }
              .underline-offset-2 { text-underline-offset: 2px; }
              .tabular-nums { font-variant-numeric: tabular-nums; }
              .whitespace-nowrap { white-space: nowrap; }

              /* === COLORS (ALL HEX – NO oklch) === */
              .text-white { color: #ffffff; }
              .text-black { color: #000000; }
              .text-slate-300 { color: #cbd5e1; }
              .text-slate-400 { color: #94a3b8; }
              .text-slate-500 { color: #64748b; }
              .text-slate-600 { color: #475569; }
              .text-slate-700 { color: #334155; }
              .text-slate-800 { color: #1e293b; }
              .text-slate-900 { color: #0f172a; }
              .text-green-500 { color: #22c55e; }
              .text-green-600 { color: #16a34a; }
              .text-green-700 { color: #15803d; }
              .text-green-800 { color: #166534; }
              .text-green-900 { color: #14532d; }
              .text-red-500 { color: #ef4444; }
              .text-red-600 { color: #dc2626; }
              .text-red-700 { color: #b91c1c; }
              .text-blue-700 { color: #1d4ed8; }
              .text-blue-800 { color: #1e40af; }
              .text-indigo-600 { color: #4f46e5; }
              .text-indigo-700 { color: #4338ca; }
              .text-indigo-800 { color: #3730a3; }
              .text-indigo-900 { color: #312e81; }
              .text-amber-700 { color: #b45309; }
              .text-amber-800 { color: #92400e; }
              .text-amber-900 { color: #78350f; }
              .text-emerald-700 { color: #047857; }

              .bg-white { background-color: #ffffff; }
              .bg-\\[\\#F0F2F5\\] { background-color: #F0F2F5; }
              .bg-slate-50 { background-color: #f8fafc; }
              .bg-slate-50\\/30 { background-color: rgba(248,250,252,0.3); }
              .bg-slate-50\\/50 { background-color: rgba(248,250,252,0.5); }
              .bg-slate-100 { background-color: #f1f5f9; }
              .bg-slate-200 { background-color: #e2e8f0; }
              .bg-slate-300 { background-color: #cbd5e1; }
              .bg-slate-900 { background-color: #0f172a; }
              .bg-green-50 { background-color: #f0fdf4; }
              .bg-green-100 { background-color: #dcfce7; }
              .bg-green-200 { background-color: #bbf7d0; }
              .bg-green-600 { background-color: #16a34a; }
              .bg-green-800 { background-color: #166534; }
              .bg-red-50 { background-color: #fef2f2; }
              .bg-red-100 { background-color: #fee2e2; }
              .bg-red-600 { background-color: #dc2626; }
              .bg-blue-50 { background-color: #eff6ff; }
              .bg-blue-100 { background-color: #dbeafe; }
              .bg-indigo-50 { background-color: #eef2ff; }
              .bg-indigo-50\\/20 { background-color: rgba(238,242,255,0.2); }
              .bg-indigo-50\\/50 { background-color: rgba(238,242,255,0.5); }
              .bg-indigo-200 { background-color: #c7d2fe; }
              .bg-indigo-600 { background-color: #4f46e5; }
              .bg-amber-50 { background-color: #fffbeb; }
              .bg-amber-500 { background-color: #f59e0b; }
              .bg-amber-600 { background-color: #d97706; }
              .bg-emerald-50 { background-color: #ecfdf5; }

              .border-slate-50 { border-color: #f8fafc; }
              .border-slate-100 { border-color: #f1f5f9; }
              .border-slate-200 { border-color: #e2e8f0; }
              .border-slate-900 { border-color: #0f172a; }
              .border-green-100 { border-color: #dcfce7; }
              .border-green-200 { border-color: #bbf7d0; }
              .border-green-700 { border-color: #15803d; }
              .border-red-200 { border-color: #fecaca; }
              .border-blue-100 { border-color: #dbeafe; }
              .border-blue-200 { border-color: #bfdbfe; }
              .border-indigo-100 { border-color: #e0e7ff; }
              .border-indigo-200 { border-color: #c7d2fe; }
              .border-amber-100 { border-color: #fef3c7; }
              .border-amber-200 { border-color: #fde68a; }
              .border-emerald-200 { border-color: #a7f3d0; }

              /* === BORDERS === */
              .border { border-width: 1px; }
              .border-0 { border-width: 0; }
              .border-2 { border-width: 2px; }
              .border-b { border-bottom-width: 1px; }
              .border-b-2 { border-bottom-width: 2px; }
              .border-b-4 { border-bottom-width: 4px; }
              .border-t { border-top-width: 1px; }
              .border-t-4 { border-top-width: 4px; }
              .border-l-2 { border-left-width: 2px; }
              .border-r { border-right-width: 1px; }
              .border-x { border-left-width: 1px; border-right-width: 1px; }
              .border-collapse { border-collapse: collapse; }
              .rounded { border-radius: 0.25rem; }
              .rounded-sm { border-radius: 0.125rem; }
              .rounded-lg { border-radius: 0.5rem; }
              .rounded-xl { border-radius: 0.75rem; }
              .rounded-full { border-radius: 9999px; }
              .rounded-none { border-radius: 0; }

              /* === EFFECTS === */
              .shadow-sm { box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
              .shadow-lg { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
              .shadow-inner { box-shadow: inset 0 2px 4px rgba(0,0,0,0.05); }
              .cursor-help { cursor: help; }
              .transition-colors { transition: color 0.15s, background-color 0.15s, border-color 0.15s; }
              .transition-all { transition: all 0.15s; }
              .outline-none { outline: none; }

              /* === RESPONSIVE (applied for PDF – always desktop) === */
              .md\\:p-16 { padding: 4rem; }
              .md\\:p-0 { padding: 0; }
              .md\\:flex-row { flex-direction: row; }
              .md\\:items-end { align-items: flex-end; }
              .md\\:col-span-2 { grid-column: span 2 / span 2; }
              .md\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
              .md\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
              .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
              .xl\\:flex-row { flex-direction: row; }
              .xl\\:w-80 { width: 20rem; }
              .xl\\:border-l { border-left-width: 1px; }
              .xl\\:border-t-0 { border-top-width: 0; }
              .xl\\:pt-0 { padding-top: 0; }
              .xl\\:pl-8 { padding-left: 2rem; }
              .xl\\:hidden { display: none; }
              .last\\:border-0:last-child { border-width: 0; }

              /* === PRINT === */
              .pdf-only { display: none; }
              .no-print { display: flex; }
              table, tr, td, th { page-break-inside: avoid; }
              @media print {
                .no-print { display: none !important; }
                .pdf-only { display: block !important; }
                body { background: white !important; }
              }

              /* Google Fonts fallback */
              @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap');
            `;
            doc.head.appendChild(s);
          }
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      const worker = html2pdf().from(element).set(opt);
      await worker.toPdf().get('pdf').then((pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text(`FortSmart Agro - Pág ${i} de ${totalPages}`, 190, 285, { align: 'right' });
        }
      });
      await worker.save();
    } catch (err) {
      console.error("PDF Export Error:", err);
      alert("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsExporting(false);
    }
  };

  const currentYear = 2025;
  const currentDateLabel = mounted ? new Date().toLocaleDateString('pt-BR') : "";

  if (!mounted) return <div className="min-h-screen bg-[#F0F2F5] p-16">Carregando Dashboard Corporativo...</div>;

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
            className="flex items-center gap-3 bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-none font-black text-xs uppercase tracking-widest transition-all shadow-lg active:scale-95 no-print"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
            Gerar Arquivo PDF
          </button>
        </div>

        {/* Painel de Decisão Agronômica (Filtros e Resumos) */}
        <div className="bg-white border border-slate-200 p-6 flex flex-col xl:flex-row gap-8 items-start shadow-sm mb-8 z-10 w-full relative">
          {/* Análise Inteligente FortSmart */}
          <div className="flex-1 w-full space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">🧠 RANKING DE PERFORMANCE ({filterCategoria === 'Todas' ? 'GERAL' : filterCategoria.toUpperCase()})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* RANKING 1: PRODUTIVIDADE */}
              <div className="bg-slate-50 p-4 border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-slate-900"></div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-3">🥇 Top Produtividade</p>
                <div className="space-y-3">
                  {summaryMetrics.topProd?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'}`}>{idx + 1}º</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-900 truncate leading-tight">{t.produto}</p>
                        <p className="text-[9px] font-bold text-slate-500">{t.media.toFixed(2).replace('.', ',')} sc/ha</p>
                      </div>
                    </div>
                  ))}
                  {(!summaryMetrics.topProd || summaryMetrics.topProd.length === 0) && <p className="text-[10px] text-slate-400">Sem dados filtrados</p>}
                </div>
              </div>

              {/* RANKING 2: CUSTO-BENEFÍCIO (ROI) */}
              <div className="bg-green-50 p-4 border border-green-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-green-600"></div>
                <p className="text-[9px] font-bold text-green-800 uppercase tracking-widest mb-3">🚀 Top ROI %</p>
                <div className="space-y-3">
                  {summaryMetrics.topRoi?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                       <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-green-600 text-white' : 'bg-green-200 text-green-700'}`}>{idx + 1}º</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-green-900 truncate leading-tight">{t.produto}</p>
                        <p className="text-[9px] font-bold text-green-700">{t.roi.toFixed(0)}% ROI</p>
                      </div>
                    </div>
                  ))}
                  {(!summaryMetrics.topRoi || summaryMetrics.topRoi.length === 0) && <p className="text-[10px] text-slate-400">Sem dados filtrados</p>}
                </div>
              </div>

              {/* RANKING 3: LUCRO LÍQUIDO */}
              <div className="bg-indigo-50 p-4 border border-indigo-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600"></div>
                <p className="text-[9px] font-bold text-indigo-800 uppercase tracking-widest mb-3">💰 Top Lucro/ha</p>
                <div className="space-y-3">
                  {summaryMetrics.topLucro?.map((t: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-2">
                       <span className={`text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center ${idx === 0 ? 'bg-indigo-600 text-white' : 'bg-indigo-200 text-indigo-700'}`}>{idx + 1}º</span>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-indigo-900 truncate leading-tight">{t.produto}</p>
                        <p className="text-[9px] font-bold text-indigo-700">R$ {t.lucro.toFixed(0)}</p>
                      </div>
                    </div>
                  ))}
                  {(!summaryMetrics.topLucro || summaryMetrics.topLucro.length === 0) && <p className="text-[10px] text-slate-400">Sem dados filtrados</p>}
                </div>
              </div>

              {/* RECOMENDAÇÃO INTELIGENTE (Compacta) */}
              <div className="bg-amber-50 p-4 border border-amber-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                <p className="text-[9px] font-bold text-amber-800 uppercase tracking-widest mb-3">⚖️ Recomendação</p>
                {summaryMetrics.recomended ? (
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-amber-900 leading-tight">{summaryMetrics.recomended.produto}</p>
                    <p className="text-[10px] font-medium text-amber-700 leading-tight italic">
                      "{summaryMetrics.explanation}"
                    </p>
                    <div className="pt-2">
                       <span className="text-[7px] font-black bg-amber-600 text-white px-1.5 py-0.5 uppercase tracking-wider">Altamente Recomendado</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 italic">Aplique filtros para análise.</p>
                )}
              </div>
            </div>
          </div>


          {/* Filtros Inteligentes e Configuração */}
          <div className="w-full xl:w-80 space-y-5 border-t xl:border-t-0 xl:border-l border-slate-200 pt-6 xl:pt-0 xl:pl-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">⚙️ Configurações</h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Dólar (USD)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cotacaoDolar}
                    onChange={(e) => setCotacaoDolar(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-7 pr-2 text-xs font-black text-slate-900 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Soja (R$/sc)</label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    value={precoSaca}
                    onChange={(e) => setPrecoSaca(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-7 pr-2 text-xs font-black text-slate-900 outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest text-right">📅 {currentDateLabel}</p>

            <div className="h-px w-full bg-slate-100 my-4"></div>

            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setFilterCategoria("Todas")} className={`text-[9px] px-2 py-1 font-black uppercase border transition-colors ${filterCategoria === 'Todas' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Todos</button>
              <button onClick={() => setFilterCategoria("Nematicida")} className={`text-[9px] px-2 py-1 font-black uppercase border transition-colors ${filterCategoria === 'Nematicida' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Nematicida</button>
              <button onClick={() => setFilterCategoria("Fungicidas")} className={`text-[9px] px-2 py-1 font-black uppercase border transition-colors ${filterCategoria === 'Fungicidas' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Fungicidas</button>
              <button onClick={() => setFilterCategoria("Nem. Químico")} className={`text-[9px] px-2 py-1 font-black uppercase border transition-colors ${filterCategoria === 'Nem. Químico' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Nem. Químico</button>
              <button onClick={() => setFilterCategoria("Nem. Biológico")} className={`text-[9px] px-2 py-1 font-black uppercase border transition-colors ${filterCategoria === 'Nem. Biológico' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>Nem. Biológico</button>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setFilterROI(!filterROI)} className={`flex-1 text-[9px] px-2 py-2 font-black uppercase border flex items-center gap-1.5 justify-center transition-colors ${filterROI ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                <div className={`w-2 h-2 rounded-full ${filterROI ? 'bg-green-500' : 'bg-slate-300'}`}></div> ROI &gt; 0
              </button>
              <button onClick={() => setFilterTop3(!filterTop3)} className={`flex-1 text-[9px] px-2 py-2 font-black uppercase border flex items-center justify-center transition-colors ${filterTop3 ? 'bg-slate-900 text-white border-slate-900 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                🏆 Top 3
              </button>
            </div>
          </div>
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
        <div ref={reportRef} className="report-safe-zone space-y-16 bg-white p-0">

          {/* Header para Impressão */}
          <div className="hidden pdf-only block p-12 border-b-4 border-slate-900">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Relatório Técnico Processado</h2>
                <p className="text-green-800 font-black text-xs uppercase tracking-[0.3em] mt-1">FortSmart Agro Intelligence</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Data de Referência</p>
                <p className="text-lg font-black text-slate-900">{currentDateLabel}</p>
              </div>
            </div>
          </div>

          {/* Legenda de Performance */}
          <div className="mb-6 bg-white border border-slate-200 rounded-lg p-4 flex flex-wrap gap-8 items-center shadow-sm no-print">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legenda de Performance:</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Lucro Positivo</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Prejuízo (Vunerabilidade)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Campeão Produtividade</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm"></div>
              <span className="text-[10px] font-bold text-slate-600 uppercase">Melhor ROI Econômico</span>
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

                  <div className="border-x border-b border-t border-slate-200">
                    <table className="w-full text-left border-collapse table-fixed bg-white">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="py-2 px-2 text-[8px] font-black text-slate-500 uppercase tracking-widest w-8 border-r border-slate-200 text-center">Pos</th>
                          <th className="py-2 px-2 text-[8px] font-black text-slate-500 uppercase tracking-widest border-r border-slate-200">Produto <span className="font-bold text-slate-400 lowercase">/ Categoria</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-slate-500 uppercase tracking-widest w-16 border-r border-slate-200">Prod. <span className="block text-[6px] font-bold text-slate-400">sc/ha</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-slate-500 uppercase tracking-widest w-16 border-r border-slate-200">Dif. <span className="block text-[6px] font-bold text-slate-400">sc/ha</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-slate-500 uppercase tracking-widest w-16 border-r border-slate-200">Custo <span className="block text-[6px] font-bold text-slate-400">R$/ha</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-indigo-700 uppercase tracking-widest w-12 border-r border-indigo-200 bg-indigo-50/50">Área <span className="block text-[6px] font-bold text-indigo-400">ha</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-indigo-700 uppercase tracking-widest w-16 border-r border-indigo-200 bg-indigo-50/50">Prod Tot <span className="block text-[6px] font-bold text-indigo-400">sc</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-indigo-700 uppercase tracking-widest w-16 border-r border-indigo-200 bg-indigo-50/50">Rec. Tot <span className="block text-[6px] font-bold text-indigo-400">R$</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-indigo-700 uppercase tracking-widest w-16 border-r border-indigo-200 bg-indigo-50/50">Custo Tot <span className="block text-[6px] font-bold text-indigo-400">R$</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-indigo-700 uppercase tracking-widest w-[80px] border-r border-indigo-200 bg-indigo-50/50">Lucro Tot <span className="block text-[6px] font-bold text-indigo-400">R$</span></th>
                          <th className="py-2 px-2 text-right text-[8px] font-black text-slate-500 uppercase tracking-widest w-16">ROI <span className="block text-[6px] font-bold text-slate-400">%</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => {
                          const isWin = index === 0;
                          const isWitness = item.tipo === 'testemunha';
                          const diffStr = item.dif_sc === 0 ? "-" : `${item.dif_sc > 0 ? '+' : ''}${item.dif_sc.toFixed(2).replace('.', ',')}`;
                          const lucroStr = item.lucro === 0 ? "0" : `${item.lucro > 0 ? '+' : ''}${item.lucro.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;

                          return (
                            <tr key={item.produto} className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors ${index % 2 === 1 ? 'bg-slate-50/30' : 'bg-white'}`}>
                              <td className="py-2 px-2 border-r border-slate-100 text-center">
                                <span className={`text-[10px] font-black ${!isWitness && index < 3 ? 'text-green-700' : 'text-slate-400'}`}>
                                  {index + 1}º
                                </span>
                                <span className="block text-[6px] xl:hidden font-bold text-slate-400 uppercase tracking-widest mt-1 border-t pt-1 border-slate-200">
                                  {isWitness ? 'TEST' : 'TRAT'}
                                </span>
                              </td>
                              <td className="py-2 px-2 border-r border-slate-100">
                                <div className="flex flex-col">
                                  <span className={`text-[11px] font-black tracking-tight ${isWitness ? 'text-slate-500 italic font-bold' : 'text-slate-900 uppercase'}`}>
                                    {item.produto}
                                    {!isWitness && item === summaryMetrics.bestProd && <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 text-[6px] uppercase tracking-widest rounded-sm border border-blue-200 font-bold inline-block relative -top-px">MAIOR PROD</span>}
                                    {!isWitness && item === summaryMetrics.bestRoi && <span className="ml-1 px-1 py-0.5 bg-green-100 text-green-800 text-[6px] uppercase tracking-widest rounded-sm border border-green-200 font-bold inline-block relative -top-px">MELHOR ROI</span>}
                                  </span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    <span className="text-[7px] font-black text-slate-500 uppercase bg-slate-100 px-1 py-px border border-slate-200">{item.pa}</span>
                                    <span className={`text-[7px] font-black uppercase px-1 py-px border ${item.categoria === 'Biológico' ? 'bg-indigo-50 border-indigo-100 text-indigo-700' :
                                      item.categoria === 'Químico' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                        item.categoria === 'Misto' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                          'bg-slate-50 border-slate-200 text-slate-400'
                                      }`}>
                                      {item.categoria}
                                    </span>
                                    {isWitness && <span className="text-[7px] font-black text-slate-500 uppercase bg-slate-100 border border-slate-200 px-1 py-px">TESTEMUNHA</span>}
                                  </div>
                                </div>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-slate-100 bg-slate-50">
                                <span className={`text-[11px] font-black tabular-nums ${item === summaryMetrics.bestProd ? 'text-blue-700' : 'text-slate-900'}`}>
                                  {item.media.toFixed(2).replace('.', ',')}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-slate-100">
                                <span className={`text-[10px] font-black tabular-nums block ${item.dif_sc > 0 ? 'text-green-600' : item.dif_sc < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                  {diffStr}
                                </span>
                                {!isWitness && item.break_even > 0 && (
                                  <span className="block text-[6.5px] font-bold text-slate-400 mt-0.5">Payback: {item.break_even.toFixed(1)}sc</span>
                                )}
                              </td>
                              <td className="py-2 px-2 text-right border-r border-slate-100">
                                <span className={`text-[10px] font-bold tabular-nums cursor-help ${item.custo_ha === 0 ? 'text-slate-300' : 'text-slate-600 underline decoration-dashed decoration-slate-300 underline-offset-2'}`} title={
                                  item.custo_ha === 0 ? '' :
                                    `💰 Custo detalhado:\n` +
                                    (item.composicao_custos || []).map((c: any) => {
                                      const basePreco = c.moeda === 'USD' ? c.valor * cotacaoDolar : c.valor;
                                      const dose = c.dose_ha !== undefined ? c.dose_ha : 1;
                                      const finalCusto = basePreco * dose;
                                      const strValor = c.moeda === 'USD' ? `US$ ${c.valor} (x${cotacaoDolar})` : `R$ ${c.valor}`;
                                      return `${c.produto} → ${strValor} x ${dose} dose/ha = R$ ${finalCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                    }).join('\n') +
                                    `\n----------------------\nTOTAL → R$ ${item.custo_ha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                }>
                                  {item.custo_ha === 0 ? '-' : item.custo_ha.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-indigo-100 bg-indigo-50/20">
                                <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                                  {item.area}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-indigo-100 bg-indigo-50/20">
                                <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                                  {item.prod_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-indigo-100 bg-indigo-50/20">
                                <span className="text-[10px] font-bold text-slate-600 tabular-nums">
                                  {item.receita_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-indigo-100 bg-indigo-50/20">
                                <span className={`text-[10px] font-bold tabular-nums ${item.custo_total === 0 ? 'text-slate-300' : 'text-slate-600'}`}>
                                  {item.custo_total === 0 ? '-' : item.custo_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right border-r border-indigo-100 bg-indigo-50/20">
                                <span className={`text-[11px] font-black tabular-nums ${item.lucro_total > 0 ? 'text-green-700' : item.lucro_total < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                  {item.lucro_total === 0 ? "0" : `${item.lucro_total > 0 ? '+' : ''}${item.lucro_total.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-right">
                                {isWitness || item.custo_ha === 0 ? <span className="text-slate-300">-</span> : (
                                  <span className={`text-[9px] font-black tabular-nums px-1.5 py-0.5 border inline-block min-w-10 text-center ${item.roi > 100 ? 'bg-green-600 text-white border-green-700 shadow-sm' :
                                    item.roi > 0 ? 'bg-green-50 text-green-700 border-green-200' :
                                      'bg-red-50 text-red-700 border-red-200'
                                    }`}>
                                    {item.roi > 0 ? '+' : ''}{item.roi.toFixed(0)}%
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Laudo Agronômico - FICHA TÉCNICA E CONCLUSÃO */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                    <div className="md:col-span-2">
                       <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[8px]">1</span> 
                         Veredito Técnico do Talhão
                       </h4>
                       <div className="bg-slate-50 border border-slate-200 rounded p-4">
                         <p className="text-xs text-slate-700 leading-relaxed italic">
                           {items[0].tipo === 'tratamento' && items[0].lucro > 0 ? (
                             <>
                               O tratamento <strong>{items[0].produto}</strong> sagrou-se vencedor neste ensaio, entregando um ganho real de <strong>{items[0].dif_sc.toFixed(2)} sc/ha</strong> sobre a testemunha. Com um ROI de <strong>{items[0].roi.toFixed(0)}%</strong>, a tecnologia demonstrou alta viabilidade econômica e excelente fit agronômico para a variedade {variedade}.
                             </>
                           ) : (
                             <>
                               Nesta área, a estratégia de manejo evidenciou que o custo fixo de alguns tratamentos não foi compensado pelo ganho produtivo marginal. {items[0].tipo === 'testemunha' ? "A testemunha manteve a melhor margem líquida." : "Recomenda-se reavaliar a dosagem ou o posicionamento desta tecnologia."}
                             </>
                           )}
                         </p>
                       </div>
                    </div>
                    
                    <div>
                       <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                         <span className="w-5 h-5 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[8px]">2</span> 
                         Proposta Tecnológica
                       </h4>
                       <div className="space-y-3">
                         {items.slice(0, 2).map((item: any, i: number) => {
                           // Pega o primeiro ou único produto mencionado no nome para o insight
                           const mainProd = Object.keys(productInsights).find(k => item.produto.includes(k));
                           const insight = mainProd ? productInsights[mainProd] : null;

                           if (!insight) return null;

                           return (
                             <div key={i} className="border-l-2 border-indigo-200 pl-3">
                               <span className="text-[9px] font-black text-indigo-600 block uppercase">{item.produto}</span>
                               <p className="text-[10px] text-slate-500 mt-1"><strong>Alvo:</strong> {insight.alvo}</p>
                               <p className="text-[10px] text-slate-600 mt-0.5 leading-tight">{insight.proposta}</p>
                             </div>
                           )
                         })}
                       </div>
                    </div>
                  </div>

                  {/* Rodapé de Insight do Talhão */}
                  <div className="mt-6 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2 pt-4 border-t border-slate-50">
                    <span>Relatório Automatizado FortSmart • Veredito em Campo</span>
                    <span>Safra Atualizada: 2025/2026</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Análise Global por Tecnologia */}
          <div className="mt-8 mb-4">
            <h2 className="text-xl font-black text-slate-900 mb-4 tracking-tight flex items-center gap-2">
              <span className="text-xl">📊</span> Análise Consolidada por Tecnologia
            </h2>
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Tecnologia (Produto)</th>
                    <th className="py-3 px-4 text-center">Ensaios</th>
                    <th className="py-3 px-4 text-center">Área Total</th>
                    <th className="py-3 px-4 text-right">Custo Médio</th>
                    <th className="py-3 px-4 text-right">Ganho Médio</th>
                    <th className="py-3 px-4 text-right pt-2 pb-2">Taxa Sucesso</th>
                    <th className="py-3 px-4 text-right">Lucro Total Consolidado</th>
                    <th className="py-3 px-4 text-right">ROI Médio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysisByProduct.map((tech: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-800">{tech.produto}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{tech.ensaios}</td>
                      <td className="py-3 px-4 text-center font-medium text-slate-600">{tech.hectares_totais.toFixed(1)} ha</td>
                      <td className="py-3 px-4 text-right text-slate-600 font-medium">
                        {tech.media_custo_ha > 0 ? formatCurrency(tech.media_custo_ha) : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-bold">
                        <span className={tech.media_ganho_sc > 0 ? 'text-green-600' : 'text-slate-600'}>
                          {tech.media_ganho_sc > 0 ? '+' : ''}{tech.media_ganho_sc.toFixed(2)} sc/ha
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-[9px] font-black ${tech.taxa_sucesso >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {tech.taxa_sucesso.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-black tracking-tight ${tech.lucro_total > 0 ? 'text-green-600' : tech.lucro_total < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                          {tech.lucro_total > 0 ? '+' : ''}{formatCurrency(tech.lucro_total)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {tech.media_custo_ha > 0 ? (
                          <span className={`text-[10px] px-2 py-0.5 rounded border inline-block min-w-12 text-center font-black ${tech.roi_medio > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {tech.roi_medio > 0 ? '+' : ''}{tech.roi_medio.toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-slate-400 font-medium">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {analysisByProduct.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">Nenhum dado consolidado de tecnologias encontrado...</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col gap-2 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="text-indigo-600">💡</span>
                <span className="text-xs font-bold text-indigo-900">Como ler esta tabela de Análise Consolidada?</span>
              </div>
              <p className="text-[10px] text-indigo-700">
                Esta tabela agrupa aplicações da <strong>mesma tecnologia</strong> em múltiplos talhões diferentes da fazenda. O objetivo é visualizar o impacto financeiro (Lucro Total e Taxa de Sucesso) que a tecnologia entregou no <strong>quadro geral</strong>. Um <span className="font-bold">Ganho Médio</span> positivo indica acréscimo de produtividade contra a testemunha local, e uma <span className="font-bold">Taxa de Sucesso</span> alta indica que o produto superou a testemunha na maioria dos ensaios em que foi aplicado.
              </p>
            </div>
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

        /* 
           FIX para o erro "unsupported color function oklch/oklab" no html2canvas.
           O Tailwind v4 usa oklch por padrão, que o html2canvas ainda não suporta.
           Forçamos cores em HEX para os elementos dentro do relatório.
        */
        .report-safe-zone {
          --tw-bg-opacity: 1 !important;
          --tw-text-opacity: 1 !important;
          background-color: #ffffff !important;
        }
        
        /* Forçamos o reset de cores complexas do Tailwind v4 */
        .report-safe-zone *, 
        .report-safe-zone *::before, 
        .report-safe-zone *::after {
          border-color: #e2e8f0; /* Default border color */
        }
        
        .report-safe-zone .bg-slate-900 { background-color: #0f172a !important; }
        .report-safe-zone .bg-slate-50 { background-color: #f8fafc !important; }
        .report-safe-zone .bg-slate-200 { background-color: #e2e8f0 !important; }
        .report-safe-zone .bg-green-50 { background-color: #f0fdf4 !important; }
        .report-safe-zone .bg-white { background-color: #ffffff !important; }
        .report-safe-zone .bg-slate-50\/30 { background-color: rgba(248, 250, 252, 0.3) !important; }
        .report-safe-zone .bg-slate-50\/50 { background-color: rgba(248, 250, 252, 0.5) !important; }
        
        .report-safe-zone .text-slate-900 { color: #0f172a !important; }
        .report-safe-zone .text-slate-500 { color: #64748b !important; }
        .report-safe-zone .text-slate-400 { color: #94a3b8 !important; }
        .report-safe-zone .text-slate-300 { color: #cbd5e1 !important; }
        .report-safe-zone .text-green-800 { color: #166534 !important; }
        .report-safe-zone .text-green-700 { color: #15803d !important; }
        .report-safe-zone .text-green-600 { color: #16a34a !important; }
        .report-safe-zone .text-green-500 { color: #22c55e !important; }
        .report-safe-zone .text-red-700 { color: #b91c1c !important; }
        .report-safe-zone .text-white { color: #ffffff !important; }
        
        .report-safe-zone .border-slate-200 { border-color: #e2e8f0 !important; }
        .report-safe-zone .border-slate-100 { border-color: #f1f5f9 !important; }
        .report-safe-zone .border-slate-900 { border-color: #0f172a !important; }
        .report-safe-zone .border-green-100 { border-color: #dcfce7 !important; }
        .report-safe-zone .border-b-4 { border-bottom-width: 4px !important; }
        .report-safe-zone .border-t-4 { border-top-width: 4px !important; }

        @media print {
          .no-print { display: none !important; }
          .break-inside-avoid { break-inside: avoid; }
          .pdf-only { display: block !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          table { border-collapse: collapse !important; }
        }
        
        .pdf-only { display: none; }

        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  );
}

