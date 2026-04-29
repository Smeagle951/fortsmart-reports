# FortSmart Reports

Relatórios técnicos agrícolas — **framework reutilizável**, multi-app seguro, JSON como fonte de verdade, renderização na Vercel, PDF pelo navegador.

**Repositório:** [github.com/Smeagle951/fortsmart-reports](https://github.com/Smeagle951/fortsmart-reports)

## Arquitetura (Próximo Nível — Profissional)

- **Frontend:** Next.js App Router (Vercel)
- **Dados:** Supabase — tabela `relatorios` com **isolamento por dono** (`owner_firebase_uid`, `app_id`), **compartilhamento seguro** (`share_token`, `is_public`), bucket `relatorios` para imagens
- **Rotas:** `/relatorio/[id]` (privado, só dono) • `/r/[token]` (público, link compartilhado)
- **Zero mistura:** cada usuário/app vê apenas seus relatórios; link público só com token

## Estrutura do framework

```
fortsmart-reports/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Home
│   ├── relatorio/[id]/page.tsx     # Privado (cookie firebase_uid)
│   ├── r/[token]/page.tsx          # Público (link compartilhado)
│   └── api/relatorio/[id]/route.ts # GET privado (header X-Firebase-UID)
├── components/
│   ├── Header.tsx
│   ├── Mapa.tsx
│   ├── Galeria.tsx
│   ├── TabelaDados.tsx
│   ├── RelatorioContent.tsx
│   └── PrintBar.tsx
├── lib/
│   ├── supabase.ts                 # getRelatorioByShareToken, getRelatorioByIdForOwner, getStoragePublicUrl
│   └── supabaseClient.js           # (legado pages)
├── utils/
│   └── format.ts
├── styles/
│   └── globals.css
├── pages/                          # Legado (opcional)
├── data/
├── package.json
└── next.config.js
```

## Setup

1. **Clone e instale:**

   ```bash
   cd fortsmart-reports
   npm install
   ```

2. **Supabase:** crie projeto em [supabase.com](https://supabase.com). Anote:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API → service_role; **só no server**, nunca no browser)

3. **Variáveis de ambiente** (Vercel ou `.env.local`):

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Para API privada /relatorio/[id]
   ```

4. **Supabase — tabela e RLS:** execute no **SQL Editor** do projeto:

   - **`docs/supabase_relatorios_framework.sql`** (raiz do repositório principal)
   - Cria: tabela `relatorios` (id uuid, owner_firebase_uid, app_id, device_id, share_token, is_public, titulo, dados jsonb), RLS (dono vê só os seus; anon só lê is_public=true), bucket `relatorios` para imagens (`relatorios/{id}/foto.jpg`).

## URLs

- **Home:** `https://seu-dominio.vercel.app/`
- **Relatório privado:** `https://seu-dominio.vercel.app/relatorio/[uuid]` — exige cookie `firebase_uid` (ou app envia header ao chamar API)
- **Link compartilhado:** `https://seu-dominio.vercel.app/r/[share_token]` — sem login; só retorna se `is_public = true`

**Não usar** `/relatorio?id=123` (inseguro). Sempre compartilhar via **share_token** e rota `/r/[token]`.

## Painel de Amostragem de Solos (Novo)

Painel web independente para visualização georreferenciada de amostragens de solo e compactação.

- **URL:** `https://seu-dominio.vercel.app/painel-amostragem`
- **Características:**
  - Mapa satélite com pontos georreferenciados
  - Galeria de fotos com zoom e preview
  - Seletor de talhões
  - Exportação KML
  - Funciona offline após carregar dados
  - Aceita upload de JSON ou carregamento via URL

**Fluxo de uso:**
1. Exportar JSON do app FortSmart (módulo amostragem)
2. Acessar painel na URL
3. Fazer upload do arquivo JSON
4. Visualizar pontos, fotos e dados no mapa

Arquivos: `public/painel-amostragem/index.html` (app estático puro HTML/JS)

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

## App (Flutter): fluxo para enviar e compartilhar

1. **Inserir relatório:** montar JSON (ex.: `RelatorioWebJsonService.buildJsonForSafra(safraId)`). Inserir na tabela `relatorios` com `owner_firebase_uid` = Firebase UID do usuário, `app_id` = ID do app, `dados` = JSON. Imagens: upload em `relatorios/{relatorio_id}/foto.jpg` e usar `path` no JSON (ex.: `foto.jpg`); a web resolve com `getStoragePublicUrl(relatorioId, path)`.
2. **Ver relatório privado:** abrir no app o link `https://seu-dominio.vercel.app/relatorio/{uuid}` com o cookie `firebase_uid` definido (ao fazer login com Firebase, definir esse cookie no domínio da Vercel ou usar a API `GET /api/relatorio/[id]` com header `X-Firebase-UID`).
3. **Compartilhar:** ao clicar "Compartilhar", backend faz `UPDATE relatorios SET share_token = gen_random_uuid()::text, is_public = true WHERE id = $1 AND owner_firebase_uid = $2` e retorna o link `https://seu-dominio.vercel.app/r/{share_token}`. Quem recebe o link acessa sem login.

## Deploy na Cloudflare (Workers + GitHub)

Este repositório usa **OpenNext** (`@opennextjs/cloudflare`) e **Wrangler**. O script `npm run build` é **só `next build`** (o OpenNext volta a chamá-lo por dentro). Para o Worker sair no ar, o CI **tem** de correr **`npm run cf:build`** antes do `wrangler deploy` — esse passo gera a pasta **`.open-next/`** e o config compilado.

### Erro típico no painel

```
ERROR Could not find compiled Open Next config, did you run the build command?
```

Significa que o **comando de construção** está como `npm run build` (Next puro). Troque para **`npm run cf:build`** ou **`npm run cloudflare-build`** (equivale ao mesmo).

**Workers Builds (painel Cloudflare) — valores obrigatórios**

| Campo | Valor |
|--------|--------|
| Nome do projeto | `fortsmart-reports` |
| Caminho (root) | `/` |
| Comando de construção | **`npm run cf:build`** (**não** use `npm run build` só) |
| Comando de implantação | `npx wrangler deploy` |
| Branch não produção (opcional) | `npx wrangler versions upload` |

**Alternativa (um comando só):** se o painel permitir deixar o passo de “build” vazio, use **apenas** no deploy: `npm run deploy:cf` (inclui `cf:build` + `wrangler deploy`). Caso contrário use a tabela acima.

**Variáveis R2 / Supabase** não entram no **build**: configure-as como **Secrets / Variables do Worker** ou variáveis de runtime no painel — **nunca** commits com esses valores no Git.

Defina as mesmas variáveis de ambiente do Supabase/Next em **Build variables** e **Secrets**, como na [documentação OpenNext (env)](https://opennext.js.org/cloudflare/howtos/env-vars).

Local: `npm run cf:build` gera `.open-next/`; `npm run deploy:cf` faz build + deploy (`opennextjs-cloudflare deploy`). Next.js 14.2.x exige a flag `--dangerouslyUseUnsupportedNextVersion` (já incluída em `cf:build`).

## Deploy na Vercel

1. Conecte o repositório GitHub ao Vercel.
2. No projeto Vercel, defina o **comando de build** como `npm run build` (apenas `next build`) — não use `cf:build` na Vercel a menos que migre o deploy para Workers.
3. Configure as variáveis de ambiente no painel da Vercel.
4. Deploy automático a cada push.

---

**Checklist produto:** ver em **`docs/PRODUTO_OPERACIONAL_RELATORIOS.md`** (versionamento, assinatura, histórico por cliente, controle de acesso opcional).

**Conclusão:** JSON como fonte única, HTML gerado dinamicamente, PDF via impressão do navegador. Versionamento (`meta.versao`), assinatura técnica e histórico por cliente já implementados; escalável para SaaS com Auth + RLS.
