# Mapa de Talhões - Setup e Configuração

## 📋 Resumo

O **Mapa de Talhões** é uma funcionalidade web que permite visualizar talhões e subáreas exportados do app FortSmart via link curto ou GeoJSON base64 na URL.

## 🔗 Fluxo de Funcionamento

1. **App Flutter** → Usuário seleciona talhões → Clica "Visualizar mapa (web)"
2. **App** gera GeoJSON → Envia para `/api/mapa-talhoes/share`
3. **API** salva no Supabase → Retorna link curto `/mapa-talhoes/m/:token`
4. **App** abre o link no navegador
5. **Web** carrega o GeoJSON do Supabase e renderiza o mapa

## ⚙️ Configuração Necessária

### 1. Variáveis de Ambiente (Vercel/Deploy)

Configure estas variáveis no painel da Vercel:

```env
# Supabase (obrigatório para links curtos)
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# URL canônica (opcional, para links corretos)
NEXT_PUBLIC_CANONICAL_URL=https://relatorios.fortsmart-agro.com.br
```

### 2. Migração do Supabase

Execute a migração para criar a tabela de compartilhamentos:

```bash
# Via Supabase CLI
supabase db push

# Ou execute manualmente no SQL Editor do Supabase:
-- Arquivo: supabase/migrations/20260424120000_mapa_talhoes_shares.sql
```

### 3. Estrutura do Banco

Tabela: `mapa_talhoes_shares`
- `id` (TEXT PRIMARY KEY): Token base64url (9 bytes)
- `geojson` (JSONB): FeatureCollection GeoJSON
- `expires_at` (TIMESTAMPTZ): Data de expiração (90 dias)
- `created_at` (TIMESTAMPTZ): Data de criação

## 🔍 Troubleshooting

### Erro: "Servidor sem Supabase (service role)" (503)

**Causa**: Variáveis de ambiente não configuradas
**Solução**: 
1. Verifique se `SUPABASE_SERVICE_ROLE_KEY` está configurada
2. Reinicie o deploy na Vercel após adicionar as variáveis

### Erro: "Tabela mapa_talhoes_shares inexistente" (503)

**Causa**: Migração não executada
**Solução**:
```bash
# Execute no SQL Editor do Supabase:
CREATE TABLE IF NOT EXISTS mapa_talhoes_shares (
    id TEXT PRIMARY KEY,
    geojson JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Erro: "Link expirado ou inválido" (404)

**Causa**: Token não existe ou expirou
**Solução**: Gere um novo mapa no app

### GeoJSON não aparece no mapa

**Causa**: Talhões sem geometria (polígono)
**Solução**: No app, desenhe o contorno do talhão no mapa (mín. 3 pontos)

## 🧪 Teste Local

```bash
cd fortsmart-reports

# Configurar .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co" >> .env.local
echo "SUPABASE_SERVICE_ROLE_KEY=sua-key" >> .env.local

# Executar
npm run dev

# Testar API
curl -X POST http://localhost:3000/api/mapa-talhoes/share \
  -H "Content-Type: application/json" \
  -d '{"type":"FeatureCollection","features":[]}'
```

## 📱 URLs do App Flutter

As URLs estão configuradas em `lib/utils/constants.dart`:

```dart
static const String webReportsBaseUrl = 'https://relatorios.fortsmart-agro.com.br';
static const String webMapaTalhoesPath = '/mapa-talhoes';
static String get webMapaTalhoesUrl => '$webReportsBaseUrl$webMapaTalhoesPath';
```

## 🔄 Fallbacks Implementados

O app Flutter tem 3 níveis de fallback:

1. **Link curto** (POST /api/mapa-talhoes/share) - Preferido
2. **Base64 na URL** (?d=...) - Se link curto falhar
3. **Compartilhar arquivo** - Se GeoJSON for muito grande

## 🗺️ Componentes do Mapa

- `MapaTalhoesClient.tsx` - Cliente principal com filtros
- `MapView.tsx` - Mapa Leaflet dinâmico (SSR desabilitado)
- `TalhaoDetailPanel.tsx` - Painel de detalhes do talhão
- `SeedCalculatorTable.tsx` - Calculadora de sementes

## 📊 Estrutura GeoJSON

```json
{
  "type": "FeatureCollection",
  "meta": {
    "gerado_por": "FortSmart",
    "exportado_em": "2024-04-24T10:00:00Z",
    "safra_filtro": "safra-2025"
  },
  "features": [
    {
      "type": "Feature",
      "id": "talhao_123",
      "properties": {
        "tipo": "talhao",
        "name": "Talhão 17",
        "cultura": "Milho",
        "material": "P3707PWU",
        "estande_pl_ha": 65000,
        "area_ha": 128.0
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-46.0, -23.0], ...]]
      }
    }
  ]
}
```

## 🚀 Deploy

```bash
cd fortsmart-reports
npm run build
vercel --prod
```

## 📞 Suporte

Em caso de problemas:
1. Verifique logs na Vercel (Functions)
2. Confirme variáveis de ambiente
3. Valide migração do Supabase
4. Teste API com curl/Postman
