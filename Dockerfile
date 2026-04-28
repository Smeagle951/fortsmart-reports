# Dockerfile para FortSmart Reports (Next.js)
# Deploy no Railway

FROM node:18-alpine AS base

# Instalar dependências necessárias para build nativo
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar package files
COPY package.json package-lock.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm ci

# Copiar código fonte
COPY . .

# Build da aplicação Next.js
ENV NODE_ENV=production
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production

# Copiar arquivos necessários do build
COPY --from=base /app/package.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/next.config.mjs ./

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["npm", "start"]
