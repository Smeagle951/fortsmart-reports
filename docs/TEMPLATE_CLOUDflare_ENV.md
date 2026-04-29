# Cloudflare — referência (sem segredos)

Não commite tokens. Use o painel Workers ou `.env.local` (ver `.env.example`).

## Workers Builds / Wrangler

| Variável | Onde obter |
|----------|------------|
| CLOUDFLARE_API_TOKEN | API Tokens (Workers deploy) ou token do assistente Workers Builds |
| CLOUDFLARE_ACCOUNT_ID | Account home ou R2 Overview |
| CLOUDFLARE_R2_BUCKET | Nome do bucket R2 |

## R2 (upload S3)

| Variável | Onde obter |
|----------|------------|
| R2_ACCOUNT_ID | Igual a CLOUDFLARE_ACCOUNT_ID |
| R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY | R2 → Manage R2 API Tokens |
| R2_PUBLIC_BASE_URL | Domínio público do bucket (r2.dev ou custom domain) |

## Endpoints típicos

- Verificar token: GET https://api.cloudflare.com/client/v4/user/tokens/verify
- Endpoint S3: https://SEU_ACCOUNT_ID.r2.cloudflarestorage.com
