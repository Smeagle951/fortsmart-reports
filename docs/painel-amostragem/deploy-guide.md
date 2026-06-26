# 🚀 Guia de Deploy - Painel de Amostragem

## Arquitetura Recomendada: JSON Estático + Vercel

### Por que JSON em vez de Supabase?

| Problema Supabase | Solução JSON |
|-------------------|--------------|
| ⏸️ Trava após 90 dias inativo | ✅ **Sempre disponível** |
| 💰 Storage de fotos pago | ✅ **Vercel Edge (grátis)** |
| 🔌 Latência de API | ✅ **Instantâneo (CDN)** |
| 🔄 Complexidade de backend | ✅ **Deploy estático** |
| 📦 Limite de 500MB dados | ✅ **Ilimitado no GitHub** |

---

## 📁 Estrutura de Deploy

```
fortsmart-reports/
├── public/
│   └── painel-amostragem/
│       ├── index.html              # Painel principal
│       ├── data/                   # 📊 Dados JSON exportados
│       │   ├── amostragem-pivo-7.json
│       │   ├── amostragem-pivo-8.json
│       │   └── index.json            # Catálogo de campanhas
│       ├── photos/                 # 📸 Fotos otimizadas
│       │   ├── pivo-7/
│       │   │   ├── photo_1_1_1.jpg
│       │   │   └── ...
│       │   └── pivo-8/
│       └── assets/
│           └── logo-fortsmart.svg
├── scripts/
│   └── export-campaign.js           # Script de exportação
└── vercel.json                      # Configuração de rotas
```

---

## 🔧 Fluxo de Trabalho Completo

### 1. Exportar do App Flutter

```dart
// No app FortSmart, adicione um botão:
ElevatedButton.icon(
  onPressed: () async {
    final service = SoilSamplingJsonExportService();
    
    // Opção 1: Salvar no dispositivo
    final path = await service.exportToFile(campaignId);
    Share.shareFiles([path], text: 'Dados da amostragem exportados');
    
    // Opção 2: Preparar para web deploy
    final webData = await service.exportForWebDeploy(campaignId);
    final photos = await service.exportPhotosForWeb(
      campaignId, 
      '/storage/photos',
    );
    
    // Upload para GitHub (via API ou manual)
    await uploadToGitHub(webData, photos);
  },
  icon: Icon(Icons.cloud_upload),
  label: Text('Exportar para Painel Web'),
)
```

### 2. Otimização de Imagens

Antes de subir para GitHub, otimize as fotos:

```javascript
// scripts/optimize-photos.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizePhotos(inputDir, outputDir) {
  const files = fs.readdirSync(inputDir);
  
  for (const file of files) {
    if (!file.endsWith('.jpg')) continue;
    
    await sharp(path.join(inputDir, file))
      .resize(800, 800, { fit: 'inside' })  // Max 800px
      .jpeg({ quality: 75, progressive: true })
      .toFile(path.join(outputDir, file));
    
    console.log(`✓ Otimizado: ${file}`);
  }
}

optimizePhotos('./raw-photos', './public/painel-amostragem/photos');
```

### 3. Estrutura do JSON Index

Crie um catálogo de todas as campanhas:

```json
{
  "atualizado_em": "2026-04-28T17:30:00Z",
  "campanhas": [
    {
      "id": 1,
      "nome": "Amostragem Pivô Central 7",
      "arquivo": "data/amostragem-pivo-7.json",
      "talhoes": ["Pivô Central 7"],
      "fazenda": "Fazenda São João",
      "data_criacao": "2026-04-28",
      "thumbnail": "photos/pivo-7/thumb.jpg",
      "stats": {
        "pontos": 24,
        "fotos": 72,
        "status": "em_andamento"
      }
    },
    {
      "id": 2,
      "nome": "Amostragem Pivô Central 8",
      "arquivo": "data/amostragem-pivo-8.json",
      "talhoes": ["Pivô Central 8"],
      "fazenda": "Fazenda São João",
      "data_criacao": "2026-04-25",
      "thumbnail": "photos/pivo-8/thumb.jpg",
      "stats": {
        "pontos": 18,
        "fotos": 54,
        "status": "completo"
      }
    }
  ]
}
```

### 4. Configuração Vercel

```json
// vercel.json
{
  "routes": [
    {
      "src": "/painel-amostragem",
      "dest": "/painel-amostragem/index.html"
    },
    {
      "src": "/painel-amostragem/(.*)",
      "dest": "/painel-amostragem/$1"
    }
  ],
  "headers": [
    {
      "source": "/painel-amostragem/data/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=3600"
        }
      ]
    },
    {
      "source": "/painel-amostragem/photos/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=86400"
        }
      ]
    }
  ]
}
```

---

## 📤 Deploy Automatizado via GitHub Actions

```yaml
# .github/workflows/deploy-amostragem.yml
name: Deploy Painel Amostragem

on:
  push:
    branches: [main]
    paths:
      - 'fortsmart-reports/public/painel-amostragem/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd fortsmart-reports
          npm install
      
      - name: Optimize images
        run: |
          cd fortsmart-reports
          node scripts/optimize-photos.js
      
      - name: Build
        run: |
          cd fortsmart-reports
          npm run build
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

---

## 📱 Integração Flutter → Web

### Opção 1: Exportar e Compartilhar

```dart
Future<void> exportarParaWeb(int campaignId) async {
  final service = SoilSamplingJsonExportService();
  
  // 1. Exportar dados
  final jsonPath = await service.exportToFile(campaignId);
  
  // 2. Compactar com fotos
  final zipPath = await _compactarComFotos(jsonPath, campaignId);
  
  // 3. Compartilhar (WhatsApp, Email, Telegram)
  await Share.shareFiles(
    [zipPath],
    text: '🌱 Dados da amostragem prontos para o painel web!\n\n'
          'Instruções:\n'
          '1. Descompacte o arquivo\n'
          '2. Acesse: https://fortsmart.com/painel-amostragem\n'
          '3. Faça upload do arquivo JSON',
  );
}
```

### Opção 2: Upload Direto para GitHub

```dart
Future<void> uploadParaGitHub(int campaignId) async {
  final service = SoilSamplingJsonExportService();
  final data = await service.exportCampaign(campaignId);
  
  // Upload via API GitHub
  final github = GitHub(auth: Authentication.withToken('ghp_...'));
  final repo = RepositorySlug('smeagle951', 'fortsmart-reports');
  
  // Criar/update arquivo JSON
  await github.repositories.createOrUpdateFile(
    repo,
    CreateFile(
      path: 'public/painel-amostragem/data/amostragem-${campaignId}.json',
      message: 'Update: Amostragem ${campaignId}',
      content: base64Encode(utf8.encode(jsonEncode(data))),
      sha: await _getCurrentSha(repo, path), // Para update
    ),
  );
  
  // Trigger deploy Vercel automático
  await http.post(
    Uri.parse('https://api.vercel.com/v1/deployments'),
    headers: {'Authorization': 'Bearer ${vercelToken}'},
  );
}
```

---

## 🖼️ Estratégias para Imagens

### Opção A: Imagens no Repositório (Recomendado < 100 fotos)

```
public/painel-amostragem/
├── data/
│   └── amostragem.json
└── photos/
    ├── campaign-1/
    │   ├── photo-1-1.jpg (75KB otimizado)
    │   └── photo-1-2.jpg (68KB otimizado)
    └── campaign-2/
        └── ...
```

**Limites GitHub:**
- Repositório: 2GB
- Arquivo único: 100MB
- Recomendado: < 500 fotos por campanha

### Opção B: Imagens em Base64 (JSON único)

```json
{
  "points": [{
    "fotos": [{
      "data_url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
      "size_kb": 45.2
    }]
  }]
}
```

**Quando usar:**
- Poucas fotos (< 50)
- Campanha pequena
- Backup offline

### Opção C: CDN Externo (Google Drive, S3)

```json
{
  "fotos": [{
    "url": "https://drive.google.com/uc?id=FILE_ID",
    "thumbnail": "https://drive.google.com/thumbnail?id=FILE_ID"
  }]
}
```

**Quando usar:**
- Muitas fotos (> 500)
- Alta resolução necessária
- Acesso público

---

## 📊 Limite de Tamanho

| Componente | Limite | Solução |
|------------|--------|---------|
| JSON dados | 10 MB | Dividir campanhas |
| Fotos (opção A) | 100MB/arquivo | Otimizar para 75KB |
| Fotos (opção B) | 50 MB JSON | Usar CDN |
| Total repo | 2 GB | Separar por safra |

---

## 🔄 Workflow Recomendado

```
┌─────────────────┐
│  App Flutter    │
│  (Coleta dados) │
└────────┬────────┘
         │
         │ 1. Exportar JSON + Fotos
         ▼
┌─────────────────┐
│   Otimização    │
│  (Reduzir 60%)  │
└────────┬────────┘
         │
         │ 2. Compactar ZIP
         ▼
┌─────────────────┐
│     GitHub      │
│   (Push dados)  │
└────────┬────────┘
         │
         │ 3. Trigger deploy
         ▼
┌─────────────────┐
│     Vercel      │
│   (CDN Global)  │
└────────┬────────┘
         │
         │ 4. Acesso painel
         ▼
┌─────────────────┐
│   Cliente/Web   │
│  (Visualização) │
└─────────────────┘
```

---

## 💰 Custos Estimados

### JSON + Vercel (Recomendado)

| Serviço | Custo Mensal |
|---------|-------------|
| GitHub (repositório) | **Grátis** |
| Vercel (hobby) | **Grátis** |
| Banda CDN | **100GB/mês grátis** |
| **Total** | **R$ 0,00** ✅ |

### Supabase (Alternativa)

| Serviço | Custo Mensal |
|---------|-------------|
| Database (500MB) | Grátis (até travar) |
| Storage (1GB) | $0.021/GB |
| Bandwidth | $0.09/GB |
| **Total** | **R$ 5-50/mês** (se ativo) |

---

## ✅ Checklist de Deploy

- [ ] Exportar campanha do Flutter
- [ ] Otimizar fotos (75KB cada)
- [ ] Verificar tamanho total (< 100MB)
- [ ] Criar/atualizar JSON index
- [ ] Commit no GitHub
- [ ] Verificar build Vercel
- [ ] Testar acesso ao painel
- [ ] Compartilhar URL com cliente

---

## 📞 Suporte

Problemas comuns:

**"JSON muito grande"**
→ Dividir em múltiplos arquivos por talhão

**"Fotos não aparecem"**
→ Verificar path no JSON vs pasta photos/

**"Deploy falhou"**
→ Verificar vercel.json e limites de tamanho

---

**Data:** 28/04/2026  
**Versão:** 1.0  
**Autor:** FortSmart Agro
