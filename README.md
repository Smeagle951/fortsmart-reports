# FortSmart Reports

Relatórios técnicos agrícolas — **JSON como fonte de verdade**, renderização HTML na Vercel, download em PDF pelo navegador.

## Arquitetura

- **Frontend:** Next.js (Vercel)
- **Dados:** Supabase (tabela `relatorios` + bucket `relatorios-imagens`)
- **Fluxo:** App Flutter gera JSON → upload imagens Supabase Storage → salva JSON no Supabase → link compartilhável → Vercel renderiza HTML → usuário imprime como PDF

## Estrutura

```
fortsmart-reports/
├── data/
│   ├── schema-relatorio-visita-tecnica.json   # Schema do JSON canônico
│   └── exemplo-relatorio.json                  # Exemplo para teste local
├── lib/
│   ├── supabaseClient.js
│   └── formatters.js
├── pages/
│   ├── index.js
│   └── relatorio/
│       └── [id].js
├── styles/
│   └── globals.css
├── public/
│   └── assets/
│       └── logo.png
├── package.json
├── next.config.js
└── vercel.json
```

## Setup

1. **Clone / copie** o projeto e instale dependências:

   ```bash
   cd fortsmart-reports
   npm install
   ```

2. **Supabase:** crie projeto em [supabase.com](https://supabase.com). Anote:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

3. **Variáveis de ambiente** (Vercel ou `.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

4. **Supabase — tabelas e storage:** execute o script SQL completo no **SQL Editor** do projeto:

   - No repositório: **`docs/supabase_relatorios_setup.sql`**
   - Ele cria: tabela `relatorios`, RLS, bucket `relatorios-imagens` (5MB, só imagens), políticas de storage e tabela opcional `relatorio_imagens` para auditoria.
   - Se preferir só o mínimo: tabela `relatorios` e bucket manual no Dashboard (Storage → Create bucket → `relatorios-imagens`, público).

## URLs

- **Home:** `https://seu-dominio.vercel.app/`
- **Relatório:** `https://seu-dominio.vercel.app/relatorio/[id]`
- **Histórico por cliente:** `https://seu-dominio.vercel.app/cliente/[clienteId]` (ex: `/cliente/boa-esperanca`)
- **Exemplo (sem Supabase):** `https://seu-dominio.vercel.app/relatorio/exemplo`

Se as variáveis do Supabase não estiverem configuradas, apenas o ID `exemplo` funciona (dados do arquivo `data/exemplo-relatorio.json`).

## Download em PDF

O usuário clica em **Baixar PDF** → o navegador abre o diálogo de impressão → “Salvar como PDF”. Não é gerado PDF no servidor.

## JSON canônico (Relatório de Visita Técnica)

O app Flutter deve montar um objeto com (entre outros):

| Bloco | Campos principais |
|-------|--------------------|
| `meta` | id, dataGeracao, tecnico, tecnicoCrea, safra, appVersion |
| `propriedade` | fazenda, municipio, estado, proprietario |
| `talhao` | id, nome, numero, cultura, area, dataPlantio |
| `contextoSafra` | materialVariedade, empresa, espacamentoCm, populacaoAlvoPlHa, dae, dap |
| `fenologia` | estadio, ultimaAvaliacaoDias, dataUltimaAvaliacao |
| `populacao` | plantasHa, estandeEfetivoPlHa, eficienciaPct, situacao |
| `aplicacoes` | array: tipo, data, produto, dose, unidade, status |
| `pragas` | array: tipo, alvo, incidencia, severidade, situacao |
| `condicoes` | temperatura, umidade, vento, soloUmidade, compactacao, vigorCultura, etc. |
| `mapa` | viewBox, path (SVG), pontos (opcional) |
| `imagens` | array: **url** (pública), descricao, categoria, data — **nunca base64** |
| `diagnostico` | problemaPrincipal, causaProvavel, nivelRisco, urgenciaAcao |
| `planoAcao` | objetivoManejo, acoes: [{ prioridade, acao, prazo }] |
| `conclusao` | string |

Ver `data/schema-relatorio-visita-tecnica.json` e `data/exemplo-relatorio.json`.

## Flutter: fluxo para enviar relatório

1. Montar o JSON com `RelatorioWebJsonService.buildJsonForSafra(safraId)` (já inclui `meta.versao`, `assinaturaTecnica`).
2. Para cada imagem: comprimir, upload para o bucket `relatorios-imagens`, obter URL pública e preencher `imagens[].url` no JSON.
3. Gerar `cliente_id` com `RelatorioWebJsonService.clienteIdFromFazenda(fazendaNome)` (slug para histórico em `/cliente/[clienteId]`).
4. Inserir na tabela Supabase `relatorios`: `id`, `cliente_id`, `cliente`, `data_relatorio`, `json_data`.
5. Compartilhar: `https://fortsmart.vercel.app/relatorio/{id}` ou histórico: `https://fortsmart.vercel.app/cliente/{cliente_id}`.

## Deploy na Vercel

1. Conecte o repositório GitHub ao Vercel.
2. Configure as variáveis de ambiente no painel da Vercel.
3. Deploy automático a cada push.

---

**Checklist produto:** ver em **`docs/PRODUTO_OPERACIONAL_RELATORIOS.md`** (versionamento, assinatura, histórico por cliente, controle de acesso opcional).

**Conclusão:** JSON como fonte única, HTML gerado dinamicamente, PDF via impressão do navegador. Versionamento (`meta.versao`), assinatura técnica e histórico por cliente já implementados; escalável para SaaS com Auth + RLS.
