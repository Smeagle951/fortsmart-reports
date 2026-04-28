# Deploy FortSmart Reports no Vercel

## 🚀 Configuração do Deploy

Este documento orienta o deploy do FortSmart Reports (incluindo o novo Mapa de Talhões) no Vercel.

### 📋 Pré-requisitos

1. **Conta Vercel**: Criar conta em https://vercel.com
2. **GitHub**: Repositório conectado ao Vercel
3. **Supabase**: Projeto configurado com as tabelas necessárias
4. **Secrets GitHub**: Variáveis de ambiente configuradas

### 🔧 Variáveis de Ambiente

#### Secrets no GitHub
Configure os seguintes secrets no repositório GitHub:

```bash
# Vercel
VERCEL_ORG_ID=seu_org_id_vercel
VERCEL_PROJECT_ID=seu_project_id_vercel
VERCEL_TOKEN=seu_token_vercel

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

#### Environment Variables no Vercel
Configure no dashboard do Vercel:

```bash
# Supabase (públicas - começam com NEXT_PUBLIC_)
NEXT_PUBLIC_SUPABASE_URL=https://seu_projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon

# Supabase (privadas - sem NEXT_PUBLIC_)
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

### 🗄️ Configuração do Supabase

Execute a migração para criar a tabela de compartilhamento:

```sql
-- Arquivo: supabase/migrations/20260424120000_mapa_talhoes_shares.sql
CREATE TABLE IF NOT EXISTS mapa_talhoes_shares (
    id TEXT PRIMARY KEY,
    geojson JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices e políticas RLS
-- (ver arquivo completo para detalhes)
```

### 🌐 Deploy Automático

O deploy é automático via GitHub Actions:

1. **Push para main/master**: Deploy automático em produção
2. **Pull Request**: Deploy automático em preview
3. **Build**: Testes, lint e TypeScript check

### 📁 Estrutura do Projeto

```
fortsmart-reports/
├── app/
│   ├── mapa-talhoes/          # Novo mapa integrado
│   ├── api/                   # APIs REST
│   └── layout.tsx
├── public/
├── package.json
├── next.config.js
├── vercel.json                # Config Vercel
└── README_DEPLOY.md
```

### 🔗 URLs do Deploy

- **Produção**: https://relatorios.fortsmart-agro.com.br
- **Mapa de Talhões**: https://relatorios.fortsmart-agro.com.br/mapa-talhoes
- **API Share**: https://relatorios.fortsmart-agro.com.br/api/mapa-talhoes/share
- **API Snapshot**: https://relatorios.fortsmart-agro.com.br/api/mapa-talhoes/snapshot/:token

### 🧪 Testes Locais

Para testar localmente:

```bash
# Instalar dependências
npm install

# Configurar .env.local
cp .env.example .env.local
# Editar .env.local com suas chaves

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build
npm start
```

### 🐛 Troubleshooting

#### Erro Comum: "Missing environment variables"
- Verifique se todas as variáveis estão configuradas no Vercel
- Reinicie o deploy após adicionar variáveis

#### Erro Comum: "Supabase connection failed"
- Verifique URL e chaves do Supabase
- Confirme que as políticas RLS estão configuradas

#### Erro Comum: "Build failed"
- Verifique logs no GitHub Actions
- Confirme que todos os dependencies estão instalados

### 📊 Monitoramento

- **Vercel Analytics**: Métricas de uso e performance
- **Supabase Dashboard**: Status do banco e queries
- **GitHub Actions**: Status dos builds e deploys

### 🔄 Fluxo de Atualização

1. Desenvolver features no branch `develop`
2. Testar localmente
3. Abrir PR para `main`
4. Deploy automático em preview
5. Aprovar PR → deploy em produção

### 🛡️ Segurança

- **RLS no Supabase**: Apenas leitura pública para links válidos
- **Environment Variables**: Nunca commitar chaves no repo
- **HTTPS**: Automático no Vercel
- **CORS**: Configurado para domínios FortSmart

### 📱 Integração com App Flutter

O app Flutter usa as seguintes URLs (definidas em `constants.dart`):

```dart
// URLs para o app
static const String webMapaTalhoesUrl = 'https://relatorios.fortsmart-agro.com.br/mapa-talhoes';
static const String webMapaShareApiUrl = 'https://relatorios.fortsmart-agro.com.br/api/mapa-talhoes/share';
static String webMapaSnapshotApiUrl(String token) => 'https://relatorios.fortsmart-agro.com.br/api/mapa-talhoes/snapshot/$token';
```

### ✅ Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Supabase migrations aplicadas
- [ ] GitHub Actions funcionando
- [ ] Build de produção OK
- [ ] Testes de integração passando
- [ ] URLs de produção acessíveis
- [ ] Mapa de talhões funcionando
- [ ] API de compartilhamento OK

---

**Suporte**: Para problemas de deploy, contatar a equipe de desenvolvimento FortSmart.
