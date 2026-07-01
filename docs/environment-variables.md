# Variáveis de Ambiente

## Variáveis obrigatórias para todo o sistema

### DATABASE_URL
- Descrição: conexão PostgreSQL usada pelo Prisma
- Uso: `packages/database/prisma/schema.prisma`, `apps/web`, `apps/bot`
- Exemplo: `postgresql://user:pass@localhost:5432/enso`

## Variáveis obrigatórias para o frontend web

### NEXT_PUBLIC_API_URL
- Descrição: URL pública do backend/bot para chamadas REST e Socket.IO
- Uso: client-side no frontend Next.js
- Exemplo: `https://api.enso.app`

### NEXTAUTH_URL
- Descrição: URL pública do site para NextAuth
- Uso: configuração de login em `apps/web/auth.ts`
- Exemplo: `https://app.enso.app`

### NEXTAUTH_SECRET
- Descrição: segredo usado para criptografia JWT do NextAuth
- Uso: `apps/web/auth.ts`
- Exemplo: `A_LONG_RANDOM_SECRET`

## Variáveis obrigatórias para o bot/backend

### GEMINI_API_KEY
- Descrição: chave de API Gemini para moderação de perguntas
- Uso: `apps/bot/src/services/ai-service.ts`
- Exemplo: `AIza...` ou chave de serviço Gemini compatível

### RESEND_API_KEY
- Descrição: chave de API da Resend para envio de emails
- Uso: `apps/bot/src/services/email-service.ts`
- Exemplo: `re_abcdefgh123456`

## Variáveis recomendadas para o bot/backend

### REDIS_URL
- Descrição: URL do Redis para BullMQ
- Valor padrão: `redis://localhost:6379`
- Uso: `apps/bot/src/scheduler/queue.ts`
- Exemplo: `redis://:password@redis-host:6379`

### FRONTEND_URL
- Descrição: URL do frontend usada pelo CORS do bot
- Valor padrão: `http://localhost:3000`
- Uso: `apps/bot/src/index.ts`
- Exemplo: `https://app.enso.app`

### BASE_URL
- Descrição: URL base usada para gerar links de QR code
- Valor padrão: `http://localhost:3000`
- Uso: `apps/bot/src/services/qrcode-service.ts`

### PORT
- Descrição: porta em que o bot escuta
- Valor padrão: `3001`
- Uso: `apps/bot/src/index.ts`

### RESEND_FROM
- Descrição: remetente padrão para emails enviados via Resend
- Valor padrão: `onboarding@resend.dev`
- Uso: `apps/bot/src/services/email-service.ts`

## Variáveis internas e de runtime

### _QR_CODE
- Descrição: valor gerado em runtime contendo a URL do QR Code WhatsApp
- Uso: `apps/bot/src/index.ts`
- Nota: não deve ser definido manualmente em `.env`

### NODE_ENV
- Descrição: ambiente de execução (`development`, `production`)
- Uso: `packages/database/index.ts` e comportamentos gerais

## Exemplo mínimo de `.env`

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/enso
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=uma_chave_secreta_forte
GEMINI_API_KEY=sua_chave_gemini
RESEND_API_KEY=sua_chave_resend
REDIS_URL=redis://localhost:6379
FRONTEND_URL=http://localhost:3000
BASE_URL=http://localhost:3000
PORT=3001
RESEND_FROM=onboarding@resend.dev
```

> Lembre-se de não armazenar chaves secretas em repositórios públicos.
