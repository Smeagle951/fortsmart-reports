"use client";

import React, { useRef, useMemo } from 'react';

const INITIAL_HARVEST_DATA = [
  // T-15 (DM79K80 CE)
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + ACTIVE + VERANGO", hectares: 30.29, media: 82.07, tipo: "tratamento", pa: "Bacillus + Fluopiram", classe: "Nematicida", categoria: "Misto", segmento: "Solo/TS", modo: "Bio + SDHI", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "SOIL ACTIVE", valor: 40, moeda: "BRL", dose_ha: 1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "PADRAO FAZENDA / LALNIX RESIST + VERANGO", hectares: 33.46, media: 78.69, tipo: "testemunha", pa: "B. licheniformis + Fluopiram", classe: "Nematicida", categoria: "Misto", segmento: "Solo/TS", modo: "Bio + SDHI", composicao_custos: [{ produto: "LALNIX RESIST", valor: 475, moeda: "BRL", dose_ha: 0.1 }, { produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-15", variedade: "DM79K80 CE", produto: "NEM-OUT + TRUST", hectares: 27.3, media: 78.44, tipo: "tratamento", pa: "Bacillus + Trichoderma", classe: "Nematicida", categoria: "Biológico", segmento: "Solo", modo: "Antagonismo", composicao_custos: [{ produto: "NEM-OUT", valor: 110, moeda: "BRL", dose_ha: 1 }, { produto: "TRUST", valor: 90, moeda: "BRL", dose_ha: 1 }] },

  // T-12 (BREV 5830 CE)
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "VERANGO", hectares: 3.43, media: 84.22, tipo: "testemunha", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "TS", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "T-12", variedade: "BREV 5830 CE", produto: "AGRIVALLE", hectares: 3.83, media: 83.45, tipo: "tratamento", pa: "Shocker (2 Bacillus + Trichoderma) + Profix (2 Bacillus + 1 Fungo) + Raizer", classe: "Nematicida", categoria: "Biológico", segmento: "Solo/Foliar", modo: "Biofungicida + Nematicida Biológico", composicao_custos: [{ produto: "SHOCKER", valor: 14.00, moeda: "BRL", dose_ha: 1 }, { produto: "PROFIX", valor: 40.00, moeda: "BRL", dose_ha: 1 }, { produto: "RAIZER", valor: 8.50, moeda: "BRL", dose_ha: 1 }] },

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
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "COM VERANGO", hectares: 5.6, media: 61.00, tipo: "tratamento", pa: "Fluopiram", classe: "Nematicida", categoria: "Químico", segmento: "Sulco", modo: "SDHI", composicao_custos: [{ produto: "VERANGO", valor: 84.25, moeda: "USD", dose_ha: 0.5 }] },
  { talhao: "PIVO-05", variedade: "BALSAMO TMG", produto: "SEM VERANGO (Pad. Fazenda)", hectares: 4.08, media: 68.73, tipo: "testemunha", pa: "Padrão", classe: "Baseline", categoria: "Baseline", segmento: "-", modo: "-", composicao_custos: [] },

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
  // --- COMBOS E ASSEMBLEIAS ---
  "NEM-OUT + ACTIVE + VERANGO": { 
    alvo: "Complexo de Nematoides (Galha, Cisto e Lesões)", 
    proposta: "Sinergismo Químico-Biológico de Alto Espectro.", 
    bio: "Fluopiram (SDHI químico) garante choque inicial na respiração mitocondrial. O Bacillus sp. do Nem-Out e estruturadores de Active formam biofilme radicular de longo prazo." 
  },
  "PADRAO FAZENDA / LALNIX RESIST + VERANGO": { 
    alvo: "Defesa e Remoção do Inóculo Inicial", 
    proposta: "Choque Químico + Indução Sistêmica de Resistência biológica.", 
    bio: "Fluopiram reduz carga nematológica local. Lalnix (B. licheniformis) dispara a rota SAR/ISR, blindando sistemicamente o sistema radicular." 
  },
  "NEM-OUT + TRUST": { 
    alvo: "Nematoides e Patógenos Necrotróficos", 
    proposta: "Controle biológico fúngico-bacteriano.", 
    bio: "O consórcio (Bacillus + Trichoderma do Trust) parasita estruturas fúngicas de viabilidade e exibe forte competição no solo." 
  },

  // --- PRODUTOS INDIVIDUAIS (Biológicos e Suplementos) ---
  "VERANGO": { 
    alvo: "Nematoides de Galha e Cisto (Fitonematoides)", 
    proposta: "Nematicida Químico SDHI Sistemico de amplo residual.", 
    bio: "Inibição do complexo II mitocondrial. Elevada mobilidade no sistema radicular, induzindo paralisia dos nematoides em formato agulha minutos pós-aplicação." 
  },
  "NEM OUT": {
    alvo: "Fitonematoides de solo e manutenção da rizosfera",
    proposta: "Nematicida Microbiológico (Bacillus spp.).",
    bio: "Colonização simbiótica e agressiva do sistema radicular. Os Bacillus liberam enzimas e toxinas que degradam a cutícula do nematoide, enquanto bloqueiam a exsudação para evitar atração de novos fitonematoides."
  },
  "NEM-OUT": {
    alvo: "Fitonematoides de solo e manutenção da rizosfera",
    proposta: "Nematicida Microbiológico (Bacillus spp.).",
    bio: "Colonização simbiótica e agressiva do sistema radicular. Os Bacillus liberam enzimas e toxinas que degradam a cutícula do nematoide, enquanto bloqueiam a exsudação para evitar atração de novos fitonematoides."
  },
  "ACTIVE": {
    alvo: "Estruturação Biolótiga do Solo",
    proposta: "Bioativador e Condicionador Microbiano.",
    bio: "Promove ambiência favorável para proliferação de microrganismos benéficos, aumentando a atividade enzimática do solo e auxiliando na descompactação biológica da rizosfera."
  },
  "SOIL ACTIVE": {
    alvo: "Estruturação Biolótiga do Solo",
    proposta: "Bioativador e Condicionador Microbiano.",
    bio: "Promove ambiência favorável para proliferação de microrganismos benéficos, aumentando a atividade enzimática do solo e auxiliando na descompactação biológica da rizosfera."
  },
  "TRUST": {
    alvo: "Fungos Fitopatogênicos (Macrophomina, Fusarium, Rhizoctonia)",
    proposta: "Biofungicida de Micoparasitismo (Trichoderma spp.).",
    bio: "Agressivo micoparasita e competidor. Envolve e perfura hifas dos patógenos causadores de tombamento, agindo sinergicamente como promotor de enraizamento através de metabólitos secundários."
  },
  "LALNIX": {
    alvo: "Indução de Resistência SAR e Proteção",
    proposta: "Elicitor biológico (B. licheniformis).",
    bio: "Sinaliza a planta para aumentar a expressão gênica de defesa basal, espessando parede celular e aumentando a resistência climática e fitossanitária sem gasto excessivo de ATP."
  },
  "LALNIX RESIST": {
    alvo: "Indução de Resistência SAR e Proteção",
    proposta: "Elicitor biológico (B. licheniformis).",
    bio: "Sinaliza a planta para aumentar a expressão gênica de defesa basal, espessando parede celular e aumentando a resistência climática e fitossanitária sem gasto excessivo de ATP."
  },
  "QUALITY": {
    alvo: "Balanço Nutricional e Fisiológico",
    proposta: "Manejo Nutricional e Bioestimulação Avançada.",
    bio: "Fornece componentes orgânicos e minerais de rápida absorção via floema/xilema, destravando a planta pós-estresse (salino, hídrico, ou químico) e sustentando o engalhamento contínuo."
  },

  // --- OUTROS (Agrivalle, Fungicidas, Fósforo) ---
  "AGRIVALLE": { 
    alvo: "Proteção Radicular Completa (Nematoides e Fungos)", 
    proposta: "Biocontrole Consorciado de Múltiplos Sítios Ativos.", 
    bio: "Carga robusta via Shocker e Profix; liberação de lipopeptídeos formadores de poros na membrana fúngica, somado ao Raizer promovendo ramificação profunda." 
  },
  "DOTTE OURO FINO": { 
    alvo: "Doenças Foliares (Antracnose, Manchas)", 
    proposta: "Fungicida Microbiológico Multissítio.", 
    bio: "B. amyloliquefaciens atua preventivamente produzindo antibióticos naturais no filoplano, e funcionando como elicitor que bloqueia o ingresso hifal." 
  },
  "VIOVAN (PADRAO FAZENDA)": { 
    alvo: "Ferrugem Asiática e Manchas Foliares", 
    proposta: "Manejo Químico Sistêmico e Protetor (QoI).", 
    bio: "Picoxistrobina com fortíssimo efeito translaminar ('green effect'), neutralizando o estresse oxidativo e otimizando peso de grão." 
  },
  "ADAMA (ExpertGrow e Armero)": { 
    alvo: "Fase de Enchimento Fotossintético", 
    proposta: "Controle de Espectro Largo (Cercospora e DFCs).", 
    bio: "Armero inibe a síntese de ergosterol de forma aguda. ExpertGrow maximiza a taxa fotossintética, otimizando translocação orgânica." 
  },
  "VICTRATO": { 
    alvo: "Alta Pressão Inicial de Fitonematoides (TS)", 
    proposta: "SDHI Intracelular Ultrassistemizado.", 
    bio: "Tyclopyrazoflor bloqueia infecções já nas primeiras horas da radícula. O redirecionamento da seiva foca no fechamento rápido do dossel vegetativo." 
  },
  "ESTIMULATE": { 
    alvo: "Arquitetura Fisiológica e Engalhamento", 
    proposta: "Regulador Hormonal (Auxina, Giberelina, Citocinina).", 
    bio: "Quebra a dominância apical para engalhamento, aumenta ramificação de radicela absorvente e diminui abortamento de vagens." 
  },
  "ADUBO FOSFORO": { 
    alvo: "Nutrição Mineral Base (P2O5)", 
    proposta: "Suplementação de Arranque Fosfatado.", 
    bio: "Fornece energia (ATP) para os momentos de maior demanda metabólica inicial, estruturando raízes pivotantes mais calibrosas." 
  },
  "FÓSFORO NA LINHA": { 
    alvo: "Nutrição Mineral Base (P2O5)", 
    proposta: "Suplementação de Arranque Fosfatado.", 
    bio: "Fornece energia (ATP) para os momentos de maior demanda metabólica inicial, estruturando raízes pivotantes mais calibrosas." 
  },
  "PADRAO FAZENDA": {
    alvo: "Manejo Standard Comercial Otimizado",
    proposta: "Baseline Safra do Custo de Produção Histórico.",
    bio: "Define o Teto Econômico Limitante. Serve como métrica comparativa para quantificar em Reais (R$) a margem incremental das novas tecnologias bio/químicas."
  },
  "PADRAO FAZENDA (1)": {
    alvo: "Manejo Standard Comercial Otimizado",
    proposta: "Baseline Safra do Custo de Produção Histórico.",
    bio: "Define o Teto Econômico Limitante. Serve como métrica comparativa para quantificar em Reais (R$) a margem incremental das novas tecnologias bio/químicas."
  },
  "Manejo Equilibrado": {
    alvo: "Estratégia Defensiva Conservadora",
    proposta: "Posicionamento técnico central de segurança.",
    bio: "Produtividade estabilizada com volatilidade mínima de custo. A performance fisiológica suporta intempéries dentro de flutuações aceitáveis sem dilapidar o fluxo de caixa."
  }
};

type InformativoSnapshot = {
  id: string;
  nome: string;
  createdAt: string;
  locked?: boolean;
  meta?: {
    responsavel?: string;
    safra?: string;
    observacao?: string;
  };
  data: any[];
};

export default function SoybeanHarvestDashboard() {
  const reportRef = useRef<HTMLDivElement>(null);
  const importRef = useRef<HTMLInputElement>(null);
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
  const [informativoData, setInformativoData] = React.useState<any[]>(INITIAL_HARVEST_DATA);
  const [snapshotName, setSnapshotName] = React.useState<string>("Informativo Safra 2025/2026");
  const [savedSnapshots, setSavedSnapshots] = React.useState<InformativoSnapshot[]>([]);
  const [trashSnapshots, setTrashSnapshots] = React.useState<InformativoSnapshot[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = React.useState<string>("");
  const [restoreSnapshotId, setRestoreSnapshotId] = React.useState<string>("");
  const [showRestorePanel, setShowRestorePanel] = React.useState(false);
  const [isLockedView, setIsLockedView] = React.useState(false);
  const [showInformativoPanel, setShowInformativoPanel] = React.useState(false);
  const [lockOnSave, setLockOnSave] = React.useState(true);
  const [metaResponsavel, setMetaResponsavel] = React.useState("");
  const [metaSafra, setMetaSafra] = React.useState("2025/2026");
  const [metaObservacao, setMetaObservacao] = React.useState("");
  const [newRow, setNewRow] = React.useState({
    talhao: "",
    variedade: "",
    produto: "",
    tipo: "tratamento",
    classe: "Nematicida",
    categoria: "Químico",
    segmento: "TS",
    modo: "SDHI",
    pa: "",
    hectares: "",
    media: "",
    valor: "",
    moeda: "BRL",
    dose: "",
  });
  const [componentDraft, setComponentDraft] = React.useState({
    produto: "",
    valor: "",
    moeda: "BRL",
    dose: "",
  });
  const [componentesTratamento, setComponentesTratamento] = React.useState<Array<{
    produto: string;
    valor: number;
    moeda: string;
    dose_ha: number;
  }>>([]);

  const getViaAplicacao = (classe: string) => {
    if (classe === "Nematicida") return "Via Sulco";
    if (classe === "Fungicida") return "Aplicação Aérea";
    return "Conforme manejo";
  };

  React.useEffect(() => { setMounted(true); }, []);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const snapshotKeys = [
        "fortsmart_colheita_snapshots_v1",
        "fortsmart_colheita_snapshots",
        "fortsmart_colheita_informativos_v1",
      ];

      let loadedSnapshots: InformativoSnapshot[] = [];
      for (const key of snapshotKeys) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        const candidate = Array.isArray(parsed)
          ? parsed
          : (Array.isArray(parsed?.snapshots) ? parsed.snapshots : []);
        if (!Array.isArray(candidate) || candidate.length === 0) continue;
        loadedSnapshots = candidate
          .filter((s: any) => s && Array.isArray(s.data))
          .map((s: any) => ({
            id: String(s.id || `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            nome: String(s.nome || "Informativo"),
            createdAt: String(s.createdAt || new Date().toISOString()),
            locked: Boolean(s.locked),
            meta: s.meta ?? {},
            data: s.data,
          }));
        if (loadedSnapshots.length > 0) break;
      }

      if (loadedSnapshots.length > 0) {
        setSavedSnapshots(loadedSnapshots);
        // Prioriza abrir dados antigos primeiro (mais recente da lista).
        const first = loadedSnapshots[0];
        setInformativoData(first.data || []);
        setSelectedSnapshotId(first.id);
        setIsLockedView(Boolean(first.locked));
        setSnapshotName(first.nome || "");
        setMetaResponsavel(first.meta?.responsavel || "");
        setMetaSafra(first.meta?.safra || "2025/2026");
        setMetaObservacao(first.meta?.observacao || "");
      } else {
        // Compatibilidade: último rascunho sem snapshot salvo.
        const currentRaw = window.localStorage.getItem("fortsmart_colheita_current_v1");
        if (currentRaw) {
          const currentParsed = JSON.parse(currentRaw);
          if (Array.isArray(currentParsed) && currentParsed.length > 0) {
            setInformativoData(currentParsed);
          }
        }
      }

      const trashRaw = window.localStorage.getItem("fortsmart_colheita_snapshots_trash_v1");
      if (trashRaw) {
        const trashParsed = JSON.parse(trashRaw);
        if (Array.isArray(trashParsed)) setTrashSnapshots(trashParsed);
      }
    } catch (_) {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fortsmart_colheita_snapshots_v1", JSON.stringify(savedSnapshots));
  }, [savedSnapshots]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fortsmart_colheita_current_v1", JSON.stringify(informativoData));
  }, [informativoData]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("fortsmart_colheita_snapshots_trash_v1", JSON.stringify(trashSnapshots));
  }, [trashSnapshots]);

  const { groupedData, summaryMetrics, allProductClasses, processedData } = useMemo(() => {
    try {
      const classes = Array.from(new Set(informativoData.map(item => item.classe))).filter(c => c !== "Baseline");
      const calcularCustoHa = (entry: any) => {
        return (entry.composicao_custos || []).reduce((acc: number, c: any) => {
          const valor = Number(c.valor ?? 0);
          const dose = Number(c.dose_ha ?? 1);
          const moeda = String(c.moeda ?? "BRL").toUpperCase();
          const valorBRL = moeda === "USD" ? valor * cotacaoDolar : valor;
          return acc + (valorBRL * dose);
        }, 0);
      };

      const processedData = informativoData.map(item => {
        const key = `${item.talhao} - ${item.variedade}`;
        const witnessGroup = informativoData.filter(h => `${h.talhao} - ${h.variedade}` === key);
        const witness = witnessGroup.find(h => h.tipo === 'testemunha') || witnessGroup[0];
        const witnessCustoHa = calcularCustoHa(witness);
        const custoHaBRL = calcularCustoHa(item);

        const rec_sc_ha = item.media;
        const rec_ha_rs = rec_sc_ha * precoSaca;
        const rec_tot_rs = rec_sc_ha * precoSaca * item.hectares;
        const custo_tot_rs = custoHaBRL * item.hectares;
        const lucro_tot_rs = rec_tot_rs - custo_tot_rs;
        const margem_ha_rs = rec_ha_rs - custoHaBRL;

        const diff_prod = item.media - witness.media;
        const payback_sc = custoHaBRL / precoSaca;

        // Incremental versus padrão do mesmo talhão/variedade
        const custoDiffHa = custoHaBRL - witnessCustoHa;
        const lucroIncrementalHa = (diff_prod * precoSaca) - custoDiffHa;
        const lucroIncrementalTot = lucroIncrementalHa * item.hectares;
        const roi = custoHaBRL > 0 ? ((diff_prod * precoSaca - custoHaBRL) / custoHaBRL) * 100 : 0;
        const roiIncremental = custoDiffHa > 0 ? (lucroIncrementalHa / custoDiffHa) * 100 : null;

        return {
          ...item,
          groupKey: key,
          custoHa: custoHaBRL,
          witnessCustoHa,
          custoDiffHa,
          custoTot: custo_tot_rs,
          receitaHa: rec_ha_rs,
          recTot: rec_tot_rs,
          margemHa: margem_ha_rs,
          lucroTot: lucro_tot_rs,
          roi,
          roiIncremental,
          diff_prod,
          lucroIncrementalHa,
          lucroIncrementalTot,
          payback_sc,
          viaAplicacao: getViaAplicacao(item.classe),
          comparavel: item.classe === focoEnsaio
        };
      });

      const groups = processedData.reduce((acc: Record<string, any[]>, curr) => {
        if (!acc[curr.groupKey]) acc[curr.groupKey] = [];
        acc[curr.groupKey].push(curr);
        return acc;
      }, {});

      Object.keys(groups).forEach(key => {
        groups[key].sort((a, b) => {
          if (a.tipo === 'testemunha' && b.tipo !== 'testemunha') return 1;
          if (b.tipo === 'testemunha' && a.tipo !== 'testemunha') return -1;
          if (a.tipo !== 'testemunha' && b.tipo !== 'testemunha') {
            const byLucro = (b.lucroIncrementalHa ?? 0) - (a.lucroIncrementalHa ?? 0);
            if (byLucro !== 0) return byLucro;
            return (b.media ?? 0) - (a.media ?? 0);
          }
          return (b.media ?? 0) - (a.media ?? 0);
        });
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
        topROI: [...filteredResults]
          .filter(t => t.custoHa > 0)
          .sort((a, b) => ((b.roiIncremental ?? b.roi) - (a.roiIncremental ?? a.roi)))
          .slice(0, 3),
        topLucro: [...filteredResults]
          .sort((a, b) => (b.lucroIncrementalHa - a.lucroIncrementalHa))
          .slice(0, 3),
      };

      return { groupedData: groups, summaryMetrics: summary, allProductClasses: classes, processedData };
    } catch (e) {
      console.error("Critical Analysis Error:", e);
      return { groupedData: {}, summaryMetrics: { topProdutividade: [], topROI: [], topLucro: [] }, allProductClasses: [], processedData: [] };
    }
  }, [informativoData, cotacaoDolar, precoSaca, focoEnsaio, viewMode, filtroCategoria]);

  const auditRows = useMemo(() => {
    type AuditRow = {
      key: string;
      talhao: string;
      variedade: string;
      tratamento: string;
      tipo: string;
      componente: string;
      moeda: string;
      valorBase: number;
      doseHa: number;
      valorConvertido: number;
      subtotalHa: number;
      custoTotalHa: number;
      viaAplicacao: string;
    };

    const rows: AuditRow[] = [];

    for (const item of informativoData) {
      const componentes = item.composicao_custos ?? [];
      const custoTotalHa = componentes.reduce((sum: number, c: any) => {
        const valor = Number(c?.valor ?? 0);
        const dose = Number(c?.dose_ha ?? 1);
        const moeda = String(c?.moeda ?? "BRL").toUpperCase();
        const convertido = moeda === "USD" ? valor * cotacaoDolar : valor;
        return sum + (convertido * dose);
      }, 0);

      if (componentes.length === 0) {
        rows.push({
          key: `${item.talhao}-${item.variedade}-${item.produto}-sem-componente`,
          talhao: item.talhao,
          variedade: item.variedade,
          tratamento: item.produto,
          tipo: item.tipo,
          componente: "—",
          moeda: "BRL",
          valorBase: 0,
          doseHa: 0,
          valorConvertido: 0,
          subtotalHa: 0,
          custoTotalHa,
          viaAplicacao: getViaAplicacao(item.classe),
        });
        continue;
      }

      for (let i = 0; i < componentes.length; i++) {
        const c = componentes[i];
        const valor = Number(c?.valor ?? 0);
        const dose = Number(c?.dose_ha ?? 1);
        const moeda = String(c?.moeda ?? "BRL").toUpperCase();
        const convertido = moeda === "USD" ? valor * cotacaoDolar : valor;
        const subtotal = convertido * dose;

        rows.push({
          key: `${item.talhao}-${item.variedade}-${item.produto}-${i}`,
          talhao: item.talhao,
          variedade: item.variedade,
          tratamento: item.produto,
          tipo: item.tipo,
          componente: String(c?.produto ?? "Componente"),
          moeda,
          valorBase: valor,
          doseHa: dose,
          valorConvertido: convertido,
          subtotalHa: subtotal,
          custoTotalHa,
          viaAplicacao: getViaAplicacao(item.classe),
        });
      }
    }

    rows.sort((a, b) => {
      if (a.talhao !== b.talhao) return a.talhao.localeCompare(b.talhao);
      if (a.variedade !== b.variedade) return a.variedade.localeCompare(b.variedade);
      return a.tratamento.localeCompare(b.tratamento);
    });

    return rows;
  }, [informativoData, cotacaoDolar]);

  const resumoEconomico = useMemo(() => {
    const rows = (processedData || [])
      .filter((r: any) => r.tipo === "tratamento")
      .map((r: any) => ({
        key: `${r.talhao}-${r.variedade}-${r.produto}`,
        talhao: r.talhao,
        variedade: r.variedade,
        produto: r.produto,
        receitaHa: Number(r.receitaHa ?? 0),
        margemHa: Number(r.margemHa ?? 0),
        lucroIncrementalHa: Number(r.lucroIncrementalHa ?? 0),
        roiIncremental: r.roiIncremental == null ? null : Number(r.roiIncremental),
        diffProd: Number(r.diff_prod ?? 0),
        custoDiffHa: Number(r.custoDiffHa ?? 0),
      }))
      .sort((a: any, b: any) => b.lucroIncrementalHa - a.lucroIncrementalHa);
    return rows;
  }, [processedData]);

  const explainEconomicDecision = (r: any) => {
    const roi = r.roiIncremental;
    if (r.lucroIncrementalHa > 0 && (roi == null || roi >= 0)) {
      if (r.diffProd <= 0 && r.custoDiffHa < 0) {
        return { label: "Vale a pena", reason: "Mesmo sem ganho de produção, a economia de custo gerou retorno." };
      }
      if (r.diffProd > 0 && r.custoDiffHa > 0) {
        return { label: "Vale a pena", reason: "O ganho de produtividade pagou o custo adicional da tecnologia." };
      }
      return { label: "Vale a pena", reason: "Margem incremental positiva comparada ao padrão." };
    }
    if (r.lucroIncrementalHa <= 0 && r.diffProd > 0) {
      return { label: "Não vale", reason: "Houve ganho de produção, mas o custo adicional foi maior que o benefício." };
    }
    if (r.lucroIncrementalHa <= 0 && r.diffProd <= 0) {
      return { label: "Não vale", reason: "Sem ganho de produção e sem economia suficiente para compensar." };
    }
    return { label: "Atenção", reason: "Resultado limítrofe. Reavaliar preço, dose e custo unitário." };
  };

  const getDicionarioAgronomico = (produto: string) => {
    if (productInsights[produto]) return productInsights[produto];
    const key = Object.keys(productInsights).find(k => produto.toUpperCase().includes(k.toUpperCase()));
    if (key) return productInsights[key];
    return { 
      alvo: "Manejo Estratégico", 
      proposta: "Posicionamento técnico de acordo com a bula.", 
      bio: "Ação definida pela composição base." 
    };
  };

  const pareceresTecnicos = useMemo(() => {
    const topProd = [...resumoEconomico].sort((a,b) => b.diffProd - a.diffProd);
    const topROI = [...resumoEconomico].sort((a,b) => (b.roiIncremental ?? 0) - (a.roiIncremental ?? 0));
    
    return resumoEconomico.map((r: any) => {
      const isTop1Prod = topProd[0] && topProd[0].key === r.key;
      const isTop1ROI = topROI[0] && topROI[0].key === r.key;
      
      let perfil = "Equilíbrio e Segurança";
      let resultado = `Produtividade ${r.diffProd > 0 ? 'superior' : 'próxima'} ao padrão com margem equilibrada.`;
      let recomendacao = "Estratégia segura para diferentes ambientes.";
      let atencao = "Monitorar responsividade em diferentes talhões.";
      let icon = "⚖️";
      let destaque = "Manejo Equilibrado";

      if (isTop1Prod && !isTop1ROI) {
        perfil = "Alta Performance (Teto Produtivo)";
        resultado = `Entregou a maior produtividade agregando +${r.diffProd.toFixed(1)} sc/ha.`;
        recomendacao = "Ideal para áreas de alto investimento e sem restrição hídrica.";
        atencao = "Custo elevado reduziu a margem financeira. Requer cautela no preço da saca.";
        icon = "🚀";
        destaque = "Máximo Teto Produtivo";
      } else if (isTop1ROI && r.lucroIncrementalHa > 0 && r.diffProd <= 0) {
        perfil = "Alta Eficiência Econômica (Redução de Custo)";
        resultado = `Mesmo produzindo o mesmo ou menos que o padrão, reduziu custos para gerar maior ROI.`;
        recomendacao = "Excelente para otimização de margem em grandes extensões.";
        atencao = "Limita o teto produtivo em talhões de altíssima fertilidade.";
        icon = "💰";
        destaque = "Melhor Escolha Econômica";
      } else if (isTop1ROI && r.diffProd > 0 && r.lucroIncrementalHa > 0) {
        perfil = "Campeão de Rentabilidade e Produção";
        resultado = `Uniu ganho de produtividade (+${r.diffProd.toFixed(1)} sc/ha) com o maior lucro líquido.`;
        recomendacao = "Adoção recomendada como padrão técnico para a próxima safra.";
        atencao = "Garantir a mesma qualidade e janela de aplicação do teste.";
        icon = "🏆";
        destaque = "Alta Produtividade + Melhor ROI";
      } else if (r.lucroIncrementalHa < 0) {
        perfil = "Baixa Viabilidade Financeira";
        resultado = `Custo operacional alto suprimiu ganhos, gerando prejuízo em relação ao padrão.`;
        recomendacao = "Reavaliar viabilidade técnica ou negociar pesadamente o preço do insumo.";
        atencao = "Margem negativa na atual cotação da saca.";
        icon = "⚠️";
        destaque = "Atenção Financeira";
      } else if (r.lucroIncrementalHa > 0) {
        resultado = `Gerou lucro adicional de R$ ${r.lucroIncrementalHa.toFixed(0)}/ha com produtividade segura.`;
        recomendacao = "Candidato sólido a uso parcial na safra comercial.";
        atencao = "Comparar com as versões Top ROI antes da tomada de decisão.";
        icon = "📈";
        destaque = "Boa Viabilidade Financeira";
      }

      const dic = getDicionarioAgronomico(r.produto);

      return {
        ...r,
        perfil,
        resultado,
        recomendacao,
        atencao,
        icon,
        destaque,
        dic
      };
    });
  }, [resumoEconomico]);

  const resumoExecutivo = useMemo(() => {
    if (pareceresTecnicos.length === 0) return null;
    const bestROI = pareceresTecnicos.find((p: any) => p.icon === "🏆" || p.icon === "💰" || p.destaque.includes("ROI")) || pareceresTecnicos[0];
    const bestProd = pareceresTecnicos.find((p: any) => p.icon === "🚀" || p.destaque.includes("Produtivo")) || pareceresTecnicos[0];
    
    if (bestROI.key === bestProd.key) {
       return `O tratamento ${bestROI.produto} despontou como a solução definitiva neste ensaio, apresentando não apenas o melhor ganho de produtividade, mas também a maior rentabilidade por hectare. É a escolha técnica e econômica mais indicada para adoção em escala.`;
    } else {
       return `O tratamento ${bestROI.produto} exibiu a melhor performance financeira (escolha mais inteligente para maximização de margem operacional com controle de risco), enquanto o ${bestProd.produto} demonstrou o maior potencial biológico (recomendado para elevação do teto produtivo em áreas de talhões premium).`;
    }
  }, [pareceresTecnicos]);

  const handleSaveSnapshot = () => {
    const nome = snapshotName.trim();
    if (!nome) {
      window.alert("Informe o nome do informativo para salvar.");
      return;
    }
    const snap = {
      id: `snap_${Date.now()}`,
      nome,
      createdAt: new Date().toISOString(),
      locked: lockOnSave,
      meta: {
        responsavel: metaResponsavel.trim() || undefined,
        safra: metaSafra.trim() || undefined,
        observacao: metaObservacao.trim() || undefined,
      },
      data: informativoData,
    };
    setSavedSnapshots(prev => [snap, ...prev]);
  };

  const handleNovoInformativo = () => {
    if (informativoData.length > 0) {
      const snap = {
        id: `snap_${Date.now()}`,
        nome: `Auto backup ${new Date().toLocaleString("pt-BR")}`,
        createdAt: new Date().toISOString(),
        locked: false,
        meta: {
          responsavel: metaResponsavel.trim() || undefined,
          safra: metaSafra.trim() || undefined,
        },
        data: informativoData,
      };
      setSavedSnapshots(prev => [snap, ...prev]);
    }
    setSelectedSnapshotId("");
    setIsLockedView(false);
    setShowInformativoPanel(true);
    setSnapshotName(`Informativo ${new Date().toLocaleDateString("pt-BR")}`);
    setMetaObservacao("");
    setInformativoData([]);
  };

  const handleLoadSnapshot = (id: string) => {
    setSelectedSnapshotId(id);
    const target = savedSnapshots.find(s => s.id === id);
    if (!target) return;
    setInformativoData(target.data || []);
    setIsLockedView(Boolean(target.locked));
    setSnapshotName(target.nome || "");
    setMetaResponsavel(target.meta?.responsavel || "");
    setMetaSafra(target.meta?.safra || "");
    setMetaObservacao(target.meta?.observacao || "");
  };

  const handleDeleteSnapshot = () => {
    if (!selectedSnapshotId) {
      window.alert("Selecione um informativo salvo para excluir.");
      return;
    }
    const target = savedSnapshots.find((s) => s.id === selectedSnapshotId);
    if (!target) {
      window.alert("Snapshot não encontrado.");
      return;
    }

    setSavedSnapshots((prev) => prev.filter((s) => s.id !== selectedSnapshotId));
    setTrashSnapshots((prev) => [target, ...prev]);
    setRestoreSnapshotId(target.id);
    setShowRestorePanel(true);
    setSelectedSnapshotId("");
    setIsLockedView(false);
  };

  const handleRestoreSnapshot = (id: string) => {
    if (!id) {
      window.alert("Selecione um informativo da lixeira para restaurar.");
      return;
    }
    const target = trashSnapshots.find((s) => s.id === id);
    if (!target) {
      window.alert("Snapshot da lixeira não encontrado.");
      return;
    }
    setTrashSnapshots((prev) => prev.filter((s) => s.id !== id));
    setSavedSnapshots((prev) => [target, ...prev]);
    handleLoadSnapshot(target.id);
    setShowRestorePanel(false);
  };

  const handleExportSnapshots = () => {
    if (typeof window === "undefined") return;
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      snapshots: savedSnapshots,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fortsmart-informativos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleImportSnapshots = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = String(reader.result || "{}");
        const parsed = JSON.parse(raw);
        const imported = Array.isArray(parsed?.snapshots) ? parsed.snapshots : (Array.isArray(parsed) ? parsed : []);
        if (!Array.isArray(imported) || imported.length === 0) {
          window.alert("Arquivo sem snapshots válidos.");
          return;
        }
        const normalized: InformativoSnapshot[] = imported
          .filter((s: any) => s && Array.isArray(s.data))
          .map((s: any) => ({
            id: String(s.id || `snap_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
            nome: String(s.nome || "Informativo importado"),
            createdAt: String(s.createdAt || new Date().toISOString()),
            locked: Boolean(s.locked),
            meta: s.meta ?? {},
            data: s.data,
          }));
        setSavedSnapshots(prev => [...normalized, ...prev]);
        window.alert(`${normalized.length} informativo(s) importado(s) com sucesso.`);
      } catch (_) {
        window.alert("Não foi possível importar o JSON.");
      } finally {
        if (importRef.current) importRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  const handleAddNewRow = () => {
    if (isLockedView) {
      window.alert("Este informativo está bloqueado (histórico oficial). Crie um novo para editar.");
      return;
    }
    const hectares = Number(newRow.hectares);
    const media = Number(newRow.media);
    const valor = Number(newRow.valor);
    const dose = Number(newRow.dose);
    if (!newRow.talhao || !newRow.variedade || !newRow.produto || !hectares || !media) {
      window.alert("Preencha talhão, variedade, produto, área e produtividade.");
      return;
    }

    // Regra operacional: nematicida via sulco, fungicida via aplicação aérea.
    const segmentoNormalizado =
      newRow.classe === "Nematicida"
        ? "Sulco"
        : newRow.classe === "Fungicida"
          ? "Aérea"
          : newRow.segmento;
    const row = {
      talhao: newRow.talhao,
      variedade: newRow.variedade,
      produto: newRow.produto,
      hectares,
      media,
      tipo: newRow.tipo,
      pa: newRow.pa || "—",
      classe: newRow.classe,
      categoria: newRow.categoria,
      segmento: segmentoNormalizado,
      modo: newRow.modo,
      composicao_custos: componentesTratamento.length > 0
        ? componentesTratamento
        : (valor > 0 && dose > 0
          ? [{ produto: newRow.produto, valor, moeda: newRow.moeda, dose_ha: dose }]
          : []),
    };
    setInformativoData(prev => [...prev, row]);
    setNewRow({
      talhao: "",
      variedade: "",
      produto: "",
      tipo: "tratamento",
      classe: "Nematicida",
      categoria: "Químico",
      segmento: "TS",
      modo: "SDHI",
      pa: "",
      hectares: "",
      media: "",
      valor: "",
      moeda: "BRL",
      dose: "",
    });
    setComponentDraft({
      produto: "",
      valor: "",
      moeda: "BRL",
      dose: "",
    });
    setComponentesTratamento([]);
  };

  const handleAddComponente = () => {
    if (isLockedView) return;
    const produto = componentDraft.produto.trim();
    const valor = Number(componentDraft.valor);
    const dose = Number(componentDraft.dose);
    if (!produto || !(valor > 0) || !(dose > 0)) {
      window.alert("Informe componente, valor e dose válidos.");
      return;
    }
    setComponentesTratamento((prev) => [
      ...prev,
      {
        produto,
        valor,
        moeda: componentDraft.moeda,
        dose_ha: dose,
      },
    ]);
    setComponentDraft({
      produto: "",
      valor: "",
      moeda: componentDraft.moeda,
      dose: "",
    });
  };

  const handleRemoveComponente = (idx: number) => {
    if (isLockedView) return;
    setComponentesTratamento((prev) => prev.filter((_, i) => i !== idx));
  };

  const custoCompostoHaPreview = useMemo(() => {
    return componentesTratamento.reduce((sum, c) => {
      const convertido = c.moeda === "USD" ? c.valor * cotacaoDolar : c.valor;
      return sum + (convertido * c.dose_ha);
    }, 0);
  }, [componentesTratamento, cotacaoDolar]);

  const exportPDF = async () => {
    if (typeof window === "undefined" || isExporting) return;
    setIsExporting(true);
    try {
      // Estratégia mais fiel e estável: impressão nativa do navegador.
      // O usuário pode "Salvar como PDF" e mantém layout/texto melhores que html2canvas.
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      window.print();
    } catch (err) {
      console.error("Print/PDF Fail:", err);
      window.alert("Nao foi possivel abrir a impressao do relatorio. Tente novamente.");
    } finally {
      setTimeout(() => setIsExporting(false), 800);
    }
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
            <h1 className="text-3xl font-black tracking-tighter uppercase leading-none" style={{ color: '#0f172a' }}>
              Informativo de <span className="text-green-800" style={{ color: '#166534' }}>Colheita Final</span>
            </h1>
            <p className="text-slate-400 mt-2 font-bold uppercase text-[10px] tracking-widest">Base Consolidada • Safra 2025/2026</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setShowInformativoPanel((v) => !v)}
              className="bg-white border border-slate-300 hover:border-slate-500 text-slate-700 px-5 py-3 font-black text-[10px] uppercase tracking-widest no-print"
            >
              {showInformativoPanel ? "Ocultar Novo Informativo" : "Novo Informativo"}
            </button>
            <button
              onClick={exportPDF}
              disabled={isExporting}
              className="bg-slate-900 hover:bg-black disabled:opacity-70 disabled:cursor-not-allowed text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest no-print shadow-xl transition-all active:scale-95"
            >
              Exportar Relatório
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
            <p className="text-[10px] text-slate-500 bg-white border border-slate-200 px-3 py-2">
              Ranking considera retorno econômico (lucro incremental/ha) e produtividade. ROI compara cada tratamento com o padrão do mesmo talhão.
            </p>
            
            <div className="flex flex-wrap gap-3">
              {/* Card 1: Produtividade */}
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 shadow-sm min-h-[160px]" style={{ backgroundColor: '#ffffff', borderLeftColor: '#1e40af', borderTopColor: '#e2e8f0' }}>
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
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 shadow-sm min-h-[160px]" style={{ backgroundColor: '#ffffff', borderLeftColor: '#16a34a', borderTopColor: '#e2e8f0' }}>
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
                      <span className="text-[9px] font-black text-green-700 ml-6">{Math.round(t.roiIncremental ?? t.roi)}% ROI</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 3: Lucro/HA */}
              <div className="flex-1 min-w-[220px] bg-white p-4 border-t-2 border-l-4 shadow-sm min-h-[160px]" style={{ backgroundColor: '#ffffff', borderLeftColor: '#4338ca', borderTopColor: '#e2e8f0' }}>
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
                      <span className="text-[9px] font-bold text-slate-500 ml-6">R$ {formatNum(t.lucroIncrementalHa)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 4: Recomendação */}
              <div className="flex-1 min-w-[220px] bg-amber-50 p-4 border-t-2 border-l-4 shadow-sm min-h-[160px]" style={{ backgroundColor: '#fffbeb', borderLeftColor: '#f97316', borderTopColor: '#e2e8f0' }}>
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

        {/* NOVO: INTELIGÊNCIA AGRONÔMICA (PARECER TÉCNICO) */}
        {!showInformativoPanel && (
          <div className="bg-white border border-slate-200 shadow-sm mt-4 overflow-hidden break-inside-avoid">
            <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                  <span className="text-sm">🧠</span> Parecer Técnico Automático
                </h3>
                <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">
                  Análise Agronômica vs. Impacto Financeiro
                </p>
              </div>
            </div>
            
            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {pareceresTecnicos.map((p: any, idx: number) => (
                <div key={p.key} className={`border border-slate-200 p-4 relative flex flex-col ${p.icon === '🏆' ? 'bg-amber-50/50 border-amber-300' : 'bg-white'}`}>
                  <div className="absolute top-0 right-0 bg-slate-100 text-[9px] font-black uppercase px-2 py-1 text-slate-500 border-l border-b border-slate-200">
                    Posição #{idx+1} em Lucro
                  </div>
                  
                  <div className="flex gap-2 items-center mb-3 mt-1">
                     <span className="text-xl">{p.icon}</span>
                     <div>
                       <h4 className="text-[11px] font-black uppercase text-slate-800 leading-tight pr-14">{p.produto}</h4>
                       <p className={`text-[9px] font-bold uppercase ${p.icon === '⚠️' ? 'text-rose-600' : 'text-green-700'}`}>{p.destaque}</p>
                     </div>
                  </div>

                  <div className="space-y-3 mt-2 flex-grow">
                    <div>
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">📈 Resultado Observado</h5>
                      <p className="text-[11px] text-slate-700 font-medium leading-tight">{p.resultado}</p>
                    </div>
                    <div>
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">🌱 Ação Agronômica</h5>
                      <p className="text-[11px] text-slate-700 font-medium leading-tight">{p.dic.proposta}</p>
                    </div>
                    <div>
                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">🚜 Benefício no Campo</h5>
                      <p className="text-[11px] text-slate-700 font-medium leading-tight">{p.dic.bio}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                    <div className="bg-slate-50 border border-slate-100 p-2">
                      <h5 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">💡 Indicação</h5>
                      <p className="text-[10px] font-bold text-slate-800 leading-tight">{p.recomendacao}</p>
                    </div>
                    <div className="bg-rose-50 border border-rose-100 p-2">
                      <h5 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">⚠️ Ponto de Atenção</h5>
                      <p className="text-[10px] font-bold text-rose-900 leading-tight">{p.atencao}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Novo Informativo + Histórico */}
        {showInformativoPanel && (
        <div className="bg-white border border-slate-200 shadow-sm mt-4 p-4 no-print">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-600 mb-3">
            Novo Informativo e Histórico
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input className="border border-slate-300 px-2 py-2 text-xs" placeholder="Nome do informativo (obrigatório)" value={snapshotName} onChange={(e) => setSnapshotName(e.target.value)} />
            <button className="bg-slate-900 text-white px-3 py-2 text-xs font-black uppercase" onClick={handleSaveSnapshot}>Salvar Informativo Atual</button>
            <button className="bg-amber-600 text-white px-3 py-2 text-xs font-black uppercase" onClick={handleNovoInformativo}>Novo Informativo</button>
            <select className="border border-slate-300 px-2 py-2 text-xs" value={selectedSnapshotId} onChange={(e) => handleLoadSnapshot(e.target.value)}>
              <option value="">Carregar informativo salvo...</option>
              {savedSnapshots.map((s) => (
                <option key={s.id} value={s.id}>{s.nome}</option>
              ))}
            </select>
            <button className="bg-red-700 text-white px-3 py-2 text-xs font-black uppercase disabled:opacity-60" disabled={!selectedSnapshotId} onClick={handleDeleteSnapshot}>
              Excluir Selecionado
            </button>
          </div>
          {showRestorePanel && (
            <div className="mt-2 border border-amber-300 bg-amber-50 p-3">
              <p className="text-[10px] font-black uppercase text-amber-700 mb-2">
                Informativo excluído. Restaurar agora?
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <select className="border border-amber-300 px-2 py-2 text-xs bg-white" value={restoreSnapshotId} onChange={(e) => setRestoreSnapshotId(e.target.value)}>
                  <option value="">Selecione na lixeira...</option>
                  {trashSnapshots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nome} ({new Date(s.createdAt).toLocaleDateString("pt-BR")})
                    </option>
                  ))}
                </select>
                <button className="bg-emerald-700 text-white px-3 py-2 text-xs font-black uppercase" onClick={() => handleRestoreSnapshot(restoreSnapshotId)}>
                  Restaurar Selecionado
                </button>
                <button className="bg-slate-500 text-white px-3 py-2 text-xs font-black uppercase" onClick={() => setShowRestorePanel(false)}>
                  Fechar
                </button>
              </div>
            </div>
          )}
          <div className="mt-2 grid grid-cols-1 md:grid-cols-5 gap-2">
            <input className="border border-slate-300 px-2 py-2 text-xs" placeholder="Responsável técnico" value={metaResponsavel} onChange={(e) => setMetaResponsavel(e.target.value)} />
            <input className="border border-slate-300 px-2 py-2 text-xs" placeholder="Safra (ex: 2025/2026)" value={metaSafra} onChange={(e) => setMetaSafra(e.target.value)} />
            <input className="border border-slate-300 px-2 py-2 text-xs md:col-span-2" placeholder="Observação do informativo" value={metaObservacao} onChange={(e) => setMetaObservacao(e.target.value)} />
            <label className="flex items-center justify-center gap-2 text-xs font-bold border border-slate-300 px-2 py-2">
              <input type="checkbox" checked={lockOnSave} onChange={(e) => setLockOnSave(e.target.checked)} />
              Bloquear ao salvar
            </label>
          </div>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
            <button className="bg-blue-700 text-white px-3 py-2 text-xs font-black uppercase" onClick={handleExportSnapshots}>
              Exportar Snapshots (JSON)
            </button>
            <button className="bg-cyan-700 text-white px-3 py-2 text-xs font-black uppercase" onClick={() => importRef.current?.click()}>
              Importar Snapshots (JSON)
            </button>
            <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={handleImportSnapshots} />
            <div className={`px-3 py-2 text-xs font-black uppercase text-center ${isLockedView ? "bg-rose-100 text-rose-700 border border-rose-300" : "bg-emerald-100 text-emerald-700 border border-emerald-300"}`}>
              {isLockedView ? "Histórico Oficial (Bloqueado)" : "Modo Edição"}
            </div>
            <button
              className="bg-slate-700 text-white px-3 py-2 text-xs font-black uppercase disabled:opacity-60"
              disabled={!isLockedView}
              onClick={() => {
                setIsLockedView(false);
                setSelectedSnapshotId("");
                setSnapshotName(`${snapshotName} - cópia editável`);
              }}
            >
              Criar Cópia Editável
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-7 gap-2">
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Talhão" value={newRow.talhao} onChange={(e) => setNewRow(v => ({ ...v, talhao: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Variedade" value={newRow.variedade} onChange={(e) => setNewRow(v => ({ ...v, variedade: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Produto" value={newRow.produto} onChange={(e) => setNewRow(v => ({ ...v, produto: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Área (ha)" value={newRow.hectares} onChange={(e) => setNewRow(v => ({ ...v, hectares: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Produtividade (sc/ha)" value={newRow.media} onChange={(e) => setNewRow(v => ({ ...v, media: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Valor (por dose)" value={newRow.valor} onChange={(e) => setNewRow(v => ({ ...v, valor: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Dose/ha" value={newRow.dose} onChange={(e) => setNewRow(v => ({ ...v, dose: e.target.value }))} />
          </div>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-6 gap-2">
            <select disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" value={newRow.tipo} onChange={(e) => setNewRow(v => ({ ...v, tipo: e.target.value }))}>
              <option value="tratamento">Tratamento</option>
              <option value="testemunha">Padrão/Testemunha</option>
            </select>
            <select disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" value={newRow.moeda} onChange={(e) => setNewRow(v => ({ ...v, moeda: e.target.value }))}>
              <option value="BRL">BRL</option>
              <option value="USD">USD</option>
            </select>
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Classe" value={newRow.classe} onChange={(e) => setNewRow(v => ({ ...v, classe: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="Categoria" value={newRow.categoria} onChange={(e) => setNewRow(v => ({ ...v, categoria: e.target.value }))} />
            <input disabled={isLockedView} className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100" placeholder="PA (opcional)" value={newRow.pa} onChange={(e) => setNewRow(v => ({ ...v, pa: e.target.value }))} />
            <button disabled={isLockedView} className="bg-green-700 text-white px-3 py-2 text-xs font-black uppercase disabled:opacity-60" onClick={handleAddNewRow}>
              Adicionar Linha
            </button>
          </div>
          <div className="mt-3 border border-slate-200 p-3 bg-slate-50">
            <p className="text-[10px] font-black uppercase text-slate-600 mb-2">
              Composição de custo do tratamento (multi-produto)
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              <input
                disabled={isLockedView}
                className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100"
                placeholder="Componente (produto)"
                value={componentDraft.produto}
                onChange={(e) => setComponentDraft((v) => ({ ...v, produto: e.target.value }))}
              />
              <input
                disabled={isLockedView}
                className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100"
                placeholder="Valor"
                value={componentDraft.valor}
                onChange={(e) => setComponentDraft((v) => ({ ...v, valor: e.target.value }))}
              />
              <select
                disabled={isLockedView}
                className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100"
                value={componentDraft.moeda}
                onChange={(e) => setComponentDraft((v) => ({ ...v, moeda: e.target.value }))}
              >
                <option value="BRL">BRL</option>
                <option value="USD">USD</option>
              </select>
              <input
                disabled={isLockedView}
                className="border border-slate-300 px-2 py-2 text-xs disabled:bg-slate-100"
                placeholder="Dose/ha"
                value={componentDraft.dose}
                onChange={(e) => setComponentDraft((v) => ({ ...v, dose: e.target.value }))}
              />
              <button
                disabled={isLockedView}
                className="bg-indigo-700 text-white px-3 py-2 text-xs font-black uppercase disabled:opacity-60"
                onClick={handleAddComponente}
              >
                Adicionar Componente
              </button>
            </div>
            <div className="mt-2 text-[10px] font-bold text-slate-700">
              Custo composto preview/ha:{" "}
              <span className="text-indigo-700">
                {custoCompostoHaPreview.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {componentesTratamento.length === 0 && (
                <div className="text-[10px] text-slate-500">Nenhum componente adicionado. Se desejar, usa o custo simples acima.</div>
              )}
              {componentesTratamento.map((c, idx) => (
                <div key={`${c.produto}-${idx}`} className="flex items-center justify-between bg-white border border-slate-200 px-2 py-1">
                  <span className="text-[10px] font-bold text-slate-700">
                    {c.produto} | {c.moeda} {c.valor.toLocaleString("pt-BR")} | dose {c.dose_ha}
                  </span>
                  <button
                    disabled={isLockedView}
                    className="text-[10px] font-black uppercase text-red-700 disabled:opacity-60"
                    onClick={() => handleRemoveComponente(idx)}
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        )}

        {/* Seções "Auditoria de Custo" e "Visão Econômica Única" Removidas a pedido corporativo */}

        <div className="space-y-10 bg-[#F0F2F5] pb-10">

          {/* Grid de Talhões */}
          {Object.entries(groupedData as Record<string, any[]>).map(([groupKey, products]) => {
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
                        <th className="py-4 px-4 text-center text-[9px] font-black uppercase text-slate-400">Custo <br /><span className="text-[7px]">r$/ha</span><br /><span className="text-[7px] normal-case text-slate-300">(toque para detalhar)</span></th>
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
                        const roiExibicao = item.roiIncremental ?? item.roi;

                        return (
                          <tr key={idx} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${isWinner ? 'bg-green-50/20' : ''}`}>
                            <td className="py-4 px-4 text-center font-black text-xs text-slate-400">{idx + 1}º</td>
                            <td className="py-4 px-4">
                              <p className="text-[11px] font-black uppercase leading-tight">{item.produto}</p>
                              <div className="flex gap-1 mt-1">
                                <span className="text-[8px] font-bold px-1 py-0.5 bg-slate-100 border border-slate-200 text-slate-500 uppercase">{item.pa}</span>
                                <span className={`text-[8px] font-bold px-1 py-0.5 border uppercase ${item.categoria === 'Misto' ? 'border-blue-700 text-blue-700' : item.categoria === 'Químico' ? 'border-orange-700 text-orange-700' : 'border-green-700 text-green-700'}`}>{item.categoria}</span>
                                {item.segmento !== "-" && <span className="text-[8px] font-bold px-1 py-0.5 bg-slate-800 text-white uppercase">{item.segmento}</span>}
                                <span className="text-[8px] font-bold px-1 py-0.5 border border-cyan-700 text-cyan-700 uppercase">{item.viaAplicacao}</span>
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
                            <td className="py-4 px-4 text-center text-xs font-bold tabular-nums border-x border-slate-50">
                              <details>
                                <summary className="cursor-pointer list-none text-blue-800">
                                  {item.custoHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </summary>
                                <div className="mt-1 text-left bg-slate-50 border border-slate-200 p-2">
                                  <p className="text-[8px] font-black uppercase text-slate-500 mb-1">{item.viaAplicacao}</p>
                                  {(item.composicao_custos || []).length === 0 && (
                                    <p className="text-[8px] text-slate-400">Sem componentes detalhados.</p>
                                  )}
                                  {(item.composicao_custos || []).map((c: any, cIdx: number) => {
                                    const valor = Number(c?.valor ?? 0);
                                    const dose = Number(c?.dose_ha ?? 1);
                                    const moeda = String(c?.moeda ?? "BRL").toUpperCase();
                                    const convertido = moeda === "USD" ? valor * cotacaoDolar : valor;
                                    const subtotal = convertido * dose;
                                    return (
                                      <p key={cIdx} className="text-[8px] text-slate-700">
                                        {c?.produto ?? "Componente"}: {moeda} {valor.toLocaleString("pt-BR")} x dose {dose} = R$ {subtotal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </p>
                                    );
                                  })}
                                </div>
                              </details>
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-bold tabular-nums text-slate-500">{item.hectares}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.media * item.hectares)}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.recTot)}</td>
                            <td className="py-4 px-4 text-center font-black text-xs bg-slate-100/30 tabular-nums">{formatNum(item.custoTot)}</td>
                            <td className={`py-4 px-4 text-center font-black text-xs bg-slate-100/60 tabular-nums ${item.lucroTot >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatNum(item.lucroTot)}</td>
                            <td className="py-4 px-4 text-center">
                              {isWitness ? (
                                <span className="text-slate-300 font-black">-</span>
                              ) : (
                                <div className={`text-xs font-black border-2 px-1 py-0.5 rounded ${roiExibicao >= 0 ? 'border-green-800 text-green-800' : 'border-red-700 text-red-700'}`}>
                                  {Math.round(roiExibicao)}%
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
                      "Nesta área, a estratégia de manejo evidenciou que o {bestInGroup.lucroIncrementalHa > 0 ? 'investimento tecnológico superou a base econômica' : 'custo adicional não foi compensado pelo ganho produtivo'}.
                      O tratamento {bestInGroup.produto} apresentou {bestInGroup.diff_prod > 0 ? `incremento de ${bestInGroup.diff_prod.toFixed(2)} sc/ha` : 'resultado estável'}, com {bestInGroup.roiIncremental != null ? `ROI incremental de ${Math.round(bestInGroup.roiIncremental)}%` : 'avaliação incremental por margem'}.
                      Mesmo quando a produtividade cai, o modelo considera se a redução de custo manteve lucro incremental positivo para decidir se vale a pena."
                    </div>
                  </div>

                  {/* LADO DIREITO: Proposta Tecnológica */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-700 text-white flex items-center justify-center font-black text-[10px]">2</div>
                      <h4 className="text-sm font-black uppercase tracking-tighter">Proposta Tecnológica</h4>
                    </div>
                    <div className="space-y-4">
                      {products.map((item, pi) => {
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

          {/* RESUMO EXECUTIVO FINAL */}
          {!showInformativoPanel && resumoExecutivo && (
          <div className="mt-8 mb-4 bg-slate-900 text-white p-6 md:p-8 border-l-4 border-green-500 shadow-xl break-inside-avoid">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🔥</span>
              <h3 className="text-[13px] font-black uppercase tracking-widest text-slate-300">Resumo Executivo (Pitch de Venda Técnica)</h3>
            </div>
            <p className="text-base md:text-[17px] font-medium leading-relaxed italic text-slate-100 opacity-90">
              "{resumoExecutivo}"
            </p>
            <div className="mt-6 pt-4 border-t border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-500 flex justify-between items-center">
              <span>Gerado automaticamente por FortSmart Field Pro Intelligence</span>
              <span className="text-green-600">Smart Report V2.9</span>
            </div>
          </div>
          )}

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
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body { background-color: #ffffff !important; zoom: 0.88 !important; }
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
