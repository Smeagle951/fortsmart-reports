# FortSmart - Painel Web de Amostragem de Solos

Painel web completo para visualização georreferenciada de amostragens de solo, desenvolvido em HTML/JavaScript puro.

## 🚀 Funcionalidades

### Mapa Interativo
- Visualização em modo **satélite** e **mapa**
- Polígonos dos talhões georreferenciados
- Marcadores numerados para cada ponto de amostragem
- Zoom e navegação intuitiva

### Gestão de Talhões
- **Seletor de talhões** com todas as fazendas
- Carregamento de múltiplos talhões
- Visualização do polígono do talhão selecionado

### Pontos de Amostragem
- Lista completa de pontos com coordenadas
- Status visual: Completo (verde) / Pendente (amarelo)
- Navegação rápida entre pontos
- Contadores de pontos e fotos

### Detalhes do Ponto
Modal completo ao clicar em um ponto:
- **Galeria de fotos** com legenda de profundidade
- **Dados completos**:
  - Nome do talhão
  - Nome da fazenda
  - Coordenadas GPS
  - Data e hora da coleta
  - Responsável técnico
- **Profundidades coletadas** com status
- Contador de fotos por profundidade

### Exportação
- **Exportar KML** para Google Earth
- **Imprimir** relatório completo

## 🎨 Design FortSmart
- Cores oficiais da marca
- Tipografia Inter
- Interface responsiva
- Ícones Lucide

## 📁 Estrutura de Arquivos

```
painel-amostragem/
├── index.html          # Painel principal (único arquivo)
└── README.md           # Documentação
```

## 🔧 Integração com Dados Reais

### 1. API REST (Recomendado)

Substitua os dados de exemplo (`sampleData`) por chamadas à API:

```javascript
// Substituir na função initApp()
async function initApp() {
    // Buscar dados da campanha
    const response = await fetch('/api/campaigns/{id}');
    campaignData = await response.json();
    
    // Buscar pontos
    const pointsResponse = await fetch('/api/campaigns/{id}/points');
    pointsData = await pointsResponse.json();
    
    // Buscar talhões
    const talhoesResponse = await fetch('/api/talhoes?campaign={id}');
    sampleData.talhoes = await talhoesResponse.json();
    
    // ... resto da inicialização
}
```

### 2. Dados via JSON

Exporte os dados do SQLite para JSON:

```javascript
// Estrutura esperada
const data = {
    campaign: {
        name: "Amostragem Pivô 7",
        culture: "Soja",
        safra: "2025/2026",
        responsavel: "Técnico"
    },
    talhoes: [
        {
            id: 1,
            nome: "Pivô Central 7",
            fazenda: "Fazenda São João",
            poligono: [[lat, lng], [lat, lng], ...]
        }
    ],
    points: [
        {
            id: 1,
            nome: "Ponto A1",
            talhao: "Pivô Central 7",
            fazenda: "Fazenda São João",
            lat: -15.34750,
            lng: -54.44950,
            data: "28/04/2026",
            hora: "10:15:30",
            responsavel: "Técnico",
            profundidades: [
                { range: "0-10 cm", status: "complete", photos: 2 }
            ],
            fotos: [
                { 
                    url: "/photos/point_1_depth_0_10_1.jpg", 
                    depth: "0-10cm", 
                    data: "28/04/2026" 
                }
            ]
        }
    ]
};
```

### 3. Supabase Integration

```javascript
// Usar Supabase client
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function loadCampaignData(campaignId) {
    // Buscar campanha
    const { data: campaign } = await supabase
        .from('soil_sampling_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
    
    // Buscar pontos
    const { data: points } = await supabase
        .from('soil_sampling_points')
        .select(`
            *,
            depths:soil_sampling_depths(*),
            photos:soil_sampling_depth_photos(*)
        `)
        .eq('campaign_id', campaignId);
    
    return { campaign, points };
}
```

## 🗺️ Formato dos Dados

### Campanha
```json
{
    "name": "Nome da Campanha",
    "culture": "Soja",
    "safra": "2025/2026",
    "responsavel": "Técnico de Campo"
}
```

### Talhão
```json
{
    "id": 1,
    "nome": "Pivô Central 7",
    "fazenda": "Fazenda São João",
    "poligono": [
        [-15.347, -54.449],
        [-15.348, -54.448],
        [-15.349, -54.449],
        [-15.348, -54.450]
    ]
}
```

### Ponto
```json
{
    "id": 1,
    "nome": "Pivô 7 A 1",
    "talhao": "Pivô Central 7",
    "fazenda": "Fazenda São João",
    "lat": -15.34750,
    "lng": -54.44950,
    "data": "28/04/2026",
    "hora": "10:15:30",
    "responsavel": "Técnico de Campo",
    "profundidades": [
        { "range": "0-10 cm", "status": "complete", "photos": 2 },
        { "range": "10-20 cm", "status": "complete", "photos": 1 },
        { "range": "20-30 cm", "status": "pending", "photos": 0 }
    ],
    "fotos": [
        { 
            "url": "/api/photos/1/0-10/1.jpg", 
            "depth": "0-10cm", 
            "data": "28/04/2026" 
        }
    ]
}
```

## 🚀 Deploy

### Vercel/Netlify
1. Faça upload do `index.html` para a pasta `public/`
2. Configure as variáveis de ambiente para a API
3. Deploy automático

### Servidor Próprio
```bash
# Copiar para servidor web
cp index.html /var/www/html/painel-amostragem/

# Ou usar com Nginx
location /painel-amostragem {
    alias /var/www/painel-amostragem;
    index index.html;
}
```

### Flutter WebView
```dart
// Abrir painel no app Flutter
WebView(
  initialUrl: 'https://seu-dominio.com/painel-amostragem?campaignId=123',
  javascriptMode: JavascriptMode.unrestricted,
)
```

## 📱 Responsividade

- Desktop: Sidebar + Mapa lado a lado
- Tablet: Sidebar colapsável
- Mobile: Menu hamburger para sidebar

## 🔐 Segurança

1. **Autenticação**: Adicione JWT token nas requisições
2. **CORS**: Configure headers apropriados
3. **Fotos**: Use URLs assinadas (S3/Supabase)

## 🎯 Próximos Passos

1. [ ] Integrar com API real do backend
2. [ ] Adicionar autenticação JWT
3. [ ] Implementar filtros avançados
4. [ ] Adicionar relatórios em PDF
5. [ ] Suporte a múltiplas campanhas

## 📞 Suporte

Para dúvidas ou sugestões, entre em contato com a equipe FortSmart.

---

**Versão**: 1.0.0  
**Data**: 2026-04-28  
**Desenvolvido por**: FortSmart Agro
